// Các hàm logic tách riêng để dễ test

export function getTeamPoints(teamPlayers, rankingMap) {
  return (teamPlayers || []).reduce((sum, pid) => {
    return sum + (rankingMap[pid]?.points ?? 0);
  }, 0);
}

export function getDivisorByPointDiff(diff, scoreConfig) {
  if (!scoreConfig.length) return 2;
  return (
    scoreConfig.find((c) => diff <= c.maxPointDiff)?.divisor ??
    scoreConfig[scoreConfig.length - 1].divisor
  );
}

export function calcPointDelta(team1Pts, team2Pts, divisor) {
  const ratingDiff = Math.abs(team1Pts - team2Pts);
  return Math.max(1, Math.round(ratingDiff / divisor));
}

export function formatDateLocal(isoString) {
  const d = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, '0');
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const dd = pad(d.getDate());
  const MM = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}
