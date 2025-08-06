# Resim İşleme Web Uygulaması

Bu web uygulaması, kullanıcıların resim yükleyip çeşitli görüntü işleme teknikleri uygulayabilmelerini sağlar.

## Özellikler

- **Modern ve Responsive Arayüz**: Kullanıcı dostu, modern tasarım
- **Drag & Drop Desteği**: Resimleri sürükleyip bırakarak yükleme
- **Çoklu İşlem Seçenekleri**:
  - **Zoom**: 1.2x, 1.5x, 2.0x oranlarında büyütme
  - **Döndürme**: 30°, 60°, 90°, 120°, 150°, 180°, 210°, 240°, 270°, 300°, 330°, 360° açılarında döndürme
  - **Ters Çevirme**: Yatay, dikey ve her iki yönde çevirme
  - **Bulanıklaştırma**: Farklı seviyelerde Gaussian blur
  - **Veri Artırma**: Gaussian blur ile veri artırma teknikleri
- **ZIP İndirme**: İşlenen tüm resimler ZIP dosyası olarak indirilebilir
- **Gerçek Zamanlı Durum Takibi**: İşlem durumu ve ilerleme çubuğu

## Kurulum

### Gereksinimler

- Python 3.7 veya üzeri
- pip (Python paket yöneticisi)

### Adımlar

1. **Projeyi klonlayın veya indirin**

2. **Gerekli paketleri yükleyin**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Uygulamayı çalıştırın**:
   ```bash
   python app.py
   ```

4. **Tarayıcınızda şu adresi açın**:
   ```
   http://localhost:5000
   ```

## Kullanım

1. **Resim Yükleme**:
   - "Dosya Seç" butonuna tıklayın veya resmi sürükleyip bırakın
   - Desteklenen formatlar: PNG, JPG, JPEG, GIF, BMP
   - Maksimum dosya boyutu: 16MB

2. **İşlem Seçenekleri**:
   - Yüklenen resim otomatik olarak önizlenir
   - Çıktı klasörü adını belirleyin (varsayılan: processed_images)
   - "İşlemi Başlat" butonuna tıklayın

3. **Sonuçları İndirme**:
   - İşlem tamamlandığında tüm işlenen resimler ZIP dosyası olarak indirilir
   - ZIP dosyası belirttiğiniz klasör adıyla adlandırılır

## Teknik Detaylar

### Backend (Flask)
- **app.py**: Ana Flask uygulaması
- **Endpoints**:
  - `GET /`: Ana sayfa
  - `POST /upload`: Dosya yükleme
  - `POST /process`: Resim işleme
  - `GET /download/<filename>`: Dosya indirme

### Frontend
- **HTML**: Modern, semantic markup
- **CSS**: Responsive tasarım, gradient'ler, animasyonlar
- **JavaScript**: Async/await, drag & drop, real-time updates

### İşlenen Resimler
Her yüklenen resim için şu işlemler uygulanır:

1. **Zoom İşlemleri** (3 resim):
   - 1.2x zoom
   - 1.5x zoom  
   - 2.0x zoom

2. **Döndürme İşlemleri** (12 resim):
   - 30°, 60°, 90°, 120°, 150°, 180°
   - 210°, 240°, 270°, 300°, 330°, 360°

3. **Ters Çevirme İşlemleri** (3 resim):
   - Yatay çevirme
   - Dikey çevirme
   - Her iki yönde çevirme

4. **Bulanıklaştırma İşlemleri** (3 resim):
   - Hafif bulanıklaştırma (5x5 kernel)
   - Orta bulanıklaştırma (15x15 kernel)
   - Güçlü bulanıklaştırma (25x25 kernel)

5. **Veri Artırma İşlemleri** (3 resim):
   - Sigma: 5
   - Sigma: 10
   - Sigma: 15

**Toplam: 24 işlenmiş resim**

## Klasör Yapısı

```
web-uygulama/
├── app.py                 # Ana Flask uygulaması
├── requirements.txt       # Python bağımlılıkları
├── README.md             # Bu dosya
├── static/               # Frontend dosyaları
│   ├── index.html        # Ana HTML sayfası
│   ├── style.css         # CSS stilleri
│   └── script.js         # JavaScript kodu
├── uploads/              # Yüklenen dosyalar (otomatik oluşturulur)
└── processed/            # İşlenen dosyalar (otomatik oluşturulur)
```

## Güvenlik

- Dosya türü kontrolü
- Dosya boyutu sınırlaması (16MB)
- Güvenli dosya adı oluşturma
- Input validation

## Performans

- Asenkron dosya işleme
- Progress bar ile kullanıcı geri bildirimi
- Optimize edilmiş görüntü işleme
- ZIP sıkıştırma ile hızlı indirme

## Sorun Giderme

### Yaygın Sorunlar

1. **"opencv-python yüklenemedi"**:
   ```bash
   pip install --upgrade pip
   pip install opencv-python
   ```

2. **"Port 5000 kullanımda"**:
   - `app.py` dosyasında port numarasını değiştirin
   - Veya mevcut uygulamayı durdurun

3. **"Dosya yükleme hatası"**:
   - Dosya boyutunu kontrol edin (max 16MB)
   - Dosya türünü kontrol edin
   - Uploads klasörünün yazma izni olduğundan emin olun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## İletişim

Sorularınız için issue açabilir veya pull request gönderebilirsiniz. 