# Ví Dụ Tính Điểm Với Cấu Hình Hiện Tại

## Cấu Hình Hệ Số

```javascript
scoreConfig = [
  { maxPointDiff: 29, divisor: 1 },
  { maxPointDiff: 69, divisor: 2 },
  { maxPointDiff: 999, divisor: 3 }
]
```

| Chênh lệch Rating | Hệ số |
|-------------------|-------|
| 0-29 điểm | 1 |
| 30-69 điểm | 2 |
| ≥70 điểm | 3 |

---

## Bảng Ví Dụ Chi Tiết

### Kịch bản 1: Hai đội ngang sức (chênh < 30)

| Team A Rating | Team B Rating | Chênh lệch | Hệ số | Tỉ số | Cách biệt | Đội thắng | Điểm +/- | A sau | B sau |
|---------------|---------------|------------|-------|-------|-----------|-----------|----------|-------|-------|
| 100 | 100 | 0 | 1 | 21-19 | 2 | A | 2 | 102 | 98 |
| 100 | 110 | 10 | 1 | 21-18 | 3 | A | 3 | 103 | 107 |
| 100 | 120 | 20 | 1 | 19-21 | 2 | B | 2 | 98 | 122 |
| 150 | 170 | 20 | 1 | 21-20 | 1 | A | 1 | 151 | 169 |

**Nhận xét:** Với chênh lệch < 30, hệ số = 1
- Điểm thay đổi = cách biệt tỉ số (không nhân/chia gì)
- Công bằng cho cả hai đội

---

### Kịch bản 2: Chênh lệch vừa (30-69)

#### Case 2.1: Đội mạnh thắng

| Team A Rating | Team B Rating | Chênh lệch | Hệ số | Tỉ số | Cách biệt | Đội thắng | Tính toán | Điểm +/- | A sau | B sau |
|---------------|---------------|------------|-------|-------|-----------|-----------|-----------|----------|-------|-------|
| 200 | 150 | 50 | 2 | 21-19 | 2 | A (cao) | 2/2=1 | 1 | 201 | 149 |
| 200 | 150 | 50 | 2 | 21-17 | 4 | A (cao) | 4/2=2 | 2 | 202 | 148 |
| 180 | 130 | 50 | 2 | 21-20 | 1 | A (cao) | 1/2=0.5→1 | 1 | 181 | 129 |
| 160 | 120 | 40 | 2 | 21-15 | 6 | A (cao) | 6/2=3 | 3 | 163 | 117 |

**Nhận xét:** Đội mạnh thắng → chia hệ số → ít điểm

---

#### Case 2.2: Đội yếu thắng (Upset!)

| Team A Rating | Team B Rating | Chênh lệch | Hệ số | Tỉ số | Cách biệt | Đội thắng | Tính toán | Điểm +/- | A sau | B sau |
|---------------|---------------|------------|-------|-------|-----------|-----------|-----------|----------|-------|-------|
| 200 | 150 | 50 | 2 | 19-21 | 2 | B (thấp) | 2*2=4 | 4 | 196 | 154 |
| 200 | 150 | 50 | 2 | 18-21 | 3 | B (thấp) | 3*2=6 | 6 | 194 | 156 |
| 180 | 130 | 50 | 2 | 20-21 | 1 | B (thấp) | 1*2=2 | 2 | 178 | 132 |
| 160 | 120 | 40 | 2 | 15-21 | 6 | B (thấp) | 6*2=12 | 12 | 148 | 132 |

**Nhận xét:** Đội yếu thắng → nhân hệ số → nhiều điểm (gấp đôi!)

---

### Kịch bản 3: Chênh lệch lớn (≥70)

#### Case 3.1: Đội mạnh thắng

| Team A Rating | Team B Rating | Chênh lệch | Hệ số | Tỉ số | Cách biệt | Đội thắng | Tính toán | Điểm +/- | A sau | B sau |
|---------------|---------------|------------|-------|-------|-----------|-----------|-----------|----------|-------|-------|
| 300 | 200 | 100 | 3 | 21-19 | 2 | A (cao) | 2/3=0.67→1 | 1 | 301 | 199 |
| 300 | 200 | 100 | 3 | 21-15 | 6 | A (cao) | 6/3=2 | 2 | 302 | 198 |
| 250 | 170 | 80 | 3 | 21-20 | 1 | A (cao) | 1/3=0.33→1 | 1 | 251 | 169 |
| 350 | 250 | 100 | 3 | 21-12 | 9 | A (cao) | 9/3=3 | 3 | 353 | 247 |

**Nhận xét:** Đội mạnh thắng → chia 3 → rất ít điểm

---

#### Case 3.2: Đội yếu thắng (Big Upset!)

