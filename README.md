# Migros Rota Uygulaması

Bu uygulama, Migros mağazaları için rota planlama ve filtreleme işlemlerini kolaylaştırmak amacıyla React Native (Expo) ile geliştirilmiştir.

## Özellikler

- **Mağaza Filtreleme:** Marka ve konuma göre mağaza arama.
- **Rota Planlama:** Belirlenen mağazalar arasında en kısa rotayı hesaplama (TSP algoritması).
- **Detaylı Görünüm:** Mağaza detaylarını ve çalışma saatlerini inceleme.
- **Konum Entegrasyonu:** Kullanıcının mevcut konumuna göre mesafe hesaplama.

## Teknolojiler

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Zustand](https://github.com/pmndrs/zustand) (State Management)
- [TypeScript](https://www.typescriptlang.org/)
- Haversine Formülü (Mesafe hesaplama için)

## Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/KULLANICI_ADINIZ/MigrosRotaApp.git
   ```
2. Gerekli bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Uygulamayı başlatın:
   ```bash
   npx expo start
   ```

## Veri Kaynağı

Uygulama, mağaza verilerini `Magaza_Listesi.csv` dosyasından okuyarak kullanır.
