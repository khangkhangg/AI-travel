-- Migration: Add user profile theme preference
-- Each user can select their own profile theme from admin-approved themes

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_theme VARCHAR(50) DEFAULT 'journey';