| Team A Rating | Team B Rating | Chênh lệch | Hệ số | Tỉ số | Cách biệt | Đội thắng | Tính toán | Điểm +/- | A sau | B sau |
|---------------|---------------|------------|-------|-------|-----------|-----------|-----------|----------|-------|-------|
| 300 | 200 | 100 | 3 | 19-21 | 2 | B (thấp) | 2*3=6 | 6 | 294 | 206 |
| 300 | 200 | 100 | 3 | 18-21 | 3 | B (thấp) | 3*3=9 | 9 | 291 | 209 |
| 250 | 170 | 80 | 3 | 20-21 | 1 | B (thấp) | 1*3=3 | 3 | 247 | 173 |
| 350 | 250 | 100 | 3 | 15-21 | 6 | B (thấp) | 6*3=18 | 18 | 332 | 268 |

**Nhận xét:** Đội yếu thắng → nhân 3 → cực nhiều điểm (gấp 3 lần!)

---

## So Sánh Các Kịch Bản

### Tỉ số 21-19 (cách biệt 2)

| Chênh lệch Rating | Hệ số | Đội mạnh thắng | Đội yếu thắng | Tỷ lệ |
|-------------------|-------|----------------|---------------|-------|
| 10 (0-29) | 1 | +2 | +2 | 1:1 |
| 50 (30-69) | 2 | +1 | +4 | 1:4 |
| 100 (≥70) | 3 | +1 | +6 | 1:6 |

**Kết luận:**
- Chênh lệch càng lớn, upset càng được thưởng nhiều
- Đội mạnh thắng đội yếu nhiều lần cũng khó tăng điểm

---

### Tỉ số 21-15 (cách biệt 6)

| Chênh lệch Rating | Hệ số | Đội mạnh thắng | Đội yếu thắng | Tỷ lệ |
|-------------------|-------|----------------|---------------|-------|
| 10 (0-29) | 1 | +6 | +6 | 1:1 |
| 50 (30-69) | 2 | +3 | +12 | 1:4 |
| 100 (≥70) | 3 | +2 | +18 | 1:9 |

**Kết luận:**
- Thắng cách biệt lớn → điểm thay đổi nhiều hơn
- Nếu yếu mà thắng cách biệt lớn → điểm tăng vọt!

---

## Chiến Thuật

### Để tăng điểm nhanh:
1. Thách đấu với người mạnh hơn (chênh 30-69 hoặc ≥70)
2. Cố gắng thắng cách biệt lớn
3. Mỗi lần thắng người mạnh hơn 50 điểm → +4 đến +6 điểm

### Để bảo vệ điểm:
1. Tránh thua người yếu hơn (sẽ mất nhiều điểm)
2. Nếu phải đấu người yếu hơn, cố thắng cách biệt nhỏ (1-2 điểm)
3. Thắng người cùng level (chênh < 30) để tăng ổn định

### Cân bằng:
- Đội rating cao thắng đội yếu: +1 đến +3 điểm (khó farm)
- Đội rating thấp thắng đội mạnh: +4 đến +18 điểm (high risk, high reward)
- → Hệ thống khuyến khích thách thức!

---

## Ví Dụ Thực Tế: Một Ngày Thi Đấu

### Cầu thủ A (rating 150) và B (rating 140) đấu cặp

**Trận 1:** vs C+D (rating 180+160 = 340)
- Chênh lệch: |290 - 340| = 50 → hệ số 2
- Tỉ số: 19-21 (thua)
- A+B là đội yếu, thua → -4 điểm
- A: 150 - 4 = 146
- B: 140 - 4 = 136

**Trận 2:** vs E+F (rating 100+90 = 190)
- Chênh lệch: |282 - 190| = 92 → hệ số 3
- Tỉ số: 21-17 (thắng, cách biệt 4)
- A+B là đội mạnh, thắng → +1 điểm (4/3 ≈ 1.33 → 1)
- A: 146 + 1 = 147
- B: 136 + 1 = 137

**Trận 3:** vs G+H (rating 200+180 = 380)
- Chênh lệch: |284 - 380| = 96 → hệ số 3
- Tỉ số: 20-21 (thua, cách biệt 1)
- A+B là đội yếu, thua → -3 điểm (1*3)
- A: 147 - 3 = 144
- B: 137 - 3 = 134

**Trận 4:** vs I+J (rating 160+150 = 310)
- Chênh lệch: |278 - 310| = 32 → hệ số 2
- Tỉ số: 22-20 (thắng, cách biệt 2)
- A+B là đội yếu, thắng → +4 điểm (2*2)
- A: 144 + 4 = 148
- B: 134 + 4 = 138

**Kết quả cuối ngày:**
- A: 150 → 148 (-2)
- B: 140 → 138 (-2)
- Tỉ lệ thắng: 2/4 = 50%
- Nhưng vẫn giảm điểm vì thua những trận quan trọng!

---

## File Liên Quan

- [docs/SCORING_CHANGES.md](./SCORING_CHANGES.md) - Công thức tổng quan
- [docs/HOW_DIVISOR_WORKS.md](./HOW_DIVISOR_WORKS.md) - Chi tiết cách lấy hệ số
- [src/App.jsx](../src/App.jsx) - Code implementation
