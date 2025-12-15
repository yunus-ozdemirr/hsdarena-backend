# 🎯 HSD Arena Backend

**Modern gerçek zamanlı quiz platformu backend API'si**

NestJS, Prisma, PostgreSQL ve WebSocket teknolojileri ile geliştirilmiş, canlı quiz yarışmaları için tasarlanmış profesyonel bir backend sistemi.

---

## 📚 İçindekiler

- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [Özellikler](#-özellikler)
- [Teknoloji Stack](#-teknoloji-stack)
- [Kurulum](#-kurulum)
- [Proje Yapısı](#-proje-yapısı)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [WebSocket Events](#-websocket-events)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Veritabanı](#-veritabanı)
- [Test Etme](#-test-etme)
- [Deployment](#-deployment)
- [Katkıda Bulunma](#-katkıda-bulunma)

---

## 🚀 Hızlı Başlangıç

### Ön Gereksinimler

- Node.js (v18 veya üzeri)
- npm veya yarn
- PostgreSQL (veya Neon DB hesabı)
- Redis (opsiyonel, caching için)
- Docker (opsiyonel, local development için)

### 3 Adımda Başlat

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Environment variables ayarla
cp .env.example .env
# .env dosyasını düzenle

# 3. Veritabanını hazırla ve başlat
npm run prisma:generate
npm run db:deploy
npm run seed
npm run start:dev
```

✅ API çalışıyor! → `http://localhost:8082`  
✅ Swagger UI → `http://localhost:8082/docs`

---

## ✨ Özellikler

### 🎮 Quiz Yönetimi
- ✅ Çoklu seçenekli (MCQ) ve Doğru/Yanlış (T/F) soru tipleri
- ✅ Soru havuzu ve dinamik quiz oluşturma
- ✅ Quiz settings (süre, puan, bonus ayarları)
- ✅ Admin paneli için tam CRUD operasyonları

### 👥 Takım Sistemi
- ✅ Session code ile kolay katılım
- ✅ Takım bazlı token yönetimi
- ✅ Gerçek zamanlı takım skorları
- ✅ Disqualification desteği

### 🔐 Güvenlik
- ✅ JWT tabanlı kimlik doğrulama (Admin + Team)
- ✅ Role-based access control (RBAC)
- ✅ Argon2 şifre hashleme
- ✅ Rate limiting ve throttling
- ✅ CORS koruması

### 📊 Gerçek Zamanlı
- ✅ WebSocket ile anlık event'ler (`domain:action` formatı)
- ✅ Canlı scoreboard güncellemeleri
- ✅ Soru başlangıç/bitiş bildirimleri
- ✅ Takım cevap istatistikleri

### 📈 Skorlama
- ✅ Otomatik cevap doğrulama
- ✅ Puan hesaplama
- ✅ Canlı leaderboard
- ✅ Session bazlı raporlama

---

## 🛠 Teknoloji Stack

### Backend Framework
- **NestJS** - Enterprise-grade Node.js framework
- **TypeScript** - Type-safe development
- **Prisma ORM** - Modern database toolkit

### Veritabanı & Cache
- **PostgreSQL** - Ana veritabanı (Neon DB destekli)
- **Redis** - Caching ve session yönetimi

### Güvenlik
- **JWT** - Token-based authentication
- **Argon2** - Şifre hashleme
- **Passport** - Authentication middleware

### Real-time
- **Socket.IO** - WebSocket iletişimi
- **NestJS WebSockets** - WebSocket gateway

### Dokümantasyon & Testing
- **Swagger/OpenAPI** - API dokümantasyonu
- **Jest** - Unit & Integration testleri

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container setup

---

## 📦 Kurulum

### Yöntem 1: Neon DB ile Cloud Setup (Önerilen)

#### 1️⃣ Neon Database Kurulumu

1. [neon.tech](https://neon.tech) hesabı oluşturun (ücretsiz)
2. Yeni proje oluşturun
3. Connection string'i kopyalayın

#### 2️⃣ Environment Variables

`.env` dosyası oluşturun:

```env
# Database (Neon DB)
DATABASE_URL="postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# Redis (opsiyonel - yerel veya cloud)
REDIS_URL="redis://localhost:6379"

# JWT Secrets (GÜÇ LÜ secretlar kullanın!)
JWT_ADMIN_SECRET="super-secret-admin-key-256-chars-min"
JWT_TEAM_SECRET="super-secret-team-key-256-chars-min"
JWT_EXP_ADMIN="15m"
JWT_EXP_TEAM="60m"

# Server
PORT=8080
NODE_ENV=development

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

#### 3️⃣ Kurulum Komutları

```bash
# Bağımlılıkları yükle
npm install

# Prisma client generate et
npm run prisma:generate

# Migration'ları uygula
npm run db:deploy

# İlk admin kullanıcısı ve demo quiz oluştur
npm run seed

# Uygulamayı başlat
npm run start:dev
```

#### 4️⃣ Redis Kurulumu

**A) Yerel Redis (Docker ile):**
```bash
docker compose up -d redis
```

**B) Cloud Redis (Upstash, Redis Cloud):**
```env
REDIS_URL="redis://username:password@host:port"
```

---

### Yöntem 2: Docker ile Tam Yerel Setup

```bash
# Tüm servisleri başlat (PostgreSQL + Redis)
docker compose up -d

# Bağımlılıkları yükle
npm install

# Prisma setup
npm run prisma:generate
npm run db:deploy

# Seed data
npm run seed

# Uygulamayı başlat
npm run start:dev
```

**Servisler:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- API: `localhost:8082`

---

## 📁 Proje Yapısı

```
hsdarena-backend/
├── prisma/
│   ├── schema.prisma        # Veritabanı şeması
│   ├── migrations/          # Migration dosyaları
│   └── seed.ts              # Seed data scripti
│
├── src/
│   ├── auth/                # 🔐 Kimlik doğrulama
│   │   ├── dto/             # Login, Register DTO'ları
│   │   ├── strategies/      # JWT stratejileri (Admin/Team)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/               # 👤 Kullanıcı ayarları
│   │   ├── dto/             # Email, Password update DTO'ları
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── quiz/                # 📝 Quiz yönetimi (Admin)
│   │   ├── dto/             # Quiz CRUD DTO'ları
│   │   ├── quiz.controller.ts
│   │   ├── quiz.service.ts
│   │   └── quiz.module.ts
│   │
│   ├── questions/           # ❓ Soru yönetimi (Admin)
│   │   ├── dto/             # Question CRUD DTO'ları
│   │   ├── questions.controller.ts
│   │   ├── questions.service.ts
│   │   └── questions.module.ts
│   │
│   ├── sessions/            # 🎮 Session ve cevap yönetimi
│   │   ├── dto/             # Session, Answer DTO'ları
│   │   ├── sessions.controller.ts  # Admin + Team endpoints
│   │   ├── sessions.service.ts
│   │   └── sessions.module.ts
│   │
│   ├── team/                # 👥 Takım katılımı
│   │   ├── dto/             # Join team DTO
│   │   ├── team.controller.ts
│   │   ├── team.service.ts
│   │   └── team.module.ts
│   │
│   ├── realtime/            # 🔌 WebSocket Gateway
│   │   ├── dto/             # WebSocket event DTO'ları
│   │   ├── guards/          # WS auth guards
│   │   ├── interceptors/    # WS logging
│   │   ├── types/           # WebSocket tipleri
│   │   ├── quiz.gateway.ts  # Ana WebSocket gateway
│   │   ├── websocket.service.ts
│   │   └── realtime.module.ts
│   │
│   ├── common/              # 🔧 Ortak bileşenler
│   │   ├── filters/         # Exception filters
│   │   ├── guards/          # Auth guards (Admin/Team JWT)
│   │   ├── interceptors/    # Global interceptors
│   │   └── pipes/           # Validation pipes
│   │
│   ├── infra/               # 🏗️ Altyapı servisleri
│   │   ├── prisma/          # Prisma module & service
│   │   ├── redis/           # Redis module & service
│   │   └── logger/          # Custom logger
│   │
│   ├── config/              # ⚙️ Yapılandırma
│   │   └── configuration.ts
│   │
│   ├── app.module.ts        # Ana modül
│   ├── app.controller.ts    # Health check endpoint
│   └── main.ts              # Uygulama başlangıcı
│
├── .env                     # Environment variables
├── .env.example             # Env template
├── docker-compose.yml       # Docker servisleri
├── Dockerfile               # Production image
├── package.json             # NPM dependencies
├── tsconfig.json            # TypeScript config
├── nest-cli.json            # NestJS config
├── API-Docs-v2.md           # Detaylı API dokümantasyonu
└── README.md                # Bu dosya
```

### 📂 Modül Açıklamaları

| Modül | Sorumluluk | Endpoint Prefix |
|-------|------------|-----------------|
| **auth** | Login, Register, Token yönetimi | `/api/auth/*` |
| **users** | Kullanıcı ayarları (email, password, delete) | `/api/users/*` |
| **quiz** | Quiz CRUD (sadece admin) | `/api/admin/quizzes/*` |
| **questions** | Soru CRUD (sadece admin) | `/api/admin/questions/*` |
| **sessions** | Session yönetimi & cevap gönderme | `/api/admin/sessions/*`, `/api/sessions/*` |
| **team** | Takım katılımı | `/api/teams/*` |
| **realtime** | WebSocket event'leri | `/realtime` namespace |

---

## 📖 API Dokümantasyonu

```
http://localhost:8082/docs
```

### API Endpoint'leri

#### 🔐 Authentication

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/register` | Yeni admin kullanıcısı kaydet | - |
| POST | `/api/auth/login` | Admin girişi | - |
| POST | `/api/auth/logout` | Çıkış yap | Admin |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgileri | Admin |

#### 👤 User Settings

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| PATCH | `/api/users/me/email` | Email güncelle | Admin |
| PATCH | `/api/users/me/password` | Şifre güncelle | Admin |
| DELETE | `/api/users/me` | Hesap sil | Admin |

#### 📝 Quizzes (Admin)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/admin/quizzes` | Yeni quiz oluştur | Admin |
| GET | `/api/admin/quizzes` | Tüm quizleri listele | Admin |
| GET | `/api/admin/quizzes/:id` | Quiz detayları | Admin |
| PUT | `/api/admin/quizzes/:id` | Quiz güncelle | Admin |
| DELETE | `/api/admin/quizzes/:id` | Quiz sil | Admin |

#### ❓ Questions (Admin)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/admin/quizzes/:quizId/questions` | Soru ekle | Admin |
| GET | `/api/admin/quizzes/:quizId/questions` | Soruları listele | Admin |
| PUT | `/api/admin/questions/:id` | Soru güncelle | Admin |
| DELETE | `/api/admin/questions/:id` | Soru sil | Admin |

#### 🎮 Sessions (Admin)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/admin/quizzes/:quizId/session` | Session oluştur | Admin |
| POST | `/api/admin/sessions/:code/start` | Session başlat (ACTIVE yap) | Admin |
| GET | `/api/admin/sessions/:code` | Session detayları | Admin |
| GET | `/api/admin/sessions/:code/scoreboard` | Scoreboard | Admin |

#### 🎯 Sessions (Team)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/sessions/:code/quiz` | Quiz bilgisi al | Public |
| GET | `/api/sessions/:code/question/current` | Aktif soru | Public |
| POST | `/api/sessions/:code/answer` | Cevap gönder | Team |

#### 👥 Teams

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/teams/join` | Session'a katıl | Public |

### Örnek API Kullanımı

#### 1. Admin Login
```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

#### 2. Quiz Oluştur
```bash
curl -X POST http://localhost:8082/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Genel Kültür Quiz",
    "settings": {},
    "questions": [
      {
        "index": 1,
        "text": "Türkiye'\''nin başkenti neresidir?",
        "type": "MCQ",
        "choices": [
          {"id": "A", "text": "Istanbul"},
          {"id": "B", "text": "Ankara"}
        ],
        "correctAnswer": "B",
        "timeLimitSec": 30,
        "points": 10
      }
    ]
  }'
```

#### 3. Takım Katılımı
```bash
curl -X POST http://localhost:8082/api/teams/join \
  -H "Content-Type: application/json" \
  -d '{
    "sessionCode": "ABC123",
    "teamName": "Red Dragons"
  }'
```

Detaylı API dokümantasyonu için: [API-Docs-v2.md](./API-Docs-v2.md)

---

## 🔌 WebSocket Events

### Connection
```
ws://localhost:8082/realtime
```

### Event Format: `domain:action`

#### Session Events (Server → Client)
- `session:started` - Session başladı
- `session:ended` - Session bitti

#### Question Events (Server → Client)
- `question:started` - Yeni soru başladı
- `question:time-warning` - Süre uyarısı (10 sn kala)
- `question:ended` - Soru süresi doldu

#### Answer Events (Server → Client)
- `answer:submitted` - Bir takım cevap gönderdi
- `answer:stats-updated` - Cevap istatistikleri güncellendi

#### Scoreboard Events (Server → Client)
- `scoreboard:updated` - Scoreboard güncellendi

#### Admin Control (Client → Server)
- `admin:next-question` - Sonraki soruya geç
- `admin:end-session` - Session'ı bitir

### Örnek WebSocket Kullanımı

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8082/realtime', {
  auth: {
    token: 'YOUR_TEAM_TOKEN'
  }
});

// Session'a katıl
socket.emit('join_session', {
  sessionCode: 'ABC123'
});

// Event dinle
socket.on('question:started', (data) => {
  console.log('Yeni soru:', data.question);
});

socket.on('scoreboard:updated', (data) => {
  console.log('Skor tablosu:', data.leaderboard);
});
```

---

## 🔧 Ortam Değişkenleri

### Gerekli Değişkenler

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `DATABASE_URL` | PostgreSQL bağlantı string'i | `postgresql://user:pass@host:5432/db` |
| `JWT_ADMIN_SECRET` | Admin JWT secret key | `super-secret-256-chars` |
| `JWT_TEAM_SECRET` | Team JWT secret key | `another-secret-256-chars` |

### Opsiyonel Değişkenler

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `PORT` | API port numarası | `8080` |
| `NODE_ENV` | Ortam (development/production) | `development` |
| `REDIS_URL` | Redis bağlantı string'i | `redis://localhost:6379` |
| `JWT_EXP_ADMIN` | Admin token süresi | `15m` |
| `JWT_EXP_TEAM` | Team token süresi | `60m` |
| `ALLOWED_ORIGINS` | CORS allowed origins (virgülle ayır) | `http://localhost:3000` |

### Production için Öneriler

```env
# GÜVENLİ secretlar kullanın!
JWT_ADMIN_SECRET="$(openssl rand -base64 64)"
JWT_TEAM_SECRET="$(openssl rand -base64 64)"

# SSL gerektir
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Production mode
NODE_ENV=production

# Rate limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

---

## 🗄️ Veritabanı

### Prisma Komutları

```bash
# Prisma client generate et
npm run prisma:generate

# Migration oluştur (schema değişikliği sonrası)
npm run db:migrate

# Migration'ları production'a deploy et
npx prisma migrate deploy

# Prisma Studio ile veritabanını görüntüle
npm run db:studio

# Seed data yükle
npm run seed
```

### Veritabanı Modelleri

- **User** - Admin kullanıcıları
- **Quiz** - Quiz tanımları
- **Question** - Sorular (MCQ/TF)
- **QuizSession** - Quiz oturumları
- **Team** - Takımlar
- **Answer** - Takım cevapları

### Migration'lar

Migration dosyaları: `prisma/migrations/`

```bash
# Yeni migration oluştur
npx prisma migrate dev --name description

# Migration geçmişini görüntüle
npx prisma migrate status

# Migration geri al (production'da kullanma!)
npx prisma migrate reset
```

---

## 🧪 Test Etme

### NPM Scripts

```bash
# Unit testler
npm run test

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch

# Linting
npm run lint

# Format
npm run format
```

### Swagger ile Manuel Test

1. Uygulamayı başlat: `npm run start:dev`
2. Swagger UI'a git: `http://localhost:8080/docs`
3. Sağ üstten "Authorize" tıkla
4. Admin token ile giriş yap
5. Endpoint'leri test et

### Test Senaryosu

```bash
# 1. Admin register
POST /api/auth/register

# 2. Admin login
POST /api/auth/login

# 3. Quiz oluştur
POST /api/admin/quizzes

# 4. Session başlat
POST /api/admin/quizzes/:quizId/session

# 5. Takım katılımı
POST /api/teams/join

# 6. Cevap gönder
POST /api/sessions/:code/answer
```

---

## � Troubleshooting

### Port Zaten Kullanımda

**Hata:**
```
Error: listen EADDRINUSE: address already in use :::8082
```

**Çözüm:**

**Windows:**
```bash
# Port'u kullanan process'i bul
netstat -ano | findstr :8082

# Process'i kapat (PID numarasını yukarıdan al)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Port'u kullanan process'i bul ve kapat
lsof -ti:8082 | xargs kill -9
```

**Veya farklı port kullan:**
```env
# .env dosyasında
PORT=8083
```

---

### Database Bağlantı Hatası

**Hata:**
```
Error: Can't reach database server at `host`
```

**Kontrol Listesi:**
1. ✅ `DATABASE_URL` doğru mu?
2. ✅ Neon DB'de database aktif mi?
3. ✅ SSL mode ekli mi? (`?sslmode=require`)
4. ✅ Firewall/VPN bağlantıyı engelliyor mu?

**Test:**
```bash
# Prisma ile bağlantıyı test et
npx prisma db pull
```

**Neon DB için:**
- Dashboard'da database "Active" mi kontrol et
- Connection string'i yeniden kopyala
- Pooling bağlantısı yerine Direct bağlantı kullan

---

### 401 Unauthorized Errors

**Sebep 1: Token Süresi Dolmuş**
- Admin token: 15 dakika
- Team token: 60 dakika

**Çözüm:** Yeniden login yap
```bash
POST /api/auth/login
```

**Sebep 2: Yanlış Authorization Tipi**

Swagger'da doğru token tipini kullan:
- Admin endpoints → **"admin-token"** (üstteki Authorize)
- Team endpoints → **"team-token"** (üstteki Authorize)

**Sebep 3: Token Format Hatası**

Doğru format:
```
Authorization: Bearer eyJhbGc...
```

---

### Prisma Migration Sorunları

**Development'da:**
```bash
# Yeni migration oluştur
npm run db:migrate

# Migration durumunu kontrol et
npx prisma migrate status
```

**Production'da:**
```bash
# Migration'ları deploy et
npx prisma migrate deploy
```

**Son Çare (DİKKAT: Veri kaybı!):**
```bash
# Tüm migration'ları sıfırla
npx prisma migrate reset

# Seed data'yı yeniden yükle
npm run seed
```

---

### CORS Errors

**Hata:**
```
Access to fetch at 'http://localhost:8082' blocked by CORS policy
```

**Çözüm:**

`.env` dosyasında frontend URL'ini ekle:
```env
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,https://your-frontend.com"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://your-frontend.com"
```

**Not:** Virgülle ayırarak birden fazla origin ekleyebilirsin.

---

### WebSocket Bağlantı Sorunları

**Hata:** `WebSocket connection to 'ws://localhost:8082' failed`

**Kontrol Listesi:**
1. ✅ Backend çalışıyor mu?
2. ✅ Port doğru mu? (`ws://localhost:8082/realtime`)
3. ✅ Token geçerli mi?
4. ✅ Namespace doğru mu? (`/realtime`)

**Debug:**
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

---

### Redux/Zustand State Sorunları

**Sorun:** Real-time güncellemeler state'e yansımıyor

**Çözüm:** WebSocket event'lerinde state güncelleme yap:
```javascript
socket.on('scoreboard:updated', (data) => {
  // Redux
  dispatch(updateLeaderboard(data.leaderboard));
  
  // Zustand
  useStore.setState({ leaderboard: data.leaderboard });
});
```

---

### npm install Hataları

**Hata:** `npm ERR! code ERESOLVE`

**Çözüm:**
```bash
# Legacy peer deps ile kur
npm install --legacy-peer-deps

# Veya package-lock.json'u sil
rm package-lock.json
rm -rf node_modules
npm install
```

---

**Hala Sorun mu Yaşıyorsun?**

1. Backend log'larını kontrol et: Terminalde hata mesajları
2. Swagger'da test et: `http://localhost:8082/docs`
3. `.env` dosyasını kontrol et: Tüm değerler set edilmiş mi?
4. GitHub Issues: Sorununu detaylı açıkla

---

## �🚀 Deployment

### Docker ile Production Build

```bash
# Image oluştur
docker build -t hsdarena-backend .

# Container'ı çalıştır
docker run -p 8082:8082 \
  -e DATABASE_URL="..." \
  -e JWT_ADMIN_SECRET="..." \
  -e JWT_TEAM_SECRET="..." \
  hsdarena-backend
```

### Production Checklist

- [ ] Environment variables güvenli şekilde ayarlandı
- [ ] Database SSL bağlantısı aktif
- [ ] JWT secretlar güçlü (min 256 karakter)
- [ ] CORS ayarları production domain'e göre set edildi
- [ ] Rate limiting aktif
- [ ] Logging yapılandırıldı
- [ ] Health check endpoint çalışıyor (`GET /`)
- [ ] Migration'lar deploy edildi
- [ ] Seed data yüklendi (ilk admin)
- [ ] Backup stratejisi hazır

### Deployment Platformları

**Neon DB** (Database):
- Ücretsiz tier: 3 GB storage
- Auto-scaling
- SSL by default

**Railway** (Backend):
```bash
# Railway CLI ile deploy
railway up
```

**Render** (Backend):
- Dockerfile ile otomatik deploy
- Free tier mevcut

**Vercel/Netlify** (Sadece frontend için uygun, backend için değil)

---

## 🤝 Katkıda Bulunma

### Geliştirme Akışı

1. Fork'layın
2. Feature branch oluşturun: `git checkout -b feature/amazing-feature`
3. Değişikliklerinizi commit edin: `git commit -m 'feat: Add amazing feature'`
4. Branch'i push edin: `git push origin feature/amazing-feature`
5. Pull Request oluşturun

### Commit Kuralları

```
feat: Yeni özellik
fix: Bug düzeltmesi
docs: Dokümantasyon değişikliği
style: Code formatting
refactor: Code refactoring
test: Test ekleme/düzeltme
chore: Build/config değişiklikleri
```

### Code Style

```bash
# Linting kontrol
npm run lint

# Auto-fix
npm run lint:fix

# Formatting
npm run format
```

---

## 📞 Destek

- **Dokümantasyon**: [API-Docs-v2.md](./API-Docs-v2.md)
- **Swagger UI**: `http://localhost:8080/docs`
- **Issues**: GitHub Issues

---

## 📄 Lisans

Bu proje özel bir lisans altındadır. Kullanım için izin gereklidir.

---

## 🙏 Teşekkürler

- [NestJS](https://nestjs.com/) - Framework
- [Prisma](https://www.prisma.io/) - ORM
- [Neon](https://neon.tech/) - Serverless Postgres

---

**Yaratıcı:** HSD Arena Development Team  
**Versiyon:** 2.0  
**Son Güncelleme:** Aralık 2025
