import { useState, useEffect } from "react";
import "./App.css";

const API_URL =
    "https://script.google.com/macros/s/AKfycbyDSW4ZAkBVROvWbA_j82ugaVPotGz4kBjOfriEIK7p6olAO5lKJsSEe0hoPfEwcFc2rA/exec";

function App() {
    const [isLoaded, setIsLoaded] = useState(false);

    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [scoreConfig, setScoreConfig] = useState([]);

    const [newPlayerName, setNewPlayerName] = useState("");
    const [activeTab, setActiveTab] = useState("ranking");
    const [matchType, setMatchType] = useState("singles");

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
        return d.toLocaleString("vi-VN", {
            hour12: false,
            dateStyle: "short",
            timeStyle: "short",
        });
    };

    const getDivisorByPointDiff = (diff) => {
        if (!scoreConfig.length) return 2;
        return (
            scoreConfig.find((c) => diff <= c.maxPointDiff)?.divisor ??
            scoreConfig[scoreConfig.length - 1].divisor
        );
    };

    const getTeamPoints = (teamPlayers, rankingMap) => {
        return (teamPlayers || []).reduce((sum, pid) => {
            return sum + (rankingMap[pid]?.points ?? 0);
        }, 0);
    };

    /* =======================
       LOAD DATA
    ======================= */

    useEffect(() => {
        const loadData = async () => {
            const res = await fetch(API_URL);
            const data = await res.json();

            setScoreConfig(data.scoreConfig || []);

            const fixedPlayers = (data.players || []).map((p) => ({
                id: p.id ?? crypto.randomUUID(),
                name: p.name,
            }));

            const fixedMatches = (data.matches || []).filter(
                (m) =>
                    m.team1 &&
                    m.team2 &&
                    (m.winner || (m.score1 != null && m.score2 != null))
            );

            setPlayers(fixedPlayers);
            setMatches(fixedMatches);
            setIsLoaded(true);
        };

        loadData();
    }, []);

    /* =======================
       AUTO SAVE (FULL PAYLOAD)
    ======================= */

    useEffect(() => {
        if (!isLoaded) return;

        const timeout = setTimeout(() => {
            fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    players,
                    matches,
                    scoreConfig,
                }),
            });
        }, 800);

        return () => clearTimeout(timeout);
    }, [players, matches, scoreConfig, isLoaded]);

    /* =======================
       PLAYERS
    ======================= */

    const addPlayer = () => {
        if (!newPlayerName.trim()) return;

        setPlayers([
            ...players,
            { id: crypto.randomUUID(), name: newPlayerName.trim() },
        ]);
        setNewPlayerName("");
    };

    const deletePlayer = (id) => {
        const hasHistory = matches.some(
            (m) => m.team1.includes(id) || m.team2.includes(id)
        );

        if (hasHistory) {
            alert("Không thể xóa người chơi đã có lịch sử thi đấu.");
            return;
        }

        setPlayers(players.filter((p) => p.id !== id));
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

    const createMatch = () => {
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

        const divisorUsed = getDivisorByPointDiff(ratingDiff);
        const pointDelta = Math.max(1, Math.round(scoreDiff / divisorUsed));

        setMatches([
            ...matches,
            {
                id: crypto.randomUUID(),
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
                    divisorUsed,
                    scoreDiff,
                    pointDelta,
                },
            },
        ]);

        setTeam1({ players: [] });
        setTeam2({ players: [] });
        setMatchType("singles");
        setScoreTeam1("");
        setScoreTeam2("");

        alert("Trận đấu đã được lưu (đã chốt điểm)");
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
                ranking[pid].points += delta;
                ranking[pid].wins += 1;
            });

            match[`team${loserTeam}`].forEach((pid) => {
                ranking[pid].points -= delta;
            });

            match.team1.forEach((pid) => ranking[pid].totalMatches++);
            match.team2.forEach((pid) => ranking[pid].totalMatches++);
        });

        if (forSnapshot) return ranking;

        return Object.values(ranking).sort((a, b) => b.points - a.points);
    };

    const rankingData = calculateRanking();

    /* =======================
       RENDER
    ======================= */

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="header-title">BADMINTON LEGEND ALLIANCE</h1>
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
                {/* Xếp hạng */}
                {activeTab === "ranking" && (
                    <section className="section">
                        <h2 className="section-title">Bảng Xếp Hạng</h2>

                        {rankingData.map((p, i) => (
                            <div key={p.name + i} className="ranking-item">
                                <div className="rank-number">#{i + 1}</div>
                                <div className="player-details">
                                    <div className="player-name">{p.name}</div>
                                    <div className="player-stats">
                                        {p.totalMatches} trận • {p.wins} thắng
                                    </div>
                                </div>
                                <div className="player-points">{p.points}</div>
                            </div>
                        ))}
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
                                        <div className="placeholder">
                                            Chưa chọn
                                        </div>
                                    ) : (
                                        team1.players.map((playerId) => (
                                            <div
                                                key={playerId}
                                                className="player-tag"
                                            >
                                                <span>
                                                    {getPlayerName(playerId)}
                                                </span>
                                                <button
                                                    className="remove-tag-btn"
                                                    onClick={() =>
                                                        removePlayerFromTeam(
                                                            1,
                                                            playerId
                                                        )
                                                    }
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {/* Danh sách người chơi có thể chọn vào đội 1 */}
                                <div className="player-buttons">
                                    {players
                                        .filter(
                                            (p) =>
                                                !team1.players.includes(p.id) &&
                                                !team2.players.includes(p.id)
                                        )
                                        .map((player) => (
                                            <button
                                                key={player.id}
                                                className="player-select-btn"
                                                onClick={() =>
                                                    addPlayerToTeam(
                                                        1,
                                                        player.id
                                                    )
                                                }
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
                                        <div className="placeholder">
                                            Chưa chọn
                                        </div>
                                    ) : (
                                        team2.players.map((playerId) => (
                                            <div
                                                key={playerId}
                                                className="player-tag"
                                            >
                                                <span>
                                                    {getPlayerName(playerId)}
                                                </span>
                                                <button
                                                    className="remove-tag-btn"
                                                    onClick={() =>
                                                        removePlayerFromTeam(
                                                            2,
                                                            playerId
                                                        )
                                                    }
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {/* Danh sách người chơi có thể chọn vào đội 2 */}
                                <div className="player-buttons">
                                    {players
                                        .filter(
                                            (p) =>
                                                !team1.players.includes(p.id) &&
                                                !team2.players.includes(p.id)
                                        )
                                        .map((player) => (
                                            <button
                                                key={player.id}
                                                className="player-select-btn"
                                                onClick={() =>
                                                    addPlayerToTeam(
                                                        2,
                                                        player.id
                                                    )
                                                }
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

                                <span
                                    style={{ fontWeight: 500, flexShrink: 0 }}
                                >
                                    -
                                </span>

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

                        {/* Chọn đội thắng và lưu trận (giữ UI cũ, nhưng winner sẽ tự tính theo score) */}
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
                                {players.map((player) => (
                                    <div
                                        key={player.id}
                                        className="player-item"
                                    >
                                        <div className="player-name">
                                            {player.name}
                                        </div>
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
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Tab Lịch Sử Trận Đấu */}
                {activeTab === "history" && (
                    <section className="section">
                        <h2 className="section-title">Lịch Sử Trận Đấu</h2>
                        {matches.length === 0 ? (
                            <div className="empty-state">Chưa có trận đấu</div>
                        ) : (
                            <div className="history-list">
                                {matches
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
                                    await fetch(API_URL, {
                                        method: "POST",
                                        mode: "no-cors",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({ scoreConfig }),
                                    });
                                    alert("Đã lưu cấu hình");
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
            </main>
        </div>
    );
}

export default App;
