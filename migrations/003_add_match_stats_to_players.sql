-- Migration: Add total_matches and wins columns to players table
-- Date: 2026-01-15
-- Purpose: Store match statistics directly in players table for better performance

-- Add total_matches column (default 0, not null)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS total_matches INTEGER NOT NULL DEFAULT 0;

-- Add wins column (default 0, not null)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0;

-- Add comments
COMMENT ON COLUMN players.total_matches IS 'Total number of matches played by the player';
COMMENT ON COLUMN players.wins IS 'Total number of matches won by the player';
