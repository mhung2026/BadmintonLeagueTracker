# Công Thức Tính Điểm - Badminton League Tracker

## Ngày cập nhật: 2026-01-15

## Tóm tắt công thức

Công thức tính điểm dựa trên **cách biệt tỉ số** (score difference) giữa hai đội, kết hợp với **hệ số điều chỉnh** (divisor) dựa trên chênh lệch rating.

---

## Công Thức Chi Tiết

### Các thành phần:
- **Điểm đội A** = Tổng điểm rating của tất cả thành viên đội A
- **Điểm đội B** = Tổng điểm rating của tất cả thành viên đội B
- **Cách biệt tỉ số** = |scoreA - scoreB| (ví dụ: 21-19 → cách biệt = 2)
- **Chênh lệch rating** = |điểm đội A - điểm đội B|
- **Hệ số** = Tra bảng scoreConfig dựa trên chênh lệch rating

### Quy tắc tính điểm:

```
baseDelta = max(1, cách biệt tỉ số)

Nếu rating 2 đội bằng nhau:
    appliedDelta = baseDelta

Nếu đội thắng có rating CAO hơn đội thua:
    appliedDelta = baseDelta / hệ số
    (Thưởng ít vì thắng đội yếu hơn)

Nếu đội thắng có rating THẤP hơn đội thua:
    appliedDelta = baseDelta * hệ số
    (Thưởng nhiều vì thắng đội mạnh hơn)
```

**Điểm cộng/trừ:**
- Đội thắng: **+appliedDelta**
- Đội thua: **-appliedDelta**

---

## Ví dụ cụ thể

### Ví dụ 1: Đội mạnh thắng đội yếu

**Tình huống:**
- Team A: 200 rating (mạnh hơn)
- Team B: 150 rating (yếu hơn)
- Tỉ số: 21-19 (Team A thắng)
- Cách biệt tỉ số: 2
- Chênh lệch rating: 50 → Hệ số = **2** (vì 30 ≤ 50 < 70)

**Tính toán:**
```
baseDelta = 2 (cách biệt tỉ số)
Team A (rating cao) thắng → chia hệ số
appliedDelta = 2 / 2 = 1 điểm
```

**Kết quả:**
- Team A: 200 + 1 = **201 rating**
- Team B: 150 - 1 = **149 rating**

---

### Ví dụ 2: Đội yếu thắng đội mạnh (Upset!)

**Tình huống:**
- Team A: 200 rating (mạnh hơn)
- Team B: 150 rating (yếu hơn)
- Tỉ số: 19-21 (Team B thắng)
- Cách biệt tỉ số: 2
- Chênh lệch rating: 50 → Hệ số = **2** (vì 30 ≤ 50 < 70)

**Tính toán:**
```
baseDelta = 2 (cách biệt tỉ số)
Team B (rating thấp) thắng → nhân hệ số
appliedDelta = 2 * 2 = 4 điểm
```

**Kết quả:**
- Team A: 200 - 4 = **196 rating**
- Team B: 150 + 4 = **154 rating**

---

### Ví dụ 3: Hai đội ngang sức

**Tình huống:**
- Team A: 180 rating
- Team B: 180 rating (bằng nhau)
- Tỉ số: 21-18 (Team A thắng)
- Cách biệt tỉ số: 3

**Tính toán:**
```
baseDelta = 3 (cách biệt tỉ số)
Rating bằng nhau → không nhân/chia
appliedDelta = 3 điểm
```

**Kết quả:**
- Team A: 180 + 3 = **183 rating**
- Team B: 180 - 3 = **177 rating**

---

### Ví dụ 4: Trận thắng sít sao

**Tình huống:**
- Team A: 200 rating (mạnh hơn)
- Team B: 150 rating (yếu hơn)
- Tỉ số: 21-20 (Team A thắng)
- Cách biệt tỉ số: **1**
- Chênh lệch rating: 50 → Hệ số = **2** (vì 30 ≤ 50 < 70)

**Tính toán:**
```
baseDelta = 1 (cách biệt tỉ số)
Team A (rating cao) thắng → chia hệ số
appliedDelta = 1 / 2 = 0.5 → làm tròn nhưng min = 1
appliedDelta = max(1, round(0.5)) = 1 điểm
```

**Kết quả:**
- Team A: 200 + 1 = **201 rating**
- Team B: 150 - 1 = **149 rating**

---

## Ưu điểm công thức

1. **Công bằng với tỉ số:** Thắng cách biệt lớn được thưởng nhiều hơn
2. **Khuyến khích upset:** Đội yếu thắng đội mạnh được thưởng gấp đôi/gấp ba
3. **Hạn chế farm điểm:** Đội mạnh thắng đội yếu chỉ được ít điểm
4. **Linh hoạt:** Có thể điều chỉnh hệ số qua bảng scoreConfig

