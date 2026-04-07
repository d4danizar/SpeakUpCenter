-- Step 1: Add the new enum values to the existing Role enum (without removing ADMIN yet)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CS';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MARKETING';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CREATOR';

-- Step 2: Migrate all existing ADMIN users to CS
UPDATE "public"."User"
SET role = 'CS'
WHERE role = 'ADMIN';
