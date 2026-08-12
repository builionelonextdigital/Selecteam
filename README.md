# Selecteam - Form Chọn Team

Ứng dụng web Node.js cho phép người dùng chọn team với giới hạn tối đa 2 người cho mỗi team.

## ✨ Tính Năng

- 📋 Form với trường **Tên** và **Chọn Team**
- 🏆 4 Teams có sẵn (Team A, B, C, D)
- 👥 Giới hạn tối đa **2 người** trên mỗi team
- 🔄 Kiểm tra số lượng realtime
- 💾 Lưu dữ liệu vào PostgreSQL
- 📊 API để xem danh sách đã chọn
- 🎨 Giao diện responsive và hiện đại
- 🌐 Hỗ trợ tiếng Việt

## 🚀 Cài Đặt

### Yêu Cầu
- Node.js v14+
- PostgreSQL (hoặc Neon Database)
- npm hoặc yarn

### Bước 1: Clone/Tạo dự án
```bash
cd Selecteam
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình môi trường
Tạo file `.env` (hoặc chỉnh sửa file hiện có):
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require&channel_binding=require
PORT=3000
```

### Bước 4: Chạy server
```bash
# Chế độ development (với auto-reload)
npm run dev

# Chế độ production
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📚 Cấu Trúc Dự Án

```
Selecteam/
├── server.js           # Express server & logic chính
├── views/
│   └── form.ejs       # Form HTML template
├── package.json       # Dependencies
├── .env              # Biến môi trường
├── .gitignore        # Git ignore file
└── README.md         # Tài liệu này
```

## 📖 Cách Sử Dụng

1. **Mở form**: Vào `http://localhost:3000`
2. **Nhập tên**: Điền tên của bạn
3. **Chọn team**: Chọn một trong 4 team (Team A, B, C, hoặc D)
4. **Gửi**: Nhấp nút "Gửi"

### Quy tắc
- Mỗi team chỉ nhận tối đa **2 người**
- Khi team đầy, option sẽ bị vô hiệu hóa
- Dữ liệu được lưu vào cơ sở dữ liệu

## 🔌 API Endpoints

### GET `/`
Hiển thị form chọn team

**Response**: HTML form

### POST `/submit`
Gửi dữ liệu form (tên và team)

**Body**:
```json
{
  "name": "Tên của bạn",
  "team": "team_a"
}
```

**Success Response** (200):
```
Trang form với thông báo thành công
```

**Error Response** (400/500):
```
Trang form với thông báo lỗi
```

### GET `/api/selections`
Lấy danh sách tất cả người đã chọn (JSON)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Văn A",
      "team": "team_a",
      "created_at": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

## 🗄️ Schema Database

Bảng `team_selections`:
```sql
CREATE TABLE team_selections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  team VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Giao Diện

- **Hiện thị số người**: Mỗi team hiển thị `X/2` người đã chọn
- **Trạng thái team**:
  - 🟢 **Còn chỗ** (< 2 người)
  - 🔴 **Đầy** (= 2 người)
- **Tự động cập nhật**: Form tự động disable option team khi đầy

## 🔒 Bảo Mật

- ⚠️ Kiểm tra trên server (không chỉ client)
- Biến môi trường không được commit vào git
- Database connection string nằm trong `.env`

## 📱 Responsive Design

- ✅ Hoạt động trên desktop, tablet, mobile
- ✅ Tự động điều chỉnh layout

## 🤝 Hỗ Trợ

Nếu có bất kỳ lỗi nào, kiểm tra:
1. Database connection string trong `.env`
2. Node.js version >= 14
3. Cổng 3000 có sẵn

## 📝 Ghi Chú

- Form tự động reset sau khi gửi thành công
- Thông báo lỗi sẽ biến mất sau 5 giây
- API `/api/selections` có thể dùng để tích hợp với ứng dụng khác