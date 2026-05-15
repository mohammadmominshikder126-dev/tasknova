import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate
} from 'react-router-dom';
import { 
  Download, Diamond, Play, User, Users, 
  History, Headset, LayoutGrid, Info, Phone,
  LogOut, Wallet, CheckCircle2, XCircle, Clock, ShieldCheck, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  signInWithGoogle, 
  registerWithPhone, 
  loginWithPhone, 
  signInWithEmailAndPassword,
  logout, 
  db 
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { NovaService, UserProfile, PACKAGES, TransactionLog, InvestmentPackage } from './lib/services';
import { collection, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';

const Logo = ({ size = "lg" }: { size?: "sm" | "lg" }) => {
  const dim = size === "lg" ? "w-28 h-28" : "w-12 h-12";
  return (
    <div className={`relative ${dim}`}>
      <div className={`absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 ${size === "lg" ? "animate-pulse" : ""}`}></div>
      <div className={`relative z-10 w-full h-full rounded-full shadow-2xl overflow-hidden border-2 border-white/10 bg-[#0a0a1a] flex items-center justify-center`}>
        <div className="flex flex-col items-center justify-center">
          <div className="font-black italic text-white flex items-baseline leading-none">
            <span className={size === "lg" ? "text-4xl" : "text-xl"}>T</span>
            <span className={`text-blue-500 ${size === "lg" ? "text-2xl ml-1" : "text-sm"}`}>N</span>
          </div>
          {size === "lg" && (
            <div className="text-[6px] uppercase font-black tracking-[0.3em] text-gray-500 mt-2">
              Taks Nova
            </div>
          )}
        </div>
      </div>
      {size === "lg" && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-500/50">Together • Grow • Succeed</span>
        </div>
      )}
    </div>
  );
};

const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) => (
  <div className="min-h-screen bg-[#0a0a1a] text-white flex flex-col items-center justify-center p-6 pb-12">
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mb-8"
    >
      <Logo />
    </motion.div>
    <h1 className="text-3xl font-black mb-2 italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-200">{title}</h1>
    <p className="text-gray-500 text-center mb-8 max-w-xs text-sm">{subtitle}</p>
    <div className="w-full max-w-sm">
      {children}
    </div>
  </div>
);

const LoginView = ({ onSwitch, registered }: { onSwitch: () => void, registered?: boolean }) => {
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !pass) return;
    setLoading(true);
    setError(null);
    const trimmedInput = phone.trim().replace(/\s/g, '');
    try {
      if (trimmedInput.includes('@')) {
        await signInWithEmailAndPassword(auth, trimmedInput, pass);
      } else {
        await loginWithPhone(trimmedInput, pass);
      }
    } catch (e: any) {
      console.error("Login error:", e);
      if (e.code === 'auth/operation-not-allowed') {
        setError("ত্রুটি: Firebase Console-এ 'Email/Password' মেথডটি চালু করা নেই। অনুগ্রহ করে এই লিঙ্কে গিয়ে এটি চালু করুন: https://console.firebase.google.com/project/gen-lang-client-0513150768/authentication/providers - সেখানে 'Email/Password' এনাবল করুন।");
      } else if (e.code === 'auth/invalid-email') {
        setError("ভুল ইমেইল ফরম্যাট! ইমেইল চেক করুন।");
      } else {
        setError("মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল! (" + (e.code || "Login Failed") + ")");
      }
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError("গুগল লগইন ব্যর্থ হয়েছে।");
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Login" subtitle="আপনার অ্যাকাউন্টে লগইন করুন">
      <div className="space-y-4">
        {registered && (
          <div className="bg-green-500/20 border border-green-500 text-green-500 p-4 rounded-2xl text-center font-bold mb-4">
            রেজিস্ট্রেশন সফল হয়েছে! লগইন করুন।
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-2xl text-center font-bold mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" placeholder="মোবাইল নম্বর অথবা ইমেইল" 
            value={phone} onChange={e => { setPhone(e.target.value); setError(null); }} required
            className="w-full bg-[#161b22] border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors"
          />
          <input 
            type="password" placeholder="পাসওয়ার্ড" 
            value={pass} onChange={e => { setPass(e.target.value); setError(null); }} required
            className="w-full bg-[#161b22] border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'প্রবেশ করা হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-500">
            <span className="bg-[#0a0a1a] px-2">অথবা</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          GOOGLE দিয়ে লগইন করুন
        </button>
        <p className="text-center text-xs text-gray-500 pt-4">
          অ্যাকাউন্ট নেই? <button type="button" onClick={onSwitch} className="text-blue-500 font-bold underline">রেজিস্ট্রেশন করুন</button>
        </p>
      </div>
    </AuthLayout>
  );
};

const RegisterView = ({ onSwitch, onRegistered, setIsRegistering }: { onSwitch: () => void, onRegistered: () => void, setIsRegistering: (v: boolean) => void }) => {
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [invitedBy, setInvitedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setInvitedBy(ref);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pass !== confirmPass) {
      setError("পাসওয়ার্ড মেলেনি!");
      return;
    }
    if (pass.length < 8) {
      setError("পাসওয়ার্ড নূন্যতম ৮ অক্ষরের হতে হবে!");
      return;
    }
    const cleanPhone = phone.trim().replace(/\s/g, '');
    if (cleanPhone.length !== 11) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন!");
      return;
    }
    
    setLoading(true);
    setIsRegistering(true);
    try {
      const trimmedPhone = phone.trim().replace(/\s/g, '');
      const trimmedInvitedBy = invitedBy.trim();
      
      const u = await registerWithPhone(trimmedPhone, pass);
      await NovaService.createUserProfile(u, trimmedInvitedBy || undefined);
      
      setSuccess(true);
      // Wait a bit to show success animation then transition
      setTimeout(() => {
        setIsRegistering(false);
      }, 2000);
      
    } catch (e: any) {
      console.error("Registration error:", e);
      if (e.code === 'auth/operation-not-allowed') {
        setError("ত্রুটি: Firebase Console-এ 'Email/Password' মেথডটি চালু করা নেই। অনুগ্রহ করে এই লিঙ্কে গিয়ে এটি চালু করুন: https://console.firebase.google.com/project/gen-lang-client-0513150768/authentication/providers - সেখানে 'Email/Password' এনাবল করুন।");
      } else {
        setError("ত্রুটি: " + (e.code || e.message || "অ্যাকাউন্ট তৈরি করা যায়নি"));
      }
      setLoading(false);
      setIsRegistering(false);
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError("গুগল লগইন ব্যর্থ হয়েছে।");
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Register" subtitle="নতুন অ্যাকাউন্ট তৈরি করুন এবং আয় শুরু করুন">
      <div className="space-y-4">
        {success && (
          <div className="w-full bg-green-500/20 border border-green-500 text-green-500 p-4 rounded-2xl text-center font-bold mb-4 animate-bounce">
            রেজিস্ট্রেশন সফল হয়েছে!
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-2xl text-center font-bold mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-4">
          <input 
            type="tel" placeholder="মোবাইল নম্বর (১১ ডিজিট)" 
            value={phone} onChange={e => { setPhone(e.target.value); setError(null); }} required
            className="w-full bg-[#161b22] border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors"
          />
          <input 
            type="password" placeholder="পাসওয়ার্ড (নূন্যতম ৮ অক্ষর)" 
            value={pass} onChange={e => { setPass(e.target.value); setError(null); }} required
            className="w-full bg-[#161b22] border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors"
          />
          <input 
            type="password" placeholder="কনফার্ম পাসওয়ার্ড" 
            value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(null); }} required
            className="w-full bg-[#161b22] border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors"
          />
          <input 
            type="text" placeholder="রেফারেল কোড (ঐচ্ছিক)" 
            value={invitedBy} onChange={e => setInvitedBy(e.target.value)}
            className="w-full bg-[#161b22] border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors shadow-inner"
          />
          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'রেজিস্ট্রেশন করুন'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-500">
            <span className="bg-[#0a0a1a] px-2">অথবা</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          GOOGLE দিয়ে সাইন-আপ করুন
        </button>
        <p className="text-center text-xs text-gray-500 pt-4">
          ইতিমধ্যে অ্যাকাউন্ট আছে? <button type="button" onClick={onSwitch} className="text-blue-500 font-bold underline">লগইন করুন</button>
        </p>
      </div>
    </AuthLayout>
  );
};

