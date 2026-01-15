# Random G'olib Tanlash Tizimi 🎲

MongoDB, Express.js va React asosida yaratilgan random g'olib tanlash web ilovasi.

## 📋 Funksiyalar

### Admin panel:
- ✅ Viloyatlar va tumanlarni boshqarish
- ✅ Excel (XLSX) fayldan ishtirokchilarni yuklash
- ✅ Tumanlarni faollashtirish/o'chirish
- ✅ G'oliblar ro'yxatini ko'rish va boshqarish
- ✅ G'olib statusini bekor qilish

### Foydalanuvchi panel:
- ✅ Random g'olib tanlash
- ✅ Oxirgi g'olibni ko'rish
- ✅ G'oliblar tarixini ko'rish

### Random tanlash logikasi:
1. Avval faol viloyatlardan bittasi random tanlanadi
2. Keyin tanlangan viloyatdagi faol tumanlardan bittasi random tanlanadi
3. So'ng tanlangan tumandagi ishtirokchilardan bitta odam random tanlanadi
4. Oldingi g'oliblar qayta tanlanmasligi mumkin (sozlanishi mumkin)

## 🛠 Texnologiyalar

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Frontend:** React
- **Autentifikatsiya:** JWT
- **Excel yuklash:** multer, xlsx

## 📁 Loyiha strukturasi

```
random-winner-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── viloyatController.js
│   │   ├── tumanController.js
│   │   ├── ishtirokchiController.js
│   │   ├── golibController.js
│   │   ├── randomController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Viloyat.js
│   │   ├── Tuman.js
│   │   ├── Ishtirokchi.js
│   │   └── Golib.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── viloyatRoutes.js
│   │   ├── tumanRoutes.js
│   │   ├── ishtirokchiRoutes.js
│   │   ├── golibRoutes.js
│   │   ├── randomRoutes.js
│   │   └── uploadRoutes.js
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Navbar.css
│   │   │   └── ProtectedRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Viloyatlar.js
│   │   │   │   ├── Tumanlar.js
│   │   │   │   ├── Ishtirokchilar.js
│   │   │   │   ├── Upload.js
│   │   │   │   └── AdminPages.css
│   │   │   ├── Home.js
│   │   │   ├── Home.css
│   │   │   ├── Goliblar.js
│   │   │   ├── Goliblar.css
│   │   │   ├── Login.js
│   │   │   └── Login.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## 🚀 Ishga tushirish

### 1. MongoDB o'rnatish
MongoDB o'rnatilgan va ishlayotgan bo'lishi kerak.

### 2. Backend sozlash

```bash
cd backend

# Paketlarni o'rnatish
npm install

# .env faylni sozlash (namunadan nusxa oling)
# MONGODB_URI=mongodb://localhost:27017/random_winner_db
# JWT_SECRET=your_secret_key
# PORT=5000

# Serverni ishga tushirish
npm run dev
```

### 3. Frontend sozlash

```bash
cd frontend

# Paketlarni o'rnatish
npm install

# Ilovani ishga tushirish
npm start
```

### 4. Admin yaratish

Birinchi marta tizimni ishga tushirganda admin yaratish uchun:

```bash
# POST so'rov yuboring
curl -X POST http://localhost:5000/api/auth/init-admin
```

yoki Postman orqali:
- URL: `POST http://localhost:5000/api/auth/init-admin`

**Default admin ma'lumotlari:**
- Username: `admin`
- Password: `admin123`

## 📡 API Endpointlar

### Autentifikatsiya
| Method | Endpoint | Ta'rif |
|--------|----------|--------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/init-admin` | Admin yaratish |
| GET | `/api/auth/me` | Joriy foydalanuvchi |
| POST | `/api/auth/register` | Foydalanuvchi yaratish (faqat admin) |

### Viloyatlar
| Method | Endpoint | Ta'rif |
|--------|----------|--------|
| GET | `/api/viloyat` | Barcha viloyatlar |
| GET | `/api/viloyat/:id` | Bitta viloyat |
| POST | `/api/viloyat` | Yangi viloyat (admin) |
| PUT | `/api/viloyat/:id` | Yangilash (admin) |
| DELETE | `/api/viloyat/:id` | O'chirish (admin) |

### Tumanlar
| Method | Endpoint | Ta'rif |
|--------|----------|--------|
| GET | `/api/tuman` | Barcha tumanlar |
| GET | `/api/tuman/:id` | Bitta tuman |
| POST | `/api/tuman` | Yangi tuman (admin) |
| PUT | `/api/tuman/:id` | Yangilash (admin) |
| DELETE | `/api/tuman/:id` | O'chirish (admin) |
| PATCH | `/api/tuman/:id/toggle-active` | Faollikni o'zgartirish (admin) |

### Ishtirokchilar
| Method | Endpoint | Ta'rif |
|--------|----------|--------|
| GET | `/api/ishtirokchi` | Barcha ishtirokchilar |
| GET | `/api/ishtirokchi/:id` | Bitta ishtirokchi |
| POST | `/api/ishtirokchi` | Yangi ishtirokchi (admin) |
| PUT | `/api/ishtirokchi/:id` | Yangilash (admin) |
| DELETE | `/api/ishtirokchi/:id` | O'chirish (admin) |
| PATCH | `/api/ishtirokchi/:id/reset-winner` | G'olib statusini bekor qilish (admin) |

### G'oliblar
| Method | Endpoint | Ta'rif |
|--------|----------|--------|
| GET | `/api/golib` | Barcha g'oliblar |
| GET | `/api/golib/latest` | Oxirgi g'olib |
| GET | `/api/golib/stats` | Statistika |
| GET | `/api/golib/:id` | Bitta g'olib |
| DELETE | `/api/golib/:id` | O'chirish (admin) |

### Random tanlash
| Method | Endpoint | Ta'rif |
|--------|----------|--------|
| POST | `/api/random/select` | G'olib tanlash |
| GET | `/api/random/stats` | Tanlash statistikasi |
| POST | `/api/random/reset-all-winners` | Barcha g'olib statuslarini bekor qilish (admin) |

### Excel yuklash
| Method | Endpoint | Ta'rif |
|--------|----------|--------|
| POST | `/api/upload/excel` | Excel fayldan yuklash (admin) |
| GET | `/api/upload/template` | Namuna faylni yuklab olish (admin) |

## 📊 Excel fayl formati

Excel fayl quyidagi ustunlardan iborat bo'lishi kerak:

| FIO | Tuman | Viloyat | Telefon |
|-----|-------|---------|---------|
| Alijon Valiyev | Chilonzor | Toshkent | +998901234567 |
| Bobur Karimov | Mirzo Ulug'bek | Toshkent | |

- **FIO** - majburiy
- **Tuman** - majburiy
- **Viloyat** - majburiy
- **Telefon** - ixtiyoriy

## 🔐 Rollar

1. **Admin**
   - Barcha funksiyalarga kirish huquqi
   - Viloyat, tuman, ishtirokchilarni boshqarish
   - Excel orqali yuklash
   - G'olib statuslarini boshqarish

2. **User (Foydalanuvchi)**
   - Random tanlash
   - G'oliblar ro'yxatini ko'rish (faqat o'qish)

## ⚠️ Muhim eslatmalar

1. MongoDB ishlab turgan bo'lishi kerak
2. `.env` faylda `JWT_SECRET` xavfsiz qiymat bilan almashtirilishi kerak
3. Production muhitda `NODE_ENV=production` qo'yilishi kerak
4. Admin parolini o'zgartirish tavsiya etiladi

## 📝 Litsenziya

MIT License
