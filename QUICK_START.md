# 🚀 Quick Start - Selecteam

Hướng dẫn nhanh để chạy ứng dụng chọn team.

## 5 Phút Cài Đặt

### 1️⃣ Cài Đặt Dependencies
```bash
npm install
```

### 2️⃣ Cấu Hình Database
File `.env` đã được tạo sẵn với kết nối đến Neon Database.

**Nếu muốn thay đổi**, mở `.env` và sửa:
```env
DATABASE_URL=postgresql://neondb_owner:npg_m7OTkheDYM5s@ep-dawn-sound-axt639na-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 3️⃣ Chạy Server
```bash
npm start
```

Hoặc chế độ development (auto-reload):
```bash
npm run dev
```

### 4️⃣ Mở Browser
```
http://localhost:3000
```

✅ Done! Bây giờ bạn có thể:
- Nhập tên
- Chọn team
- Gửi form
- Xem danh sách đã chọn

---

## 🎯 Chức Năng

| Tính năng | Chi tiết |
|----------|---------|
| 📋 Form | Tên + Chọn Team |
| 🏆 Teams | 4 team (A, B, C, D) |
| 👥 Giới hạn | Max 2 người/team |
| 💾 Database | PostgreSQL (Neon) |
| 📊 API | `/api/selections` |

---

## 📝 Cách Sử Dụng

### 1. Gửi Form
```
1. Nhập tên
2. Chọn team
3. Nhấp "Gửi"
```

### 2. Xem Danh Sách
Nhấp vào link "📊 Xem danh sách đã chọn" hoặc:
```bash
curl http://localhost:3000/api/selections
```

### 3. Tích Hợp API
```javascript
// Gửi
fetch('/submit', {
  method: 'POST',
  body: new FormData(formElement)
});

// Lấy danh sách
fetch('/api/selections').then(r => r.json());
```

---

## 🆘 Troubleshooting

### ❌ Lỗi: "Cannot find module 'pg'"
```bash
npm install pg
```

### ❌ Lỗi: "ECONNREFUSED" (Database)
- Kiểm tra DATABASE_URL trong `.env`
- Kiểm tra kết nối internet
- Kiểm tra firewall

### ❌ Port 3000 đang sử dụng
```bash
# Thay đổi port
PORT=3001 npm start
```

### ❌ Form không submit
- Mở console (F12)
- Kiểm tra error message
- Xem server logs

---

## 📚 Tài Liệu Thêm

- [README.md](README.md) - Tài liệu chi tiết
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Chi tiết API
- [package.json](package.json) - Dependencies

---

## 💡 Tips

✅ Form tự động update số người/team  
✅ Team đầy sẽ bị disable (không chọn được)  
✅ Thông báo lỗi tự biến mất sau 5 giây  
✅ Tất cả dữ liệu lưu vào database  
✅ API trả về JSON (dùng để tích hợp)  

---

## 🔧 Tùy Chỉnh

Sửa file `config.js` để:
- ✏️ Đổi tên team
- ✏️ Thay đổi giới hạn người/team
- ✏️ Tùy chỉnh message

---

## 🚢 Deploy

### Với Heroku
```bash
git push heroku main
```

### Với Docker
```bash
docker-compose up
```

### Với Node
```bash
npm install -g pm2
pm2 start server.js --name "selecteam"
```

---

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra logs: `npm run dev`
2. Kiểm tra database connection
3. Xóa `node_modules` rồi chạy lại: `npm install && npm start`

Chúc bạn thành công! 🎉
