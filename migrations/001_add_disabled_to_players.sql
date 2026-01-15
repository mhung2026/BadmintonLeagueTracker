-- Migration: Add `disabled` column to `players`
-- Run this in Supabase SQL editor or with psql

BEGIN;
ALTER TABLE public.players
    ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;
COMMIT;
