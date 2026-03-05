/**
 * Script tính lại toàn bộ meta cho matches và sync điểm về players.
 * Chạy: node scripts/recalculate-db.mjs
 * Cần file .env.local với VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Đọc .env.local thủ công
function loadEnv() {
    const envPath = resolve(__dirname, '../.env.local');
    const raw = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        env[key] = val;
    }
    return env;
}

// ── Logic giống App.jsx ──────────────────────────────────────────────────────

function getDivisorByPointDiff(diff, scoreConfig) {
    if (!scoreConfig.length) return 2;
    return (
        scoreConfig.find((c) => diff <= c.maxPointDiff)?.divisor ??
        scoreConfig[scoreConfig.length - 1].divisor
    );
}

function computeAppliedDelta(winnerTeam, team1PtsBefore, team2PtsBefore, scoreDiff, scoreConfig) {
    const ratingDiff = Math.abs(team1PtsBefore - team2PtsBefore);
    const divisorUsed = getDivisorByPointDiff(ratingDiff, scoreConfig);
    const baseDelta = Math.max(1, scoreDiff);

    if (team1PtsBefore === team2PtsBefore) {
        return { appliedDelta: baseDelta, baseDelta, divisorUsed };
    }

    const higherRatedTeam = team1PtsBefore > team2PtsBefore ? 1 : 2;
    let appliedDelta;
    if (winnerTeam === higherRatedTeam) {
        appliedDelta = Math.max(1, Math.round(baseDelta / Math.max(divisorUsed, 1)));
    } else {
        appliedDelta = baseDelta * Math.max(divisorUsed, 1);
    }
    return { appliedDelta, baseDelta, divisorUsed };
}

function recomputeMatchesWithMeta(matches, scoreConfig) {
    // Sắp xếp theo thời gian tăng dần để tính điểm tích lũy đúng thứ tự
    const sorted = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Điểm hiện tại của từng player (tích lũy theo thứ tự trận)
    const currentPoints = {};
    const getPoints = (id) => currentPoints[id] ?? 0;

    const result = [];

    for (const match of sorted) {
        const { team1, team2, score1, score2, winner } = match;

        const team1PtsBefore = (team1 || []).reduce((s, id) => s + getPoints(id), 0);
        const team2PtsBefore = (team2 || []).reduce((s, id) => s + getPoints(id), 0);

        const scoreDiff = Math.abs((score1 ?? 0) - (score2 ?? 0));
        const ratingDiff = Math.abs(team1PtsBefore - team2PtsBefore);

        const { appliedDelta, baseDelta, divisorUsed } = computeAppliedDelta(
            winner, team1PtsBefore, team2PtsBefore, scoreDiff, scoreConfig
        );

        const pointDelta = appliedDelta;

        // Cập nhật điểm tích lũy
        if (winner === 1) {
            (team1 || []).forEach(id => { currentPoints[id] = getPoints(id) + pointDelta; });
            (team2 || []).forEach(id => { currentPoints[id] = getPoints(id) - pointDelta; });
        } else {
            (team2 || []).forEach(id => { currentPoints[id] = getPoints(id) + pointDelta; });
            (team1 || []).forEach(id => { currentPoints[id] = getPoints(id) - pointDelta; });
        }

        result.push({
            ...match,
            meta: {
                team1PtsBefore,
                team2PtsBefore,
                ratingDiff,
                scoreDiff,
                baseDelta,
                divisorUsed,
                pointDelta,
            }
        });
    }

    return result;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const env = loadEnv();
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Đang tải dữ liệu...');

    const [{ data: matches, error: mErr }, { data: scoreConfig, error: sErr }, { data: players, error: pErr }] = await Promise.all([
        supabase.from('matches').select('*'),
        supabase.from('scoreconfig').select('*'),
        supabase.from('players').select('*'),
    ]);

    if (mErr) { console.error('Lỗi tải matches:', mErr); process.exit(1); }
    if (sErr) { console.error('Lỗi tải scoreconfig:', sErr); process.exit(1); }
    if (pErr) { console.error('Lỗi tải players:', pErr); process.exit(1); }

    console.log(`  ${matches.length} trận | ${scoreConfig.length} config rows | ${players.length} players`);
    console.log('Score config:', scoreConfig.map(c => `≤${c.maxPointDiff}→÷${c.divisor}`).join(', '));

    // Tính lại
    const recalculated = recomputeMatchesWithMeta(matches, scoreConfig);

    // Upsert matches
    console.log('\nĐang upsert matches...');
    const matchPayload = recalculated.map(m => ({
        id: m.id,
        type: m.type,
        team1: m.team1,
        team2: m.team2,
        score1: m.score1,
        score2: m.score2,
        winner: m.winner,
        date: m.date,
        meta: m.meta,
    }));

    const { error: uErr } = await supabase.from('matches').upsert(matchPayload);
    if (uErr) { console.error('Lỗi upsert matches:', uErr); process.exit(1); }
    console.log(`  OK: ${matchPayload.length} trận đã cập nhật`);

    // Tính điểm cuối cùng từ recalculated (theo thứ tự đã sort)
    const finalPoints = {};
    const totalMatches = {};
    const wins = {};

    for (const p of players) {
        finalPoints[p.id] = 0;
        totalMatches[p.id] = 0;
        wins[p.id] = 0;
    }

    for (const m of recalculated) {
        const delta = m.meta.pointDelta;
        const allIds = [...(m.team1 || []), ...(m.team2 || [])];
        allIds.forEach(id => { if (totalMatches[id] !== undefined) totalMatches[id]++; });

        if (m.winner === 1) {
            (m.team1 || []).forEach(id => {
                if (finalPoints[id] !== undefined) {
                    finalPoints[id] += delta;
                    wins[id]++;
                }
            });
            (m.team2 || []).forEach(id => { if (finalPoints[id] !== undefined) finalPoints[id] -= delta; });
        } else {
            (m.team2 || []).forEach(id => {
                if (finalPoints[id] !== undefined) {
                    finalPoints[id] += delta;
                    wins[id]++;
                }
            });
            (m.team1 || []).forEach(id => { if (finalPoints[id] !== undefined) finalPoints[id] -= delta; });
        }
    }

    // Upsert players
    console.log('\nĐang sync điểm về players...');
    const playerPayload = players.map(p => ({
        id: p.id,
        name: p.name,
        disabled: p.disabled,
        avatar_url: p.avatar_url,
        current_points: finalPoints[p.id] ?? 0,
        total_matches: totalMatches[p.id] ?? 0,
        wins: wins[p.id] ?? 0,
    }));

    const { error: puErr } = await supabase.from('players').upsert(playerPayload);
    if (puErr) { console.error('Lỗi upsert players:', puErr); process.exit(1); }

    console.log('\n=== KẾT QUẢ ===');
    playerPayload
        .filter(p => p.total_matches > 0)
        .sort((a, b) => b.current_points - a.current_points)
        .forEach((p, i) => {
            const wr = p.total_matches > 0 ? Math.round(p.wins / p.total_matches * 100) : 0;
            console.log(`  #${i + 1} ${p.name}: ${p.current_points} pts | ${p.total_matches} trận | ${p.wins}W ${wr}%`);
        });

    console.log('\nHoàn tất!');
}

main().catch(err => { console.error(err); process.exit(1); });
