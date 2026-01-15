# Cách Lấy Hệ Số (Divisor) - Chi Tiết

## Hàm `getDivisorByPointDiff()`

### Vị trí
[src/utils.js:9-15](../src/utils.js#L9-L15)

### Code
```javascript
export function getDivisorByPointDiff(diff, scoreConfig) {
  if (!scoreConfig.length) return 2;
  return (
    scoreConfig.find((c) => diff <= c.maxPointDiff)?.divisor ??
    scoreConfig[scoreConfig.length - 1].divisor
  );
}
```

---

## Giải Thích Chi Tiết

### Input
- **`diff`**: Chênh lệch rating giữa 2 đội (số dương)
- **`scoreConfig`**: Mảng cấu hình từ database, ví dụ:
  ```javascript
  [
    { maxPointDiff: 5, divisor: 2 },
    { maxPointDiff: 10, divisor: 3 },
    { maxPointDiff: 999, divisor: 4 }
  ]
  ```

### Output
- **Hệ số** (divisor) tương ứng với chênh lệch rating

---

## Thuật Toán

### Bước 1: Kiểm tra config rỗng
```javascript
if (!scoreConfig.length) return 2;
```
- Nếu bảng config rỗng → trả về **2** (giá trị mặc định)

### Bước 2: Tìm quy tắc đầu tiên phù hợp
```javascript
scoreConfig.find((c) => diff <= c.maxPointDiff)
```
- Duyệt qua từng quy tắc trong config
- Tìm quy tắc **ĐẦU TIÊN** mà `diff <= maxPointDiff`
- Trả về `divisor` của quy tắc đó

### Bước 3: Fallback nếu không tìm thấy
```javascript
?? scoreConfig[scoreConfig.length - 1].divisor
```
- Nếu không có quy tắc nào phù hợp (diff lớn hơn tất cả)
- → Lấy divisor của **quy tắc cuối cùng**

---

## Ví Dụ Chi Tiết

### Cấu hình hiện tại (scoreConfig):
```javascript
[
  { maxPointDiff: 29, divisor: 1 },   // Quy tắc 1: Chênh 0-29
  { maxPointDiff: 69, divisor: 2 },   // Quy tắc 2: Chênh 30-69
  { maxPointDiff: 999, divisor: 3 }   // Quy tắc 3: Chênh ≥70
]
```

### Test Cases

#### Case 1: diff = 15 (chênh lệch nhỏ)
```javascript
getDivisorByPointDiff(15, scoreConfig)
```

**Luồng thực thi:**
1. scoreConfig không rỗng → tiếp tục
2. Duyệt qua config:
   - Quy tắc 1: `15 <= 29` ✅ → Tìm thấy!
   - Return: `divisor = 1`

**Kết quả:** `1` (không điều chỉnh mạnh)

---

#### Case 2: diff = 50 (chênh lệch vừa)
```javascript
getDivisorByPointDiff(50, scoreConfig)
```

**Luồng thực thi:**
1. scoreConfig không rỗng → tiếp tục
2. Duyệt qua config:
   - Quy tắc 1: `50 <= 29` ❌ → Bỏ qua
   - Quy tắc 2: `50 <= 69` ✅ → Tìm thấy!
   - Return: `divisor = 2`

**Kết quả:** `2`

---

#### Case 3: diff = 80 (chênh lệch lớn)
```javascript
getDivisorByPointDiff(80, scoreConfig)
```

**Luồng thực thi:**
1. scoreConfig không rỗng → tiếp tục
2. Duyệt qua config:
   - Quy tắc 1: `80 <= 29` ❌
   - Quy tắc 2: `80 <= 69` ❌
   - Quy tắc 3: `80 <= 999` ✅ → Tìm thấy!
   - Return: `divisor = 3`

**Kết quả:** `3`

---

#### Case 4: diff = 1000 (vượt quá tất cả)
```javascript
getDivisorByPointDiff(1000, scoreConfig)
```

**Luồng thực thi:**
1. scoreConfig không rỗng → tiếp tục
2. Duyệt qua config:
   - Quy tắc 1: `1000 <= 29` ❌
   - Quy tắc 2: `1000 <= 69` ❌
   - Quy tắc 3: `1000 <= 999` ❌
   - Không tìm thấy!
3. Fallback: Lấy divisor của quy tắc cuối (index = 2)
   - Return: `divisor = 3`

**Kết quả:** `3`

---

## Bảng Tra Cứu Nhanh

Với cấu hình hiện tại:

| Chênh Lệch Rating | Điều Kiện | Hệ Số |
|-------------------|-----------|-------|
| 0 - 29 điểm | diff ≤ 29 | 1 |
| 30 - 69 điểm | 29 < diff ≤ 69 | 2 |
| 70+ điểm | diff ≥ 70 | 3 |

---

## Ứng Dụng Trong Tính Điểm

### Ví dụ thực tế:

```javascript
// Tình huống
const team1Rating = 200;
const team2Rating = 150;
const ratingDiff = Math.abs(200 - 150); // = 50

// Lấy hệ số
const divisor = getDivisorByPointDiff(50, scoreConfig); // = 2 (vì 30 ≤ 50 ≤ 69)

// Tính điểm (giả sử tỉ số 21-19, cách biệt = 2)
const baseDelta = 2;

// Nếu đội mạnh thắng
const appliedDelta = Math.round(2 / 2); // = 1

// Nếu đội yếu thắng
const appliedDelta = 2 * 2; // = 4
```

---

## Test Cases (trong utils.unit.test.js)

```javascript
describe('getDivisorByPointDiff', () => {
  it('trả về đúng divisor', () => {
    const config = [
      { maxPointDiff: 5, divisor: 2 },
      { maxPointDiff: 10, divisor: 3 }
    ];

    expect(getDivisorByPointDiff(3, config)).toBe(2);   // 3 <= 5
    expect(getDivisorByPointDiff(7, config)).toBe(3);   // 7 <= 10
    expect(getDivisorByPointDiff(20, config)).toBe(3);  // 20 > 10 → fallback cuối
  });
});
```

Chạy test:
```bash
npm test
```

---

## Cấu Hình Trong Database

### Bảng `scoreconfig`

```sql
CREATE TABLE scoreconfig (
  id SERIAL PRIMARY KEY,
  maxPointDiff INT NOT NULL,
  divisor INT NOT NULL
);
```

### Dữ liệu mẫu:

```sql
INSERT INTO scoreconfig (maxPointDiff, divisor) VALUES
  (29, 1),
  (69, 2),
  (999, 3);
```

### Đọc từ Supabase:

```javascript
const { data: scoreConfigData } = await supabase
  .from('scoreconfig')
  .select('*')
  .order('maxPointDiff', { ascending: true });

setScoreConfig(scoreConfigData || []);
```

---

## Chỉnh Sửa Hệ Số

### Trong UI (Tab Cài đặt):

1. Vào tab **"Cài đặt"**
2. Cuộn xuống phần **"Cấu hình tính điểm"**
3. Chỉnh sửa bảng:
   - **maxPointDiff**: Chênh lệch rating tối đa
   - **divisor**: Hệ số tương ứng
4. Nhấn **"+ Thêm dòng"** để thêm quy tắc mới
5. Nhấn **"Lưu cấu hình"** và nhập mã xác nhận
6. Nhấn **"🔄 Tính lại toàn bộ database"** để áp dụng

### Ví dụ config tùy chỉnh:

| maxPointDiff | divisor | Ý nghĩa |
|--------------|---------|---------|
| 29 | 1 | Chênh 0-29: Hệ số 1 (mặc định) |
| 69 | 2 | Chênh 30-69: Hệ số 2 |
| 999 | 3 | Chênh 70+: Hệ số 3 |

**Hoặc cấu hình mạnh hơn:**

| maxPointDiff | divisor | Ý nghĩa |
|--------------|---------|---------|
| 20 | 2 | Chênh 0-20: Hệ số 2 |
| 50 | 4 | Chênh 21-50: Hệ số 4 |
| 100 | 6 | Chênh 51-100: Hệ số 6 |
| 999 | 10 | Chênh >100: Hệ số 10 |

→ Chênh lệch càng lớn, hệ số càng cao → Điều chỉnh càng mạnh!

---

## Lưu Ý Quan Trọng

1. **Thứ tự quan trọng:** Config được duyệt từ đầu đến cuối, nên sắp xếp theo `maxPointDiff` tăng dần

2. **Quy tắc cuối cùng:** Nên có giá trị `maxPointDiff` rất lớn (như 999) để bắt tất cả trường hợp

3. **Không được rỗng:** Nếu config rỗng, hệ số mặc định là 2

4. **Tính lại database:** Sau khi thay đổi config, phải nhấn "Tính lại toàn bộ database" để áp dụng

---

## File Liên Quan

- [src/utils.js:9-15](../src/utils.js#L9-L15) - Hàm `getDivisorByPointDiff()`
- [src/App.jsx:65-68](../src/App.jsx#L65-L68) - Wrapper function
- [src/App.jsx:77](../src/App.jsx#L77) - Sử dụng trong `computeAppliedDelta()`
- [src/utils.unit.test.js:16-26](../src/utils.unit.test.js#L16-L26) - Test cases
- [docs/SCORING_CHANGES.md](./SCORING_CHANGES.md) - Tài liệu công thức tổng quan
