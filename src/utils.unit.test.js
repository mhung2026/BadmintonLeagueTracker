import { getTeamPoints, getDivisorByPointDiff, calcPointDelta, formatDateLocal } from './utils.js';

describe('getTeamPoints', () => {
  it('tính tổng điểm đúng', () => {
    const rankingMap = {
      'a': { points: 10 },
      'b': { points: 5 },
      'c': { points: 0 }
    };
    expect(getTeamPoints(['a', 'b'], rankingMap)).toBe(15);
    expect(getTeamPoints(['c'], rankingMap)).toBe(0);
    expect(getTeamPoints([], rankingMap)).toBe(0);
  });
});

describe('getDivisorByPointDiff', () => {
  it('trả về đúng divisor', () => {
    const config = [
      { maxPointDiff: 5, divisor: 2 },
      { maxPointDiff: 10, divisor: 3 }
    ];
    expect(getDivisorByPointDiff(3, config)).toBe(2);
    expect(getDivisorByPointDiff(7, config)).toBe(3);
    expect(getDivisorByPointDiff(20, config)).toBe(3);
  });
});

describe('calcPointDelta', () => {
  it('tính đúng pointDelta', () => {
    expect(calcPointDelta(10, 5, 2)).toBe(3);
    expect(calcPointDelta(10, 10, 2)).toBe(1);
    expect(calcPointDelta(20, 10, 5)).toBe(2);
  });
});

describe('formatDateLocal', () => {
  it('trả về đúng định dạng', () => {
    const iso = '2025-01-01T10:30:00.000Z';
    expect(formatDateLocal(iso)).toMatch(/\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}/);
  });
});
