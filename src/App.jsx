import { useState, useEffect } from "react";
import "./App.css";

function App() {
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [newPlayerName, setNewPlayerName] = useState("");
    const [activeTab, setActiveTab] = useState("ranking");
    const [matchType, setMatchType] = useState("singles");
    const [team1, setTeam1] = useState({ players: [] });
    const [team2, setTeam2] = useState({ players: [] });

    useEffect(() => {
        const savedPlayers = localStorage.getItem("badmintonPlayers");
        const savedMatches = localStorage.getItem("badmintonMatches");
        if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
        if (savedMatches) setMatches(JSON.parse(savedMatches));
    }, []);

    useEffect(() => {
        localStorage.setItem("badmintonPlayers", JSON.stringify(players));
    }, [players]);

    useEffect(() => {
        localStorage.setItem("badmintonMatches", JSON.stringify(matches));
    }, [matches]);

    const addPlayer = () => {
        if (newPlayerName.trim()) {
            setPlayers([
                ...players,
                { id: Date.now(), name: newPlayerName.trim() },
            ]);
            setNewPlayerName("");
        }
    };

    const deletePlayer = (id) => {
        setPlayers(players.filter((p) => p.id !== id));
    };

    const createMatch = (winnerTeam) => {
        const isValidSingles =
            matchType === "singles" &&
            team1.players.length &&
            team2.players.length;
        const isValidDoubles =
            matchType === "doubles" &&
            team1.players.length === 2 &&
            team2.players.length === 2;

        if (isValidSingles || isValidDoubles) {
            setMatches([
                ...matches,
                {
                    id: Date.now(),
                    type: matchType,
                    team1: team1.players,
                    team2: team2.players,
                    winner: winnerTeam,
                    date: new Date().toLocaleDateString("vi-VN"),
                },
            ]);
            setTeam1({ players: [] });
            setTeam2({ players: [] });
            setMatchType("singles");
            alert("Trận đấu đã được lưu!");
        }
    };

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
            if (team === 1) setTeam1(newTeam);
            else setTeam2(newTeam);
        }
    };

    const removePlayerFromTeam = (team, playerId) => {
        const teamState = team === 1 ? team1 : team2;
        const newTeam = {
            ...teamState,
            players: teamState.players.filter((id) => id !== playerId),
        };
        if (team === 1) setTeam1(newTeam);
        else setTeam2(newTeam);
    };

    const calculateRanking = () => {
        const ranking = {};
        players.forEach((p) => {
            ranking[p.id] = {
                name: p.name,
                points: 0,
                totalMatches: 0,
                wins: 0,
            };
        });

        matches.forEach((match) => {
            const winner = match.winner;
            const loser = match.winner === 1 ? 2 : 1;

            if (match.type === "singles") {
                match[`team${winner}`].forEach((pid) => {
                    ranking[pid].points += 3;
                    ranking[pid].wins += 1;
                });
                match[`team${loser}`].forEach((pid) => {
                    ranking[pid].points += 1;
                });
            } else {
                match[`team${winner}`].forEach((pid) => {
                    ranking[pid].points += 2;
                    ranking[pid].wins += 1;
                });
                match[`team${loser}`].forEach((pid) => {
                    ranking[pid].points += 1;
                });
            }
            match.team1.forEach((pid) => (ranking[pid].totalMatches += 1));
            match.team2.forEach((pid) => (ranking[pid].totalMatches += 1));
        });

        return Object.values(ranking).sort((a, b) => b.points - a.points);
    };

    const getPlayerName = (id) =>
        players.find((p) => p.id === id)?.name || "Không xác định";

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <h1 className="header-title">Cầu Lông</h1>
            </header>

            {/* Navigation */}
            <nav className="nav-bar">
                <button
                    className={`nav-btn ${
                        activeTab === "ranking" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("ranking")}
                >
                    Xếp Hạng
                </button>
                <button
                    className={`nav-btn ${
                        activeTab === "createMatch" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("createMatch")}
                >
                    Trận Đấu
                </button>
                <button
                    className={`nav-btn ${
                        activeTab === "players" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("players")}
                >
                    Người Chơi
                </button>
                <button
                    className={`nav-btn ${
                        activeTab === "history" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("history")}
                >
                    Lịch Sử
                </button>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                {/* RANKING */}
                {activeTab === "ranking" && (
                    <section className="section">
                        <h2 className="section-title">Bảng Xếp Hạng</h2>
                        {calculateRanking().length === 0 ? (
                            <div className="empty-state">Chưa có dữ liệu</div>
                        ) : (
                            <div className="ranking-list">
                                {calculateRanking().map((player, idx) => (
                                    <div
                                        key={player.name}
                                        className="ranking-item"
                                    >
                                        <div className="rank-number">
                                            #{idx + 1}
                                        </div>
                                        <div className="player-details">
                                            <div className="player-name">
                                                {player.name}
                                            </div>
                                            <div className="player-stats">
                                                {player.totalMatches} trận •{" "}
                                                {player.wins} thắng
                                            </div>
                                        </div>
                                        <div className="player-points">
                                            {player.points}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* CREATE MATCH */}
                {activeTab === "createMatch" && (
                    <section className="section">
                        <h2 className="section-title">Tạo Trận Đấu</h2>

                        {/* Match Type */}
                        <div className="match-type-group">
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

                        {/* Team Selection */}
                        <div className="teams-container">
                            {/* Team 1 */}
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

                            {/* VS */}
                            <div className="vs-divider">VS</div>

                            {/* Team 2 */}
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

                        {/* Result Buttons */}
                        <div className="result-buttons">
                            <button
                                className="btn btn-primary"
                                onClick={() => createMatch(1)}
                            >
                                Đội 1 Thắng
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => createMatch(2)}
                            >
                                Đội 2 Thắng
                            </button>
                        </div>
                    </section>
                )}

                {/* PLAYERS */}
                {activeTab === "players" && (
                    <section className="section">
                        <h2 className="section-title">Người Chơi</h2>

                        {/* Add Player */}
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

                        {/* Player List */}
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
                                            onClick={() =>
                                                deletePlayer(player.id)
                                            }
                                        >
                                            Xoá
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* HISTORY */}
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
                                                    {match.date}
                                                </span>
                                            </div>
                                            <div className="history-teams">
                                                <div
                                                    className={`history-team ${
                                                        match.winner === 1
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
                                                    className={`history-team ${
                                                        match.winner === 2
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
            </main>
        </div>
    );
}

export default App;
