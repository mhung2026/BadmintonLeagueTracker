node --experimental-vm-modules node_modules/jest/bin/jest.js src/utils.unit.test.js# Hướng dẫn sử dụng Supabase cho Badminton League Tracker

## 1. Tạo project và bảng dữ liệu

- Truy cập https://app.supabase.com, đăng nhập và tạo project mới.
- Vào tab SQL Editor, chạy các lệnh sau để tạo bảng:

```sql
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  team1 uuid[] not null,
  team2 uuid[] not null,
  score1 integer,
  score2 integer,
  winner integer,
  date timestamptz not null,
  meta jsonb
);

create table scoreConfig (
  id serial primary key,
  maxPointDiff integer not null,
  divisor integer not null
);
```

## 2. Lấy thông tin kết nối

- Vào Project Settings > API:
  - Copy Project URL và anon/public key.
- Dán vào file `src/supabaseClient.js`:

```js
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 3. Tích hợp vào React app

- Đã cài đặt `@supabase/supabase-js` bằng lệnh:
  ```sh
  npm install @supabase/supabase-js
  ```
- Đã cập nhật App.jsx sử dụng Supabase cho toàn bộ thao tác CRUD.

## 4. Sử dụng

- Khi thêm/xóa người chơi, tạo trận đấu, cấu hình điểm... dữ liệu sẽ lưu trực tiếp vào Supabase DB.
- Mọi thay đổi sẽ đồng bộ với các client khác (nếu dùng subscription realtime).

## 5. Lưu ý bảo mật

- Không chia sẻ public key cho người lạ nếu dữ liệu nhạy cảm.
- Có thể cấu hình Row Level Security (RLS) trong Supabase để kiểm soát quyền truy cập.

## 6. Chạy unit test với Jest (ESM)

Nếu gặp lỗi import khi chạy Jest, hãy làm như sau:

1. Đảm bảo package.json có dòng:
  ```json
  "type": "module"
  ```
2. Tạo file jest.config.js với nội dung:
  ```js
  export default {
    transform: {},
    testEnvironment: "node"
  };
  ```
3. Chạy test bằng lệnh:
  ```sh
  node --experimental-vm-modules node_modules/jest/bin/jest.js src/utils.unit.test.js
  ```

## 7. Tài liệu tham khảo
- [Supabase Docs](https://supabase.com/docs)
- [@supabase/supabase-js](https://github.com/supabase/supabase-js)
- [Jest ESM Guide](https://jestjs.io/docs/ecmascript-modules)

---
Nếu cần hướng dẫn chi tiết hơn hoặc bổ sung tính năng realtime, hãy yêu cầu!