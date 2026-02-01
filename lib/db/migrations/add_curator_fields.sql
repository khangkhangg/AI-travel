-- Migration: Add curator fields for Curated Itinerary visibility
-- Date: 2026-02-01

-- Add curator fields to trips table
DO $$
BEGIN
    -- Add curator_is_local column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trips' AND column_name = 'curator_is_local'
    ) THEN
        ALTER TABLE trips ADD COLUMN curator_is_local TEXT;
    END IF;

    -- Add curator_years_lived column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trips' AND column_name = 'curator_years_lived'
    ) THEN
        ALTER TABLE trips ADD COLUMN curator_years_lived TEXT;
    END IF;

    -- Add curator_experience column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trips' AND column_name = 'curator_experience'
    ) THEN
        ALTER TABLE trips ADD COLUMN curator_experience TEXT;
    END IF;
END $$;

-- Update visibility check constraint to include 'curated'
-- First drop existing constraint if it exists, then add new one
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'trips_visibility_check' AND table_name = 'trips'
    ) THEN
        ALTER TABLE trips DROP CONSTRAINT trips_visibility_check;
    END IF;

    -- Add updated constraint with 'curated' option
    ALTER TABLE trips ADD CONSTRAINT trips_visibility_check
        CHECK (visibility IN ('public', 'private', 'marketplace', 'curated'));
EXCEPTION
    WHEN others THEN
        -- Constraint might not exist or visibility column might have different setup
        NULL;
END $$;
