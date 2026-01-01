# Security Policy

## Phiên bản được hỗ trợ

| Phiên bản | Hỗ trợ bảo mật |
| --------- | -------------- |
| 1.x.x     | ✅ Có          |

## Báo cáo lỗ hổng bảo mật

Nếu bạn phát hiện lỗ hổng bảo mật trong dự án này, vui lòng:

1. **Không** công khai thông tin lỗ hổng trên GitHub Issues
2. Gửi email đến: [mhung20262004@gmail.com] với tiêu đề "Security Vulnerability Report"
3. Mô tả chi tiết lỗ hổng và các bước tái tạo
4. Chúng tôi sẽ phản hồi trong vòng 48 giờ

## Các biện pháp bảo mật hiện tại

### Xác thực và Phân quyền
- Sử dụng Supabase Row Level Security (RLS) để kiểm soát truy cập dữ liệu
- Mã xác nhận được yêu cầu khi chỉnh sửa lịch sử trận đấu

### Bảo vệ dữ liệu
- Credentials Supabase lưu trong biến môi trường, không commit vào git
- File `.env` được thêm vào `.gitignore`

### Best Practices
- Không lưu trữ thông tin nhạy cảm trong code
- Sử dụng HTTPS cho tất cả các kết nối
- Validate input ở cả client và server side

## Cấu hình bảo mật khuyến nghị

### Supabase RLS
Để tăng cường bảo mật, bạn nên bật Row Level Security trong Supabase:

```sql
-- Bật RLS cho các bảng
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoreconfig ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai
CREATE POLICY "Allow public read" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON scoreconfig FOR SELECT USING (true);
```

## Liên hệ

Mọi thắc mắc về bảo mật, vui lòng liên hệ qua email hoặc tạo issue trên GitHub.
