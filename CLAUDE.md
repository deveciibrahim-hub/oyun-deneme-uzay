# CLAUDE.md — Dünya Savunması (oyun-deneme-uzay)

Yeni sohbette önce bunu oku. Kullanıcı: İbrahim — Türkçe, doğrudan, gerçekçi ol, heveslendirme.

## Teknoloji
- **Phaser 4.2.1 + TypeScript + Vite**, telefona **Capacitor 8** (Android önce, sonra iOS).
- Mantıksal çözünürlük **1080x1920 dikey**, `Scale.EXPAND` (uzun ekranlar boşluksuz dolar).
- Fizik: Arcade. Her şey **delta time** ile — 120 Hz telefonda hız değişmez.
- Görseller şimdilik **kodla üretilir** (`src/core/textures.ts`, Canvas 2D, neon tarz). Gerçek asset (Kenney CC0) gelince aynı anahtarlarla değiştirilir.
- Sesler WebAudio sentezi (`src/core/sfx.ts`). Reklam şimdilik sahte (`src/core/ads.ts`).

## Oyun yapısı
- **Ana bölüm = gezegen savunması** (`OrbitScene`): gemi gezegen etrafında 360° döner (yatay kaydırma, sağ = saat yönü), ateş otomatik. Dalgalar + son dalgada ana gemi (boss). Dalga aralarında 3 roguelite kart (`data/cards.ts`).
- **Ara bölüm = gezegenler arası yolculuk** (`TransitScene`): eski v1.4'ün dikey görünümü. Gemi altta, 4 can.
- Güneş sistemi: Dünya → Mars → Jüpiter → Satürn → Uranüs → Neptün (`data/planets.ts`). İleride galaksi.
- Kalıcı mağaza (`data/upgrades.ts`), kayıt localStorage (`core/save.ts`), TR/EN (`core/i18n.ts`).
- Eski tek dosyalık sürüm: `legacy/index-v1.4.html` (referans, silme).

## Denge (bot testiyle ölçüldü, 2026-10-27)
- Yükseltmesiz: Dünya + Mars geçilir, Jüpiter'den itibaren mağaza şart. Orta yükseltme: Neptün dahil geçilir.
- Geçiş: ilk yolculuklar yükseltmesiz geçilir; Neptün yolu yükseltme ister.
- Denge sayıları: `wavePlan()` ve `enemyStats()` (`data/planets.ts`).

## Çalıştırma
```
npm install
npm run dev        # tarayıcıda: http://localhost:5173  (telefon aynı ağdaysa IP:5173)
npm run build      # dist/
npx cap sync android && npx cap open android   # Android Studio ile
```
Test kısayolları: `?scene=Orbit&planet=2`, `?scene=Transit&planet=0`, `?scene=Shop`. Klavye: A/D veya ok tuşları, N = nükleer, ESC = duraklat.

## Teslim hattı (GitHub Actions)
- `android-apk.yml`: her push'ta APK → Releases "Test APK (son)" (tag `apk-son`).
- `web-pages.yml`: her push'ta GitHub Pages → telefondan tarayıcıda oyna.

## Kurallar
- Tahmin edip deneme — önce ölç (bot testi: oyun mantığını çizimsiz hızlandırılmış çalıştırır).
- Kod verirken tam dosya, üstünde yol. İngilizce terimin yanına Türkçesi.
- `appId` (com.deveciibrahim.dunyasavunmasi) Play'e ilk yüklemeden sonra değişmez — yayından önce kesinleştir.