// --- Auth Views ---

// --- Shared Components ---

const Header = ({ userProfile, onBalanceClick }: { userProfile: UserProfile | null, onBalanceClick: () => void }) => (
  <header className="p-4 pt-6">
    <div className="flex justify-between items-center bg-[#161b22] p-4 rounded-2xl border border-gray-800 shadow-xl">
      <div className="flex items-center gap-3">
        {userProfile?.photoURL ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg">
            <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="User" referrerPolicy="no-referrer" />
          </div>
        ) : (
          <Logo size="sm" />
        )}
        <div>
          <h2 className="text-lg font-bold leading-none">{userProfile?.displayName || 'User'}</h2>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">ID: {userProfile?.uid.substring(0, 6)}</p>
        </div>
      </div>
      <button 
        onClick={onBalanceClick}
        className="bg-blue-600/10 text-blue-500 px-4 py-2 rounded-xl text-xs font-bold border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
      >
         💳 ৳{userProfile?.balance?.toLocaleString() || '0.00'}
      </button>
    </div>
  </header>
);

const BottomNav = ({ isAdmin }: { isAdmin: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#161b22]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 flex justify-around items-center shadow-2xl z-50">
      <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activePath === '/' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}>
        <LayoutGrid size={20} />
        <span className="text-[10px] font-bold">হোম</span>
      </button>
      <button onClick={() => navigate('/packages')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activePath === '/packages' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}>
        <Diamond size={20} />
        <span className="text-[10px] font-bold">প্যাকেজ</span>
      </button>
      <button onClick={() => navigate('/profile')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activePath === '/profile' || activePath === '/history' || activePath === '/refer' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}>
        <User size={20} />
        <span className="text-[10px] font-bold">প্রোফাইল</span>
      </button>
      {isAdmin && (
        <button onClick={() => navigate('/admin')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activePath === '/admin' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}>
          <ShieldCheck size={20} />
          <span className="text-[10px] font-bold">এডমিন</span>
        </button>
      )}
    </nav>
  );
};

// --- Views ---

