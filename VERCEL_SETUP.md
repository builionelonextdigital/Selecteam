# 🚀 Hướng Dẫn Setup Vercel

Fix lỗi: `Environment Variable "DATABASE_URL" references Secret "database_url", which does not exist.`

## ✅ Giải Pháp

### Cách 1: Thêm Environment Variable vào Vercel Dashboard (Khuyên Dùng)

1. **Vào Vercel Project**
   - Truy cập: https://vercel.com/projects
   - Chọn project `Selecteam`

2. **Vào Settings**
   - Click `Settings` (menu trên)
   - Chọn `Environment Variables` (bên trái)

3. **Thêm DATABASE_URL**
   - Click nút **Add New** (hoặc **New Environment Variable**)
   - **Name:** `DATABASE_URL`
   - **Value:** Dán connection string:
     ```
     postgresql://neondb_owner:npg_m7OTkheDYM5s@ep-dawn-sound-axt639na-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```
   - **Environment:** Chọn `Production`, `Preview`, `Development`
   - Click **Save**

4. **Redeploy**
   - Quay lại `Deployments`
   - Click nút `Redeploy` (các chấm 3 chiều)
   - Chọn `Redeploy`

✅ Done! Deployment sẽ thành công

---

### Cách 2: Sử Dụng .env.production (Local)

Nếu muốn deploy từ local:

```bash
# 1. Tạo file .env.production
echo 'DATABASE_URL=postgresql://neondb_owner:npg_m7OTkheDYM5s@ep-dawn-sound-axt639na-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' > .env.production

# 2. Commit & Push
git add .env.production
git commit -m "Add production environment"
git push origin main

# 3. Vercel sẽ tự deploy
```

---

### Cách 3: Vercel CLI

```bash
# 1. Login vào Vercel
vercel login

# 2. Link project
vercel link

# 3. Add environment variable
vercel env add DATABASE_URL
# Paste: postgresql://neondb_owner:npg_m7OTkheDYM5s@ep-dawn-sound-axt639na-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# 4. Deploy
vercel deploy --prod
```

---

## 📋 Checklist

- [ ] DATABASE_URL đã thêm vào Vercel Dashboard
- [ ] Chọn đúng Environment (Production, Preview, Development)
- [ ] Vercel project đã redeploy
- [ ] Deployment status: "Ready" (xanh)
- [ ] Truy cập https://selecteam.vercel.app thử

---

## 🔍 Kiểm Tra Status

Vào **Deployments**:
- 🟢 **Ready** = Thành công ✓
- 🟡 **Building** = Đang build
- 🔴 **Error** = Lỗi (kiểm tra logs)

Để xem logs lỗi chi tiết:
1. Click vào deployment
2. Chọn tab **Functions** hoặc **Build Logs**
3. Scroll xuống xem error

---

## ⚠️ Lưu Ý

- **Không commit .env file** (chứa password)
- .env.production có thể commit (nhưng tốt hơn là add vào Vercel Dashboard)
- Mỗi khi thay đổi environment variable phải redeploy

---

## 🆘 Nếu Vẫn Lỗi

**Lỗi: "DATABASE_URL is undefined"**
- Kiểm tra: Settings > Environment Variables > DATABASE_URL có không?
- Kiểm tra: Value không có space trước/sau

**Lỗi: "Database connection timeout"**
- Kiểm tra: Connection string có đúng không?
- Kiểm tra: Neon database online không? (https://console.neon.tech)

**Lỗi: "SSL/certificate error"**
- Nguyên nhân: Connection string cần `sslmode=require`
- Check: Connection string có `?sslmode=require&channel_binding=require` không?

---

## 📞 Liên Hệ

Nếu vẫn không được, kiểm tra:
1. Vercel Logs (bấm Ctrl+K, search "Build Logs")
2. Neon Database status
3. DATABASE_URL format (copy từ Neon console)
