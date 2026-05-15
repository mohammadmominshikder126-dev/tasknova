# Elite Invest Security Specification

## Data Invariants
1. A transaction can only be created by the user it belongs to (except for referral bonuses which the system/admin would handle, but here we'll let user request).
2. Users can only read their own profile, transactions, and task logs.
3. Packages are read-only for users.
4. `balance` can only be updated via transactions (conceptually), but in Firestore rules we'll control it carefully. Actually, `balance` is in the `User` doc.
5. Users cannot change their own `balance` directly to an arbitrary value. This usually requires a backend, but we'll try to secure it as much as possible using `request.resource.data.balance`.
6. Actually, since we don't have a backend, we have to trust the client for some operations OR use strict `existsAfter` or similar. But usually, in these "AI Studio" apps, we allow user to update their own balance if the transaction doc is also created.

## The Dirty Dozen Payloads
1. Attempt to update another user's balance.
2. Attempt to create a recharge transaction as "completed" without admin.
3. Attempt to set `invitedBy` to someone else after creation.
4. Attempt to change `price` of a package in the `packages` collection.
5. Attempt to withdraw more than the current balance.
6. Attempt to complete more tasks than allowed by the package.
7. Attempt to delete transactions to hide history.
8. Attempt to spoof `createdAt` to gain older status.
9. Attempt to read other users' `email` or `balance`.
10. Attempt to join a package without having enough balance.
11. Attempt to inject a massive string into `displayName`.
12. Attempt to bypass `email_verified` check if we enforce it.

## Verification
Rules will be tested for PERMISSION_DENIED on these attempts.