const HeroBanner = () => {
  const navigate = useNavigate();
  return (
    <section className="px-4 mb-8">
      <div className="w-full rounded-[32px] overflow-hidden shadow-2xl border border-blue-500/20 relative group bg-gradient-to-br from-indigo-950 via-[#0a0a1a] to-blue-900 min-h-[220px] p-6 flex flex-col justify-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 px-4 py-1.5 rounded-full border border-blue-500/30 mb-4 animate-pulse">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <p className="text-[10px] font-black uppercase text-blue-300 tracking-widest">Taks Nova-তে আপনাকে স্বাগতম</p>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black italic text-white drop-shadow-[0_4px_12px_rgba(37,99,235,0.8)] tracking-tighter uppercase leading-tight mb-2">
              <span className="text-yellow-400">১০০</span> টাকা বোনাস!
            </h2>
            
            <p className="text-xs text-gray-400 font-medium mb-6 flex items-center justify-center md:justify-start gap-2">
              <CheckCircle2 size={12} className="text-green-500" />
              রেজিস্ট্রেশন করলেই পাচ্ছেন নিশ্চিত বোনাস।
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
                <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1">Min Deposit</p>
                <p className="text-lg font-black text-white">৳ ৫০০</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
                <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1">Min Withdraw</p>
                <p className="text-lg font-black text-white">৳ ১৫০</p>
              </div>
            </div>
          </div>

          <div className="relative w-full md:w-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[24px] blur opacity-25"></div>
            <div className="relative bg-[#161b22] border border-white/10 p-5 rounded-[24px] w-full md:w-64">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-black text-blue-400 italic">Nova Premium</p>
                <Diamond size={16} className="text-yellow-400 animate-bounce" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">মূল্য</span>
                  <span className="text-sm font-black text-white">৬০০ টাকা</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">দৈনিক আয়</span>
                  <span className="text-sm font-black text-green-400">৭০ টাকা</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">মোট আয়</span>
                  <span className="text-base font-black text-yellow-400">১০৫০ টাকা</span>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/packages')}
                className="w-full mt-5 bg-blue-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                প্যাকেজ দেখুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    return NovaService.getBanners(setBanners);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Primary Company Banner */}
      <HeroBanner />

      {banners.length > 0 && (
        <section className="px-4 mb-8">
           <div className="w-full h-40 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
              <img src={banners[0].imageUrl} className="w-full h-full object-cover" alt="Banner" referrerPolicy="no-referrer" />
           </div>
        </section>
      )}
      <section className="px-4 grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'রিচার্জ', icon: <Download className="rotate-180" />, path: '/recharge' },
          { label: 'উত্তোলন', icon: <Download />, path: '/withdraw' },
          { label: 'প্যাকেজ', icon: <Diamond />, path: '/packages' },
          { label: 'কাজ', icon: <Play />, path: '/tasks' },
          { label: 'প্রোফাইল', icon: <User />, path: '/profile' },
          { label: 'রেফার', icon: <Users />, path: '/refer' },
          { label: 'হিস্ট্রি', icon: <History />, path: '/history' },
          { label: 'সাপোর্ট', icon: <Headset />, path: '/support' },
        ].map((item, index) => (
          <div key={index} 
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <div className="w-14 h-14 bg-gradient-to-b from-[#1c222b] to-[#11161d] rounded-2xl flex items-center justify-center border border-gray-800 shadow-lg group-active:scale-95 transition-transform">
              <span className="text-blue-500">{item.icon}</span>
            </div>
            <span className="text-[10px] font-medium text-gray-400">{item.label}</span>
          </div>
        ))}
      </section>

      <section className="px-4 mb-8">
        <div className="bg-gradient-to-b from-[#1e1435] to-[#0a0a1a] p-5 rounded-[32px] border border-purple-900/20 shadow-inner">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
            <h3 className="text-blue-500 text-xs font-black uppercase tracking-wider italic flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              লাইভ পেমেন্ট প্রুফ
            </h3>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Momin***', time: '1 মিনিট আগে', amount: '+ ৳2500' },
              { name: 'Hridoy***', time: '5 মিনিট আগে', amount: '+ ৳1500' },
              { name: 'Asif***', time: '18 মিনিট আগে', amount: '+ ৳500' },
              { name: 'Arif***', time: '36 মিনিট আগে', amount: '+ ৳5000' },
            ].map((log, i) => (
              <div key={i} className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                <div>
                  <p className="text-sm font-bold text-gray-200">{log.name}</p>
                  <p className="text-[10px] text-gray-500">{log.time}</p>
                </div>
                <p className="text-green-500 font-black text-sm">{log.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const PackageView: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
  const [activePkgs, setActivePkgs] = useState<InvestmentPackage[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, 'packages'), orderBy('price', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const dbPkgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as InvestmentPackage));
      setActivePkgs(dbPkgs.length > 0 ? dbPkgs : PACKAGES);
    });
    return () => unsubscribe();
  }, []);

  const handleBuy = async (pkg: InvestmentPackage) => {
    if (!userProfile) return;
    if (userProfile.balance < pkg.price) {
      alert("Insufficient balance! Please recharge.");
      return;
    }
    try {
      await NovaService.buyPackage(userProfile.uid, pkg);
      alert(`Successfully activated ${pkg.name}!`);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="px-4 pb-24">
      <div className="text-center mb-4">
         <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Investment Plans</span>
         <h2 className="text-2xl font-black mt-2">VIP মেম্বারশিপ</h2>
      </div>

      {activePkgs.map(pkg => (
        <div key={pkg.id} className="bg-[#161b22] rounded-[32px] p-6 border-l-[6px] border-blue-600 shadow-2xl mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{pkg.name}</h2>
              <p className="text-[10px] text-blue-500 font-bold tracking-[0.2em]">{pkg.tier}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase">প্যাকেজ মূল্য</p>
              <p className="text-2xl font-black">৳ {pkg.price.toFixed(0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><History size={16} className="text-blue-500" /></div>
              <div><p className="text-[10px] text-gray-500">মেয়াদকাল</p><p className="text-sm font-bold">{pkg.durationDays} দিন</p></div>
            </div>
            <div className="flex items-center gap-3 justify-end text-right">
              <div><p className="text-[10px] text-gray-500">দৈনিক কাজ</p><p className="text-sm font-bold">{pkg.dailyTasks} টি</p></div>
              <div className="p-2 bg-blue-500/10 rounded-lg"><Play size={16} className="text-blue-500" /></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Download size={16} className="text-blue-500 rotate-180" /></div>
              <div><p className="text-[10px] text-gray-500">দৈনিক আয়</p><p className="text-sm font-bold">৳ {pkg.dailyEarning.toFixed(2)}</p></div>
            </div>
            <div className="flex items-center gap-3 justify-end text-right">
              <div><p className="text-[10px] text-gray-500">সর্বমোট আয়</p><p className="text-sm font-bold">৳ {pkg.totalEarning.toLocaleString()}</p></div>
              <div className="p-2 bg-blue-500/10 rounded-lg"><LayoutGrid size={16} className="text-blue-500" /></div>
            </div>
          </div>

          <div className="bg-[#0a0a1a] rounded-2xl p-4 flex justify-between items-center border border-gray-800 mb-6">
            <span className="text-green-500 font-bold flex items-center gap-2 italic">
              <span className="text-lg">↑</span> নিট মুনাফা
            </span>
            <span className="text-green-500 font-black text-lg">৳ {(pkg.totalEarning - pkg.price).toLocaleString()}</span>
          </div>

          <div className="flex gap-3">
             <button 
              onClick={() => handleBuy(pkg)}
              disabled={userProfile?.activePackageId === pkg.id}
              className={`flex-1 font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 ${
                userProfile?.activePackageId === pkg.id 
                ? 'bg-[#00c853] text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {userProfile?.activePackageId === pkg.id ? 'সক্রিয় আছে' : 'প্যাকেজটি কিনুন'}
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

const TasksView: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
  const [isWorking, setIsWorking] = useState(false);
  const [pkg, setPkg] = useState<InvestmentPackage | null>(null);

  useEffect(() => {
    if (userProfile?.activePackageId) {
      getDoc(doc(db, 'packages', userProfile.activePackageId)).then(snap => {
        if (snap.exists()) setPkg({ id: snap.id, ...snap.data() } as InvestmentPackage);
        else setPkg(PACKAGES.find(p => p.id === userProfile.activePackageId) || null);
      });
    }
  }, [userProfile?.activePackageId]);

  const handleTask = async () => {
    if (!userProfile?.activePackageId) {
      alert("Please buy a package first!");
      return;
    }
    setIsWorking(true);
    try {
      await NovaService.completeDailyTask(userProfile.uid, userProfile.activePackageId);
      alert("Task completed successfully!");
    } catch (e: any) {
      alert(e.message);
    }
    setIsWorking(false);
  };

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-4 text-center">
      <div className="bg-[#161b22] p-8 rounded-[40px] border border-gray-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
        <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tighter text-blue-500">Daily Tasks</h2>
        <p className="text-xs text-gray-500 mb-8">প্যাকেজ অনুযায়ী প্রতিদিন কাজ করুন</p>
        
        <div className="flex justify-center mb-8">
          <div className="w-48 h-48 rounded-full border-4 border-blue-500/20 flex items-center justify-center p-4">
            <div className={`w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] ${isWorking ? 'animate-spin' : ''}`}>
               <Play size={48} className="fill-white" />
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a1a] p-4 rounded-2xl mb-8">
           <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">সক্রিয় প্যাকেজ</p>
           <p className="text-lg font-black">{pkg?.name || 'কোনো প্যাকেজ নেই'}</p>
        </div>

        <button 
          onClick={handleTask}
          disabled={isWorking || !userProfile?.activePackageId}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl text-lg shadow-2xl disabled:opacity-50 transition-all active:scale-95"
        >
          {isWorking ? 'কাজ চলছে...' : 'কাজ শুরু করুন'}
        </button>
      </div>
    </motion.div>
  );
};

const ProfileView: React.FC<{ userProfile: UserProfile | null, isAdmin: boolean }> = ({ userProfile, isAdmin }) => {
  const navigate = useNavigate();
  const [showAvatars, setShowAvatars] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const avatars = [
    { name: 'Character 1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
    { name: 'Character 2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
    { name: 'Character 3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nala' },
    { name: 'Character 4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kail' },
    { name: 'Character 5', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna' },
    { name: 'Character 6', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper' },
  ];

  const handleAvatarChange = async (url: string) => {
    if (!userProfile) return;
    setIsChanging(true);
    try {
      await NovaService.updateAvatar(userProfile.uid, url);
      setShowAvatars(false);
    } catch (e) {
      console.error("Avatar change error:", e);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4">
      <div className="bg-[#161b22] p-6 rounded-[32px] border border-gray-800 mb-6 text-center relative overflow-hidden">
        <div className="relative inline-block group">
          <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-black mb-4 border-4 border-blue-500/20 shadow-lg overflow-hidden relative bg-[#0a0a1a]">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
            ) : (
              <div className="bg-blue-600 w-full h-full flex items-center justify-center">
                {userProfile?.displayName?.[0] || 'U'}
              </div>
            )}
            {isChanging && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <button 
              onClick={() => setShowAvatars(true)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <CreditCard size={20} className="text-white" />
            </button>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1.5 rounded-full border-2 border-[#161b22] shadow-lg">
             <ShieldCheck size={12} className="text-white" />
          </div>
        </div>

        <AnimatePresence>
          {showAvatars && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-[#161b22] z-20 flex flex-col p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">ক্যারেক্টার নির্বাচন করুন</p>
                <button onClick={() => setShowAvatars(false)}><XCircle size={20} className="text-gray-500" /></button>
              </div>
              <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-1">
                {avatars.map((av, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    disabled={isChanging}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAvatarChange(av.url);
                    }}
                    className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-gray-800 hover:border-blue-500 transition-all bg-[#0a0a1a] p-1 disabled:opacity-50"
                  >
                    <img src={av.url} className="w-full h-full object-contain" alt={av.name} referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="text-xl font-black italic tracking-tighter uppercase">{userProfile?.displayName}</h2>
        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest leading-none">Verified Account</p>
        
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-[#0a0a1a] p-4 rounded-2xl border border-gray-800 shadow-inner">
            <p className="text-[10px] text-gray-500 uppercase font-bold">মোট আয়</p>
            <p className="text-lg font-black text-green-500">৳{userProfile?.totalEarned?.toFixed(2)}</p>
          </div>
          <div className="bg-[#0a0a1a] p-4 rounded-2xl border border-gray-800 shadow-inner">
            <p className="text-[10px] text-gray-500 uppercase font-bold">মোট উত্তোলন</p>
            <p className="text-lg font-black text-red-500">৳{userProfile?.totalWithdrawn?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pb-28">
        {[
          { label: 'ব্যক্তিগত তথ্য', icon: <User size={20}/>, path: '/refer' },
          { label: 'ব্যাংক কার্ড সেটআপ', icon: <CreditCard size={20}/>, path: '/bank-card' },
          { label: 'লেনদেনের ইতিহাস', icon: <History size={20}/>, path: '/history' },
          { label: 'কাস্টমার সাপোর্ট', icon: <Headset size={20}/>, path: '/support' },
        ].concat(isAdmin ? [{ label: 'এডমিন প্যানেল', icon: <ShieldCheck size={20}/>, path: '/admin' }] : []).map((item, i) => (
          <button 
            key={i} 
            onClick={() => navigate(item.path)}
            className="w-full flex items-center justify-between bg-[#161b22] p-5 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className="text-blue-500">{item.icon}</span>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </div>
            <Play size={10} className="text-gray-700" />
          </button>
        ))}
        <button 
          onClick={() => logout()}
          className="w-full flex items-center justify-between bg-red-500/10 p-5 rounded-2xl border border-red-500/20 text-red-500 active:scale-95 transition-all mt-4"
        >
          <div className="flex items-center gap-4">
            <LogOut size={20}/>
            <span className="font-bold">লগ আউট</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

const HistoryView: React.FC<{ userId: string }> = ({ userId }) => {
  const [txs, setTxs] = useState<TransactionLog[]>([]);

  useEffect(() => {
    return NovaService.getTransactions(userId, setTxs);
  }, [userId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4">
      <h2 className="text-xl font-black mb-6 flex items-center gap-3 italic tracking-tight">
        <History className="text-blue-500" /> লেনদেনের ইতিহাস
      </h2>
      <div className="space-y-3 pb-24">
        {txs.length === 0 && <p className="text-center text-gray-500 py-10">কোনো লেনদেন পাওয়া যায়নি</p>}
        {txs.map(tx => (
          <div key={tx.id} className="bg-[#161b22] p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {tx.type === 'earning' && <Wallet size={16}/>}
                {tx.type === 'withdrawal' && <Download size={16}/>}
                {tx.type === 'recharge' && <Download size={16} className="rotate-180"/>}
                {tx.type === 'referral' && <Users size={16}/>}
              </div>
              <div>
                <p className="text-sm font-bold">{tx.description}</p>
                <p className="text-[10px] text-gray-500">{tx.createdAt?.toDate().toLocaleString() || 'Pending...'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-black tracking-tight ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
              </p>
              <div className="flex items-center gap-1 justify-end mt-1">
                {tx.status === 'completed' && <CheckCircle2 size={10} className="text-green-500"/>}
                {tx.status === 'pending' && <Clock size={10} className="text-blue-500"/>}
                {tx.status === 'rejected' && <XCircle size={10} className="text-red-500"/>}
                <span className="text-[8px] uppercase font-bold text-gray-500">{tx.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const ReferView: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
  const referLink = `${window.location.origin}/?ref=${userProfile?.referralCode}`;
  const copyLink = () => {
    navigator.clipboard.writeText(referLink);
    alert("রেফার লিঙ্ক কপি করা হয়েছে!");
  };

  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-4 text-center">
      <div className="flex flex-col items-center gap-4 mb-8">
         <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-600/20 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
            <Users size={40} className="text-blue-500" />
         </div>
         <div>
           <h2 className="text-2xl font-black">বন্ধুদের রেফার করুন</h2>
           <p className="text-sm text-gray-500 px-6">লিঙ্ক শেয়ার করুন এবং বন্ধুদের আয়ের ওপর ১০% কমিশন লাইফটাইম পান</p>
         </div>
      </div>
      
      <div className="bg-[#161b22] p-2 pl-5 rounded-3xl border border-gray-800 flex items-center gap-3 mb-6 shadow-inner">
         <input 
           readOnly 
           value={referLink} 
           className="bg-transparent flex-1 text-[10px] text-blue-500 outline-none whitespace-nowrap overflow-hidden text-ellipsis font-black tracking-widest"
         />
         <button 
           onClick={copyLink}
           className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all"
         >
           Copy
         </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161b22] p-6 rounded-3xl border border-gray-800">
           <p className="text-[10px] text-gray-500 uppercase mb-1">মোট রেফারেল</p>
           <p className="text-2xl font-black">0</p>
        </div>
        <div className="bg-[#161b22] p-6 rounded-3xl border border-gray-800">
           <p className="text-[10px] text-gray-500 uppercase mb-1">রেফার ইনকাম</p>
           <p className="text-2xl font-black">৳0</p>
        </div>
      </div>
    </motion.div>
  );
};

const PaymentIcon = ({ method, size = "md" }: { method: string, size?: "sm" | "md" }) => {
  const isBkash = method === 'bkash';
  const isNagad = method === 'nagad';
  const isRocket = method === 'rocket';
  
  let bgClass = "bg-white";
  let iconColor = "text-[#D12053]";

  if (isBkash) {
    iconColor = "text-[#D12053]";
  } else if (isNagad) {
    iconColor = "text-[#F7941D]";
  } else if (isRocket) {
    iconColor = "text-[#8C3494]";
  }

  const containerSize = size === "sm" ? "w-10 h-10" : "w-16 h-16";
  const iconSize = size === "sm" ? 20 : 32;

  return (
    <div className={`${containerSize} ${bgClass} rounded-2xl flex items-center justify-center shadow-lg shrink-0 border border-white/20 relative overflow-hidden group`}>
      <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {isBkash && (
        <div className={`relative ${iconColor} flex flex-col items-center`}>
           <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center overflow-hidden">
             <div className="w-4 h-4 bg-current rounded-[20%] rotate-45"></div>
           </div>
        </div>
      )}

      {isNagad && (
        <div className={`relative ${iconColor} flex items-center justify-center`}>
           <div className="w-8 h-8 rounded-full border-2 border-dashed border-current animate-[spin_10s_linear_infinite]"></div>
           <div className="absolute w-4 h-4 bg-current rounded-full"></div>
        </div>
      )}

      {isRocket && (
        <Play size={iconSize} className={`${iconColor} fill-current rotate-[-45deg] transition-transform group-hover:scale-110`} />
      )}

      {!isBkash && !isNagad && !isRocket && <Wallet size={iconSize} className="text-gray-400" />}
      
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
    </div>
  );
};

const RechargeView: React.FC<{ userId: string }> = ({ userId }) => {
  const [method, setMethod] = useState('bkash');
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminSettings, setAdminSettings] = useState<any>({ bkash: '', nagad: '', rocket: '', minWithdraw: 500 });

  useEffect(() => {
    NovaService.getAdminSettings().then(setAdminSettings);
  }, []);

  const amounts = [500, 1000, 2000, 5000, 10000, 25000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !txId) return alert("সব তথ্য পূরণ করুন!");
    setLoading(true);
    try {
      await NovaService.requestRecharge(userId, Number(amount), method, txId);
      // Instant balance update as requested by user
      await NovaService.updateBalance(userId, Number(amount));
      alert("রিচার্জ সফল হয়েছে! আপনার ব্যালেন্স যোগ করা হয়েছে।");
      setAmount('');
      setTxId('');
    } catch (err) {
      alert("কিছু ভুল হয়েছে! আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    alert("নম্বর কপি করা হয়েছে!");
  };

  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 pb-24">
      {/* Offer Banner */}
      <div className="bg-blue-600 p-4 rounded-3xl text-white mb-8 flex items-center gap-4 shadow-[0_10px_30px_rgba(37,99,235,0.2)]">
         <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
            <Diamond size={24} className="fill-white" />
         </div>
         <div className="flex-1">
            <p className="text-sm font-black uppercase tracking-tight">ধামাকা বোনাস অফার!</p>
            <p className="text-[10px] font-bold opacity-80 uppercase italic mt-0.5">৫০০৳ থেকে ২৫,০০০৳ রিচার্জে পাচ্ছেন বিশেষ কমিশন।</p>
         </div>
      </div>

      <div className="space-y-8">
        {/* Step 1: Gateway Selection */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-black">১</div>
            <h3 className="text-sm font-black uppercase text-blue-500 tracking-wider">পেমেন্ট গেটওয়ে সিলেক্ট করুন</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {['bkash', 'nagad', 'rocket'].map(m => (
              <button 
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative group overflow-hidden ${
                  method === m 
                  ? 'border-blue-500 bg-blue-500/5' 
                  : 'border-gray-800 bg-[#161b22]'
                }`}
              >
                {method === m && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={14} className="text-blue-500" />
                  </div>
                )}
                <PaymentIcon method={m} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${method === m ? 'text-white' : 'text-gray-500'}`}>{m === 'bkash' ? 'বিকাশ' : m === 'nagad' ? 'নগদ' : 'রকেট'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 1.5: Payment Link / Number */}
        {adminSettings && adminSettings[method] && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-blue-600/10 border border-blue-500/30 p-5 rounded-3xl">
             <p className="text-[10px] text-blue-500 uppercase font-black mb-3 text-center">নিচের নম্বরে টাকা পাঠিয়ে Transaction ID দিন</p>
             <div className="bg-[#0a0a1a] p-4 rounded-2xl flex items-center justify-between border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Phone size={14} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase font-black">আমাদের {method} নম্বর</p>
                    <p className="text-lg font-black tracking-widest">{adminSettings[method]}</p>
                  </div>
                </div>
                <button 
                  onClick={() => copyNumber(adminSettings[method])}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg"
                >
                  COPY
                </button>
             </div>
             <p className="text-[8px] text-gray-500 mt-4 text-center italic">* অবশ্যই "Send Money" করবেন</p>
          </motion.div>
        )}

        {/* Step 2: Recharge Details */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-black">২</div>
            <h3 className="text-sm font-black uppercase text-blue-500 tracking-wider">রিচার্জের তথ্য প্রদান করুন</h3>
          </div>
          
          <div className="bg-[#161b22] p-6 rounded-[40px] border border-gray-800 space-y-6">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black mb-4 ml-1">পরিমাণ নির্বাচন করুন</p>
              <div className="grid grid-cols-3 gap-3">
                {amounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={`py-3 rounded-2xl font-black text-xs transition-all border ${
                      amount === amt.toString()
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-[#0a0a1a] text-gray-400 border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
                  <Wallet size={18} />
                </div>
                <input 
                  type="number" 
                  placeholder="পরিমাণ লিখুন" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#0a0a1a] border border-gray-800 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500 focus:bg-[#161b22] transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
                  <Download size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Transaction ID (TrxID)" 
                  value={txId}
                  onChange={e => setTxId(e.target.value)}
                  className="w-full bg-[#0a0a1a] border border-gray-800 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500 focus:bg-[#161b22] transition-all"
                />
              </div>
            </div>

            <button 
              disabled={loading || !amount || !txId}
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl text-lg shadow-[0_20px_40px_rgba(37,99,235,0.2)] disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? 'প্রক্রিয়াধীন...' : 'নিশ্চিত করুন'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const WithdrawForm: React.FC<{ userId: string, balance: number, initialData?: any }> = ({ userId, balance, initialData }) => {
  const [method, setMethod] = useState(initialData?.method || 'bkash');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(initialData?.accountNumber || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !account) return alert("সব তথ্য পূরণ করুন!");
    const amt = Number(amount);
    if (amt < 500) return alert("নূন্যতম উত্তোলন ৫০০৳!");
    if (amt > balance) return alert("পর্যাপ্ত ব্যালেন্স নেই!");
    
    await NovaService.requestWithdrawal(userId, amt, method, account);
    alert("উত্তোলন রিকোয়েস্ট সফলভাবে জমা হয়েছে!");
    setAmount('');
    setAccount('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-[10px] text-gray-500 uppercase font-black block mb-3">উত্তোলন মেথড সিলেক্ট করুন</label>
        <div className="grid grid-cols-3 gap-3">
            {['bkash', 'nagad', 'rocket'].map(m => (
              <button 
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${method === m ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-[#161b22]'}`}
              >
                <PaymentIcon method={m} size="sm" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">{m}</span>
              </button>
            ))}
        </div>
      </div>
      <div className="space-y-3">
        <input 
          type="number" 
          placeholder="উত্তোলনের মান" 
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-[#161b22] border border-gray-800 p-4 rounded-2xl text-sm outline-none focus:border-blue-500 transition-colors"
        />
        <input 
          type="text" 
          placeholder="অ্যাকাউন্ট নম্বর" 
          value={account}
          onChange={e => setAccount(e.target.value)}
          className="w-full bg-[#161b22] border border-gray-800 p-4 rounded-2xl text-sm outline-none focus:border-blue-500 transition-colors"
        />
      </div>
      <button className="w-full bg-[#00c853] text-white font-black py-4 rounded-3xl text-lg shadow-[0_10px_20px_rgba(0,200,83,0.2)] active:scale-95 transition-all">
        উত্তোলন রিকোয়েস্ট
      </button>
    </form>
  );
};

const BankCardView: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
  const [method, setMethod] = useState<any>(userProfile?.bankCard?.method || 'bkash');
  const [account, setAccount] = useState(userProfile?.bankCard?.accountNumber || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("অ্যাকাউন্ট নম্বর দিন!");
    setLoading(true);
    try {
      await NovaService.updateBankCard(userProfile!.uid, { method, accountNumber: account });
      alert("ব্যাংক কার্ড তথ্য সফলভাবে সেভ করা হয়েছে!");
    } catch (e: any) {
      alert("ত্রুটি: " + e.message);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4">
      <h2 className="text-xl font-black mb-6">ব্যাংক কার্ড সেটআপ</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-[#161b22] p-6 rounded-3xl border border-gray-800">
          <label className="text-[10px] text-gray-500 uppercase font-black block mb-4">পেমেন্ট মেথড বেছে নিন</label>
          <div className="grid grid-cols-3 gap-3">
            {['bkash', 'nagad', 'rocket'].map(m => (
              <button 
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${method === m ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-[#0a0a1a]'}`}
              >
                <PaymentIcon method={m} />
                <span className="font-bold uppercase text-[10px] tracking-tighter">{m}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#161b22] p-6 rounded-3xl border border-gray-800">
          <label className="text-[10px] text-gray-500 uppercase font-black block mb-4">অ্যাকাউন্ট নম্বর</label>
          <input 
            type="tel" 
            placeholder="আপনার নম্বর লিখুন" 
            value={account}
            onChange={e => setAccount(e.target.value)}
            className="w-full bg-[#0a0a1a] border border-gray-800 p-4 rounded-2xl text-sm outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-3xl text-lg shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'প্রক্রিয়াধীন...' : 'সেভ করুন'}
        </button>
      </form>
    </motion.div>
  );
};

const AdminView: React.FC = () => {
  const [tab, setTab] = useState('packages');
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDaily, setPkgDaily] = useState('');
  const [pkgDays, setPkgDays] = useState('60');
  const [bannerUrl, setBannerUrl] = useState('');
  const [txs, setTxs] = useState<TransactionLog[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [adminSettings, setAdminSettings] = useState({ bkash: '', nagad: '', rocket: '', minWithdraw: 500 });

  useEffect(() => {
    NovaService.getUserCount().then(setUserCount);
    NovaService.getAdminSettings().then(setAdminSettings);
    return NovaService.getTransactions('ADMIN', setTxs);
  }, []);

  const handleAddPkg = async (e: React.FormEvent) => {
    e.preventDefault();
    await NovaService.addPackage({
      name: pkgName,
      price: Number(pkgPrice),
      dailyEarning: Number(pkgDaily),
      totalEarning: Number(pkgDaily) * Number(pkgDays),
      durationDays: Number(pkgDays),
      dailyTasks: 3,
      tier: 'OFFICIAL TIER'
    });
    alert("প্যাকেজ যুক্ত হয়েছে!");
    setPkgName(''); setPkgPrice(''); setPkgDaily('');
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    await NovaService.addBanner({ imageUrl: bannerUrl, active: true });
    alert("ব্যানার যুক্ত হয়েছে!");
    setBannerUrl('');
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await NovaService.updateAdminSettings(adminSettings);
    alert("সেটিংস আপডেট করা হয়েছে!");
  };

  return (
    <div className="px-4 pb-24">
      <h2 className="text-2xl font-black mb-6 text-blue-500 uppercase tracking-tighter italic">Admin Panel</h2>

      <div className="bg-[#161b22] p-6 rounded-3xl border border-gray-800 mb-6 flex items-center justify-between shadow-xl">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-black">মোট সদস্য</p>
          <p className="text-2xl font-black text-blue-500">{userCount}</p>
        </div>
        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
           <Users size={24} />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {['packages', 'banners', 'transactions', 'settings'].map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${tab === t ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-[#161b22] text-gray-400 border border-white/5'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'packages' && (
        <form onSubmit={handleAddPkg} className="space-y-4 bg-[#161b22] p-6 rounded-3xl border border-gray-800 shadow-xl">
          <input placeholder="Package Name" value={pkgName} onChange={e => setPkgName(e.target.value)} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" required />
          <input placeholder="Price" type="number" value={pkgPrice} onChange={e => setPkgPrice(e.target.value)} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" required />
          <input placeholder="Daily Earning" type="number" value={pkgDaily} onChange={e => setPkgDaily(e.target.value)} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" required />
          <input placeholder="Days" type="number" value={pkgDays} onChange={e => setPkgDays(e.target.value)} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" required />
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase">Add Package</button>
        </form>
      )}

      {tab === 'banners' && (
        <form onSubmit={handleAddBanner} className="space-y-4 bg-[#161b22] p-6 rounded-3xl border border-gray-800 shadow-xl">
          <input placeholder="Banner Image URL" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" required />
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase">Add Banner</button>
        </form>
      )}

      {tab === 'settings' && (
        <form onSubmit={handleUpdateSettings} className="space-y-4 bg-[#161b22] p-6 rounded-3xl border border-gray-800 shadow-xl">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black ml-1">বিকাশ নম্বর</label>
            <input placeholder="Bkash Number" value={adminSettings.bkash} onChange={e => setAdminSettings({...adminSettings, bkash: e.target.value})} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black ml-1">নগদ নম্বর</label>
            <input placeholder="Nagad Number" value={adminSettings.nagad} onChange={e => setAdminSettings({...adminSettings, nagad: e.target.value})} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black ml-1">রকেট নম্বর</label>
            <input placeholder="Rocket Number" value={adminSettings.rocket} onChange={e => setAdminSettings({...adminSettings, rocket: e.target.value})} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black ml-1">মিনিমাম উইথড্র</label>
            <input placeholder="Min Withdraw" type="number" value={adminSettings.minWithdraw} onChange={e => setAdminSettings({...adminSettings, minWithdraw: Number(e.target.value)})} className="w-full bg-[#0a0a1a] p-4 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-all" />
          </div>
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase">Save Settings</button>
        </form>
      )}

      {tab === 'transactions' && (
        <div className="space-y-3">
          {txs.map(tx => (
            <div key={tx.id} className="bg-[#161b22] p-4 rounded-2xl border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-bold">{tx.type.toUpperCase()} - {tx.amount}৳</p>
                  <p className="text-[10px] text-gray-500">{tx.userId}</p>
                </div>
                <span className={`text-[8px] px-2 py-1 rounded-full ${tx.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {tx.status.toUpperCase()}
                </span>
              </div>
              {tx.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => NovaService.updateTransactionStatus(tx.id!, 'completed', tx.userId, tx.amount, tx.type)}
                    className="flex-1 bg-green-500 text-white text-[10px] font-bold py-2 rounded-lg"
                  >
                    APPROVE
                  </button>
                  <button 
                    onClick={() => NovaService.updateTransactionStatus(tx.id!, 'rejected', tx.userId, tx.amount, tx.type)}
                    className="flex-1 bg-red-500 text-white text-[10px] font-bold py-2 rounded-lg"
                  >
                    REJECT
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App Shell ---

const AppShell = ({ userProfile, isAdmin, children }: { userProfile: UserProfile | null, isAdmin: boolean, children: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white font-sans max-w-md mx-auto relative border-x border-gray-900 overflow-x-hidden">
      <Header userProfile={userProfile} onBalanceClick={() => navigate('/recharge')} />
      <main className="py-6 min-h-[calc(100vh-200px)]">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    // Check if URL has referral to default to register
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
      setShowRegister(true);
    }
  }, []);

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (u) => {
      if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
      }

      setUser(u);
      if (u) {
        try {
          // Just subscribe, if it doesn't exist, we'll try to auto-initiate once
          userUnsubscribe = NovaService.subscribeToUser(u.uid, (profile) => {
            if (profile) {
              setUserProfile(profile);
              setLoading(false);
            } else {
              // Profile missing - trigger creation
              NovaService.createUserProfile(u).then(newProfile => {
                setUserProfile(newProfile);
                setLoading(false);
              }).catch(err => {
                console.error("Auto-profile creation failed:", err);
                setLoading(false); // Still stop loading to show logout/error state
              });
            }
          });
          const adminState = await NovaService.isAdmin(u.uid);
          const isSuperAdmin = u.email === 'mohammadmominshikder126@gmail.com';
          setIsAdmin(adminState || isSuperAdmin);
        } catch (e) {
          console.error("Auth init error:", e);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
      </div>
    );
  }

  const onRegistered = () => {
    setIsRegistering(false);
    setShowRegister(false);
    setRegistered(true);
  };

  if (!user || isRegistering) {
    return showRegister 
      ? <RegisterView 
          onSwitch={() => setShowRegister(false)} 
          onRegistered={onRegistered} 
          setIsRegistering={setIsRegistering}
        /> 
      : <LoginView onSwitch={() => { setShowRegister(true); setRegistered(false); }} registered={registered} />;
  }

  if (!userProfile) {
    return (
      <AuthLayout title="Account Setup" subtitle="আপনার প্রোফাইল লোড হচ্ছে...">
         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
         <button type="button" onClick={() => logout()} className="w-full text-gray-500 underline text-xs">লগ আউট করুন</button>
      </AuthLayout>
    );
  }

  return (
    <BrowserRouter>
      <AppShell userProfile={userProfile} isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/packages" element={<PackageView userProfile={userProfile} />} />
          <Route path="/tasks" element={<TasksView userProfile={userProfile} />} />
          <Route path="/profile" element={<ProfileView userProfile={userProfile} isAdmin={isAdmin} />} />
          <Route path="/history" element={<HistoryView userId={user.uid} />} />
          <Route path="/refer" element={<ReferView userProfile={userProfile} />} />
          <Route path="/bank-card" element={<BankCardView userProfile={userProfile} />} />
          <Route path="/recharge" element={<RechargeView userId={user.uid} />} />
          <Route path="/withdraw" element={
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 pb-24">
              <h2 className="text-xl font-black mb-4">উত্তোলন (Withdraw)</h2>
              {(userProfile?.balance || 0) < 500 ? (
                <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 text-red-500">
                  <Info size={32} className="mx-auto mb-4" />
                  <p className="text-sm font-bold">আপনার বর্তমান ব্যালেন্স ৳{(userProfile?.balance || 0).toLocaleString()}। উত্তোলন করার জন্য নূন্যতম ৳৫০০ প্রয়োজন।</p>
                </div>
              ) : (
                <WithdrawForm userId={user.uid} balance={userProfile?.balance || 0} initialData={userProfile?.bankCard} />
              )}
            </motion.div>
          } />
          <Route path="/support" element={
            <div className="px-4 text-center">
              <h2 className="text-xl font-black mb-4">কাস্টমার সাপোর্ট</h2>
              <div className="bg-[#161b22] p-8 rounded-[40px] border border-gray-800">
                <Headset size={64} className="mx-auto text-blue-500 mb-6" />
                <p className="text-sm text-gray-400 mb-8">যেকোনো সমস্যায় আমাদের টেলিগ্রাম চ্যানেলে যোগাযোগ করুন।</p>
                <a href="https://t.me/taksnova_support" target="_blank" rel="noreferrer" className="block w-full bg-[#24A1DE] text-white font-black py-4 rounded-3xl shadow-xl active:scale-95 transition-all">টেলিগ্রাম সাপোর্ট</a>
              </div>
            </div>
          } />
          <Route path="/admin" element={isAdmin ? <AdminView /> : <Navigate to="/" />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
