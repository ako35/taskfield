# Taskfield

Mama satışı yapan saha ekipleri için ziyaret, rota, denetim ve sipariş yönetimi platformu.

## Uygulamalar

- `apps/admin-web`: React ve Vite tabanlı operasyon paneli
- `apps/field-mobile`: Expo ve React Native tabanlı saha uygulaması
- `apps/api`: NestJS tabanlı REST API
- `packages/domain`: Web, mobil ve API arasında paylaşılan domain tipleri

## Gereksinimler

- Node.js 22 veya üzeri
- Corepack
- Yerel veri servisleri için Docker Desktop

Bu makinede pnpm sistem PATH'inde olmadığı için komutlar `corepack pnpm` biçiminde kullanılmalıdır.

## Kurulum

```powershell
Copy-Item .env.example .env
corepack pnpm install
```

Docker Desktop kuruluysa yerel PostgreSQL/PostGIS, Redis ve MinIO servislerini başlatın:

```powershell
corepack pnpm infra:up
```

## Geliştirme

Her uygulamayı ayrı terminalde çalıştırın:

```powershell
corepack pnpm dev:web
corepack pnpm dev:api
corepack pnpm dev:mobile
```

Servis adresleri:

| Servis              | Adres                            |
| ------------------- | -------------------------------- |
| Yönetim paneli      | http://localhost:5173            |
| API sağlık kontrolü | http://localhost:3000/api/health |
| MinIO API           | http://localhost:9000            |
| MinIO konsolu       | http://localhost:9001            |

## Kontroller

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## İlk geliştirme sırası

1. Prisma şeması ve organizasyon izolasyonu
2. Kullanıcı girişi ve rol bazlı yetkilendirme
3. Müşteri, ürün ve fiyat listesi yönetimi
4. Rota ve GPS doğrulamalı ziyaret akışı
5. Offline form, fotoğraf ve sipariş senkronizasyonu
