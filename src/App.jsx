
import { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";
import { getTeamPoints, getDivisorByPointDiff as getDivisorByPointDiffUtil, calcPointDelta as calcPointDeltaUtil, formatDateLocal as formatDateLocalUtil } from "./utils.js";
import { useToast } from "./Toast.jsx";
import { createPortal } from "react-dom";
import { SkeletonRanking, SkeletonCard, SkeletonTable } from "./Skeleton.jsx";

function App() {
    const { addToast } = useToast();
    const [isLoaded, setIsLoaded] = useState(false);

    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [scoreConfig, setScoreConfig] = useState([]);

    const [newPlayerName, setNewPlayerName] = useState("");
    const [activeTab, setActiveTab] = useState("ranking");
    const [matchType, setMatchType] = useState("doubles");
    const [historyFilter, setHistoryFilter] = useState("all");
    const [historyPlayerFilter, setHistoryPlayerFilter] = useState("all");
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [editingPlayerName, setEditingPlayerName] = useState("");
    const [editingMatchId, setEditingMatchId] = useState(null);
    const [editingMatchScore1, setEditingMatchScore1] = useState("");
    const [editingMatchScore2, setEditingMatchScore2] = useState("");
    const [editingMatchTeam1, setEditingMatchTeam1] = useState([]);
    const [editingMatchTeam2, setEditingMatchTeam2] = useState([]);
    const [editingMatchType, setEditingMatchType] = useState("doubles");
    const [isUpdatingMatches, setIsUpdatingMatches] = useState(false);
    const [historyStartDate, setHistoryStartDate] = useState("");
    const [historyEndDate, setHistoryEndDate] = useState("");

    // Chart states
    const [chartPlayerIds, setChartPlayerIds] = useState([]);

    const [team1, setTeam1] = useState({ players: [] });
    const [team2, setTeam2] = useState({ players: [] });

    const [suggestedMatchesState, setSuggestedMatchesState] = useState([]);

    const [scoreTeam1, setScoreTeam1] = useState("");
    const [scoreTeam2, setScoreTeam2] = useState("");

    // Validation states
    const [playerNameError, setPlayerNameError] = useState("");
    const [scoreError, setScoreError] = useState("");

    // Loading states
    const [isAddingPlayer, setIsAddingPlayer] = useState(false);
    const [isCreatingMatch, setIsCreatingMatch] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    /* =======================
       HELPERS
    ======================= */

    const getPlayerName = (id) =>
        players.find((p) => p.id === id)?.name || "Không xác định";

    const formatDateLocal = (isoString) => {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return "--:-- --/--/----";
        return formatDateLocalUtil(isoString);
    };

    const getDivisorByPointDiff = (diff) => {
        if (!scoreConfig.length) return 2;
        return getDivisorByPointDiffUtil(diff, scoreConfig);
    };

    // Compute applied delta based on score diff and rating comparison:
    // Công thức: Điểm cộng/trừ = (cách biệt tỉ số) * hoặc / hệ số
    // - Nếu đội thắng có rating cao hơn: chia hệ số (thưởng ít)
    // - Nếu đội thắng có rating thấp hơn: nhân hệ số (thưởng nhiều)
    // - Nếu rating bằng nhau: không nhân/chia
    const computeAppliedDelta = (winnerTeam, team1PtsBefore, team2PtsBefore, scoreDiff) => {
        const ratingDiff = Math.abs(team1PtsBefore - team2PtsBefore);
        const divisorUsed = getDivisorByPointDiff(ratingDiff);

        // baseDelta = cách biệt tỉ số (không chia gì cả ở đây)
        const baseDelta = Math.max(1, scoreDiff);

        // Nếu rating bằng nhau
        if (team1PtsBefore === team2PtsBefore) {
            return { appliedDelta: baseDelta, baseDelta, divisorUsed };
        }

        // Xác định đội nào có rating cao hơn
        const higherRatedTeam = team1PtsBefore > team2PtsBefore ? 1 : 2;
        let appliedDelta;

        if (winnerTeam === higherRatedTeam) {
            // Đội rating cao thắng -> chia hệ số (giảm thưởng)
            appliedDelta = Math.max(1, Math.round(baseDelta / Math.max(divisorUsed, 1)));
        } else {
            // Đội rating thấp thắng -> nhân hệ số (tăng thưởng)
            appliedDelta = baseDelta * Math.max(divisorUsed, 1);
        }

        return { appliedDelta, baseDelta, divisorUsed };
    };



    // Sử dụng getTeamPoints từ utils.js

    const fetchPlayers = useCallback(async () => {
        const { data, error } = await supabase.from("players").select("*");
        if (error) {
            console.error("Không thể tải danh sách người chơi", error);
            return [];
        }
        // normalize all fields for compatibility
        setPlayers((data || []).map(p => ({
            ...p,
            disabled: !!p.disabled,
            current_points: p.current_points ?? 0,
            total_matches: p.total_matches ?? 0,
            wins: p.wins ?? 0
        })));
        return data || [];
    }, []);

    const fetchMatches = useCallback(async () => {
        const { data, error } = await supabase
            .from("matches")
            .select("*")
            .order('date', { ascending: false }); // Trận mới nhất trước
        if (error) {
            console.error("Không thể tải lịch sử trận đấu", error);
            return [];
        }
        setMatches(data || []);
        return data || [];
    }, []);

    const fetchScoreConfig = useCallback(async () => {
        const { data, error } = await supabase.from("scoreconfig").select("*");
        if (error) {
            console.error("Không thể tải cấu hình điểm", error);
            return [];
        }
        setScoreConfig(data || []);
        return data || [];
    }, []);

    /* =======================
       LOAD DATA
    ======================= */

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    fetchPlayers(),
                    fetchMatches(),
                    fetchScoreConfig(),
                ]);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, [fetchPlayers, fetchMatches, fetchScoreConfig]);

    /* =======================
       AUTO SAVE (FULL PAYLOAD)
    ======================= */

    useEffect(() => {
        // Supabase Realtime subscriptions
        const playersChannel = supabase
            .channel('players-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
                fetchPlayers();
            })
            .subscribe();

        const matchesChannel = supabase
            .channel('matches-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
                fetchMatches();
            })
            .subscribe();

        const configChannel = supabase
            .channel('scoreconfig-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreconfig' }, () => {
                fetchScoreConfig();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(playersChannel);
            supabase.removeChannel(matchesChannel);
            supabase.removeChannel(configChannel);
        };
    }, [fetchPlayers, fetchMatches, fetchScoreConfig]);

    /* =======================
       PLAYERS
    ======================= */

    const addPlayer = async () => {
        const trimmedName = newPlayerName.trim();

        // Validation
        if (!trimmedName) {
            setPlayerNameError("Vui lòng nhập tên người chơi");
            return;
        }
        if (trimmedName.length < 2) {
            setPlayerNameError("Tên phải có ít nhất 2 ký tự");
            return;
        }
        if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
            setPlayerNameError("Tên người chơi đã tồn tại");
            return;
        }

        setPlayerNameError("");
        setIsAddingPlayer(true);
        const newPlayer = { name: trimmedName };

        try {
            const { error } = await supabase.from("players").insert([newPlayer]);
            if (error) {
                setPlayerNameError("Không thể thêm người chơi mới. Vui lòng thử lại.");
                return;
            }

            setNewPlayerName("");
            fetchPlayers();
        } finally {
            setIsAddingPlayer(false);
        }
    };

    const deletePlayer = (id) => {
        const hasHistory = matches.some(
            (m) => m.team1.includes(id) || m.team2.includes(id)
        );
        if (hasHistory) {
            addToast('Không thể xóa người chơi đã có lịch sử thi đấu.', 'error');
            return;
        }
        openAuthModal('Nhập mã xác nhận để xóa người chơi:', (code) => {
            if (!isAuthValid(code)) {
                addToast('Mã xác nhận không đúng!', 'error');
                return;
            }
            supabase.from('players').delete().eq('id', id).then(() => {
                setPlayers(players.filter((p) => p.id !== id));
            });
        });
    };

    const startEditingPlayer = (player) => {
        setEditingPlayerId(player.id);
        setEditingPlayerName(player.name);
    };

    const cancelEditingPlayer = () => {
        setEditingPlayerId(null);
        setEditingPlayerName("");
    };

    const savePlayerName = async () => {
        if (!editingPlayerId || !editingPlayerName.trim()) return;
        const trimmed = editingPlayerName.trim();
        const { error } = await supabase
            .from("players")
            .update({ name: trimmed })
            .eq("id", editingPlayerId);

        if (error) {
            addToast("Không thể cập nhật tên. Vui lòng thử lại.", "error");
            return;
        }

        setPlayers((prev) =>
            prev.map((player) =>
                player.id === editingPlayerId
                    ? { ...player, name: trimmed }
                    : player
            )
        );
        cancelEditingPlayer();
    };

    const togglePlayerDisabled = async (id) => {
        const p = players.find((x) => x.id === id);
        if (!p) return;
        const newVal = !p.disabled;
        // optimistic update so UI responds immediately even if DB lacks the column
        setPlayers((prev) => prev.map((pl) => (pl.id === id ? { ...pl, disabled: newVal } : pl)));
        try {
            const { error } = await supabase.from('players').update({ disabled: newVal }).eq('id', id);
            if (error) throw error;
            addToast(newVal ? 'Đã vô hiệu hóa người chơi' : 'Đã kích hoạt lại người chơi', 'success');
        } catch (e) {
            // revert optimistic update on failure
            setPlayers((prev) => prev.map((pl) => (pl.id === id ? { ...pl, disabled: !newVal } : pl)));
            console.error('togglePlayerDisabled', e);
            addToast('Không thể cập nhật trạng thái người chơi', 'error');
        } finally {
            // recompute suggestions to reflect change immediately
            try {
                setSuggestedMatchesState(suggestNextMatches());
            } catch (err) {
                console.error('recompute suggestions after toggle failed', err);
            }
        }
    };

    /* =======================
       TEAMS
    ======================= */

    const addPlayerToTeam = (team, playerId) => {
        const teamState = team === 1 ? team1 : team2;
        const maxPlayers = matchType === "singles" ? 1 : 2;

        if (
            teamState.players.length < maxPlayers &&
            !teamState.players.includes(playerId)
        ) {
            const newTeam = {
                ...teamState,
                players: [...teamState.players, playerId],
            };
            team === 1 ? setTeam1(newTeam) : setTeam2(newTeam);
        }
    };

    const removePlayerFromTeam = (team, playerId) => {
        const teamState = team === 1 ? team1 : team2;
        const newTeam = {
            ...teamState,
            players: teamState.players.filter((id) => id !== playerId),
        };
        team === 1 ? setTeam1(newTeam) : setTeam2(newTeam);
    };

    /* =======================
       CREATE MATCH
    ======================= */

    const createMatch = async () => {
        // Clear previous errors
        setScoreError("");

        const isValidSingles =
            matchType === "singles" &&
            team1.players.length === 1 &&
            team2.players.length === 1;

        const isValidDoubles =
            matchType === "doubles" &&
            team1.players.length === 2 &&
            team2.players.length === 2;

        if (!(isValidSingles || isValidDoubles)) {
            const required = matchType === "singles" ? 1 : 2;
            setScoreError(`Vui lòng chọn ${required} người cho mỗi đội`);
            return;
        }

        const allPlayers = [...team1.players, ...team2.players];
        if (new Set(allPlayers).size !== allPlayers.length) {
            setScoreError("Một người không thể ở cả hai đội");
            return;
        }

        // Ensure no disabled players are included
        const hasDisabled = allPlayers.some(pid => players.find(p => p.id === pid)?.disabled);
        if (hasDisabled) {
            setScoreError('Một hoặc nhiều người chơi đã bị vô hiệu hóa');
            return;
        }

        const s1 = Number(scoreTeam1);
        const s2 = Number(scoreTeam2);

        if (scoreTeam1 === "" || scoreTeam2 === "") {
            setScoreError("Vui lòng nhập điểm cho cả hai đội");
            return;
        }

        if (!Number.isFinite(s1) || !Number.isFinite(s2)) {
            setScoreError("Điểm phải là số hợp lệ");
            return;
        }

        if (s1 < 0 || s2 < 0) {
            setScoreError("Điểm không được âm");
            return;
        }

        if (s1 === s2) {
            setScoreError("Điểm không được hòa");
            return;
        }

        /* ===== SNAPSHOT RANKING HIỆN TẠI ===== */
        const currentRanking = calculateRanking(true); // chế độ snapshot

        const team1PtsBefore = getTeamPoints(team1.players, currentRanking);
        const team2PtsBefore = getTeamPoints(team2.players, currentRanking);

        const ratingDiff = Math.abs(team1PtsBefore - team2PtsBefore);
        const scoreDiff = Math.abs(s1 - s2);

        const winner = s1 > s2 ? 1 : 2;
        const { appliedDelta: pointDelta, baseDelta, divisorUsed } = computeAppliedDelta(winner, team1PtsBefore, team2PtsBefore, scoreDiff);

        // Tính điểm sau trận
        const loser = winner === 1 ? 2 : 1;
        const team1PtsAfter = winner === 1 ? team1PtsBefore + pointDelta : team1PtsBefore - pointDelta;
        const team2PtsAfter = winner === 2 ? team2PtsBefore + pointDelta : team2PtsBefore - pointDelta;

        const newMatch = {
            type: matchType,
            team1: team1.players,
            team2: team2.players,
            score1: s1,
            score2: s2,
            winner,
            date: new Date().toISOString(),
            meta: {
                team1PtsBefore,
                team2PtsBefore,
                team1PtsAfter,
                team2PtsAfter,
                ratingDiff,
                scoreDiff,
                divisorUsed,
                pointDelta,
                baseDelta,
            },
        };
        setIsCreatingMatch(true);
        try {
            const { error } = await supabase
                .from("matches")
                .insert([newMatch]);
            if (error) throw error;

            // Update stats (points, matches, wins) for all players in this match
            await updatePlayerStats(team1.players, pointDelta, winner === 1);
            await updatePlayerStats(team2.players, pointDelta, winner === 2);

            await fetchMatches();
            await fetchPlayers(); // Reload players to get updated stats

            try {
                // immediately recompute suggestions using the fresh data
                setSuggestedMatchesState(suggestNextMatches());
            } catch (e) {
                console.error('recompute suggestions after save failed', e);
            }

            setTeam1({ players: [] });
            setTeam2({ players: [] });
            setMatchType("doubles");
            setScoreTeam1("");
            setScoreTeam2("");
            setScoreError("");

            addToast("Trận đấu đã được lưu (đã chốt điểm)", "success");
        } catch (err) {
            console.error("Không thể lưu trận đấu", err);
            setScoreError("Không thể lưu trận đấu. Vui lòng thử lại.");
        } finally {
            setIsCreatingMatch(false);
        }
    };

    /* =======================
       RANKING
    ======================= */

    const calculateRanking = (forSnapshot = false) => {
        const ranking = {};

        players.forEach((p) => {
            ranking[p.id] = {
                name: p.name,
                points: 0,
                totalMatches: 0,
                wins: 0,
            };
        });

        const sortedMatches = [...matches].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );
        sortedMatches.forEach((match) => {
            if (!match.meta?.pointDelta) return;

            const delta = match.meta.pointDelta;
            const winnerTeam = match.winner;
            const loserTeam = winnerTeam === 1 ? 2 : 1;

            match[`team${winnerTeam}`].forEach((pid) => {
                if (!ranking[pid]) ranking[pid] = { name: "Unknown", points: 0, totalMatches: 0, wins: 0 };
                ranking[pid].points += delta;
                ranking[pid].wins += 1;
            });

            match[`team${loserTeam}`].forEach((pid) => {
                if (!ranking[pid]) ranking[pid] = { name: "Unknown", points: 0, totalMatches: 0, wins: 0 };
                ranking[pid].points -= delta;
            });

            match.team1.forEach((pid) => {
                if (!ranking[pid]) ranking[pid] = { name: "Unknown", points: 0, totalMatches: 0, wins: 0 };
                ranking[pid].totalMatches++;
            });
            match.team2.forEach((pid) => {
                if (!ranking[pid]) ranking[pid] = { name: "Unknown", points: 0, totalMatches: 0, wins: 0 };
                ranking[pid].totalMatches++;
            });
        });

        if (forSnapshot) return ranking;

        return Object.values(ranking).sort((a, b) => b.points - a.points);
    };

    // Calculate point timeline for chart
    const calculatePointTimeline = useCallback((playerIds) => {
        if (!playerIds || playerIds.length === 0) return [];

        // Initialize data structure
        const playerData = {};
        playerIds.forEach(pid => {
            const player = players.find(p => p.id === pid);
            if (player) {
                playerData[pid] = {
                    name: player.name,
                    points: [{ date: null, points: 0 }] // Start from 0
                };
            }
        });

        // Sort matches by date
        const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate points over time
        const currentPoints = {};
        playerIds.forEach(pid => currentPoints[pid] = 0);

        sortedMatches.forEach((match) => {
            if (!match.meta?.pointDelta) return;

            const delta = match.meta.pointDelta;
            const winnerTeam = match.winner;
            const loserTeam = winnerTeam === 1 ? 2 : 1;
            const matchDate = new Date(match.date);

            // Track if any selected player was in this match
            let hasSelectedPlayer = false;

            // Update winner points
            match[`team${winnerTeam}`].forEach((pid) => {
                if (playerIds.includes(pid)) {
                    hasSelectedPlayer = true;
                    currentPoints[pid] += delta;
                }
            });

            // Update loser points
            match[`team${loserTeam}`].forEach((pid) => {
                if (playerIds.includes(pid)) {
                    hasSelectedPlayer = true;
                    currentPoints[pid] -= delta;
                }
            });

            // Add data point if any selected player participated
            if (hasSelectedPlayer) {
                playerIds.forEach(pid => {
                    if (playerData[pid]) {
                        playerData[pid].points.push({
                            date: matchDate,
                            points: currentPoints[pid]
                        });
                    }
                });
            }
        });

        return Object.keys(playerData).map(pid => playerData[pid]);
    }, [players, matches]);

    // Get ranking directly from players table (fast, no calculation)
    const getRankingFromPlayers = useCallback(() => {
        return players
            .filter(p => !p.disabled)
            .map(p => ({
                id: p.id,
                name: p.name,
                points: p.current_points ?? 0,
                totalMatches: p.total_matches ?? 0,
                wins: p.wins ?? 0
            }))
            .sort((a, b) => b.points - a.points);
    }, [players]);

    // Sync current_points, total_matches, and wins from matches to players table
    const syncPointsToPlayers = useCallback(async () => {
        try {
            // Calculate ranking from matches (includes points, totalMatches, wins)
            const ranking = calculateRanking(true);

            // Update each player's stats
            const updates = [];
            for (const [playerId, data] of Object.entries(ranking)) {
                updates.push(
                    supabase
                        .from('players')
                        .update({
                            current_points: data.points,
                            total_matches: data.totalMatches,
                            wins: data.wins
                        })
                        .eq('id', playerId)
                );
            }

            await Promise.all(updates);

            // Reload players
            await fetchPlayers();

            return true;
        } catch (err) {
            console.error('Lỗi sync điểm:', err);
            return false;
        }
    }, [calculateRanking, fetchPlayers]);

    // Update current_points, total_matches, and wins for specific players after a match
    const updatePlayerStats = useCallback(async (playerIds, pointDelta, isWinner) => {
        try {
            const updates = [];
            for (const playerId of playerIds) {
                const player = players.find(p => p.id === playerId);
                if (!player) continue;

                const currentPoints = player.current_points ?? 0;
                const newPoints = isWinner ? currentPoints + pointDelta : currentPoints - pointDelta;
                const newTotalMatches = (player.total_matches ?? 0) + 1;
                const newWins = (player.wins ?? 0) + (isWinner ? 1 : 0);

                updates.push(
                    supabase
                        .from('players')
                        .update({
                            current_points: newPoints,
                            total_matches: newTotalMatches,
                            wins: newWins
                        })
                        .eq('id', playerId)
                );
            }

            await Promise.all(updates);
        } catch (err) {
            console.error('Lỗi cập nhật stats người chơi:', err);
        }
    }, [players]);

    /* =======================
       GỢI Ý CẶP ĐẤU TIẾP THEO
       - Ưu tiên: không để 1 người đánh 2 trận liên tiếp (hai trận gợi ý phải tách biệt người chơi)
       - Tiếp: chọn ghép cặp sao cho chênh lệch điểm của mỗi đôi là thấp nhất (tổng các chênh lệch nhỏ)
    ======================= */

    const suggestNextMatches = useCallback(() => {
        if (!Array.isArray(players) || players.length < 2) return [];
        if (!Array.isArray(matches)) return [];

        // Only use matches from today (same local day)
        const isSameLocalDay = (iso) => {
            if (!iso) return false;
            const d = new Date(iso);
            const now = new Date();
            return (
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate()
            );
        };

        const recentMatches = [...matches]
            .filter(m => m && (m.team1 || m.team2) && isSameLocalDay(m.date))
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const playerRecentCount = {};
        players.forEach(p => { playerRecentCount[p.id] = 0; });
        recentMatches.forEach(m => {
            [...(m.team1 || []), ...(m.team2 || [])].forEach(pid => {
                if (playerRecentCount[pid] !== undefined) playerRecentCount[pid]++;
            });
        });

        // Track matchup frequency: count how many times each pair of teams has played
        const matchupCount = {};
        const getMatchupKey = (team1Ids, team2Ids) => {
            const t1 = [...team1Ids].sort().join(',');
            const t2 = [...team2Ids].sort().join(',');
            return [t1, t2].sort().join(' vs ');
        };
        recentMatches.forEach(m => {
            if (m.team1 && m.team2) {
                const key = getMatchupKey(m.team1, m.team2);
                matchupCount[key] = (matchupCount[key] || 0) + 1;
            }
        });

        // pool sorted by least recently played
        const pool = [...players].filter(p => !p.disabled).sort((a, b) => (playerRecentCount[a.id] || 0) - (playerRecentCount[b.id] || 0));

        // DEBUG: log counts to help diagnose why pool may be < 4
        try {
            const totalPlayers = (players || []).length;
            const disabledCount = (players || []).filter(p => p.disabled).length;
            // eslint-disable-next-line no-console
            console.debug('[suggestNextMatches] totalPlayers=', totalPlayers, 'disabled=', disabledCount, 'pool=', pool.length, 'recentMatches=', recentMatches.length);
        } catch (e) {
            // ignore
        }

        const rankingSnapshot = calculateRanking(true);

        const sumTeamPoints = (teamPlayers) => getTeamPoints(teamPlayers.map(p => (p && p.id) ? p.id : p), rankingSnapshot);

        // If user requested singles, generate top 3 single-player match options
        if (matchType === 'singles') {
            const suggestions = [];

            // For >=2 players: find top 3 best 1v1 pairings
            if (pool.length >= 2) {
                const top = pool.slice(0, Math.min(6, pool.length)); // Use top 6 or all available
                const candidates = [];

                // Generate all possible 1v1 combinations
                for (let i0 = 0; i0 < top.length - 1; i0++) {
                    for (let i1 = i0 + 1; i1 < top.length; i1++) {
                        const p1 = top[i0];
                        const p2 = top[i1];

                        const pa = rankingSnapshot[p1.id]?.points ?? 0;
                        const pb = rankingSnapshot[p2.id]?.points ?? 0;
                        const diff = Math.abs(pa - pb);

                        // Check matchup frequency
                        const matchupKey = getMatchupKey([p1.id], [p2.id]);
                        const matchupFreq = matchupCount[matchupKey] || 0;

                        // Score: rating diff + heavy penalty for repeated matchups
                        const score = diff + (matchupFreq * 100);

                        candidates.push({
                            score,
                            match: { team1: [p1], team2: [p2] }
                        });
                    }
                }

                // Sort by score (lower is better) and take top 3
                candidates.sort((a, b) => a.score - b.score);

                for (let i = 0; i < Math.min(3, candidates.length); i++) {
                    suggestions.push(candidates[i].match);
                }

                if (suggestions.length > 0) {
                    return suggestions;
                }
            }

            return [];
        }

        // helper: all three unique pairings of 4 players into two teams of 2
        const pairingsFor4 = (arr) => {
            const [a, b, c, d] = arr;
            return [
                [[a, b], [c, d]],
                [[a, c], [b, d]],
                [[a, d], [b, c]],
            ];
        };

        // Generate top 3 best match options for user to choose from
        const suggestions = [];

        // For >=4 players: find top 3 best pairings from the pool
        if (pool.length >= 4) {
            const top = pool.slice(0, Math.min(8, pool.length)); // Use top 8 or all available
            const candidates = [];

            // Generate all possible 4-player combinations
            for (let i0 = 0; i0 < top.length - 3; i0++) {
                for (let i1 = i0 + 1; i1 < top.length - 2; i1++) {
                    for (let i2 = i1 + 1; i2 < top.length - 1; i2++) {
                        for (let i3 = i2 + 1; i3 < top.length; i3++) {
                            const group = [top[i0], top[i1], top[i2], top[i3]];
                            const pOptions = pairingsFor4(group);

                            for (const p of pOptions) {
                                const a = sumTeamPoints(p[0]);
                                const b = sumTeamPoints(p[1]);
                                const diff = Math.abs((a || 0) - (b || 0));

                                // Check matchup frequency
                                const team1Ids = p[0].map(pl => pl.id);
                                const team2Ids = p[1].map(pl => pl.id);
                                const matchupKey = getMatchupKey(team1Ids, team2Ids);
                                const matchupFreq = matchupCount[matchupKey] || 0;

                                // Score: rating diff + heavy penalty for repeated matchups
                                const score = diff + (matchupFreq * 100);

                                candidates.push({
                                    score,
                                    match: { team1: p[0], team2: p[1] }
                                });
                            }
                        }
                    }
                }
            }

            // Sort by score (lower is better) and take top 3 unique options
            candidates.sort((a, b) => a.score - b.score);

            // Filter out duplicates (same players, different order)
            const seen = new Set();
            for (const candidate of candidates) {
                const key = [...candidate.match.team1.map(p => p.id), ...candidate.match.team2.map(p => p.id)].sort().join(',');
                if (!seen.has(key)) {
                    seen.add(key);
                    suggestions.push(candidate.match);
                    if (suggestions.length >= 3) break;
                }
            }

            if (suggestions.length > 0) {
                return suggestions;
            }
        }

        // 2-3 players: return single 1v1 option
        if (pool.length >= 2) {
            return [{ team1: [pool[0]], team2: [pool[1]] }];
        }

        return [];
    }, [players, matches, calculateRanking, matchType]);

    // keep suggestion state in sync with data changes
    useEffect(() => {
        try {
            setSuggestedMatchesState(suggestNextMatches());
        } catch (e) {
            console.error('failed to update suggestedMatchesState', e);
        }
    }, [suggestNextMatches]);

    // suggestions are stored in state and updated via effect or after actions
    // `suggestedMatchesState` holds the current suggestions

    const applySuggestion = useCallback((match) => {
        if (!match) return;
        try {
            const t1 = (match.team1 || []).map(p => (p && p.id) ? p.id : p);
            const t2 = (match.team2 || []).map(p => (p && p.id) ? p.id : p);
            setTeam1({ players: t1 });
            setTeam2({ players: t2 });
            setMatchType((t1.length === 1 && t2.length === 1) ? 'singles' : 'doubles');
            addToast('Áp dụng gợi ý cặp đấu', 'success');
        } catch (err) {
            console.error('applySuggestion error', err);
            addToast('Không thể áp dụng gợi ý', 'error');
        }
    }, [addToast]);

    // Tính điểm và chênh lệch cho các trận gợi ý
    const suggestedMatchesWithDiff = useMemo(() => {
        if (!suggestedMatchesState || !suggestedMatchesState.length) return [];
        const rankingSnapshot = calculateRanking(true);
        return suggestedMatchesState.map((m) => {
            const team1Details = (m.team1 || []).map(p => {
                const id = (p && p.id) ? p.id : p;
                const name = players.find(pl => pl.id === id)?.name || (p && p.name) || String(id);
                const pts = rankingSnapshot[id]?.points ?? 0;
                return { id, name, pts };
            });
            const team2Details = (m.team2 || []).map(p => {
                const id = (p && p.id) ? p.id : p;
                const name = players.find(pl => pl.id === id)?.name || (p && p.name) || String(id);
                const pts = rankingSnapshot[id]?.points ?? 0;
                return { id, name, pts };
            });
            const pts1 = team1Details.reduce((s, x) => s + (x.pts || 0), 0);
            const pts2 = team2Details.reduce((s, x) => s + (x.pts || 0), 0);
            return { ...m, team1Details, team2Details, pts1, pts2, diff: Math.abs(pts1 - pts2) };
        });
    }, [suggestedMatchesState, players, matches, calculateRanking]);

    /* =======================
       MATCH HISTORY EDITING
    ======================= */

    const EDIT_MATCH_CODE = import.meta.env.VITE_EDIT_MATCH_CODE || "default-code";

    const isAuthValid = (code) => String(code || "").trim() === String(EDIT_MATCH_CODE || "").trim();

    // Auth modal for edit actions (replace prompt())
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalTitle, setAuthModalTitle] = useState("");
    const [authModalCallback, setAuthModalCallback] = useState(() => () => {});
    const [authInput, setAuthInput] = useState("");

    const openAuthModal = (title, callback) => {
        setAuthModalTitle(title || "Xác nhận");
        setAuthModalCallback(() => callback || (() => {}));
        setAuthInput("");
        setAuthModalOpen(true);
    };

    const confirmAuth = () => {
        setAuthModalOpen(false);
        try {
            authModalCallback(authInput);
        } catch (e) {
            console.error('auth callback error', e);
        }
    };

    const startEditingMatch = (match) => {
        openAuthModal('Nhập mã xác nhận để chỉnh sửa:', (code) => {
            if (!isAuthValid(code)) {
                addToast('Mã xác nhận không đúng!', 'error');
                return;
            }

            setEditingMatchId(match.id);
            setEditingMatchScore1(
                match.score1 === null || match.score1 === undefined
                    ? ''
                    : String(match.score1)
            );
            setEditingMatchScore2(
                match.score2 === null || match.score2 === undefined
                    ? ''
                    : String(match.score2)
            );
            setEditingMatchTeam1([...(match.team1 || [])]);
            setEditingMatchTeam2([...(match.team2 || [])]);
            setEditingMatchType(match.type || 'doubles');
        });
    };

    const cancelEditingMatch = () => {
        setEditingMatchId(null);
        setEditingMatchScore1("");
        setEditingMatchScore2("");
        setEditingMatchTeam1([]);
        setEditingMatchTeam2([]);
        setEditingMatchType("doubles");
    };

    const recomputeMatchesWithMeta = (matchesInput) => {
        const rankingMap = {};
        players.forEach((p) => {
            rankingMap[p.id] = { points: 0 };
        });

        const sorted = [...matchesInput].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        const updatedSorted = sorted.map((match) => {
            const score1 = Number(match.score1);
            const score2 = Number(match.score2);

            if (
                !Number.isFinite(score1) ||
                !Number.isFinite(score2) ||
                score1 === score2
            ) {
                return { ...match };
            }

            const team1PtsBefore = getTeamPoints(match.team1, rankingMap);
            const team2PtsBefore = getTeamPoints(match.team2, rankingMap);
            const ratingDiff = Math.abs(team1PtsBefore - team2PtsBefore);
            const scoreDiff = Math.abs(score1 - score2);
            const winner = score1 > score2 ? 1 : 2;
            const loser = winner === 1 ? 2 : 1;
            const { appliedDelta: pointDelta, baseDelta, divisorUsed } = computeAppliedDelta(winner, team1PtsBefore, team2PtsBefore, scoreDiff);

            // Cập nhật ranking sau trận
            (match[`team${winner}`] || []).forEach((pid) => {
                if (!rankingMap[pid]) rankingMap[pid] = { points: 0 };
                rankingMap[pid].points += pointDelta;
            });

            (match[`team${loser}`] || []).forEach((pid) => {
                if (!rankingMap[pid]) rankingMap[pid] = { points: 0 };
                rankingMap[pid].points -= pointDelta;
            });

            // Tính điểm sau trận
            const team1PtsAfter = getTeamPoints(match.team1, rankingMap);
            const team2PtsAfter = getTeamPoints(match.team2, rankingMap);

            const updatedMatch = {
                ...match,
                score1,
                score2,
                winner,
                meta: {
                    team1PtsBefore,
                    team2PtsBefore,
                    team1PtsAfter,
                    team2PtsAfter,
                    ratingDiff,
                    scoreDiff,
                    divisorUsed,
                    pointDelta,
                    baseDelta,
                },
            };

            return updatedMatch;
        });

        const updatedMap = new Map(
            updatedSorted.map((match) => [match.id, match])
        );

        return matchesInput.map((match) => updatedMap.get(match.id) || match);
    };

    const saveEditedMatch = async () => {
        if (!editingMatchId) return;
        if (editingMatchScore1 === "" || editingMatchScore2 === "") {
            addToast("Vui lòng nhập đầy đủ điểm", "warning");
            return;
        }

        const s1 = Number(editingMatchScore1);
        const s2 = Number(editingMatchScore2);

        if (!Number.isFinite(s1) || !Number.isFinite(s2) || s1 === s2) {
            addToast("Điểm không hợp lệ (không được hòa)", "warning");
            return;
        }

        setIsUpdatingMatches(true);

        try {
            const maxPerTeam = editingMatchType === "singles" ? 1 : 2;
            if (editingMatchTeam1.length !== maxPerTeam || editingMatchTeam2.length !== maxPerTeam) {
                addToast(`Mỗi đội cần ${maxPerTeam} người chơi`, "warning");
                return;
            }

            const allPlayers = [...editingMatchTeam1, ...editingMatchTeam2];
            if (new Set(allPlayers).size !== allPlayers.length) {
                addToast("Một người không thể ở cả hai đội", "warning");
                return;
            }

            const updatedMatches = matches.map((match) =>
                match.id === editingMatchId
                    ? {
                        ...match,
                        type: editingMatchType,
                        team1: editingMatchTeam1,
                        team2: editingMatchTeam2,
                        score1: s1,
                        score2: s2,
                        winner: s1 > s2 ? 1 : 2,
                    }
                    : match
            );

            const matchesWithMeta = recomputeMatchesWithMeta(updatedMatches);

            const payload = matchesWithMeta.map((match) => ({
                id: match.id,
                type: match.type,
                team1: match.team1,
                team2: match.team2,
                score1: match.score1,
                score2: match.score2,
                winner: match.winner,
                date: match.date,
                meta: match.meta,
            }));

            const { error } = await supabase
                .from("matches")
                .upsert(payload);

            if (error) throw error;

            setMatches(matchesWithMeta);
            cancelEditingMatch();
            addToast("Đã cập nhật lịch sử đấu và làm mới meta", "success");
        } catch (err) {
            console.error(err);
            addToast("Không thể cập nhật lịch sử đấu. Vui lòng thử lại", "error");
        } finally {
            setIsUpdatingMatches(false);
        }
    };

    const recalculateAllMatches = async () => {
        if (!matches || matches.length === 0) {
            addToast("Không có trận đấu nào để tính lại", "warning");
            return;
        }

        setIsUpdatingMatches(true);

        try {
            // Tính lại toàn bộ meta cho tất cả trận đấu
            const matchesWithMeta = recomputeMatchesWithMeta(matches);

            // Chuẩn bị payload để update
            const payload = matchesWithMeta.map((match) => ({
                id: match.id,
                type: match.type,
                team1: match.team1,
                team2: match.team2,
                score1: match.score1,
                score2: match.score2,
                winner: match.winner,
                date: match.date,
                meta: match.meta,
            }));

            // Cập nhật toàn bộ vào database
            const { error } = await supabase
                .from("matches")
                .upsert(payload);

            if (error) throw error;

            // Cập nhật state
            setMatches(matchesWithMeta);

            // Sync điểm về players table
            await syncPointsToPlayers();

            addToast(`Đã tính lại ${matchesWithMeta.length} trận đấu và sync điểm thành công!`, "success");
        } catch (err) {
            console.error(err);
            addToast("Lỗi khi tính lại database: " + (err.message || err), "error");
        } finally {
            setIsUpdatingMatches(false);
        }
    };

    // Use current_points from players for fast ranking display
    const rankingData = useMemo(() => getRankingFromPlayers(), [getRankingFromPlayers]);
    const playerFilterOptions = useMemo(() =>
        [...players].sort((a, b) =>
            a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
        ), [players]
    );
    const playerFilterId = historyPlayerFilter === "all" ? null : historyPlayerFilter;
    const startDateFilter = historyStartDate
        ? new Date(`${historyStartDate}T00:00:00`)
        : null;
    const endDateFilter = historyEndDate
        ? new Date(`${historyEndDate}T23:59:59.999`)
        : null;
    const hasPlayerInTeam = (teamPlayers, targetId) => {
        if (targetId == null) return true;
        return (teamPlayers || []).some((id) => String(id) === String(targetId));
    };
    const filteredMatches = useMemo(() => matches.filter((match) => {
        const typeMatch = historyFilter === "all" ? true : match.type === historyFilter;
        const playerMatch = hasPlayerInTeam(match.team1, playerFilterId) || hasPlayerInTeam(match.team2, playerFilterId);
        const matchDate = new Date(match.date);
        const afterStart = startDateFilter ? matchDate >= startDateFilter : true;
        const beforeEnd = endDateFilter ? matchDate <= endDateFilter : true;
        return typeMatch && playerMatch && afterStart && beforeEnd;
    }), [matches, historyFilter, playerFilterId, startDateFilter, endDateFilter]);

    // Pagination state
    const [historyPage, setHistoryPage] = useState(1);
    const MATCHES_PER_PAGE = 10;
    const totalPages = Math.ceil(filteredMatches.length / MATCHES_PER_PAGE);
    const paginatedMatches = useMemo(() => {
        // Matches đã được sắp xếp mới nhất trước từ database
        const start = (historyPage - 1) * MATCHES_PER_PAGE;
        return filteredMatches.slice(start, start + MATCHES_PER_PAGE);
    }, [filteredMatches, historyPage]);

    // Reset page when filters change
    useEffect(() => {
        setHistoryPage(1);
    }, [historyFilter, historyPlayerFilter, historyStartDate, historyEndDate]);

    /* =======================
       RENDER
    ======================= */
    // Simple SVG Line Chart Component with better date handling
    const LineChart = ({ data }) => {
        const [hoveredPoint, setHoveredPoint] = useState(null);

        if (!data || data.length === 0) {
            return (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    Chọn người chơi để xem biểu đồ
                </div>
            );
        }

        const width = 900;
        const height = 450;
        const padding = { top: 40, right: 140, bottom: 80, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Collect all unique dates and sort them
        const allDates = new Set();
        data.forEach(player => {
            player.points.forEach(p => {
                if (p.date) allDates.add(p.date.getTime());
            });
        });
        const sortedDates = Array.from(allDates).sort((a, b) => a - b);

        // Find min/max values
        let minPoints = 0;
        let maxPoints = 0;

        data.forEach(player => {
            player.points.forEach(p => {
                if (p.points < minPoints) minPoints = p.points;
                if (p.points > maxPoints) maxPoints = p.points;
            });
        });

        // Add padding to y-axis
        const yPadding = Math.max(10, (maxPoints - minPoints) * 0.1);
        minPoints = Math.floor(minPoints - yPadding);
        maxPoints = Math.ceil(maxPoints + yPadding);

        const minDate = sortedDates.length > 0 ? sortedDates[0] : 0;
        const maxDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : 1;

        // Scale functions
        const scaleX = (date) => {
            if (!date) return 0;
            const timestamp = typeof date === 'number' ? date : date.getTime();
            const range = maxDate - minDate;
            if (range === 0) return chartWidth / 2;
            return ((timestamp - minDate) / range) * chartWidth;
        };

        const scaleY = (points) => {
            const range = maxPoints - minPoints;
            if (range === 0) return chartHeight / 2;
            return chartHeight - ((points - minPoints) / range) * chartHeight;
        };

        // Format date for display
        const formatDate = (date) => {
            if (!date) return '';
            const d = typeof date === 'number' ? new Date(date) : date;
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        };

        const formatDateFull = (date) => {
            if (!date) return '';
            const d = typeof date === 'number' ? new Date(date) : date;
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };

        // Colors for different players
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

        // Calculate date labels (show every ~3-4 dates or all if fewer than 8)
        const dateLabels = sortedDates.filter((_, idx) => {
            if (sortedDates.length <= 8) return true;
            const step = Math.ceil(sortedDates.length / 6);
            return idx % step === 0 || idx === sortedDates.length - 1;
        });

        return (
            <div style={{ overflowX: 'auto', paddingBottom: 20, position: 'relative' }}>
                <svg width={width} height={height} style={{ minWidth: width }}>
                    {/* Chart background */}
                    <rect
                        x={padding.left}
                        y={padding.top}
                        width={chartWidth}
                        height={chartHeight}
                        fill="#fafafa"
                        stroke="#e5e7eb"
                    />

                    {/* Vertical grid lines for dates */}
                    {sortedDates.map((timestamp, idx) => {
                        const x = padding.left + scaleX(timestamp);
                        return (
                            <line
                                key={idx}
                                x1={x}
                                y1={padding.top}
                                x2={x}
                                y2={padding.top + chartHeight}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Horizontal grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padding.top + chartHeight * ratio;
                        const value = Math.round(maxPoints - (maxPoints - minPoints) * ratio);
                        return (
                            <g key={ratio}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={padding.left + chartWidth}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeDasharray="4,4"
                                />
                                <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#6b7280">
                                    {value}
                                </text>
                            </g>
                        );
                    })}

                    {/* Date labels on X axis */}
                    {dateLabels.map((timestamp, idx) => {
                        const x = padding.left + scaleX(timestamp);
                        return (
                            <g key={idx}>
                                <text
                                    x={x}
                                    y={padding.top + chartHeight + 20}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#6b7280"
                                >
                                    {formatDate(timestamp)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Draw lines for each player */}
                    {data.map((player, idx) => {
                        const color = colors[idx % colors.length];
                        const validPoints = player.points.filter(p => p.date !== null);

                        if (validPoints.length === 0) return null;

                        const pathData = validPoints
                            .map((p, i) => {
                                const x = padding.left + scaleX(p.date);
                                const y = padding.top + scaleY(p.points);
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            })
                            .join(' ');

                        return (
                            <g key={idx}>
                                {/* Line */}
                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="2.5"
                                />
                                {/* Points */}
                                {validPoints.map((p, i) => {
                                    const x = padding.left + scaleX(p.date);
                                    const y = padding.top + scaleY(p.points);
                                    const pointKey = `${idx}-${i}`;
                                    const isHovered = hoveredPoint === pointKey;
                                    return (
                                        <g key={i}>
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={isHovered ? "6" : "5"}
                                                fill="white"
                                                stroke={color}
                                                strokeWidth={isHovered ? "3" : "2"}
                                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={() => setHoveredPoint(pointKey)}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            />
                                            {isHovered && (
                                                <g>
                                                    {/* Tooltip background */}
                                                    <rect
                                                        x={x + 10}
                                                        y={y - 35}
                                                        width="120"
                                                        height="30"
                                                        fill="rgba(0,0,0,0.85)"
                                                        rx="4"
                                                    />
                                                    {/* Tooltip text */}
                                                    <text
                                                        x={x + 70}
                                                        y={y - 23}
                                                        textAnchor="middle"
                                                        fontSize="11"
                                                        fontWeight="600"
                                                        fill="white"
                                                    >
                                                        {player.name}
                                                    </text>
                                                    <text
                                                        x={x + 70}
                                                        y={y - 10}
                                                        textAnchor="middle"
                                                        fontSize="10"
                                                        fill="white"
                                                    >
                                                        {formatDateFull(p.date)}: {p.points} điểm
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* Axis labels */}
                    <text
                        x={padding.left + chartWidth / 2}
                        y={height - 25}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="600"
                        fill="#374151"
                    >
                        Ngày thi đấu
                    </text>
                    <text
                        x={20}
                        y={padding.top + chartHeight / 2}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="600"
                        fill="#374151"
                        transform={`rotate(-90, 20, ${padding.top + chartHeight / 2})`}
                    >
                        Điểm số
                    </text>

                    {/* Legend */}
                    {data.map((player, idx) => {
                        const color = colors[idx % colors.length];
                        const y = padding.top + idx * 28;
                        return (
                            <g key={idx}>
                                <circle
                                    cx={padding.left + chartWidth + 25}
                                    cy={y}
                                    r="5"
                                    fill="white"
                                    stroke={color}
                                    strokeWidth="2"
                                />
                                <text
                                    x={padding.left + chartWidth + 38}
                                    y={y + 4}
                                    fontSize="12"
                                    fill="#374151"
                                >
                                    {player.name}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    // Auth modal markup - rendered into document.body to avoid stacking-context issues
    const AuthModal = () => {
        if (!authModalOpen) return null;

        const modal = (
            <div
                onClick={(e) => {
                    // close when clicking on backdrop (but not when clicking inside dialog)
                    if (e.target === e.currentTarget) setAuthModalOpen(false);
                }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(2,6,23,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2147483647,
                    pointerEvents: 'auto',
                }}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        background: '#fff',
                        padding: 16,
                        borderRadius: 8,
                        width: 360,
                        boxShadow: '0 10px 30px rgba(2,6,23,0.3)',
                        pointerEvents: 'auto',
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{authModalTitle}</div>
                    <input
                        autoFocus
                        value={authInput}
                        onChange={(e) => setAuthInput(e.target.value)}
                        type="password"
                        className="input-field"
                        placeholder="Mã xác nhận"
                        style={{ width: '100%', marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button type="button" className="btn" onClick={() => setAuthModalOpen(false)}>Huỷ</button>
                        <button type="button" className="btn btn-primary" onClick={confirmAuth}>Xác nhận</button>
                    </div>
                </div>
            </div>
        );

        if (typeof document !== 'undefined' && createPortal) {
            try {
                return createPortal(modal, document.body);
            } catch (e) {
                // fallback to inline render if portal fails
                return modal;
            }
        }

        return modal;
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="header-title">BADMINTON LEGEND ALLIANCEITSC</h1>
            </header>

            {/* ---- NAV ---- */}
            <nav className="nav-bar">
                {[
                    ["ranking", "Xếp Hạng"],
                    ["createMatch", "Trận Đấu"],
                    ["players", "Người Chơi"],
                    ["history", "Lịch Sử"],
                    ["chart", "Biểu Đồ"],
                    ["config", "Cấu Hình"],
                ].map(([key, label]) => (
                    <button
                        key={key}
                        className={`nav-btn ${activeTab === key ? "active" : ""
                            }`}
                        onClick={() => setActiveTab(key)}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            {/* ---- CONTENT ---- */}
            <main className="main-content">
                {!isLoaded && (
                    <section className="section">
                        {activeTab === "ranking" && <SkeletonRanking count={5} />}
                        {activeTab === "history" && (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        )}
                        {(activeTab === "players" || activeTab === "config") && (
                            <SkeletonTable rows={5} columns={3} />
                        )}
                        {activeTab === "createMatch" && <SkeletonCard />}
                        {activeTab === "chart" && <SkeletonCard />}
                    </section>
                )}

                {isLoaded && (
                    <>
                        {/* Xếp hạng */}
                        {activeTab === "ranking" && (
                            <section className="section">
                                <h2 className="section-title">Bảng Xếp Hạng</h2>

                                {rankingData.map((p, i) => {
                                    const winRate = p.totalMatches > 0
                                        ? Math.round((p.wins / p.totalMatches) * 100)
                                        : 0;
                                    return (
                                        <div key={p.name + i} className="ranking-item">
                                            <div className="rank-number">#{i + 1}</div>
                                            <div className="player-details">
                                                <div className="player-name">{p.name}</div>
                                                <div className="player-stats">
                                                    {p.totalMatches} trận • {p.wins} thắng • {winRate}% thắng
                                                </div>
                                            </div>
                                            <div className="player-points">{p.points}</div>
                                        </div>
                                    );
                                })}
                            </section>
                        )}
                        {/* Tab Tạo Trận Đấu */}
                        {activeTab === "createMatch" && (
                            <section className="section">
                                <h2 className="section-title">Tạo Trận Đấu</h2>

                                {/* Chọn loại trận: đơn hoặc đôi */}
                                <div className="match-type-group" style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            value="singles"
                                            checked={matchType === "singles"}
                                            onChange={(e) => {
                                                setMatchType(e.target.value);
                                                setTeam1({ players: [] });
                                                setTeam2({ players: [] });
                                            }}
                                        />
                                        <span>Trận Đơn (1 vs 1)</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            value="doubles"
                                            checked={matchType === "doubles"}
                                            onChange={(e) => {
                                                setMatchType(e.target.value);
                                                setTeam1({ players: [] });
                                                setTeam2({ players: [] });
                                            }}
                                        />
                                        <span>Trận Đôi (2 vs 2)</span>
                                    </label>
                                </div>

                                {/* Gợi ý cặp đấu (nếu có) */}
                                {suggestedMatchesWithDiff && suggestedMatchesWithDiff.length > 0 && (
                                    <div style={{ margin: '12px 0 18px 0' }}>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: 15 }}>Chọn 1 trong {suggestedMatchesWithDiff.length} gợi ý</h3>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {suggestedMatchesWithDiff.map((m, idx) => {
                                                const bg = (m.diff ?? 0) <= 1 ? '#ecfdf5' : (m.diff ?? 0) <= 3 ? '#fff7ed' : '#fff1f2';
                                                const color = (m.diff ?? 0) <= 1 ? '#166534' : (m.diff ?? 0) <= 3 ? '#92400e' : '#991b1b';
                                                return (
                                                    <div key={idx} style={{ flex: '1 1 240px', minWidth: 220, background: '#ffffff', border: '1px solid #e6eef7', borderRadius: 8, padding: 8 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ fontSize: 13, fontWeight: 600 }}>Lựa chọn {idx + 1}</div>
                                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                <div style={{ padding: '4px 8px', borderRadius: 999, background: bg, color, fontWeight: 600, fontSize: 11 }}>Δ {m.diff ?? 0}</div>
                                                                <button className="btn btn-primary" style={{ padding: '6px 8px', fontSize: 13 }} onClick={() => applySuggestion(m)}>Chọn</button>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'stretch' }}>
                                                            <div style={{ flex: 1, background: '#fafafa', padding: 6, borderRadius: 6 }}>
                                                                <div style={{ fontSize: 12, color: '#334155', marginBottom: 6, fontWeight: 700 }}>A • {m.pts1 ?? 0}</div>
                                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                    {(m.team1Details || m.team1 || []).map((p, i) => {
                                                                        const id = (p && p.id) ? p.id : i;
                                                                        const name = (p && (p.name || p)) || String(p);
                                                                        const pts = p && (p.pts !== undefined) ? p.pts : null;
                                                                        return (
                                                                            <div key={id} style={{ background: '#e6eef7', padding: '4px 6px', borderRadius: 999, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                                <span>{name}</span>
                                                                                {pts !== null && <span style={{ fontSize: 11, color: '#0f172a', opacity: 0.7 }}>• {pts}</span>}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div style={{ width: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>vs</div>
                                                            <div style={{ flex: 1, background: '#fafafa', padding: 6, borderRadius: 6 }}>
                                                                <div style={{ fontSize: 12, color: '#334155', marginBottom: 6, fontWeight: 700 }}>B • {m.pts2 ?? 0}</div>
                                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                    {(m.team2Details || m.team2 || []).map((p, i) => {
                                                                        const id = (p && p.id) ? p.id : i;
                                                                        const name = (p && (p.name || p)) || String(p);
                                                                        const pts = p && (p.pts !== undefined) ? p.pts : null;
                                                                        return (
                                                                            <div key={id} style={{ background: '#fde68a', padding: '4px 6px', borderRadius: 999, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                                <span>{name}</span>
                                                                                {pts !== null && <span style={{ fontSize: 11, color: '#92400e', opacity: 0.8 }}>• {pts}</span>}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Chọn người chơi cho từng đội */}
                                <div className="teams-container">


                                    {/* Đội 1 */}
                                    <div className="team-box">
                                        <h3 className="team-title">Đội 1</h3>
                                        <div className="team-players-display">
                                            {team1.players.length === 0 ? (
                                                <div className="placeholder">Chưa chọn</div>
                                            ) : (
                                                team1.players.map((playerId) => (
                                                    <div key={playerId} className="player-tag">
                                                        <span>{getPlayerName(playerId)}</span>
                                                        <button
                                                            className="remove-tag-btn"
                                                            onClick={() => removePlayerFromTeam(1, playerId)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {/* Danh sách người chơi có thể chọn vào đội 1 */}
                                        <div className="player-buttons">
                                            {[...players]
                                                .filter((p) => !p.disabled && !team1.players.includes(p.id) && !team2.players.includes(p.id))
                                                .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }))
                                                .map((player) => (
                                                    <button
                                                        key={player.id}
                                                        className="player-select-btn"
                                                        onClick={() => addPlayerToTeam(1, player.id)}
                                                    >
                                                        {player.name}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>

                                    {/* VS: phân cách giữa hai đội */}
                                    <div className="vs-divider">
                                        <div>VS</div>
                                        {team1.players.length > 0 && team2.players.length > 0 && (() => {
                                            const currentRanking = calculateRanking(true);
                                            const team1Pts = getTeamPoints(team1.players, currentRanking);
                                            const team2Pts = getTeamPoints(team2.players, currentRanking);
                                            const diff = Math.abs(team1Pts - team2Pts);
                                            const bg = diff <= 10 ? '#ecfdf5' : diff <= 30 ? '#fff7ed' : '#fff1f2';
                                            const color = diff <= 10 ? '#166534' : diff <= 30 ? '#92400e' : '#991b1b';
                                            return (
                                                <div style={{
                                                    marginTop: 8,
                                                    padding: '4px 8px',
                                                    borderRadius: 999,
                                                    background: bg,
                                                    color,
                                                    fontWeight: 600,
                                                    fontSize: 11
                                                }}>
                                                    Δ {diff}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Đội 2 */}
                                    <div className="team-box">
                                        <h3 className="team-title">Đội 2</h3>
                                        <div className="team-players-display">
                                            {team2.players.length === 0 ? (
                                                <div className="placeholder">Chưa chọn</div>
                                            ) : (
                                                team2.players.map((playerId) => (
                                                    <div key={playerId} className="player-tag">
                                                        <span>{getPlayerName(playerId)}</span>
                                                        <button
                                                            className="remove-tag-btn"
                                                            onClick={() => removePlayerFromTeam(2, playerId)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {/* Danh sách người chơi có thể chọn vào đội 2 */}
                                        <div className="player-buttons">
                                            {[...players]
                                                .filter((p) => !p.disabled && !team1.players.includes(p.id) && !team2.players.includes(p.id))
                                                .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }))
                                                .map((player) => (
                                                    <button
                                                        key={player.id}
                                                        className="player-select-btn"
                                                        onClick={() => addPlayerToTeam(2, player.id)}
                                                    >
                                                        {player.name}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ===== NEW: Nhập kết quả trận ===== */}
                                <div
                                    className="match-type-group"
                                    style={{ marginTop: 12, width: "100%" }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            alignItems: "center",
                                            width: "100%",
                                        }}
                                    >
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Điểm đội 1"
                                            min={0}
                                            value={scoreTeam1}
                                            onChange={(e) => {
                                                const v = Math.max(0, Number(e.target.value));
                                                setScoreTeam1(v === 0 && e.target.value === "" ? "" : v);
                                            }}
                                            style={{ flex: 1, minWidth: 0 }}
                                        />
                                        <span style={{ fontWeight: 500, flexShrink: 0 }}>-</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Điểm đội 2"
                                            min={0}
                                            value={scoreTeam2}
                                            onChange={(e) => {
                                                const v = Math.max(0, Number(e.target.value));
                                                setScoreTeam2(v === 0 && e.target.value === "" ? "" : v);
                                            }}
                                            style={{ flex: 1, minWidth: 0 }}
                                        />
                                    </div>
                                </div>

                                {/* Hiển thị lỗi validation */}
                                {scoreError && (
                                    <div className="validation-error" style={{ marginTop: 12 }}>{scoreError}</div>
                                )}

                                {/* Chọn đội thắng và lưu trận */}
                                <div
                                    className="result-buttons"
                                    style={{
                                        marginTop: 12,
                                        width: "100%",
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "center",
                                    }}
                                >
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => createMatch()}
                                        disabled={isCreatingMatch}
                                    >
                                        {isCreatingMatch ? "Đang lưu..." : "Lưu kết quả trận đấu"}
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Tab Người Chơi */}
                        {activeTab === "players" && (
                            <section className="section">
                                <h2 className="section-title">Người Chơi</h2>

                                {/* Form thêm người chơi mới */}
                                <div className="add-player-form">
                                    <input
                                        type="text"
                                        className={`input-field ${playerNameError ? 'error' : ''}`}
                                        value={newPlayerName}
                                        onChange={(e) => {
                                            setNewPlayerName(e.target.value);
                                            if (playerNameError) setPlayerNameError("");
                                        }}
                                        onKeyPress={(e) =>
                                            e.key === "Enter" && !isAddingPlayer && addPlayer()
                                        }
                                        placeholder="Nhập tên..."
                                        disabled={isAddingPlayer}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={addPlayer}
                                        disabled={isAddingPlayer}
                                    >
                                        {isAddingPlayer ? "Đang thêm..." : "Thêm"}
                                    </button>
                                </div>
                                {playerNameError && (
                                    <div className="validation-error">{playerNameError}</div>
                                )}

                                {/* Danh sách người chơi hiện tại */}
                                {players.length === 0 ? (
                                    <div className="empty-state">
                                        Chưa có người chơi
                                    </div>
                                ) : (
                                    <div className="players-list">
                                        {[...players]
                                            .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }))
                                            .map((player) => (
                                                <div
                                                    key={player.id}
                                                    className="player-item"
                                                >
                                                    {editingPlayerId === player.id ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                className="input-field"
                                                                style={{ flex: 1, marginRight: 8 }}
                                                                value={editingPlayerName}
                                                                onChange={(e) => setEditingPlayerName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") savePlayerName();
                                                                    if (e.key === "Escape") cancelEditingPlayer();
                                                                }}
                                                            />
                                                            <div className="player-actions" style={{ display: "flex", gap: 6 }}>
                                                                <button className="btn btn-primary" type="button" onClick={savePlayerName}>
                                                                    Lưu
                                                                </button>
                                                                <button className="btn" type="button" onClick={cancelEditingPlayer}>
                                                                    Huỷ
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="player-name" style={{ flex: 1 }}>
                                                                {player.name} {player.disabled ? <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 8 }}>(Vô hiệu)</span> : null}
                                                            </div>
                                                            <div className="player-actions" style={{ display: "flex", gap: 6 }}>
                                                                <button
                                                                    className="btn"
                                                                    type="button"
                                                                    onClick={() => startEditingPlayer(player)}
                                                                >
                                                                    Sửa
                                                                </button>
                                                                <button
                                                                    className={player.disabled ? 'btn' : 'btn-warning'}
                                                                    type="button"
                                                                    onClick={() => togglePlayerDisabled(player.id)}
                                                                >
                                                                    {player.disabled ? 'Kích hoạt' : 'Vô hiệu'}
                                                                </button>
                                                                <button
                                                                    className="btn-delete"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (
                                                                            window.confirm(
                                                                                `Bạn có chắc muốn xoá "${player.name}" không?`
                                                                            )
                                                                        ) {
                                                                            deletePlayer(player.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    Xoá
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Tab Lịch Sử Trận Đấu */}
                        {activeTab === "history" && (
                            <section className="section">
                                <h2 className="section-title">Lịch Sử Trận Đấu</h2>
                                {matches.length > 0 && (
                                    <div className="history-filters">
                                        <div className="filter-row">
                                            <div className="filter-group">
                                                <span className="filter-label">Loại trận</span>
                                                <div className="filter-chips">
                                                    {["all", "singles", "doubles"].map((key) => (
                                                        <button
                                                            key={key}
                                                            className={`filter-chip ${historyFilter === key ? "active" : ""}`}
                                                            onClick={() => setHistoryFilter(key)}
                                                        >
                                                            {key === "all"
                                                                ? "Tất cả"
                                                                : key === "singles"
                                                                    ? "Trận Đơn"
                                                                    : "Trận Đôi"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="filter-group filter-player">
                                                <span className="filter-label">Người chơi</span>
                                                <select
                                                    className="input-field"
                                                    value={historyPlayerFilter}
                                                    onChange={(e) => setHistoryPlayerFilter(e.target.value)}
                                                >
                                                    <option value="all">Tất cả</option>
                                                    {playerFilterOptions.map((player) => (
                                                        <option key={player.id} value={player.id}>
                                                            {player.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="filter-row">
                                            <div className="filter-group filter-dates">
                                                <span className="filter-label">Khoảng thời gian</span>
                                                <div className="date-grid">
                                                    <label className="date-field">
                                                        <span>Từ ngày</span>
                                                        <input
                                                            type="date"
                                                            className="input-field"
                                                            value={historyStartDate}
                                                            onChange={(e) => setHistoryStartDate(e.target.value)}
                                                        />
                                                    </label>
                                                    <label className="date-field">
                                                        <span>Đến ngày</span>
                                                        <input
                                                            type="date"
                                                            className="input-field"
                                                            value={historyEndDate}
                                                            onChange={(e) => setHistoryEndDate(e.target.value)}
                                                        />
                                                    </label>
                                                    <button
                                                        className="filter-reset"
                                                        type="button"
                                                        onClick={() => {
                                                            setHistoryStartDate("");
                                                            setHistoryEndDate("");
                                                        }}
                                                    >
                                                        Xóa lọc ngày
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {matches.length === 0 ? (
                                    <div className="empty-state">Chưa có trận đấu</div>
                                ) : filteredMatches.length === 0 ? (
                                    <div className="empty-state">Không có trận đấu phù hợp</div>
                                ) : (
                                    <>
                                        <div className="history-list">
                                            {paginatedMatches
                                                .map((match) => (
                                                    <div
                                                        key={match.id}
                                                        className="history-item"
                                                    >
                                                        <div className="history-header">
                                                            <span className="match-type">
                                                                {match.type === "singles"
                                                                    ? "Đơn"
                                                                    : "Đôi"}
                                                            </span>
                                                            <span className="match-date">
                                                                {formatDateLocal(
                                                                    match.date
                                                                )}
                                                            </span>
                                                        </div>
                                                        {/* NEW: show score nếu có */}
                                                        <div
                                                            style={{
                                                                fontWeight: 700,
                                                                margin: "6px 0",
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                gap: 8,
                                                                fontSize: 18,
                                                            }}
                                                        >
                                                            {match.score1 != null &&
                                                                match.score2 != null
                                                                ? `${match.score1} - ${match.score2}`
                                                                : ""}
                                                            {match.meta?.ratingDiff != null && (
                                                                <span style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 600,
                                                                    padding: '4px 8px',
                                                                    borderRadius: 999,
                                                                    background: match.meta.ratingDiff <= 10 ? '#ecfdf5' : match.meta.ratingDiff <= 30 ? '#fff7ed' : '#fff1f2',
                                                                    color: match.meta.ratingDiff <= 10 ? '#166534' : match.meta.ratingDiff <= 30 ? '#92400e' : '#991b1b'
                                                                }}>
                                                                    Δ {match.meta.ratingDiff}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="history-teams">
                                                            <div
                                                                className={`history-team ${match.winner === 1
                                                                    ? "winner"
                                                                    : ""
                                                                    }`}
                                                            >
                                                                <div>
                                                                    {match.team1
                                                                        .map((id) =>
                                                                            getPlayerName(id)
                                                                        )
                                                                        .join(", ")}
                                                                </div>
                                                                {match.meta?.pointDelta != null && (
                                                                    <div style={{
                                                                        marginTop: 4,
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        color: match.winner === 1 ? '#059669' : '#dc2626'
                                                                    }}>
                                                                        {match.winner === 1 ? '+' : '-'}{match.meta.pointDelta}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="vs">vs</span>
                                                            <div
                                                                className={`history-team ${match.winner === 2
                                                                    ? "winner"
                                                                    : ""
                                                                    }`}
                                                            >
                                                                <div>
                                                                    {match.team2
                                                                        .map((id) =>
                                                                            getPlayerName(id)
                                                                        )
                                                                        .join(", ")}
                                                                </div>
                                                                {match.meta?.pointDelta != null && (
                                                                    <div style={{
                                                                        marginTop: 4,
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        color: match.winner === 2 ? '#059669' : '#dc2626'
                                                                    }}>
                                                                        {match.winner === 2 ? '+' : '-'}{match.meta.pointDelta}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {editingMatchId === match.id ? (
                                                            <div className="history-edit-form" style={{ marginTop: 12, width: "100%" }}>
                                                                {/* Match type */}
                                                                <div style={{ marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
                                                                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                        <input
                                                                            type="radio"
                                                                            value="singles"
                                                                            checked={editingMatchType === "singles"}
                                                                            onChange={(e) => {
                                                                                setEditingMatchType(e.target.value);
                                                                                setEditingMatchTeam1(editingMatchTeam1.slice(0, 1));
                                                                                setEditingMatchTeam2(editingMatchTeam2.slice(0, 1));
                                                                            }}
                                                                            disabled={isUpdatingMatches}
                                                                        />
                                                                        <span>Trận Đơn</span>
                                                                    </label>
                                                                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                        <input
                                                                            type="radio"
                                                                            value="doubles"
                                                                            checked={editingMatchType === "doubles"}
                                                                            onChange={(e) => setEditingMatchType(e.target.value)}
                                                                            disabled={isUpdatingMatches}
                                                                        />
                                                                        <span>Trận Đôi</span>
                                                                    </label>
                                                                </div>

                                                                {/* Teams editing */}
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, marginBottom: 12 }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Đội 1</div>
                                                                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                                                                            {editingMatchTeam1.map((pid) => (
                                                                                <div key={pid} className="player-tag" style={{ justifyContent: "space-between" }}>
                                                                                    <span>{getPlayerName(pid)}</span>
                                                                                    <button
                                                                                        className="remove-tag-btn"
                                                                                        type="button"
                                                                                        onClick={() => setEditingMatchTeam1(editingMatchTeam1.filter((id) => id !== pid))}
                                                                                        disabled={isUpdatingMatches}
                                                                                    >
                                                                                        ✕
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <select
                                                                            className="input-field"
                                                                            style={{ width: "100%" }}
                                                                            value=""
                                                                            onChange={(e) => {
                                                                                const pid = e.target.value;
                                                                                const maxPerTeam = editingMatchType === "singles" ? 1 : 2;
                                                                                if (pid && editingMatchTeam1.length < maxPerTeam && !editingMatchTeam1.includes(pid) && !editingMatchTeam2.includes(pid)) {
                                                                                    setEditingMatchTeam1([...editingMatchTeam1, pid]);
                                                                                }
                                                                            }}
                                                                            disabled={isUpdatingMatches}
                                                                        >
                                                                            <option value="">+ Thêm người chơi</option>
                                                                            {playerFilterOptions
                                                                                .filter((p) => !p.disabled && !editingMatchTeam1.includes(p.id) && !editingMatchTeam2.includes(p.id))
                                                                                .map((p) => (
                                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                                ))}
                                                                        </select>
                                                                    </div>
                                                                    <div style={{ display: "flex", alignItems: "center", color: "#94a3b8", fontWeight: 600 }}>VS</div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Đội 2</div>
                                                                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                                                                            {editingMatchTeam2.map((pid) => (
                                                                                <div key={pid} className="player-tag" style={{ justifyContent: "space-between" }}>
                                                                                    <span>{getPlayerName(pid)}</span>
                                                                                    <button
                                                                                        className="remove-tag-btn"
                                                                                        type="button"
                                                                                        onClick={() => setEditingMatchTeam2(editingMatchTeam2.filter((id) => id !== pid))}
                                                                                        disabled={isUpdatingMatches}
                                                                                    >
                                                                                        ✕
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <select
                                                                            className="input-field"
                                                                            style={{ width: "100%" }}
                                                                            value=""
                                                                            onChange={(e) => {
                                                                                const pid = e.target.value;
                                                                                const maxPerTeam = editingMatchType === "singles" ? 1 : 2;
                                                                                if (pid && editingMatchTeam2.length < maxPerTeam && !editingMatchTeam1.includes(pid) && !editingMatchTeam2.includes(pid)) {
                                                                                    setEditingMatchTeam2([...editingMatchTeam2, pid]);
                                                                                }
                                                                            }}
                                                                            disabled={isUpdatingMatches}
                                                                        >
                                                                            <option value="">+ Thêm người chơi</option>
                                                                            {playerFilterOptions
                                                                                .filter((p) => !p.disabled && !editingMatchTeam1.includes(p.id) && !editingMatchTeam2.includes(p.id))
                                                                                .map((p) => (
                                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                                ))}
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                {/* Score editing */}
                                                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                                                                    <span style={{ fontWeight: 500, fontSize: 13 }}>Điểm:</span>
                                                                    <input
                                                                        type="number"
                                                                        className="input-field"
                                                                        style={{ width: 80 }}
                                                                        min={0}
                                                                        value={editingMatchScore1}
                                                                        onChange={(e) => setEditingMatchScore1(e.target.value)}
                                                                        disabled={isUpdatingMatches}
                                                                    />
                                                                    <span style={{ fontWeight: 600 }}>-</span>
                                                                    <input
                                                                        type="number"
                                                                        className="input-field"
                                                                        style={{ width: 80 }}
                                                                        min={0}
                                                                        value={editingMatchScore2}
                                                                        onChange={(e) => setEditingMatchScore2(e.target.value)}
                                                                        disabled={isUpdatingMatches}
                                                                    />
                                                                </div>

                                                                {/* Buttons */}
                                                                <div style={{ display: "flex", gap: 8 }}>
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        type="button"
                                                                        onClick={saveEditedMatch}
                                                                        disabled={isUpdatingMatches}
                                                                    >
                                                                        {isUpdatingMatches ? "Đang lưu..." : "Cập nhật"}
                                                                    </button>
                                                                    <button
                                                                        className="btn"
                                                                        type="button"
                                                                        onClick={cancelEditingMatch}
                                                                        disabled={isUpdatingMatches}
                                                                    >
                                                                        Huỷ
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ marginTop: 8 }}>
                                                                <button
                                                                    className="btn"
                                                                    type="button"
                                                                    onClick={() => startEditingMatch(match)}
                                                                >
                                                                    Chỉnh sửa
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                        {/* Pagination controls */}
                                        {totalPages > 1 && (
                                            <div className="pagination" style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginTop: 16,
                                                flexWrap: 'wrap'
                                            }}>
                                                <button
                                                    className="btn"
                                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                                    disabled={historyPage === 1}
                                                    style={{ padding: '8px 12px' }}
                                                >
                                                    ← Trước
                                                </button>
                                                <span style={{ fontSize: 14, color: '#64748b' }}>
                                                    Trang {historyPage} / {totalPages} ({filteredMatches.length} trận)
                                                </span>
                                                <button
                                                    className="btn"
                                                    onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={historyPage === totalPages}
                                                    style={{ padding: '8px 12px' }}
                                                >
                                                    Sau →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
                        )}
                        {/* Tab Cấu Hình Tính Điểm */}
                        {activeTab === "config" && (
                            <section className="section">
                                <h2 className="section-title">Cấu hình tính điểm</h2>

                                {/* WRAPPER CHỐNG TRÀN */}
                                <div style={{ width: "100%", overflowX: "auto" }}>
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            tableLayout: "fixed",
                                        }}
                                    >
                                        <thead>
                                            <tr>
                                                <th
                                                    style={{
                                                        textAlign: "left",
                                                        width: "45%",
                                                        paddingRight: 16,
                                                    }}
                                                >
                                                    Chênh lệch tối đa
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: "left",
                                                        width: "45%",
                                                        paddingLeft: 16,
                                                    }}
                                                >
                                                    Hệ số chia
                                                </th>
                                                <th style={{ width: 40 }} />
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {scoreConfig.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ paddingRight: 4, paddingBottom: 3 }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{ width: "100%" }}
                                                            min={0}
                                                            value={row.maxPointDiff}
                                                            onChange={(e) => {
                                                                const v = [
                                                                    ...scoreConfig,
                                                                ];
                                                                const val = Math.max(0, Number(e.target.value));
                                                                v[idx].maxPointDiff = val === 0 && e.target.value === "" ? "" : val;
                                                                setScoreConfig(v);
                                                            }}
                                                        />
                                                    </td>

                                                    <td style={{ paddingLeft: 4, paddingBottom: 3 }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{ width: "100%" }}
                                                            min={0}
                                                            value={row.divisor}
                                                            onChange={(e) => {
                                                                const v = [
                                                                    ...scoreConfig,
                                                                ];
                                                                const val = Math.max(0, Number(e.target.value));
                                                                v[idx].divisor = val === 0 && e.target.value === "" ? "" : val;
                                                                setScoreConfig(v);
                                                            }}
                                                        />
                                                    </td>

                                                    <td style={{ textAlign: "center" }}>
                                                        <button
                                                            className="btn-delete"
                                                            style={{
                                                                minWidth: 28,
                                                                padding: "4px 6px",
                                                            }}
                                                            onClick={() => {
                                                                setScoreConfig(
                                                                    scoreConfig.filter(
                                                                        (_, i) =>
                                                                            i !== idx
                                                                    )
                                                                );
                                                            }}
                                                        >
                                                            Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ACTIONS */}
                                <div
                                    style={{
                                        marginTop: 12,
                                        display: "flex",
                                        gap: 10,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <button
                                        className="btn"
                                        onClick={() =>
                                            setScoreConfig([
                                                ...scoreConfig,
                                                { maxPointDiff: 0, divisor: 1 },
                                            ])
                                        }
                                    >
                                        + Thêm dòng
                                    </button>

                                    <button
                                        className="btn btn-primary"
                                        onClick={() => openAuthModal('Nhập mã xác nhận để lưu cấu hình:', async (code) => {
                                            if (!isAuthValid(code)) {
                                                addToast('Mã xác nhận không đúng!', 'error');
                                                return;
                                            }
                                            try {
                                                // Xóa toàn bộ cấu hình cũ
                                                const { error: delError } = await supabase.from('scoreconfig').delete().gt('id', -1);
                                                if (delError) throw delError;
                                                // Thêm lại cấu hình mới (không truyền id)
                                                const insertRows = scoreConfig.map(({ maxPointDiff, divisor }) => ({ maxPointDiff, divisor }));
                                                const { error: insError } = await supabase.from('scoreconfig').insert(insertRows);
                                                if (insError) throw insError;
                                                // Reload lại dữ liệu
                                                const { data: scoreConfigData, error: selError } = await supabase.from('scoreconfig').select('*');
                                                if (selError) throw selError;
                                                setScoreConfig(scoreConfigData || []);
                                                addToast('Đã lưu cấu hình vào Supabase', 'success');
                                            } catch (err) {
                                                addToast('Lỗi cập nhật Supabase: ' + (err.message || err), 'error');
                                            }
                                        })}
                                    >
                                        Lưu cấu hình
                                    </button>

                                    <button
                                        className="btn btn-danger"
                                        style={{ marginLeft: 8 }}
                                        onClick={() => openAuthModal('⚠️ TÍNH LẠI TOÀN BỘ DATABASE - Nhập mã xác nhận:', async (code) => {
                                            if (!isAuthValid(code)) {
                                                addToast('Mã xác nhận không đúng!', 'error');
                                                return;
                                            }
                                            await recalculateAllMatches();
                                        })}
                                        disabled={isUpdatingMatches}
                                    >
                                        {isUpdatingMatches ? 'Đang tính lại...' : '🔄 Tính lại toàn bộ database'}
                                    </button>
                                </div>

                                <div
                                    style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}
                                >
                                    * Hàng cuối nên là giá trị lớn để bao quát mọi
                                    trường hợp
                                </div>
                            </section>
                        )}

                        {/* Tab Biểu đồ */}
                        {activeTab === "chart" && (
                            <section className="section">
                                <h2 className="section-title">Biểu Đồ Điểm Số Theo Thời Gian</h2>

                                {/* Player selection */}
                                <div style={{ marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
                                        Chọn người chơi để so sánh (tối đa 6 người)
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {playerFilterOptions
                                            .filter(p => !p.disabled)
                                            .map(player => {
                                                const isSelected = chartPlayerIds.includes(player.id);
                                                return (
                                                    <button
                                                        key={player.id}
                                                        className={isSelected ? "btn btn-primary" : "btn"}
                                                        style={{
                                                            padding: '8px 12px',
                                                            fontSize: 13,
                                                            opacity: !isSelected && chartPlayerIds.length >= 6 ? 0.5 : 1,
                                                            cursor: !isSelected && chartPlayerIds.length >= 6 ? 'not-allowed' : 'pointer'
                                                        }}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                // Remove player
                                                                setChartPlayerIds(chartPlayerIds.filter(id => id !== player.id));
                                                            } else if (chartPlayerIds.length < 6) {
                                                                // Add player
                                                                setChartPlayerIds([...chartPlayerIds, player.id]);
                                                            }
                                                        }}
                                                        disabled={!isSelected && chartPlayerIds.length >= 6}
                                                    >
                                                        {player.name}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Chart */}
                                <div style={{ background: '#fff', borderRadius: 8, padding: 20, border: '1px solid #e6eef7' }}>
                                    <LineChart data={calculatePointTimeline(chartPlayerIds)} />
                                </div>

                                {/* Stats summary */}
                                {chartPlayerIds.length > 0 && (
                                    <div style={{ marginTop: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
                                            Thống kê
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                                            {chartPlayerIds.map(playerId => {
                                                const player = players.find(p => p.id === playerId);
                                                if (!player) return null;
                                                const ranking = rankingData.find(r => r.name === player.name);
                                                const winRate = ranking?.totalMatches > 0
                                                    ? Math.round((ranking.wins / ranking.totalMatches) * 100)
                                                    : 0;
                                                return (
                                                    <div
                                                        key={playerId}
                                                        style={{
                                                            background: '#fafafa',
                                                            padding: 12,
                                                            borderRadius: 8,
                                                            border: '1px solid #e5e7eb'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600, marginBottom: 6 }}>{player.name}</div>
                                                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                                                            Điểm: <span style={{ fontWeight: 600, color: '#374151' }}>{ranking?.points ?? 0}</span>
                                                        </div>
                                                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                                                            Trận: {ranking?.totalMatches ?? 0} •
                                                            Thắng: {ranking?.wins ?? 0} •
                                                            {winRate}%
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Các tab khác giữ nguyên UI như cũ */}
                        {/* (Không cắt bớt để tránh phá layout của bạn) */}
                    </>
                )}
            </main>
            <AuthModal />
        </div>
    );
}

export default App;
