# Testcase chi tiết & Unit Test cho Badminton League Tracker (Supabase)

## 1. Testcase chi tiết

### 1.1. Thêm người chơi
- Nhập tên rỗng → Không thêm, hiện cảnh báo
- Nhập tên hợp lệ → Thêm thành công, kiểm tra DB Supabase
- Thêm nhiều người liên tiếp → Danh sách cập nhật đúng

### 1.2. Xóa người chơi
- Xóa người chơi chưa có trận → Xóa thành công, kiểm tra DB
- Xóa người chơi đã có trận → Không xóa, hiện cảnh báo

### 1.3. Tạo trận đấu
- Chọn đúng số lượng thành viên cho từng loại trận (đơn/đôi)
- Chọn trùng người ở 2 đội → Không cho lưu, hiện cảnh báo
- Nhập điểm không hợp lệ (âm, chữ, hòa) → Không cho lưu, hiện cảnh báo
- Nhập điểm hợp lệ → Lưu thành công, kiểm tra DB

### 1.4. Bảng xếp hạng
- Tạo nhiều trận, kiểm tra điểm, số trận, số thắng từng người
- Xóa người chơi, kiểm tra cập nhật bảng xếp hạng

### 1.5. Lịch sử trận đấu
- Tạo trận, kiểm tra hiển thị đúng thông tin
- Xóa trận (nếu có chức năng), kiểm tra cập nhật lịch sử

### 1.6. Cấu hình tính điểm
- Thêm/sửa/xóa dòng cấu hình, kiểm tra DB
- Tạo trận mới, kiểm tra áp dụng cấu hình mới

### 1.7. Đồng bộ dữ liệu
- Thực hiện thao tác trên 2 trình duyệt, kiểm tra đồng bộ

## 2. Unit Test (Jest)

### 2.1. Hàm getTeamPoints
```js
import { getTeamPoints } from '../src/App';
test('getTeamPoints tính tổng điểm đúng', () => {
  const rankingMap = {
    'a': { points: 10 },
    'b': { points: 5 },
    'c': { points: 0 }
  };
  expect(getTeamPoints(['a', 'b'], rankingMap)).toBe(15);
  expect(getTeamPoints(['c'], rankingMap)).toBe(0);
  expect(getTeamPoints([], rankingMap)).toBe(0);
});
```

### 2.2. Hàm getDivisorByPointDiff
```js
import { getDivisorByPointDiff } from '../src/App';
test('getDivisorByPointDiff trả về đúng divisor', () => {
  const config = [
    { maxPointDiff: 5, divisor: 2 },
    { maxPointDiff: 10, divisor: 3 }
  ];
  expect(getDivisorByPointDiff(3, config)).toBe(2);
  expect(getDivisorByPointDiff(7, config)).toBe(3);
  expect(getDivisorByPointDiff(20, config)).toBe(3);
});
```

### 2.3. Hàm tính pointDelta
```js
function calcPointDelta(team1Pts, team2Pts, divisor) {
  const ratingDiff = Math.abs(team1Pts - team2Pts);
  return Math.max(1, Math.round(ratingDiff / divisor));
}
test('calcPointDelta tính đúng', () => {
  expect(calcPointDelta(10, 5, 2)).toBe(3);
  expect(calcPointDelta(10, 10, 2)).toBe(1);
  expect(calcPointDelta(20, 10, 5)).toBe(2);
});
```

### 2.4. Hàm formatDateLocal
```js
import { formatDateLocal } from '../src/App';
test('formatDateLocal trả về đúng định dạng', () => {
  const iso = '2025-01-01T10:30:00.000Z';
  expect(formatDateLocal(iso)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
});
```

---
Nếu cần bổ sung unit test cho các hàm khác hoặc test tích hợp, hãy yêu cầu!