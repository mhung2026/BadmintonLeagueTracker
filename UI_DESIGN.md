# UI/UX Design - Ứng Dụng Quản Lý Cầu Lông

## 📐 **Cấu Trúc Layout**

### **Nguyên Tắc Chính**

-   **Container chính**: max-width 960px, centered (margin: 0 auto)
-   **Full-width sections**: Header, Navigation, Content đều fill 100% container
-   **Responsive**: Mobile-first, các element stack dọc
-   **Padding**: Consistent 20px cho content area

```
┌─────────────────────────────────────────────────────────┐
│                  HEADER (Full Width)                    │
├─────────────────────────────────────────────────────────┤
│              NAVIGATION TABS (Full Width)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │            CONTENT SECTION (Full Width)          │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 **Bảng Màu Sắc**

| Thành Phần            | Hex     | Mô Tả                     |
| --------------------- | ------- | ------------------------- |
| **Primary Accent**    | #2563eb | Tab active, nút, điểm số  |
| **Text Primary**      | #0f172a | Heading, text chính       |
| **Text Secondary**    | #64748b | Text phụ, placeholder     |
| **Border**            | #e2e8f0 | Cạnh card, divider        |
| **Background Light**  | #f8fafc | Nền page, item background |
| **Background White**  | #ffffff | Card, section, input      |
| **Background Hover**  | #f1f5f9 | Hover state item          |
| **Success Highlight** | #dbeafe | Đội thắng (light blue)    |
| **Error Light**       | #fee2e2 | Delete button background  |

---

## 📱 **Từng Màn Hình Chi Tiết**

### **1. Header**

```
┌──────────────────────────────────────┐
│ Cầu Lông                             │
└──────────────────────────────────────┘
```

-   **Height**: 56px (16px padding top + 24px font + 16px padding bottom)
-   **Background**: #ffffff
-   **Border-bottom**: 1px #e2e8f0
-   **Title**: "Cầu Lông" - font-size 24px, weight 600, căn trái
-   **Shadow**: subtle 0 1px 3px rgba(0, 0, 0, 0.05)

### **2. Navigation Bar**

```
┌──────────────────────────────────────┐
│ Xếp Hạng │ Trận Đấu │ Người Chơi │ Lịch Sử │
│        ▔▔▔▔▔▔▔▔▔▔▔▔ (active)                 │
└──────────────────────────────────────┘
```

-   **Height**: 48px
-   **Background**: #ffffff
-   **Border-bottom**: 1px #e2e8f0
-   **Tab**: Flex items, min-width 100px, padding 12px 16px
-   **Tab Text**: 14px weight 500, color #64748b
-   **Tab Active**: color #2563eb, border-bottom 2px #2563eb
-   **Tab Hover**: background #f1f5f9, color #0f172a

### **3. Trang "Xếp Hạng"** (Main Page)

```
┌────────────────────────────────────────┐
│ Bảng Xếp Hạng                          │
│                                        │
│ #1  Nguyễn A    10 trận • 8 thắng  45  │
│ #2  Trần B       9 trận • 6 thắng  39  │
│ #3  Lê C         8 trận • 5 thắng  35  │
└────────────────────────────────────────┘
```

-   **Card**: background #ffffff, border 1px #e2e8f0, padding 24px
-   **Section Title**: 20px weight 600, margin-bottom 24px
-   **Ranking Item**:
    -   Layout: flex, gap 16px, padding 16px
    -   Background: #f8fafc, border 1px #e2e8f0, border-radius 6px
    -   Rank: #2563eb, weight 700, min-width 40px
    -   Name: #0f172a, weight 500, 15px
    -   Stats: #64748b, 13px (số trận • số thắng)
    -   Points: #2563eb, weight 700, 18px, text-align right
-   **Empty State**: text-align center, color #94a3b8, padding 40px 20px

### **4. Trang "Người Chơi"**

```
┌────────────────────────────────────────┐
│ Người Chơi                             │
│                                        │
│ [Nhập tên...        ] [Thêm]           │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Nguyễn A                 [Xoá]     │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Trần B                   [Xoá]     │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

-   **Form**: flex layout, gap 8px
-   **Input**: width 100%, padding 10px 12px, border 1px #e2e8f0, border-radius 6px
-   **Button**: width flex-auto, padding 10px 16px, background #2563eb, color white
-   **Player Item**:
    -   flex justify-between, padding 12px 16px
    -   background #f8fafc, border 1px #e2e8f0
    -   Delete button: background #fee2e2, color #991b1b, 13px

### **5. Trang "Tạo Trận Đấu"**

```
┌────────────────────────────────────────┐
│ Tạo Trận Đấu                           │
│                                        │
│ ○ Trận Đơn (1 vs 1)                    │
│ ● Trận Đôi (2 vs 2)                    │
│                                        │
│ ┌──────────┐      ┌──────────┐        │
│ │ Đội 1    │  VS  │ Đội 2    │        │
│ ├──────────┤      ├──────────┤        │
│ │Chưa chọn │      │Chưa chọn │        │
│ │          │      │          │        │
│ │[Nguyễn A]│      │[Trần B]  │        │
│ │[Trần C]  │      │[Lê D]    │        │
│ └──────────┘      └──────────┘        │
│                                        │
│ [Đội 1 Thắng] [Đội 2 Thắng]           │
└────────────────────────────────────────┘
```

**Match Type Radio:**

