# Database Migrations

## Migration 001: Add `disabled` column to `players`

**File:** `migrations/001_add_disabled_to_players.sql`

**Purpose:** Add disabled flag to players table

**How to apply:**
1. Supabase -> SQL Editor -> paste and run
2. Or use psql/CLI

---

## Migration 002: Add `current_points` to `players`

**File:** `migrations/002_add_current_points_to_players.sql`
**Date:** 2026-01-15

**Purpose:** Lưu điểm hiện tại trực tiếp trong bảng players thay vì tính lại từ matches mỗi lần

**Changes:**
```sql
ALTER TABLE players
ADD COLUMN IF NOT EXISTS current_points INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_players_current_points ON players(current_points DESC);
```

**Benefits:**
- ✅ Cải thiện hiệu suất đọc ranking
- ✅ Dễ sort và filter
- ⚠️ Cần sync điểm khi tạo/sửa/xóa trận

**How to apply:**
1. Supabase Dashboard -> SQL Editor
2. Copy nội dung `migrations/002_add_current_points_to_players.sql`
3. Paste và Run
4. Trong app, vào tab "Cài đặt" -> nhấn "🔄 Sync điểm từ matches" để sync dữ liệu hiện có

**Automatic Updates:**
- Khi tạo trận mới: Điểm tự động cập nhật cho tất cả người chơi trong trận
- Khi "Tính lại toàn bộ database": Tự động sync điểm về players sau khi tính lại
- Nút "🔄 Sync điểm từ matches": Sync thủ công khi cần (ví dụ sau migration)

---

## Schema Current State

### Table: `players`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | Primary key |
| name | TEXT | - | Player name |
| disabled | BOOLEAN | false | Inactive flag |
| current_points | INTEGER | 0 | Current rating ⭐NEW |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_players_current_points (current_points DESC)` ⭐NEW

---

## After Migration

**IMPORTANT:** Sau khi chạy migration 002, phải sync điểm:

1. Vào app → tab "Cài đặt"
2. Nhấn nút "🔄 Sync điểm từ matches"
3. Nhập mã xác nhận
4. Chờ hệ thống tính lại tất cả điểm

---

## Migration 003: Add `total_matches` and `wins` to `players`

**File:** `migrations/003_add_match_stats_to_players.sql`
**Date:** 2026-01-15

**Purpose:** Lưu thống kê số trận và số trận thắng trực tiếp trong bảng players

**Changes:**
```sql
ALTER TABLE players
ADD COLUMN IF NOT EXISTS total_matches INTEGER NOT NULL DEFAULT 0;

ALTER TABLE players
ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0;
```

**Benefits:**
- ✅ Không cần đếm từ matches mỗi lần
- ✅ % thắng = wins / total_matches (tính trực tiếp)
- ⚠️ Cần cập nhật khi tạo/sửa/xóa trận

**How to apply:**
1. Supabase Dashboard -> SQL Editor
2. Copy nội dung `migrations/003_add_match_stats_to_players.sql`
3. Paste và Run
4. Trong app, vào tab "Cài đặt" -> nhấn "🔄 Sync điểm từ matches" (sẽ tự động sync cả stats)

**Automatic Updates:**
- Khi tạo trận mới: Tự động +1 total_matches, +1 wins (nếu thắng)
- Khi "Tính lại toàn bộ database": Tự động sync cả stats
- Nút "🔄 Sync điểm từ matches": Sync cả điểm và stats

---

## Schema Current State (After Migration 003)

### Table: `players`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | Primary key |
| name | TEXT | - | Player name |
| disabled | BOOLEAN | false | Inactive flag |
| current_points | INTEGER | 0 | Current rating ⭐ |
| total_matches | INTEGER | 0 | Total matches played ⭐NEW |
| wins | INTEGER | 0 | Total wins ⭐NEW |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_players_current_points (current_points DESC)`

---

## Rollback (nếu cần)

```sql
-- Rollback migration 003
ALTER TABLE players DROP COLUMN IF EXISTS wins;
ALTER TABLE players DROP COLUMN IF EXISTS total_matches;

-- Rollback migration 002
DROP INDEX IF EXISTS idx_players_current_points;
ALTER TABLE players DROP COLUMN IF EXISTS current_points;
```