# TODO - Supabase UUID vs Firebase UID Fix

## Step 1 ✅
- Fix `src/features/auth/AuthContext.tsx` so it never inserts `firebaseUser.uid` into `public.users.id`.
- Ensure `profile.id` is always the database-generated UUID from the returned Supabase row.


## Step 2
- Defensive guard: ensure foreign-key inserts only happen when `profile.id` looks like a UUID.

## Step 3
- Verify no other code uses Firebase UID in UUID FK columns (quick repo scan).

## Step 4
- Run TypeScript build / basic sanity checks.

