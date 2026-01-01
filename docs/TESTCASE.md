# Testcase cho Badminton League Tracker (Supabase)

## 1. Quản lý người chơi

### TC01: Thêm người chơi mới
- Bước: Nhập tên, nhấn Thêm
- Kết quả: Người chơi xuất hiện trong danh sách, lưu vào Supabase

### TC02: Xóa người chơi chưa có lịch sử
- Bước: Nhấn Xóa với người chơi chưa từng tham gia trận
- Kết quả: Người chơi bị xóa khỏi danh sách và Supabase

### TC03: Xóa người chơi đã có lịch sử
- Bước: Nhấn Xóa với người chơi đã tham gia trận
- Kết quả: Hiện thông báo lỗi, không xóa được

## 2. Tạo trận đấu

### TC04: Tạo trận đơn hợp lệ
- Bước: Chọn 2 người chơi, nhập điểm, lưu
- Kết quả: Trận đấu xuất hiện trong lịch sử, lưu vào Supabase

### TC05: Tạo trận đôi hợp lệ
- Bước: Chọn 4 người chơi, nhập điểm, lưu
- Kết quả: Trận đấu xuất hiện trong lịch sử, lưu vào Supabase

### TC06: Chọn trùng người ở 2 đội
- Bước: Chọn cùng 1 người cho cả 2 đội
- Kết quả: Hiện thông báo lỗi, không lưu trận

### TC07: Nhập điểm hòa
- Bước: Nhập điểm 2 đội bằng nhau
- Kết quả: Hiện thông báo lỗi, không lưu trận

## 3. Bảng xếp hạng

### TC08: Hiển thị đúng tổng điểm, số trận, số thắng
- Bước: Tạo nhiều trận, kiểm tra bảng xếp hạng
- Kết quả: Số liệu đúng theo logic tính điểm

## 4. Lịch sử trận đấu

### TC09: Hiển thị đúng thông tin trận
- Bước: Tạo trận, kiểm tra lịch sử
- Kết quả: Hiển thị loại trận, thành viên, điểm số, đội thắng, thời gian

## 5. Cấu hình tính điểm

### TC10: Thay đổi divisor, maxPointDiff
- Bước: Thêm/sửa/xóa dòng cấu hình, lưu
- Kết quả: Cấu hình lưu vào Supabase, áp dụng cho trận mới

## 6. Đồng bộ dữ liệu

### TC11: Thêm/xóa/sửa trên 2 trình duyệt khác nhau
- Bước: Thực hiện thao tác trên 2 máy
- Kết quả: Dữ liệu đồng bộ giữa các client (nếu dùng subscription)

---
Nếu cần testcase chi tiết cho từng hàm hoặc unit test, hãy yêu cầu!