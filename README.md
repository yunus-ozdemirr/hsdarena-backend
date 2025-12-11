# HSD Arena API

NestJS + Prisma + PostgreSQL + Redis tabanlı gerçek-zamanlı quiz backend.

## Neon DB ile Kurulum ve Çalıştırma

### 1. Neon Database Kurulumu

1. **Neon hesabı oluşturun**: [neon.tech](https://neon.tech) adresinden ücretsiz hesap oluşturun
2. **Yeni proje oluşturun**: Dashboard'da "Create Project" butonuna tıklayın
3. **Database URL'ini alın**: Proje oluşturulduktan sonra Connection Details bölümünden PostgreSQL connection string'i kopyalayın
   - Format: `postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

### 2. Environment Variables Ayarlama

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# Database
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Redis (yerel veya cloud)
REDIS_URL="redis://localhost:6379"

# JWT Secrets (production'da güçlü secret'lar kullanın)
JWT_ADMIN_SECRET="your-super-secret-admin-key-here"
JWT_TEAM_SECRET="your-super-secret-team-key-here"

# JWT Expiration
JWT_EXP_ADMIN="15m"
JWT_EXP_TEAM="60m"

# Server
PORT=8080
NODE_ENV=development
```

### 3. Proje Kurulumu

```bash
# Bağımlılıkları yükle
npm install

# Prisma client'ı generate et
npm run prisma:generate

# Database migration'ları uygula (Neon DB'ye)
npm run db:deploy

# Seed data'yı yükle (admin kullanıcısı ve demo quiz)
npm run seed
```

### 4. Redis Kurulumu

**Seçenek A: Yerel Redis (Docker ile)**
```bash
# Sadece Redis'i başlat
docker compose up -d redis
```

**Seçenek B: Cloud Redis (Upstash, Redis Cloud, vs.)**
- `.env` dosyasındaki `REDIS_URL`'i cloud Redis connection string'i ile değiştirin
- Örnek: `redis://username:password@host:port`

### 5. Uygulamayı Başlatma

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start
```

### 6. Veritabanı Yönetimi

```bash
# Prisma Studio ile veritabanını görüntüle
npm run db:studio

# Yeni migration oluştur (schema değişiklikleri için)
npm run db:migrate

# Migration'ları production'a deploy et
npm run db:deploy
```

### 7. Neon DB Özel Notlar

- **Connection Pooling**: Neon otomatik connection pooling sağlar
- **SSL**: Neon bağlantıları SSL gerektirir (`sslmode=require`)
- **Cold Start**: İlk bağlantı 1-2 saniye sürebilir (serverless yapı)
- **Backup**: Neon otomatik backup sağlar
- **Scaling**: Kullanım artışında otomatik scale eder

### 8. Production Deployment

**Environment Variables (Production):**
```bash
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
REDIS_URL="redis://your-cloud-redis-url"
JWT_ADMIN_SECRET="super-secure-random-string-256-chars"
JWT_TEAM_SECRET="another-super-secure-random-string-256-chars"
NODE_ENV=production
```

**Deployment Checklist:**
- [ ] Neon DB production URL'i ayarlandı
- [ ] Cloud Redis servisi ayarlandı
- [ ] JWT secret'ları güçlü random string'lerle değiştirildi
- [ ] `npm run db:deploy` ile migration'lar uygulandı
- [ ] `npm run seed` ile admin kullanıcısı oluşturuldu
- [ ] SSL sertifikaları ayarlandı (production domain için)

---

## Hızlı Başlangıç (Yerel Docker ile)

**Not**: Neon DB kullanmak istiyorsanız yukarıdaki "Neon DB ile Kurulum" bölümünü takip edin.

```bash
# Servisleri başlat (Postgres 55432, Redis 6379)
docker compose up -d postgres redis

# Bağımlılıklar ve Prisma
npm i
npm run prisma:generate

# Şemayı veritabanına uygulama (manuel SQL uyguladıysanız atlayın)
# npm run db:migrate

# Seed (admin ve demo quiz oluşturur)
npm run seed

# API'yi yerelde başlat (http://localhost:8080)
npm run start:dev
```

Swagger UI: `http://localhost:8080/docs`

Authorize butonuna tıklayıp Bearer Token girerek korumalı uçları test edebilirsiniz.

---

## Swagger ile Test Rehberi (Örnek Body’lerle)

Aşağıdaki adımları Swagger UI üzerinden sırayla uygulayın.

### 1) Admin Girişi
- Yol: `POST /api/auth/login`
- Body (application/json):
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```
- Başarılı cevapta `access_token` döner. Swagger’da sağ üstten “Authorize” butonuna tıklayın ve aşağıdaki formatta girin:
```
Bearer YOUR_JWT_TOKEN
```

### 2) Quiz Oluştur (Admin)
- Yol: `POST /api/quiz/create`
- Authorization: Bearer (Admin JWT)
- Body (application/json) örneği:
```json
{
  "title": "My First Quiz",
  "settings": { "bonusMax": 50 },
  "questions": [
    {
      "index": 1,
      "text": "2+2?",
      "type": "MCQ",
      "choices": [
        { "id": "A", "text": "3" },
        { "id": "B", "text": "4" }
      ],
      "correctAnswer": { "id": "B" },
      "timeLimitSec": 20,
      "points": 100
    },
    {
      "index": 2,
      "text": "Dünya düzdür.",
      "type": "TF",
      "correctAnswer": { "value": false },
      "timeLimitSec": 15,
      "points": 100
    }
  ]
}
```
- Cevapta oluşturulan quiz’in `id` alanını not alın.

### 3) Quiz Oturumu Başlat (Admin)
- Yol: `POST /api/quiz/{quizId}/session`
- Authorization: Bearer (Admin JWT)
- Body: boş (`{}`) bırakabilirsiniz.
- Cevap: Oturum nesnesi ve benzersiz `sessionCode` içerir. Bu kod ile takımlar katılır.

### 4) Takım Katılımı (Team Token Alma)
- Yol: `POST /api/team/join`
- Authorization: Gerekli değil (public endpoint)
- Body (application/json):
```json
{
  "sessionCode": "ABC123",
  "teamName": "Red Dragons"
}
```
- Cevap: `{ "teamId": "...", "teamToken": "..." }`
- Not: Takım olarak cevap göndermek için `teamToken` Bearer olarak kullanılmalıdır (Swagger'da Authorize'a `team-token` schema'sını seçin ve sadece token'ı girin).

### 5) Cevap Gönder (Takım)
- Yol: `POST /api/answer`
- Authorization: Bearer (Team JWT) - `team-token` schema'sını kullanın
- Body (application/json) örnekleri:

MCQ soru için:
```json
{
  "sessionId": "<session-uuid>",
  "questionId": "<question-uuid>",
  "answerPayload": { "id": "B" },
  "nonce": "client-unique-123"
}
```

Doğru/Yanlış (TF) soru için:
```json
{
  "sessionId": "<session-uuid>",
  "questionId": "<question-uuid>",
  "answerPayload": { "value": true },
  "nonce": "client-unique-124"
}
```

> Not: `sessionId` ve `questionId` değerlerini admin tarafında oluşturulan quiz ve session cevabından alabilirsiniz. Demo için `seed` ile gelen quiz’i kullanıp önce yeni bir session başlatın.

---

## Sık Karşılaşılan Sorunlar
- 8080 portu kullanımda: Başka bir API süreci varsa durdurun veya `.env` içindeki `PORT`’u değiştirin, sonra `npm run start:dev`.
- Postgres bağlantısı: `.env` içindeki `DATABASE_URL` varsayılan olarak `localhost:55432` portunu kullanır. Docker dışı Postgres kullanıyorsanız URL’i güncelleyin.
- Redis: Varsayılan `redis://localhost:6379`. Gerekirse güncelleyin.

## Proje Yapısı (kısa)
- `src/auth/*`: Admin ve takım token üretimi, login.
- `src/quiz/*`: Quiz oluşturma ve session açma.
- `src/team/*`: **[ÖĞRENCİ GÖREVİ]** Session'a takım katılımı ve team token döndürme.
- `src/answer/*`: **[ÖĞRENCİ GÖREVİ]** Takım cevap endpoint'i.

---

## 🔄 Tam Test Senaryosu (Adım Adım)

### 1. Admin Girişi ve Quiz Oluşturma
```bash
# 1. Admin login
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
# Response: { "accessToken": "eyJhbGciOiJIUzI1NiIs..." }

# 2. Swagger'da Authorize
# - "Authorize" butonuna tıklayın
# - "admin-token" schema'sını seçin
# - Value: eyJhbGciOiJIUzI1NiIs... (Bearer yazmayın!)

# 3. Quiz oluştur
POST /api/quiz/create
{
  "title": "Test Quiz",
  "settings": { "bonusMax": 50 },
  "questions": [
    {
      "index": 1,
      "text": "2+2 kaçtır?",
      "type": "MCQ",
      "choices": [
        { "id": "A", "text": "3" },
        { "id": "B", "text": "4" }
      ],
      "correctAnswer": { "id": "B" },
      "timeLimitSec": 20,
      "points": 100
    }
  ]
}
# Response: { "id": "quiz-uuid-here", ... }
```

### 2. Quiz Oturumu Başlatma
```bash
# 4. Session başlat (quiz ID'sini yukarıdaki response'dan alın)
POST /api/quiz/{quizId}/session
Body: {} (boş JSON)

# Response: 
{
  "id": "session-uuid-here",
  "sessionCode": "ABC123",
  "quizId": "quiz-uuid-here",
  "status": "CREATED",
  ...
}
```

### 2.1. Soruları Alma (İki Yöntem)

**Yöntem A: Quiz ID ile (Admin)**
```bash
# Quiz'deki soruları al
GET /api/quiz/{quizId}/questions
Authorization: Bearer (Admin JWT)

# Response:
{
  "quizId": "quiz-uuid-here",
  "quizTitle": "Test Quiz",
  "questions": [
    {
      "id": "question-uuid-1",
      "index": 1,
      "text": "2+2 kaçtır?",
      "type": "MCQ",
      "choices": [
        { "id": "A", "text": "3" },
        { "id": "B", "text": "4" }
      ],
      "timeLimitSec": 20,
      "points": 100
    }
  ]
}
```

**Yöntem B: Session ID ile (Public)**
```bash
# Session'daki soruları al (public endpoint)
GET /api/quiz/session/{sessionId}/questions

# Response:
{
  "sessionId": "session-uuid-here",
  "sessionCode": "ABC123",
  "quizId": "quiz-uuid-here",
  "quizTitle": "Test Quiz",
  "questions": [
    {
      "id": "question-uuid-1",
      "index": 1,
      "text": "2+2 kaçtır?",
      "type": "MCQ",
      "choices": [
        { "id": "A", "text": "3" },
        { "id": "B", "text": "4" }
      ],
      "timeLimitSec": 20,
      "points": 100
    }
  ]
}
```

### 3. Takım Katılımı (Team Token Alma) - ÖĞRENCİ GÖREVİ
```bash
# Bu endpoint öğrenci tarafından yazılacak
# POST /api/team/join
# Görev detayları aşağıda
```

### 4. Takım Cevap Gönderme - ÖĞRENCİ GÖREVİ
```bash
# Bu endpoint öğrenci tarafından yazılacak
# POST /api/answer
# Görev detayları aşağıda
```

### 5. cURL Test Komutları
```bash
# Admin login
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Quiz oluştur (ADMIN_TOKEN'ı yukarıdaki response'dan alın)
curl -X POST http://localhost:8082/api/quiz/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"title":"Test Quiz","settings":{"bonusMax":50},"questions":[{"index":1,"text":"2+2?","type":"MCQ","choices":[{"id":"A","text":"3"},{"id":"B","text":"4"}],"correctAnswer":{"id":"B"},"timeLimitSec":20,"points":100}]}'

# Session başlat (QUIZ_ID'yi yukarıdaki response'dan alın)
curl -X POST http://localhost:8082/api/quiz/QUIZ_ID/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{}'

# Soruları al (SESSION_ID'yi yukarıdaki response'dan alın)
curl -X GET http://localhost:8082/api/quiz/session/SESSION_ID/questions

# Takım katılımı (ÖĞRENCİ GÖREVİ - SESSION_CODE'u yukarıdaki response'dan alın)
# curl -X POST http://localhost:8082/api/team/join \
#   -H "Content-Type: application/json" \
#   -d '{"sessionCode":"SESSION_CODE","teamName":"Red Dragons"}'

# Cevap gönder (ÖĞRENCİ GÖREVİ - TEAM_TOKEN'ı yukarıdaki response'dan alın)
# curl -X POST http://localhost:8082/api/answer \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer TEAM_TOKEN" \
#   -d '{"sessionId":"SESSION_ID","questionId":"QUESTION_ID","answerPayload":{"id":"B"},"nonce":"client-123"}'
```

### 6. Swagger UI Test Rehberi
1. **Swagger UI**: `http://localhost:8082/docs`
2. **Admin işlemleri**: `admin-token` schema'sını kullanın
3. **Authorization**: Sadece token'ı girin, "Bearer " yazmayın
4. **Session Code**: 6 karakterli büyük harf ve rakam kombinasyonu (örn: ABC123)

---

## 🎓 ÖĞRENCİ GÖREVLERİ

Bu proje 2 öğrenciye ayrı görevler verilecektir:

### 📋 Görev 1: Team Endpoint'leri
- **Görevli**: [Öğrenci 1]
- **Dosya**: `OGRENCI-GOREVLERI.md` - Görev 1 bölümü
- **Yapılacak**: `POST /api/team/join` endpoint'i
- **Özellikler**: Session code ile team oluşturma, team token döndürme

### 📋 Görev 2: Answer Endpoint'leri  
- **Görevli**: [Öğrenci 2]
- **Dosya**: `OGRENCI-GOREVLERI.md` - Görev 2 bölümü
- **Yapılacak**: `POST /api/answer` endpoint'i
- **Özellikler**: Cevap doğrulama, puan hesaplama, duplicate kontrolü

### 🚀 Başlamadan Önce
1. **Swagger UI'ya erişin**: `http://localhost:8082/docs`
2. **Admin login yapın**: `admin@example.com` / `Admin123!`
3. **Mevcut endpoint'leri test edin**: Quiz oluşturma, session başlatma
4. **Görev dosyasını okuyun**: `OGRENCI-GOREVLERI.md`

### ✅ Teslim Kriterleri
- [ ] Kod GitHub'a push edildi
- [ ] Swagger UI'da test edildi
- [ ] README.md'ye test sonuçları eklendi
- [ ] Hangi endpoint'ler yazıldığı belirtildi


Öğrenci Katkıları
Görev 2 – Answer Endpoint’leri

Sorumlu: [Yunus Ozdemir]

POST /api/answer endpoint’i geliştirildi.

Cevap doğrulama, puan hesaplama ve duplicate gönderim kontrolü eklendi.

Dinamik puanlama sistemi uygulandı (soru tipi, zorluk seviyesi ve cevap süresine göre).

AnswerService içerisinde doğrulama, puanlama ve kayıt işlemleri tamamlandı.

TeamJwtGuard kullanılarak takım kimlik doğrulaması entegre edildi.

Swagger UI üzerinden testler gerçekleştirildi ve tüm testler 200 OK sonucu verdi.

Test amacıyla basit Team endpoint’leri oluşturularak işlevsel doğrulama sağlandı.

Sonuç:
Tüm gereksinimler başarıyla yerine getirildi. Kod, mevcut Prisma ve Redis altyapısı ile tam uyumludur.

---

**Görev 3 – Current Question Endpoint**

**Sorumlu:** [Yunus Ozdemir]

**Tarih:** 11 Aralık 2025

**Yapılan İşlemler:**

- `GET /api/quiz/session/:sessionCode/current-question` endpoint'i eklendi.

- Bu endpoint sadece aktif soruyu döndürerek, takımların tarayıcı geliştirici araçlarında (F12) tüm soruları görmesini engeller.

- `QuizService.getCurrentQuestion()` metodu oluşturuldu:
  - Session'ın `currentQuestionIndex` değerine göre sadece mevcut soruyu getirir
  - Toplam soru sayısı bilgisini de döndürür
  - Aktif soru yoksa `404 Not Found` hatası verir

- Swagger UI dokümantasyonu tam olarak eklendi (örnek request/response ile).

- Public endpoint olarak tasarlandı (team token gerektirmez).

**Amaç:**  
Team tarafında quiz güvenliğini artırmak. Önceden `/session/:code/questions` endpoint'i tüm soruları döndürüyordu, bu da güvenlik açığı oluşturuyordu.

**Sonuç:**  
Frontend ekibi artık sadece mevcut aktif soruyu çekebilir, quiz bütünlüğü korunur.