---

## Cách sử dụng

### Tính lại toàn bộ database

1. Vào tab **"Cài đặt"** trong ứng dụng
2. Cuộn xuống mục **"Cấu hình tính điểm"**
3. Nhấn nút đỏ **"🔄 Tính lại toàn bộ database"**
4. Nhập mã xác nhận
5. Hệ thống sẽ:
   - Tính lại tất cả trận đấu từ đầu đến giờ
   - Cập nhật `meta.pointDelta` cho mỗi trận
   - Lưu vào Supabase
   - Hiển thị bảng xếp hạng mới

**⚠️ Cảnh báo:**
- Thao tác này sẽ ghi đè toàn bộ dữ liệu meta cũ
- Không thể hoàn tác
- Nên backup database trước khi thực hiện

---

## Khôi phục công thức cũ

Nếu muốn quay lại công thức cũ với divisor, sửa file [src/App.jsx:74-83](../src/App.jsx#L74-L83):

```javascript
const computeAppliedDelta = (winnerTeam, team1PtsBefore, team2PtsBefore) => {
    const ratingDiff = Math.abs(team1PtsBefore - team2PtsBefore);
    const divisorUsed = getDivisorByPointDiff(ratingDiff);  // Bỏ comment dòng này
    const baseDelta = calcPointDeltaUtil(team1PtsBefore, team2PtsBefore, divisorUsed);

    if (team1PtsBefore === team2PtsBefore) {
        return { appliedDelta: baseDelta, baseDelta, divisorUsed };
    }

    const higherTeam = team1PtsBefore > team2PtsBefore ? 1 : 2;
    let appliedDelta;
    if (winnerTeam === higherTeam) {
        appliedDelta = Math.max(1, Math.round(baseDelta / Math.max(divisorUsed, 1)));
    } else {
        appliedDelta = baseDelta * Math.max(divisorUsed, 1);
    }

    return { appliedDelta, baseDelta, divisorUsed };
};
```

Sau đó chạy lại **"Tính lại toàn bộ database"** để áp dụng công thức cũ.

---

## Test Case

Để kiểm tra tính toán, xem file [src/utils.unit.test.js](../src/utils.unit.test.js).

Chạy test:
```bash
npm test
```

---

## Bảng Hệ Số (scoreConfig)

Bảng hệ số hiện tại được lưu trong database (bảng `scoreconfig`):

| Chênh lệch Rating | Hệ số |
|-------------------|-------|
| 0-29 điểm | 1 |
| 30-69 điểm | 2 |
| ≥70 điểm | 3 |

**Giải thích:**
- Nếu 2 đội chênh nhau ít (0-29 điểm) → hệ số = **1** (không điều chỉnh nhiều)
- Nếu chênh nhau vừa (30-69 điểm) → hệ số = **2**
- Nếu chênh nhau lớn (≥70 điểm) → hệ số = **3**

→ Chênh lệch càng lớn, hệ số điều chỉnh càng mạnh!

---

## Công Thức Toán Học

```
Cho:
  rA = rating đội A
  rB = rating đội B
  sA = score đội A
  sB = score đội B

Tính:
  scoreDiff = |sA - sB|
  ratingDiff = |rA - rB|
  divisor = lookup(ratingDiff, scoreConfig)
  baseDelta = max(1, scoreDiff)

Nếu rA == rB:
  appliedDelta = baseDelta

Nếu đội thắng có rating cao hơn:
  appliedDelta = max(1, round(baseDelta / divisor))

Nếu đội thắng có rating thấp hơn:
  appliedDelta = baseDelta * divisor

Kết quả:
  Đội thắng: +appliedDelta
  Đội thua: -appliedDelta
```

---

## Lịch sử thay đổi

| Ngày | Phiên bản | Thay đổi |
|------|-----------|----------|
| 2026-01-15 | v2.0 | Sửa công thức dùng **cách biệt tỉ số** thay vì chênh lệch rating |
| 2025-xx-xx | v1.0 | Công thức ELO-like với divisor động dựa trên chênh lệch rating |

---

## File liên quan

- [src/App.jsx:75-100](../src/App.jsx#L75-L100) - Hàm `computeAppliedDelta()` - Logic tính điểm chính
- [src/App.jsx:405](../src/App.jsx#L405) - Gọi trong `createMatch()`
- [src/App.jsx:891](../src/App.jsx#L891) - Gọi trong `recomputeMatchesWithMeta()`
- [src/utils.js](../src/utils.js) - Các hàm helper
- [src/utils.unit.test.js](../src/utils.unit.test.js) - Test cases
- [docs/TESTCASE_DETAIL.md](./TESTCASE_DETAIL.md) - Chi tiết test cases
