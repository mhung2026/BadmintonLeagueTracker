
# 🏸 Badminton League Tracker – Legend Alliance

**Badminton League Tracker** là ứng dụng web quản lý giải cầu lông, ưu tiên trải nghiệm di động, cho phép nhiều người dùng tạo trận đấu, theo dõi bảng xếp hạng, và chia sẻ dữ liệu thời gian thực qua Google Sheets (serverless backend).

## 🎯 Tính Năng Nổi Bật

- **Quản lý người chơi:** Thêm/xóa người chơi (không xóa được nếu đã có lịch sử thi đấu), danh sách dùng chung cho mọi người.
- **Tạo trận đấu:** Hỗ trợ trận đơn (1 vs 1) và đôi (2 vs 2), nhập điểm thực tế, tự động xác định đội thắng, mỗi trận lưu snapshot điểm số tại thời điểm tạo.
- **Bảng xếp hạng:** Tính toán từ lịch sử trận đấu, mỗi trận lưu lại thông tin snapshot (điểm trước trận, chênh lệch, hệ số chia, delta điểm), thay đổi quy tắc không ảnh hưởng trận cũ. **Điểm cộng cho đội thắng dựa trên chênh lệch tổng điểm thành viên hai đội trước trận, không dựa vào kết quả trận đấu.**
- **Lịch sử trận đấu:** Lưu loại trận, thành viên, điểm số, đội thắng, thời gian (UTC, hiển thị theo múi giờ máy người dùng).
- **Cấu hình tính điểm:** Tùy chỉnh quy tắc chia điểm (max chênh lệch, divisor), chỉ áp dụng cho trận mới.
- **Chia sẻ dữ liệu:** Không dùng localStorage, mọi dữ liệu lưu trên Google Sheets, mọi người cùng xem/chỉnh sửa, không cần backend truyền thống.

## 🛠 Công Nghệ Sử Dụng

- **Frontend:** React + Vite (UI hiện đại, mobile-first, responsive)
- **Backend:** Google Apps Script (API serverless)
- **Database:** Google Sheets
- **Triển khai:** Vercel

## 🌈 Thiết Kế UI/UX

- Layout mobile-first, max-width 960px, căn giữa, màu sắc tươi sáng, accent xanh dương (#2563eb).
- Các màn hình: Header, Navigation Tabs, Xếp Hạng, Người Chơi, Tạo Trận Đấu, Lịch Sử, Cấu Hình.
- Xem chi tiết tại [UI_DESIGN.md](UI_DESIGN.md).

## 🚀 Demo

https://badminton-league-tracker.vercel.app/

## ⚙️ Hướng Dẫn Cài Đặt & Phát Triển

1. **Clone repo:**
   ```sh
   git clone https://github.com/mhung2026/BadmintonLeagueTracker.git
   cd BadmintonLeagueTracker
   ```
2. **Cài đặt dependencies:**
   ```sh
   npm install
   ```
3. **Chạy local:**
   ```sh
   npm run dev
   ```
   Truy cập: http://localhost:5173

### 🔌 Kết nối Google Sheets

1. **Tạo Google Apps Script:**
   - Tạo project mới, dán code trong [AppscriptCode.gs](AppscriptCode.gs).
   - Deploy as Web App:
     - Execute as: Me
     - Who has access: Anyone
2. **Cấu hình API URL:**
   - Trong `src/App.jsx`, sửa biến:
     ```js
     const API_URL = "https://script.google.com/macros/s/XXXX/exec";
     ```

## 📄 Cấu Trúc Dữ Liệu

**Player**
```json
{
  "id": "uuid-string",
  "name": "Tên người chơi"
}
```
**Match**
```json
{
  "id": "uuid-string",
  "type": "singles | doubles",
  "team1": ["playerId1"],
  "team2": ["playerId2"],
  "score1": 21,
  "score2": 15,
  "winner": 1,
  "date": "2025-01-01T10:30:00.000Z",
  "meta": {
    "team1PtsBefore": 12,
    "team2PtsBefore": 8,
    "ratingDiff": 4,
    "divisorUsed": 2,
    // "scoreDiff": 6, // (không còn dùng)
    "pointDelta": 3 // Số điểm cộng cho đội thắng, tính bằng: Math.max(1, Math.round(Math.abs(team1PtsBefore - team2PtsBefore) / divisorUsed))
  }
}
```

## 🕒 Xử Lý Thời Gian

- Lưu trên Google Sheets: ISO 8601 (UTC)
- Hiển thị UI: `new Date(date).toLocaleString()`

## ⚠️ Giới Hạn

- Không có xác thực (ai cũng sửa được)
- Google Sheets không tối ưu cho concurrency cao
- Không phù hợp cho giải đấu quy mô lớn


## 📁 Cấu Trúc Thư Mục

```
AppscriptCode.gs         # Backend Google Apps Script (cũ)
README.md
UI_DESIGN.md             # Thiết kế UI/UX chi tiết
SECURITY.md
docs/
  SRS.md                 # Yêu cầu phần mềm
  SUPABASE_GUIDE.md      # Hướng dẫn cấu hình Supabase
public/                  # Static assets
src/
  App.jsx                # React main app
  App.css                # CSS chính
  main.jsx               # Entry point
  supabaseClient.js      # Kết nối Supabase
  assets/                # Hình ảnh, icon
```

## 🔗 Hướng dẫn sử dụng Supabase

Xem chi tiết tại [docs/SUPABASE_GUIDE.md](docs/SUPABASE_GUIDE.md)

## 👤 Tác Giả

- **mhung2026**  
- GitHub: https://github.com/mhung2026


Bạn có thể dùng bản README này để thay thế hoặc bổ sung cho tài liệu hiện tại. Nếu cần bản tiếng Anh hoặc muốn bổ sung phần nào, hãy yêu cầu!
    "team1PtsBefore": 12,

    "team2PtsBefore": 8,
