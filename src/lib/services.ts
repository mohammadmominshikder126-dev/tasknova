import { 
  db, auth, handleFirestoreError, OperationType 
} from './firebase';
import { 
  doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, increment 
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  referralCode: string;
  invitedBy?: string;
  activePackageId?: string;
  packageExpiry?: any;
  createdAt: any;
  bankCard?: {
    method: 'bkash' | 'nagad' | 'rocket';
    accountNumber: string;
  };
}

export interface InvestmentPackage {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  dailyTasks: number;
  dailyEarning: number;
  totalEarning: number;
  tier: string;
}

export interface TransactionLog {
  id?: string;
  userId: string;
  amount: number;
  type: 'earning' | 'withdrawal' | 'recharge' | 'referral';
  status: 'pending' | 'completed' | 'rejected';
  description: string;
  createdAt: any;
}

export const PACKAGES: InvestmentPackage[] = [
  {
    id: 'package_1',
    name: 'VIP 1',
    price: 500,
    durationDays: 60,
    dailyTasks: 3,
    dailyEarning: 300, // Corrected from UI screenshot if needed, but UI says 300 daily for 500 price? Wow.
    totalEarning: 18000,
    tier: 'OFFICIAL TIER'
  },
  {
    id: 'package_2',
    name: 'VIP 2',
    price: 1000,
    durationDays: 60,
    dailyTasks: 6,
    dailyEarning: 600,
    totalEarning: 36000,
    tier: 'OFFICIAL TIER'
  }
];

export const NovaService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? snap.data() as UserProfile : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${userId}`);
      return null;
    }
  },

  async createUserProfile(user: any, invitedBy?: string): Promise<UserProfile> {
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || 'https://i.pravatar.cc/150?u=' + user.uid,
      balance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      referralCode,
      invitedBy: invitedBy || '',
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'users', user.uid), profile);
      await setDoc(doc(db, 'stats', 'users'), { count: increment(1) }, { merge: true });
      return profile;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`);
      throw e;
    }
  },

  async requestRecharge(userId: string, amount: number, method: string, transactionId: string) {
    const tx: any = {
      userId,
      amount,
      type: 'recharge',
      status: 'pending',
      description: `Recharge via ${method} (TxID: ${transactionId})`,
      createdAt: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, 'transactions'), tx);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'transactions');
    }
  },

  async buyPackage(userId: string, pkg: InvestmentPackage) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data() as UserProfile;

      if (userData.balance < pkg.price) {
        throw new Error("Insufficient balance");
      }

      await updateDoc(userRef, {
        balance: increment(-pkg.price),
        activePackageId: pkg.id,
        packageExpiry: new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000)
      });

      await addDoc(collection(db, 'transactions'), {
        userId,
        amount: -pkg.price,
        type: 'withdrawal',
        status: 'completed',
        description: `Purchased Package ${pkg.name}`,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async completeDailyTask(userId: string, pkgId: string) {
    try {
      const pkg = PACKAGES.find(p => p.id === pkgId);
      if (!pkg) throw new Error("Invalid package");

      const today = new Date().toISOString().split('T')[0];
      const logId = `${userId}_${today}`;
      const logRef = doc(db, 'taskLogs', logId);
      const logSnap = await getDoc(logRef);

      let count = 0;
      if (logSnap.exists()) {
        count = logSnap.data().count;
      }

      if (count >= pkg.dailyTasks) {
        throw new Error("Daily task limit reached");
      }

      // Update log
      if (!logSnap.exists()) {
        await setDoc(logRef, { userId, packageId: pkgId, date: today, count: 1 });
      } else {
        await updateDoc(logRef, { count: increment(1) });
      }

      // Reward user
      const reward = pkg.dailyEarning / pkg.dailyTasks;
      await updateDoc(doc(db, 'users', userId), {
        balance: increment(reward),
        totalEarned: increment(reward)
      });

      await addDoc(collection(db, 'transactions'), {
        userId,
        amount: reward,
        type: 'earning',
        status: 'completed',
        description: `Task reward for ${pkg.name}`,
        createdAt: serverTimestamp()
      });

    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'taskLogs');
    }
  },

  async requestWithdrawal(userId: string, amount: number, method: string, accountDetails: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data() as UserProfile;

      if (userData.balance < amount) throw new Error("Insufficient balance");

      await updateDoc(userRef, {
        balance: increment(-amount),
        totalWithdrawn: increment(amount)
      });

      await addDoc(collection(db, 'transactions'), {
        userId,
        amount: -amount,
        type: 'withdrawal',
        status: 'pending',
        description: `Withdrawal via ${method} to ${accountDetails}`,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  subscribeToUser(userId: string, callback: (user: UserProfile | null) => void) {
    return onSnapshot(doc(db, 'users', userId), (snap) => {
      callback(snap.exists() ? (snap.data() as UserProfile) : null);
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, `users/${userId}`);
    });
  },

  getTransactions(userId: string, callback: (txs: TransactionLog[]) => void) {
    const q = userId === 'ADMIN' 
      ? query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50))
      : query(collection(db, 'transactions'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(20));
      
    return onSnapshot(q, (snap) => {
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionLog));
      callback(txs);
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, 'transactions');
    });
  },

  async updateBankCard(userId: string, bankCard: { method: any, accountNumber: string }) {
    try {
      await updateDoc(doc(db, 'users', userId), { bankCard });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
      throw e;
    }
  },

  async updateAvatar(userId: string, photoURL: string) {
    try {
      await updateDoc(doc(db, 'users', userId), { photoURL });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async updateBalance(userId: string, amount: number) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        balance: increment(amount)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const snap = await getDoc(doc(db, 'admins', userId));
      if (snap.exists()) return true;
      return auth.currentUser?.email === 'mohammadmominshikder126@gmail.com';
    } catch (e) {
      return auth.currentUser?.email === 'mohammadmominshikder126@gmail.com';
    }
  },

  async addPackage(pkg: Omit<InvestmentPackage, 'id'>) {
    const id = `pkg_${Date.now()}`;
    await setDoc(doc(db, 'packages', id), { ...pkg, id });
  },

  async addBanner(banner: any) {
    await addDoc(collection(db, 'banners'), { ...banner, createdAt: serverTimestamp() });
  },

  getBanners(callback: (banners: any[]) => void) {
    return onSnapshot(collection(db, 'banners'), (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async getUserCount(): Promise<number> {
    try {
      const snap = await getDoc(doc(db, 'stats', 'users'));
      return snap.exists() ? snap.data().count : 0;
    } catch (e) {
      return 0;
    }
  },

  async getAdminSettings(): Promise<any> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'admin'));
      return snap.exists() ? snap.data() : { bkash: '', nagad: '', rocket: '', minWithdraw: 500 };
    } catch (e) {
      return { bkash: '', nagad: '', rocket: '', minWithdraw: 500 };
    }
  },

  async updateAdminSettings(settings: any) {
    try {
      await setDoc(doc(db, 'settings', 'admin'), settings, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/admin');
    }
  },

  async updateTransactionStatus(txId: string, status: string, userId: string, amount: number, type: string) {
    try {
      await updateDoc(doc(db, 'transactions', txId), { status });
      if (status === 'completed' && type === 'recharge') {
        await updateDoc(doc(db, 'users', userId), {
          balance: increment(amount)
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'transactions');
    }
  }
};