-   flex layout, gap 24px, background #f8fafc, padding 16px
-   Radio button: width 18px, height 18px, accent-color #2563eb

**Teams Container:**

-   Desktop: grid 3 columns (1fr auto 1fr)
-   Mobile: 1 column
-   gap 16px

**Team Box:**

-   background #f8fafc, border 1px #e2e8f0, padding 16px, border-radius 6px

**Player Tag (selected):**

-   background #2563eb, color white, padding 6px 10px
-   border-radius 4px, display flex, justify-between

**Player Select Button:**

-   width 100%, text-align left, padding 8px 12px
-   background #ffffff, border 1px #e2e8f0
-   hover: background #f1f5f9, border-color #2563eb

**Result Buttons:**

-   grid 2 columns, gap 12px, full-width
-   padding 12px 16px, background #2563eb, color white

### **6. Trang "Lịch Sử Trận Đấu"**

```
┌────────────────────────────────────────┐
│ Lịch Sử Trận Đấu                       │
│                                        │
│ Đơn | Hôm nay                          │
│ ┌────────────────────────────────────┐ │
│ │ Nguyễn A vs Trần B                 │ │
│ │ (Đội thắng: background xanh nhạt) │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Đôi | 17/12/2025                       │
│ ┌────────────────────────────────────┐ │
│ │ Nguyễn A, Trần B vs Lê C, Phạm D   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**History Item:**

-   background #f8fafc, border 1px #e2e8f0, padding 12px 16px, border-radius 6px
-   Header: flex justify-between, font-size 12px
-   Match type: weight 600, color #2563eb
-   Date: color #94a3b8

**History Teams:**

-   grid 3 columns (1fr auto 1fr), gap 12px, font-size 13px
-   Team: padding 8px 12px, background #ffffff, border 1px #e2e8f0, border-radius 4px
-   Winner: background #dbeafe, color #1e40af, border #bfdbfe, weight 600

---

## 📊 **Responsive Breakpoints**

### **Desktop (> 640px)**

-   Container: max-width 960px, centered
-   Sections: full width within container
-   Grid layouts: 2-3 columns où applicable
-   Font sizes: standard

### **Mobile (≤ 640px)**

-   Container: max-width 100%, padding edges
-   Sections: 100% width
-   Grid layouts: 1 column (stack)
-   Font sizes: slightly smaller (12-14px)
-   Buttons: full-width where possible
-   Spacing: reduced (12px vs 20px)

---

## ✨ **Đặc Điểm Thiết Kế**

✅ **Layout Fix:**

-   Container chung 960px, center margin auto
-   Header, nav, content cùng chiều rộng
-   Card full-width, không lệch trái

✅ **Colors:**

-   Nền sáng (#f8fafc), card trắng
-   Accent xanh dương (#2563eb)
-   Không gradient, không tím

✅ **Typography:**

-   System fonts (-apple-system, Segoe UI)
-   Weight: 400 (normal), 500 (semi-bold), 600 (bold)
-   Size: 13px (small) → 24px (title)

✅ **Spacing:**

-   Consistent padding: 8px, 12px, 16px, 20px, 24px
-   Gap between items: 8px, 12px, 16px
-   Margin between sections: 24px

✅ **Interactivity:**

-   Hover states rõ ràng
-   Focus outline cho input
-   Border-bottom underline cho tab active
-   Smooth transitions (0.2s ease)

---

## 🔧 **CSS Classes Reference**

```
.app-container          - Container chính (960px max-width)
.app-header             - Header
.header-title           - Tiêu đề "Cầu Lông"
.nav-bar                - Navigation bar
.nav-btn                - Navigation button
.nav-btn.active         - Tab active (blue underline)
.main-content           - Content wrapper
.section                - Card/section container
.section-title          - Section heading
.ranking-list           - Ranking items wrapper
.ranking-item           - Single ranking row
.rank-number            - Rank number (#1, #2...)
.player-details         - Player name + stats
.player-name            - Player name
.player-stats           - Stats text (matches • wins)
.player-points          - Points score
.btn-primary            - Primary button
.btn-delete             - Delete button
.input-field            - Input text field
.players-list           - Players list container
.player-item            - Single player row
.match-type-group       - Radio buttons wrapper
.radio-label            - Radio label
.teams-container        - Teams layout (3 cols)
.team-box               - Team section
.team-title             - Team name
.team-players-display   - Selected players display
.player-tag             - Selected player tag
.player-buttons         - Available players buttons
.player-select-btn      - Player select button
.vs-divider             - VS divider text
.result-buttons         - Result buttons wrapper
.history-list           - History items wrapper
.history-item           - Single match history
.history-header         - Match type + date
.history-teams          - Match result display
.history-team           - Team in history
.history-team.winner    - Winner team (blue bg)
.empty-state            - Empty message
```

---

## 📋 **Checklist Sửa Lỗi**

-   ✅ Layout không bị lệch trái
-   ✅ Header, nav, content cùng chiều rộng
-   ✅ Container center, max-width 960px
-   ✅ Card full-width trong container
-   ✅ Nền trắng/xám nhạt, bỏ gradient
-   ✅ Accent xanh dương, không tím
-   ✅ Responsive mobile-first
-   ✅ Spacing consistent, không bị dôi dăng
-   ✅ Typography rõ ràng, hierarchy tốt
-   ✅ Buttons, inputs có hover/focus state

---

**Status**: ✅ UI/UX Design Updated & Finalized
