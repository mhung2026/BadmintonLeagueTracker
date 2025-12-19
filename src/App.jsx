import { useState, useEffect } from "react";
import "./App.css";
const API_URL = "https://script.google.com/macros/s/AKfycbyhwsQKYu29hbkKebinEAj_WnFXCJ_0xSeBbuYjF9pF5xEo5K2VIpSQMLeaeR1b8uu_gQ/exec";

// Ứng dụng quản lý giải cầu lông: lưu người chơi, trận đấu, xếp hạng, lịch sử

function App() {
    const [isLoaded, setIsLoaded] = useState(false);
    // Danh sách người chơi
    const [players, setPlayers] = useState([]);
    // Danh sách trận đấu
    const [matches, setMatches] = useState([]);
    // Tên người chơi mới nhập
    const [newPlayerName, setNewPlayerName] = useState("");
    // Tab đang hiển thị: xếp hạng, tạo trận, người chơi, lịch sử
    const [activeTab, setActiveTab] = useState("ranking");
    // Loại trận đấu: đơn hay đôi
    const [matchType, setMatchType] = useState("singles");
    // Đội 1 (danh sách id người chơi)
    const [team1, setTeam1] = useState({ players: [] });
    // Đội 2 (danh sách id người chơi)
    const [team2, setTeam2] = useState({ players: [] });

    // Lấy dữ liệu người chơi và trận đấu từ localStorage khi load app
    // useEffect(() => {
    //     const savedPlayers = localStorage.getItem("badmintonPlayers");
    //     const savedMatches = localStorage.getItem("badmintonMatches");
    //     if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    //     if (savedMatches) setMatches(JSON.parse(savedMatches));
    // }, []);
    useEffect(() => {
        const loadData = async () => {
            const res = await fetch(API_URL);
            const data = await res.json();

            const fixedPlayers = (data.players || []).map(p => ({
                id: p.id ?? Date.now() + Math.random(),
                name: p.name
            }));

            const fixedMatches = (data.matches || []).filter(m =>
                m.team1 && m.team2 && m.winner
            );

            setPlayers(fixedPlayers);
            setMatches(fixedMatches);
            setIsLoaded(true);
        };

        loadData();
    }, []);



    // Lưu người chơi vào localStorage khi thay đổi
    // useEffect(() => {
    //     localStorage.setItem("badmintonPlayers", JSON.stringify(players));
    // }, [players]);

    // // Lưu trận đấu vào localStorage khi thay đổi
    // useEffect(() => {
    //     localStorage.setItem("badmintonMatches", JSON.stringify(matches));
    // }, [matches]);
    useEffect(() => {
        if (!isLoaded) return;

        const timeout = setTimeout(() => {
            fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ players, matches })
            });
        }, 800);

        return () => clearTimeout(timeout);
    }, [players, matches, isLoaded]);


    // Thêm người chơi mới vào danh sách
    const addPlayer = () => {
        if (newPlayerName.trim()) {
            setPlayers([
                ...players,
                { id: Date.now(), name: newPlayerName.trim() },
            ]);
            setNewPlayerName("");
        }
    };

    // Xoá người chơi khỏi danh sách
    const deletePlayer = (id) => {
        setPlayers(players.filter((p) => p.id !== id));
    };

    // Tạo trận đấu mới, lưu vào danh sách trận
    // winnerTeam: 1 hoặc 2 (đội thắng)
    const createMatch = (winnerTeam) => {
        // Kiểm tra hợp lệ: trận đơn (1 vs 1), trận đôi (2 vs 2)
        const isValidSingles =
            matchType === "singles" &&
            team1.players.length === 1 &&
            team2.players.length === 1;
        const isValidDoubles =
            matchType === "doubles" &&
            team1.players.length === 2 &&
            team2.players.length === 2;
        if (isValidSingles || isValidDoubles) {
            setMatches([
                ...matches,
                {
                    id: crypto.randomUUID(),
                    type: matchType,
                    team1: team1.players,
                    team2: team2.players,
                    winner: winnerTeam,
                    date: new Date().toISOString(),
                },
            ]);
            // Reset chọn đội và loại trận về mặc định
            setTeam1({ players: [] });
            setTeam2({ players: [] });
            setMatchType("singles");
            alert("Trận đấu đã được lưu!");
        }
    };

    // Thêm người chơi vào đội (team: 1 hoặc 2)
    const addPlayerToTeam = (team, playerId) => {
        const teamState = team === 1 ? team1 : team2;
        const maxPlayers = matchType === "singles" ? 1 : 2;
        // Chỉ thêm nếu chưa đủ số lượng và chưa có trong đội
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

    // Xoá người chơi khỏi đội
    const removePlayerFromTeam = (team, playerId) => {
        const teamState = team === 1 ? team1 : team2;
        const newTeam = {
            ...teamState,
            players: teamState.players.filter((id) => id !== playerId),
        };
        if (team === 1) setTeam1(newTeam);
        else setTeam2(newTeam);
    };
    const formatDateLocal = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleString("vi-VN", {
            hour12: false,
            dateStyle: "short",
            timeStyle: "short"
        });
    };

    // Tính bảng xếp hạng dựa trên kết quả các trận
    // Điểm: thắng trận đơn +3, thua +1; thắng đôi +2, thua +1
    // Trả về mảng đã sắp xếp theo điểm giảm dần
    const calculateRanking = () => {
        const ranking = {};
        // Khởi tạo thông tin cho từng người chơi
        players.forEach((p) => {
            ranking[p.id] = {
                name: p.name,
                points: 0,
                totalMatches: 0,
                wins: 0,
            };
        });

        // Tính điểm và số trận cho từng người chơi
        matches.forEach((match) => {
            const winner = match.winner;
            const loser = match.winner === 1 ? 2 : 1;

            if (match.type === "singles") {
                // Trận đơn: đội thắng +3, thua +1
                match[`team${winner}`].forEach((pid) => {
                    ranking[pid].points += 3;
                    ranking[pid].wins += 1;
                });
                match[`team${loser}`].forEach((pid) => {
                    ranking[pid].points += 1;
                });
            } else {
                // Trận đôi: đội thắng +2, thua +1
                match[`team${winner}`].forEach((pid) => {
                    ranking[pid].points += 2;
                    ranking[pid].wins += 1;
                });
                match[`team${loser}`].forEach((pid) => {
                    ranking[pid].points += 1;
                });
            }
            // Tăng tổng số trận cho mỗi người chơi
            match.team1.forEach((pid) => (ranking[pid].totalMatches += 1));
            match.team2.forEach((pid) => (ranking[pid].totalMatches += 1));
        });

        // Sắp xếp theo điểm giảm dần
        return Object.values(ranking).sort((a, b) => b.points - a.points);
    };

    // Lấy tên người chơi theo id
    const getPlayerName = (id) =>
        players.find((p) => p.id === id)?.name || "Không xác định";

    // Render giao diện chính
    return (
        <div className="app-container">
            {/* Header: Tiêu đề ứng dụng */}
            <header className="app-header">
                <h1 className="header-title">BADMINTON LEGEND ALLIANCE</h1>
            </header>

            {/* Navigation: Chuyển tab giữa các chức năng */}
            <nav className="nav-bar">
                <button
                    className={`nav-btn ${activeTab === "ranking" ? "active" : ""}`}
                    onClick={() => setActiveTab("ranking")}
                >
                    Xếp Hạng
                </button>
                <button
                    className={`nav-btn ${activeTab === "createMatch" ? "active" : ""}`}
                    onClick={() => setActiveTab("createMatch")}
                >
                    Trận Đấu
                </button>
                <button
                    className={`nav-btn ${activeTab === "players" ? "active" : ""}`}
                    onClick={() => setActiveTab("players")}
                >
                    Người Chơi
                </button>
                <button
                    className={`nav-btn ${activeTab === "history" ? "active" : ""}`}
                    onClick={() => setActiveTab("history")}
                >
                    Lịch Sử
                </button>
            </nav>

            {/* Main Content: Hiển thị nội dung theo tab */}
            <main className="main-content">
                {/* Tab Xếp Hạng */}
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
                                                {player.totalMatches} trận • {player.wins} thắng
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

                {/* Tab Tạo Trận Đấu */}
                {activeTab === "createMatch" && (
                    <section className="section">
                        <h2 className="section-title">Tạo Trận Đấu</h2>

                        {/* Chọn loại trận: đơn hoặc đôi */}
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
                                                        removePlayerFromTeam(1, playerId)
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
                                                    addPlayerToTeam(1, player.id)
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
                                                        removePlayerFromTeam(2, playerId)
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
                                                    addPlayerToTeam(2, player.id)
                                                }
                                            >
                                                {player.name}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Chọn đội thắng và lưu trận */}
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
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addPlayer()}
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
                            <div className="empty-state">Chưa có người chơi</div>
                        ) : (
                            <div className="players-list">
                                {players.map((player) => (
                                    <div key={player.id} className="player-item">
                                        <div className="player-name">{player.name}</div>
                                        <button
                                            className="btn-delete"
                                            onClick={() => deletePlayer(player.id)}
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
                                        <div key={match.id} className="history-item">
                                            <div className="history-header">
                                                <span className="match-type">
                                                    {match.type === "singles" ? "Đơn" : "Đôi"}
                                                </span>
                                                <span className="match-date">{formatDateLocal(match.date)}</span>
                                            </div>
                                            <div className="history-teams">
                                                <div className={`history-team ${match.winner === 1 ? "winner" : ""}`}>
                                                    {match.team1.map((id) => getPlayerName(id)).join(", ")}
                                                </div>
                                                <span className="vs">vs</span>
                                                <div className={`history-team ${match.winner === 2 ? "winner" : ""}`}>
                                                    {match.team2.map((id) => getPlayerName(id)).join(", ")}
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
