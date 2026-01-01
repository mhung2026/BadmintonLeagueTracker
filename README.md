# 🏸 Badminton Legend AllianceITSC

**Badminton Legend AllianceITSC** là ứng dụng web quản lý giải cầu lông nội bộ, thiết kế mobile-first, cho phép theo dõi bảng xếp hạng, tạo trận đấu và xem lịch sử thi đấu với dữ liệu lưu trữ trên Supabase.

## 🎯 Tính Năng Chính

### Quản lý người chơi
- Thêm/xóa/sửa tên người chơi
- Không thể xóa người chơi đã có lịch sử thi đấu
- Danh sách được sắp xếp theo alphabet

### Tạo trận đấu
- Hỗ trợ trận đơn (1v1) và đôi (2v2)
- Nhập điểm thực tế, tự động xác định đội thắng
- Mặc định chọn trận đôi
- Lưu snapshot điểm số tại thời điểm tạo trận

### Bảng xếp hạng
- Tính toán điểm từ lịch sử trận đấu
- Hiển thị: số trận, số thắng, tỷ lệ % thắng
- Điểm cộng/trừ dựa trên chênh lệch điểm số trận đấu

### Lịch sử trận đấu
- Lọc theo: loại trận (đơn/đôi), người chơi, khoảng thời gian
- Chỉnh sửa lịch sử đấu (yêu cầu mã xác nhận)
- Khi chỉnh sửa: có thể thay đổi điểm số, thay đổi người chơi
- Tự động tính lại meta cho toàn bộ trận sau khi cập nhật
- **Phân trang** 10 trận/trang

### Cấu hình tính điểm
- Tùy chỉnh quy tắc chia điểm (chênh lệch tối đa, hệ số chia)
- Chỉ áp dụng cho trận mới

### Tính năng nâng cao
- **Toast notifications**: Thông báo trạng thái thao tác (thành công/lỗi)
- **Skeleton loading**: Hiệu ứng loading đẹp mắt thay vì spinner
- **Realtime sync**: Đồng bộ dữ liệu tự động giữa các client
- **Inline validation**: Kiểm tra lỗi nhập liệu ngay lập tức
- **Error Boundary**: Bắt lỗi render, tránh crash toàn app
- **Performance optimized**: Sử dụng useMemo để cache kết quả tính toán

## 🛠 Công Nghệ

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | React 19 + Vite |
| Database | Supabase (PostgreSQL) |
| Testing | Jest (ESM) |
| Hosting | Vercel |
| Styling | CSS thuần (mobile-first) |

## 🚀 Demo

https://badminton-league-tracker.vercel.app/

## ⚙️ Cài Đặt & Phát Triển

### 1. Clone repo
```bash
git clone https://github.com/mhung2026/BadmintonLeagueTracker.git
cd BadmintonLeagueTracker
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env` tại thư mục gốc (tham khảo `.env.example`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EDIT_MATCH_CODE=your_secret_code
```

### 4. Chạy local
```bash
npm run dev
```
Truy cập: http://localhost:5173

### 5. Chạy tests
```bash
npm test
```

## 📊 Cấu Trúc Database (Supabase)

### Bảng `players`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | Primary key |
| name | text | Tên người chơi |

### Bảng `matches`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | Primary key |
| type | text | "singles" hoặc "doubles" |
| team1 | uuid[] | Mảng ID người chơi đội 1 |
| team2 | uuid[] | Mảng ID người chơi đội 2 |
| score1 | int4 | Điểm đội 1 |
| score2 | int4 | Điểm đội 2 |
| winner | int4 | 1 hoặc 2 |
| date | timestamptz | Thời gian tạo |
| meta | jsonb | Thông tin snapshot |

### Bảng `scoreconfig`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | int8 | Primary key |
| maxPointDiff | int4 | Chênh lệch điểm tối đa |
| divisor | int4 | Hệ số chia |

## 📁 Cấu Trúc Thư Mục

```
BadmintonLeagueTracker/
├── public/
│   └── favicon.png
├── src/
│   ├── App.jsx            # Component chính
│   ├── App.css            # Styles chính
│   ├── ErrorBoundary.jsx  # Bắt lỗi render
│   ├── Toast.jsx          # Toast notifications
│   ├── Skeleton.jsx       # Skeleton loading components
│   ├── Skeleton.css       # Skeleton styles
│   ├── supabaseClient.js  # Kết nối Supabase
│   ├── utils.js           # Hàm tiện ích (dùng chung)
│   ├── main.jsx           # Entry point
│   ├── index.css          # Global styles
│   └── *.unit.test.js     # Unit tests (11 tests)
├── docs/
│   ├── SRS.md             # Tài liệu yêu cầu
│   ├── SUPABASE_GUIDE.md  # Hướng dẫn Supabase
│   ├── TESTCASE.md        # Test cases
│   └── TESTCASE_DETAIL.md # Chi tiết test cases
├── .env                   # Biến môi trường (không commit)
├── .env.example           # Mẫu biến môi trường
├── index.html
├── package.json
├── jest.config.js         # Cấu hình Jest ESM
└── vite.config.js
```

## 🔒 Bảo Mật

- Credentials Supabase được lưu trong biến môi trường
- File `.env` không được commit lên git
- Chỉnh sửa lịch sử đấu yêu cầu mã xác nhận

## 📖 Tài Liệu Thêm

- [Hướng dẫn Supabase](docs/SUPABASE_GUIDE.md)
- [Tài liệu yêu cầu (SRS)](docs/SRS.md)
- [Test Cases](docs/TESTCASE.md)
- [Chi tiết Test Cases](docs/TESTCASE_DETAIL.md)

## 📝 License

MIT License
