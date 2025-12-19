function doGet() {
  const ss = SpreadsheetApp.getActive();

  const ps = ss.getSheetByName("players");
  const ms = ss.getSheetByName("matches");
  const cs = ss.getSheetByName("config_score");

  /* ===== PLAYERS ===== */
  const players = ps.getLastRow() < 2
    ? []
    : ps.getRange(2, 1, ps.getLastRow() - 1, 2)
        .getValues()
        .map(r => ({
          id: String(r[0]),   //  giữ UUID
          name: r[1]
        }));

  /* ===== MATCHES ===== */
  const matches = ms.getLastRow() < 2
    ? []
    : ms.getRange(2, 1, ms.getLastRow() - 1, 9)
        .getValues()
        .map(r => ({
          id: r[0],
          type: r[1],
          team1: JSON.parse(r[2]),
          team2: JSON.parse(r[3]),
          winner: Number(r[4]),
          score1: Number(r[5]),
          score2: Number(r[6]),
          date: r[7],
          meta: r[8] ? JSON.parse(r[8]) : null
        }));

  /* ===== CONFIG SCORE ===== */
  const scoreConfig = cs.getLastRow() < 2
    ? []
    : cs.getRange(2, 1, cs.getLastRow() - 1, 2)
        .getValues()
        .map(r => ({
          maxPointDiff: Number(r[0]),
          divisor: Number(r[1])
        }))
        .sort((a, b) => a.maxPointDiff - b.maxPointDiff);

  return ContentService
    .createTextOutput(JSON.stringify({
      players,
      matches,
      scoreConfig
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActive();

    const ps = ss.getSheetByName("players");
    const ms = ss.getSheetByName("matches");
    const cs = ss.getSheetByName("config_score");

    /* ===== PLAYERS ===== */
    if (Array.isArray(data.players)) {
      if (ps.getLastRow() > 1) {
        ps.getRange(2, 1, ps.getLastRow() - 1, 2).clearContent();
      }

      data.players.forEach(p => {
        if (!p.id || !p.name) return;
        // ❗ KHÔNG ép Number – giữ nguyên UUID
        ps.appendRow([String(p.id), p.name]);
      });
    }

    /* ===== MATCHES ===== */
    if (Array.isArray(data.matches)) {
      if (ms.getLastRow() > 1) {
        ms.getRange(2, 1, ms.getLastRow() - 1, 9).clearContent();
      }

      data.matches.forEach(m => {
        if (
          !m.id ||
          !m.type ||
          !Array.isArray(m.team1) ||
          !Array.isArray(m.team2) ||
          typeof m.winner !== "number"
        ) return;

        ms.appendRow([
          m.id,
          m.type,
          JSON.stringify(m.team1),
          JSON.stringify(m.team2),
          Number(m.winner),
          Number(m.score1),
          Number(m.score2),
          m.date,
          m.meta ? JSON.stringify(m.meta) : ""
        ]);
      });
    }

    /* ===== CONFIG SCORE ===== */
    if (Array.isArray(data.scoreConfig)) {
      if (cs.getLastRow() > 1) {
        cs.getRange(2, 1, cs.getLastRow() - 1, 2).clearContent();
      }

      data.scoreConfig.forEach(c => {
        if (
          typeof c.maxPointDiff === "number" &&
          typeof c.divisor === "number"
        ) {
          cs.appendRow([c.maxPointDiff, c.divisor]);
        }
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: err.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

