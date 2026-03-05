-- Migration: Add avatar_url column to players table
-- Date: 2026-03-05
-- Purpose: Store avatar image URL for each player (external URL or Supabase Storage URL)

ALTER TABLE players
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

COMMENT ON COLUMN players.avatar_url IS 'URL of the player avatar image. Can be an external URL or Supabase Storage URL.';
