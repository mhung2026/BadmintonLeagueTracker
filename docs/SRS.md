# Software Requirements Specification (SRS)

## 1. Giới thiệu

### 1.1. Mục đích
Tài liệu này mô tả các yêu cầu phần mềm cho hệ thống Badminton League Tracker – Legend Alliance, một ứng dụng web quản lý giải cầu lông, phục vụ nhóm nhỏ, câu lạc bộ, hoặc giải nội bộ.

### 1.2. Phạm vi
- Quản lý người chơi, trận đấu, bảng xếp hạng, lịch sử, cấu hình tính điểm.
- Dữ liệu chia sẻ thời gian thực qua Google Sheets, không cần backend truyền thống.
- Giao diện mobile-first, dễ sử dụng, đa nền tảng.

### 1.3. Định nghĩa, từ viết tắt
- **Player**: Người chơi
- **Match**: Trận đấu
- **Leaderboard**: Bảng xếp hạng
- **Google Apps Script**: Backend serverless

## 2. Mô tả tổng quan

### 2.1. Chức năng hệ thống
- Thêm/xóa người chơi (không xóa được nếu đã có lịch sử)
- Tạo trận đấu (đơn/đôi), nhập điểm, tự động xác định đội thắng
- Tính điểm dựa trên chênh lệch tổng điểm thành viên hai đội trước trận
- Hiển thị bảng xếp hạng, lịch sử trận đấu
- Cấu hình quy tắc tính điểm (divisor, max chênh lệch)
- Lưu trữ và đồng bộ dữ liệu qua Google Sheets

### 2.2. Đặc điểm người dùng
- Nhóm chơi cầu lông nhỏ, câu lạc bộ, văn phòng
- Không yêu cầu kỹ năng CNTT cao

### 2.3. Ràng buộc
- Không có xác thực người dùng
- Phụ thuộc Google Sheets và Apps Script
- Không phù hợp cho giải đấu lớn, nhiều người truy cập đồng thời

## 3. Yêu cầu chức năng

### 3.1. Quản lý người chơi
- Thêm người chơi mới
- Xóa người chơi (nếu chưa có lịch sử)
- Danh sách người chơi dùng chung

### 3.2. Quản lý trận đấu
- Tạo trận đơn/đôi
- Chọn thành viên cho từng đội
- Nhập điểm số từng đội
- Tự động xác định đội thắng
- Lưu snapshot điểm thành viên hai đội trước trận

### 3.3. Tính điểm & bảng xếp hạng
- Tính điểm dựa trên chênh lệch tổng điểm thành viên hai đội trước trận, chia theo divisor cấu hình
- Cộng điểm cho đội thắng, trừ điểm đội thua
- Hiển thị tổng điểm, số trận, số trận thắng

### 3.4. Lịch sử trận đấu
- Hiển thị danh sách trận đã diễn ra
- Thông tin: loại trận, thành viên, điểm số, đội thắng, thời gian

### 3.5. Cấu hình tính điểm
- Thay đổi divisor, max chênh lệch cho từng mức
- Chỉ áp dụng cho trận mới

### 3.6. Lưu trữ & đồng bộ
- Dữ liệu lưu trên Google Sheets
- Tất cả người dùng cùng xem/sửa dữ liệu

## 4. Yêu cầu phi chức năng

- Giao diện mobile-first, responsive
- Hiệu năng tốt cho nhóm nhỏ (<30 người)
- Dễ sử dụng, thao tác nhanh
- Dữ liệu đồng bộ thời gian thực
- Không yêu cầu cài đặt backend riêng

## 5. Phụ lục
- Xem thêm: README.md, UI_DESIGN.md, AppscriptCode.gs
