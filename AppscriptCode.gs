function doGet() {
  const ss = SpreadsheetApp.getActive();
  const ps = ss.getSheetByName("players");
  const ms = ss.getSheetByName("matches");

  const players = ps.getLastRow() < 2
    ? []
    : ps.getRange(2, 1, ps.getLastRow() - 1, 2).getValues()
        .map(r => ({
          id: Number(r[0]),
          name: r[1]
        }));

  const matches = ms.getLastRow() < 2
    ? []
    : ms.getRange(2, 1, ms.getLastRow() - 1, 6).getValues()
        .map(r => ({
          id: r[0],
          type: r[1],
          team1: JSON.parse(r[2]),
          team2: JSON.parse(r[3]),
          winner: Number(r[4]),
          date: r[5]
        }));

  return ContentService
    .createTextOutput(JSON.stringify({ players, matches }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActive();
    const ps = ss.getSheetByName("players");
    const ms = ss.getSheetByName("matches");

    // ===== PLAYERS =====
    if (ps.getLastRow() > 1) {
      ps.getRange(2, 1, ps.getLastRow() - 1, 2).clearContent();
    }

    data.players.forEach(p => {
      if (!p.id || !p.name) return;
      ps.appendRow([Number(p.id), p.name]);
    });

    // ===== MATCHES =====
    if (ms.getLastRow() > 1) {
      ms.getRange(2, 1, ms.getLastRow() - 1, 6).clearContent();
    }

    data.matches.forEach(m => {
      if (
        !m.id ||
        !m.type ||
        !Array.isArray(m.team1) ||
        !Array.isArray(m.team2) ||
        !m.winner
      ) return;

      ms.appendRow([
        m.id,
        m.type,
        JSON.stringify(m.team1),
        JSON.stringify(m.team2),
        Number(m.winner),
        m.date
      ]);
    });

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
