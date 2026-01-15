-- Migration: Add current_points column to players table
-- Date: 2026-01-15
-- Purpose: Store current rating points directly in players table for better performance

-- Add current_points column (default 0, not null)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS current_points INTEGER NOT NULL DEFAULT 0;

-- Create index for faster sorting by points
CREATE INDEX IF NOT EXISTS idx_players_current_points ON players(current_points DESC);

-- Add comment
COMMENT ON COLUMN players.current_points IS 'Current rating points of the player, updated in real-time after each match';
