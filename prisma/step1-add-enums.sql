-- SQL Step 1: ADD new enum variants to Role (must be committed before use)
ALTER TYPE "public"."Role" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "public"."Role" ADD VALUE IF NOT EXISTS 'CS';
ALTER TYPE "public"."Role" ADD VALUE IF NOT EXISTS 'MARKETING';
ALTER TYPE "public"."Role" ADD VALUE IF NOT EXISTS 'CREATOR';
