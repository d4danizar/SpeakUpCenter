-- SQL Step 2: Migrate ADMIN users to CS (run AFTER step1 is fully committed)
UPDATE "public"."User"
SET role = 'CS'
WHERE role = 'ADMIN';
