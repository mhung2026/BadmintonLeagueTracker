
import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

function App() {
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

    const [team1, setTeam1] = useState({ players: [] });
    const [team2, setTeam2] = useState({ players: [] });

    const [scoreTeam1, setScoreTeam1] = useState("");
    const [scoreTeam2, setScoreTeam2] = useState("");

    /* =======================
       HELPERS
    ======================= */

    const getPlayerName = (id) =>
        players.find((p) => p.id === id)?.name || "Không xác định";

    const formatDateLocal = (isoString) => {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return "--:-- --/--/----";
        const pad = (val) => String(val).padStart(2, "0");
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        return `${hours}:${minutes} ${day}/${month}/${year}`;
    };

    const getDivisorByPointDiff = (diff) => {
        if (!scoreConfig.length) return 2;

        const sorted = [...scoreConfig].sort(
            (a, b) => (a.maxPointDiff ?? 0) - (b.maxPointDiff ?? 0)
        );

        let divisor = sorted[0]?.divisor ?? 2;
        for (const rule of sorted) {
            if (diff >= (rule.maxPointDiff ?? 0)) {
                divisor = rule.divisor;
            } else {
                break;
            }
        }

        return divisor ?? 2;
    };

    const getTeamPoints = (teamPlayers, rankingMap) => {
        return (teamPlayers || []).reduce((sum, pid) => {
            return sum + (rankingMap[pid]?.points ?? 0);
        }, 0);
    };

    const fetchPlayers = useCallback(async () => {
        const { data, error } = await supabase.from("players").select("*");
        if (error) {
            console.error("Không thể tải danh sách người chơi", error);
            return [];
        }
        setPlayers(data || []);
        return data || [];
    }, []);

    const fetchMatches = useCallback(async () => {
        const { data, error } = await supabase.from("matches").select("*");
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
        // Không autosave toàn bộ payload như Google Sheets nữa
        // Mỗi thao tác sẽ gọi Supabase CRUD riêng
    }, []);

    /* =======================
       PLAYERS
    ======================= */

    const addPlayer = async () => {
        if (!newPlayerName.trim()) return;
        const newPlayer = { name: newPlayerName.trim() };

        const { error } = await supabase.from("players").insert([newPlayer]);
        if (error) {
            alert("Không thể thêm người chơi mới. Vui lòng thử lại.");
            return;
        }

        setNewPlayerName("");
        fetchPlayers();
    };

    const deletePlayer = (id) => {
        const hasHistory = matches.some(
            (m) => m.team1.includes(id) || m.team2.includes(id)
        );
        if (hasHistory) {
            alert("Không thể xóa người chơi đã có lịch sử thi đấu.");
            return;
        }
        supabase.from("players").delete().eq("id", id).then(() => {
            setPlayers(players.filter((p) => p.id !== id));
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
            alert("Không thể cập nhật tên. Vui lòng thử lại.");
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
        const isValidSingles =
            matchType === "singles" &&
            team1.players.length === 1 &&
            team2.players.length === 1;

        const isValidDoubles =
            matchType === "doubles" &&
            team1.players.length === 2 &&
            team2.players.length === 2;

        if (!(isValidSingles || isValidDoubles)) return;

        const allPlayers = [...team1.players, ...team2.players];
        if (new Set(allPlayers).size !== allPlayers.length) {
            alert("Một người không thể ở cả hai đội");
            return;
        }

        const s1 = Number(scoreTeam1);
        const s2 = Number(scoreTeam2);

        if (!Number.isFinite(s1) || !Number.isFinite(s2) || s1 === s2) {
            alert("Vui lòng nhập điểm hợp lệ (không được hòa)");
            return;
        }

        /* ===== SNAPSHOT RANKING HIỆN TẠI ===== */
        const currentRanking = calculateRanking(true); // chế độ snapshot

        const team1PtsBefore = getTeamPoints(team1.players, currentRanking);
        const team2PtsBefore = getTeamPoints(team2.players, currentRanking);

        const ratingDiff = Math.abs(team1PtsBefore - team2PtsBefore);
        const scoreDiff = Math.abs(s1 - s2);

        const divisorUsed = getDivisorByPointDiff(scoreDiff);
        const pointDelta = Math.max(1, Math.round(scoreDiff / Math.max(divisorUsed, 1)));

        const newMatch = {
            type: matchType,
            team1: team1.players,
            team2: team2.players,
            score1: s1,
            score2: s2,
            winner: s1 > s2 ? 1 : 2,
            date: new Date().toISOString(),
            meta: {
                team1PtsBefore,
                team2PtsBefore,
                ratingDiff,
                scoreDiff,
                divisorUsed,
                pointDelta,
            },
        };
        try {
            const { error } = await supabase
                .from("matches")
                .insert([newMatch]);
            if (error) throw error;

            await fetchMatches();

            setTeam1({ players: [] });
            setTeam2({ players: [] });
            setMatchType("doubles");
            setScoreTeam1("");
            setScoreTeam2("");

            alert("Trận đấu đã được lưu (đã chốt điểm)");
        } catch (err) {
            console.error("Không thể lưu trận đấu", err);
            alert("Không thể lưu trận đấu. Vui lòng thử lại.");
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

    /* =======================
       MATCH HISTORY EDITING
    ======================= */

    const EDIT_MATCH_CODE = "Hungvjppro";

    const startEditingMatch = (match) => {
        const code = prompt("Nhập mã xác nhận để chỉnh sửa:");
        if (code !== EDIT_MATCH_CODE) {
            alert("Mã xác nhận không đúng!");
            return;
        }

        setEditingMatchId(match.id);
        setEditingMatchScore1(
            match.score1 === null || match.score1 === undefined
                ? ""
                : String(match.score1)
        );
        setEditingMatchScore2(
            match.score2 === null || match.score2 === undefined
                ? ""
                : String(match.score2)
        );
        setEditingMatchTeam1([...(match.team1 || [])]);
        setEditingMatchTeam2([...(match.team2 || [])]);
        setEditingMatchType(match.type || "doubles");
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
            const divisorUsed = getDivisorByPointDiff(scoreDiff);
            const pointDelta = Math.max(
                1,
                Math.round(scoreDiff / Math.max(divisorUsed, 1))
            );
            const winner = score1 > score2 ? 1 : 2;
            const loser = winner === 1 ? 2 : 1;

            const updatedMatch = {
                ...match,
                score1,
                score2,
                winner,
                meta: {
                    team1PtsBefore,
                    team2PtsBefore,
                    ratingDiff,
                    scoreDiff,
                    divisorUsed,
                    pointDelta,
                },
            };

            (updatedMatch[`team${winner}`] || []).forEach((pid) => {
                if (!rankingMap[pid]) rankingMap[pid] = { points: 0 };
                rankingMap[pid].points += pointDelta;
            });

            (updatedMatch[`team${loser}`] || []).forEach((pid) => {
                if (!rankingMap[pid]) rankingMap[pid] = { points: 0 };
                rankingMap[pid].points -= pointDelta;
            });

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
            alert("Vui lòng nhập đầy đủ điểm");
            return;
        }

        const s1 = Number(editingMatchScore1);
        const s2 = Number(editingMatchScore2);

        if (!Number.isFinite(s1) || !Number.isFinite(s2) || s1 === s2) {
            alert("Điểm không hợp lệ (không được hòa)");
            return;
        }

        setIsUpdatingMatches(true);

        try {
            const maxPerTeam = editingMatchType === "singles" ? 1 : 2;
            if (editingMatchTeam1.length !== maxPerTeam || editingMatchTeam2.length !== maxPerTeam) {
                alert(`Mỗi đội cần ${maxPerTeam} người chơi`);
                return;
            }

            const allPlayers = [...editingMatchTeam1, ...editingMatchTeam2];
            if (new Set(allPlayers).size !== allPlayers.length) {
                alert("Một người không thể ở cả hai đội");
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
            alert("Đã cập nhật lịch sử đấu và làm mới meta");
        } catch (err) {
            console.error(err);
            alert("Không thể cập nhật lịch sử đấu. Vui lòng thử lại");
        } finally {
            setIsUpdatingMatches(false);
        }
    };

    const rankingData = calculateRanking();
    const playerFilterOptions = [...players].sort((a, b) =>
        a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
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
    const filteredMatches = matches.filter((match) => {
        const typeMatch = historyFilter === "all" ? true : match.type === historyFilter;
        const playerMatch = hasPlayerInTeam(match.team1, playerFilterId) || hasPlayerInTeam(match.team2, playerFilterId);
        const matchDate = new Date(match.date);
        const afterStart = startDateFilter ? matchDate >= startDateFilter : true;
        const beforeEnd = endDateFilter ? matchDate <= endDateFilter : true;
        return typeMatch && playerMatch && afterStart && beforeEnd;
    });

    /* =======================
       RENDER
    ======================= */

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
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Đang tải dữ liệu...</p>
                    </div>
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
                                        .filter((p) => !team1.players.includes(p.id) && !team2.players.includes(p.id))
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
                            <div className="vs-divider">VS</div>

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
                                        .filter((p) => !team1.players.includes(p.id) && !team2.players.includes(p.id))
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
                            >
                                Lưu kết quả trận đấu
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
                                className="input-field"
                                value={newPlayerName}
                                onChange={(e) =>
                                    setNewPlayerName(e.target.value)
                                }
                                onKeyPress={(e) =>
                                    e.key === "Enter" && addPlayer()
                                }
                                placeholder="Nhập tên..."
                            />
                            <button
                                className="btn btn-primary"
                                onClick={addPlayer}
                            >
                                Thêm
                            </button>
                        </div>

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
                                                        {player.name}
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
                            <div className="history-list">
                                {filteredMatches
                                    .slice()
                                    .reverse()
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
                                                    fontSize: 18,
                                                }}
                                            >
                                                {match.score1 != null &&
                                                    match.score2 != null
                                                    ? `${match.score1} - ${match.score2}`
                                                    : ""}
                                            </div>
                                            <div className="history-teams">
                                                <div
                                                    className={`history-team ${match.winner === 1
                                                            ? "winner"
                                                            : ""
                                                        }`}
                                                >
                                                    {match.team1
                                                        .map((id) =>
                                                            getPlayerName(id)
                                                        )
                                                        .join(", ")}
                                                </div>
                                                <span className="vs">vs</span>
                                                <div
                                                    className={`history-team ${match.winner === 2
                                                            ? "winner"
                                                            : ""
                                                        }`}
                                                >
                                                    {match.team2
                                                        .map((id) =>
                                                            getPlayerName(id)
                                                        )
                                                        .join(", ")}
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
                                                                    .filter((p) => !editingMatchTeam1.includes(p.id) && !editingMatchTeam2.includes(p.id))
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
                                                                    .filter((p) => !editingMatchTeam1.includes(p.id) && !editingMatchTeam2.includes(p.id))
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

                                            <td style={{ paddingLeft: 4, paddingBottom: 3}}>
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
                                onClick={async () => {
                                    try {
                                        // Xóa toàn bộ cấu hình cũ
                                        const { error: delError } = await supabase.from("scoreconfig").delete().gt("id", -1);
                                        if (delError) throw delError;
                                        // Thêm lại cấu hình mới (không truyền id)
                                        const insertRows = scoreConfig.map(({ maxPointDiff, divisor }) => ({ maxPointDiff, divisor }));
                                        const { error: insError } = await supabase.from("scoreconfig").insert(insertRows);
                                        if (insError) throw insError;
                                        // Reload lại dữ liệu
                                        const { data: scoreConfigData, error: selError } = await supabase.from("scoreconfig").select("*");
                                        if (selError) throw selError;
                                        setScoreConfig(scoreConfigData || []);
                                        alert("Đã lưu cấu hình vào Supabase");
                                    } catch (err) {
                                        alert("Lỗi cập nhật Supabase: " + (err.message || err));
                                    }
                                }}
                            >
                                Lưu cấu hình
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

                {/* Các tab khác giữ nguyên UI như cũ */}
                {/* (Không cắt bớt để tránh phá layout của bạn) */}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
