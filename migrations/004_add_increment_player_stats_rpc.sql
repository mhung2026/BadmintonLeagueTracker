-- Migration: Add RPC function for atomic player stats increment
-- Date: 2026-03-05
-- Purpose: Replace read-modify-write with atomic SQL increment to prevent race conditions
--          when multiple users create matches simultaneously.

CREATE OR REPLACE FUNCTION increment_player_stats(
    p_player_id BIGINT,
    p_points_delta INTEGER,
    p_is_winner BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE players
    SET
        current_points = current_points + p_points_delta,
        total_matches  = total_matches + 1,
        wins           = wins + CASE WHEN p_is_winner THEN 1 ELSE 0 END
    WHERE id = p_player_id;
END;
$$;

COMMENT ON FUNCTION increment_player_stats IS
    'Atomically updates current_points, total_matches, and wins for a player after a match. '
    'p_points_delta should be positive for winners (added) and negative for losers (subtracted).';
