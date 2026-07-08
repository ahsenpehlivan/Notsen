# Notsen Ürün Yol Haritası ve Öncelik Planı

## 1. Ürün Vizyonu

Notsen, kullanıcının aklına gelenleri saniyeler içinde kaydetmesini, daha sonra kolayca bulmasını, işe dönüştürmesini ve zaman içinde planlamasını sağlayan bütünleşik bir üretkenlik uygulamasıdır.

Temel ürün akışı:

> **Yakalama → Düzenleme → Planlama**

- **Hızlı Notlar:** Aklındakini birkaç saniyede kaydet.
- **Kanban Panoları:** Notları, işleri ve projeleri düzenle.
- **Günüm / Ajanda:** Görevleri ve notları zamana yerleştir.
- **Profil ve İşbirliği:** Hesabı yönet, ekip arkadaşlarıyla çalış.

Önerilen ürün konumlandırması:

> **Notsen, aklındakileri saniyeler içinde kaydetmeni, gerektiğinde bulmanı ve işe dönüştürerek planlamanı sağlar.**

---

## 2. Ürün Kararı: Tek Uygulama

Hızlı Notlar, Kanban ve Ajanda ayrı uygulamalar olmayacaktır.

Bu üç bölüm aynı kullanıcı yolculuğunu tamamlar:

1. Kullanıcı hızlı bir not oluşturur.
2. Not gerektiğinde göreve dönüştürülür.
3. Görev bir panoda takip edilir.
4. Görev Günüm veya Ajanda ekranında tarihe yerleştirilir.

Önerilen mobil ana navigasyon:

- Hızlı Notlar
- Panolar
- Günüm
- Profil

Global hızlı oluşturma butonu:

- Not oluştur
- Görev oluştur
- Ajanda kaydı oluştur
- Fotoğraf ekle
- Bağlantı yapıştır

Hızlı Notlar, ürünün birinci öncelikli merkezi olacaktır.

---

## 3. Genel Öncelik Sırası

### P0 — Çalışmayan veya Eksik Temel İşlevler

Yeni özelliklere geçmeden önce mevcut ürünün ana fonksiyonları tamamlanmalı ve regresyonlar giderilmelidir.

1. Tasarım değişikliklerinden sonra bozulan Kanban sürükle-bırak sisteminin düzeltilmesi
2. Pano üyeleri ekranına kullanıcı davet etme
3. Üye rolünü değiştirme
4. Üyeyi panodan çıkarma
5. Profil ekranı
6. Çıkış yapma
7. Hesap silme akışı
8. Hızlı Notlar arama
9. Hızlı Notlar filtreleme

### P1 — Hızlı Notlar 2.0

1. Başlık ve içerik araması
2. Etiket filtresi
3. Tarih filtresi
4. Sabitlenen notlar
5. Arşivlenen notlar
6. Son eklenen / son düzenlenen sıralaması
7. Fotoğraf eki
8. Bağlantı eki
9. Video bağlantısı ve önizleme
10. Notu göreve dönüştürme
11. Hızlı oluşturma akışının iyileştirilmesi

### P2 — Günüm ve Dijital Ajanda

1. Günüm ekranı
2. Görevlere tarih ve saat ekleme
3. Kanban görevlerini Günüm ekranında gösterme
4. Günlük serbest yazı alanı
5. Zaman blokları
6. Haftalık ajanda
7. Aylık takvim
8. Hatırlatıcılar
9. Tekrarlayan görevler
10. Gün sonu değerlendirmesi

### P3 — Para Kazanma

Önerilen model:

> **Reklamsız kullanılabilir ücretsiz sürüm + Notsen Pro aboneliği**

Ana deneyimde tam ekran veya sürekli reklam kullanılmamalıdır.

Ücretsiz paket:

- Temel Hızlı Notlar
- Temel arama ve etiketler
- Sınırlı pano sayısı
- Temel Günüm ekranı
- Sınırlı dosya ve fotoğraf depolaması
- Sınırlı ortak çalışan

Notsen Pro:

- Sınırsız veya daha yüksek pano limiti
- Gelişmiş arama ve filtreler
- Daha fazla attachment depolaması
- Haftalık ve aylık ajanda
- Tekrarlayan görevler
- Hatırlatıcılar
- Gelişmiş temalar
- Dışa aktarma
- Daha uzun aktivite geçmişi
- Daha fazla ortak çalışan
- İleri düzey widget ve offline özellikleri

Gelir seçenekleri:

- Aylık Pro
- Yıllık Pro
- İlk kullanıcılar için sınırlı Kurucu Üyelik
- Sürekli sunucu maliyeti oluşturmayan özellikler için tek seferlik paket

Sınırsız bulut depolamalı ömür boyu plan önerilmez.

---

# 4. Faz 8A — Stabilizasyon, Profil ve İşbirliği Tamamlama

## 4.1 DND Regresyonunu Düzeltme

Tasarım sistemi değişikliklerinden sonra Kanban sürükle-bırak sistemi çalışmamaktadır.

Kontrol edilecek olası nedenler:

- `NotsenGlassCard` veya yeni container pointer event tüketiyor olabilir.
- `clickable`, `combinedClickable` ve `pointerInput` sırası değişmiş olabilir.
- TaskCard dışarıdan gelen modifier'ı root container'a uygulamıyor olabilir.
- Owner/Editor için `canDragAndDrop` yanlış hesaplanıyor olabilir.
- Overlay veya placeholder dokunmayı engelliyor olabilir.
- `pointerInput` key değerleri drag state'i sürekli yeniden başlatıyor olabilir.
- LazyRow veya LazyColumn scroll gesture'ı drag gesture'ını tüketiyor olabilir.
- DND koordinat sistemi tasarım değişiklikleriyle bozulmuş olabilir.

Kabul kriterleri:

- Owner ve Editor kartları uzun basarak sürükleyebilir.
- Viewer sürükleyemez.
- Aynı sütun içinde taşıma çalışır.
- Farklı sütuna taşıma çalışır.
- Boş sütuna bırakma çalışır.
- Otomatik yatay ve dikey scroll çalışır.
- RPC commit başarılıysa sıra korunur.
- RPC başarısızsa rollback ve refetch çalışır.
- Realtime event drag sırasında listeyi bozmaz.

## 4.2 Pano Üye Yönetimi

BoardMembersBottomSheet yalnızca görüntüleme ekranı olarak kalmamalıdır.

Owner için eklenecekler:

- Üye Davet Et butonu
- E-posta giriş alanı
- Editor / Viewer rol seçimi
- Davet sırasında loading
- Başarı ve kontrollü hata mesajı
- Üyenin rolünü değiştirme
- Üyeyi panodan çıkarma
- Owner satırında sabit Owner rozeti
- Owner'ın rolünün değiştirilememesi
- Owner'ın panodan çıkarılamaması

Backend:

- `invite_user_to_board`
- `update_board_member_role`
- `remove_board_member`

Bu RPC'ler:

- Yalnızca gerçek board owner tarafından çağrılmalı.
- `auth.uid()` ile yetki kontrolü yapmalı.
- `SECURITY DEFINER` ise güvenli `search_path` kullanmalı.
- `PUBLIC` ve `anon` execute izinleri kaldırılmalı.
- Yalnızca `authenticated` rolü çağırabilmeli.
- Activity log'u RPC transaction'ı içinde üretmeli.
- Android ayrıca ikinci log kaydı oluşturmamalı.

## 4.3 Profil Ekranı

Web profil ekranı kaynak kabul edilerek native Android karşılığı yapılacaktır.

Profil ekranında:

### Hesap Bilgileri

- Avatar veya baş harf
- Ad soyad
- E-posta
- Hesap oluşturma tarihi
- Web profilinde bulunan diğer kullanıcı alanları

### Tercihler

- Tema / görünüm
- Dil
- Bildirim tercihleri
- Haftanın başlangıç günü
- Saat formatı
- Varsayılan açılış ekranı

### Hesap İşlemleri

- Çıkış yap
- Şifre sıfırlama veya değiştirme
- Hesabı sil
- Gizlilik politikası
- Kullanım koşulları

Çıkış yapıldığında:

- Supabase session temizlenmeli.
- Realtime channel'lar kapatılmalı.
- Kullanıcıya ait geçici cache temizlenmeli.
- Auth/login ekranına dönülmeli.
- Başka hesapla giriş yapılabilmeli.

Hesap silme:

- Kullanıcı uygulama içinde hesap silme talebi başlatabilmeli.
- Güvenli RPC veya Edge Function kullanılmalı.
- Onay diyaloğu bulunmalı.
- Gerekirse tekrar kimlik doğrulama uygulanmalı.

---

# 5. Faz 8B — Hızlı Notlar 2.0

## 5.1 Arama

Arama şu alanları kapsamalıdır:

- Not başlığı
- Not içeriği
- Etiketler
- Eklenen bağlantı başlıkları

Davranış:

- Yazarken debounce ile arama
- Temizle butonu
- Sonuç sayısı
- Boş sonuç ekranı
- Son kullanılan arama veya filtrelerin korunması

Başlangıçta küçük veri için Supabase sorgusu veya istemci filtresi kullanılabilir. Veri büyüdüğünde PostgreSQL full-text search ve GIN index değerlendirilecektir.

## 5.2 Filtreleme ve Sıralama

Filtreler:

- Etiket
- Tarih aralığı
- Sabitlenenler
- Arşivlenenler
- Fotoğraflı notlar
- Bağlantılı notlar
- Video bağlantılı notlar
- Yalnızca metin

Sıralama:

- Son eklenen
- Son düzenlenen
- Eskiden yeniye
- Sabitlenenler önce

## 5.3 Attachment Sistemi

Desteklenecek ilk türler:

- Fotoğraf
- Web bağlantısı
- Video bağlantısı
- İleride dosya

Önerilen tablo:

```text
note_attachments
- id
- note_id
- type
- storage_path
- external_url
- mime_type
- file_name
- file_size
- metadata
- created_at
```

Kurallar:

- Fotoğraflar private Supabase Storage bucket'ında tutulmalı.
- Liste ekranında tam boy görsel yerine thumbnail kullanılmalı.
- Büyük görseller yüklenmeden önce sıkıştırılmalı.
- Video dosyası yükleme ilk sürümde yapılmamalı.
- YouTube ve benzeri video bağlantıları önizleme kartıyla gösterilmeli.
- Dosya boyutu ve kullanıcı kotası izlenmeli.

## 5.4 Notu Göreve Dönüştürme

Bir hızlı not:

- Mevcut panoda yeni göreve dönüştürülebilmeli.
- Hedef pano ve sütun seçilebilmeli.
- Orijinal not korunabilmeli.
- `converted_task_id` gibi bağlantı alanı kullanılmalı.
- Aynı notun yanlışlıkla birden çok kez dönüştürülmesi engellenmeli veya kullanıcıya bildirilmelidir.

---

# 6. Faz 8C — Günüm ve Dijital Ajanda

## 6.1 İlk Sürüm: Günüm

Günüm ekranı:

- Bugünün tarihi
- Bugüne planlanan görevler
- Zaman blokları
- Hızlı notlardan bugüne iliştirilen kayıtlar
- Günlük serbest yazı alanı
- Tamamlanan görevler
- Gün sonu değerlendirmesi

## 6.2 Veri Bütünlüğü

Ajanda bağımsız ve kopya bir görev sistemi olmamalıdır.

Kanban görevlerine eklenecek alanlar:

- due_date
- scheduled_start
- scheduled_end
- reminder_at
- recurrence_rule

Ajanda mevcut görevleri tarihe göre gösterir.

## 6.3 Sonraki Aşamalar

- Haftalık görünüm
- Aylık takvim
- Tekrarlayan görevler
- Yerel bildirimler
- Zaman bloklama
- Günlük şablonları
- Alışkanlık veya ruh hâli takibi
- Görevi takvim üzerinde taşıma

---

# 7. Faz 8D — Monetizasyon

## 7.1 Temel İlke

Notsen'in hız ve odak vaadini bozan sürekli reklamlar kullanılmamalıdır.

Önerilen model:

- Ücretsiz temel kullanım
- Aylık Notsen Pro
- Yıllık Notsen Pro

## 7.2 Teknik Gereksinimler

- Google Play Billing entegrasyonu
- Satın alma geri yükleme
- Server-side entitlement doğrulaması
- Pro durumunun Supabase profilinde güvenli tutulması
- Abonelik süresi ve iptal durumlarının senkronizasyonu
- Ücretsiz kota kontrolleri
- Storage maliyet takibi
- Paywall ve Pro karşılaştırma ekranı

## 7.3 Reklam Kararı

İlk sürümde reklam eklenmeyecektir.

Daha sonra reklam denenirse:

- Not oluşturma sırasında çıkmamalı.
- Task taşıma sırasında çıkmamalı.
- Uygulama açılışını kesmemeli.
- Tam ekran interstitial kullanılmamalı.
- En fazla pasif bir Pro tanıtım alanı veya isteğe bağlı ödüllü deney yapılmalıdır.

---

# 8. Geliştirme Kuralları

- Yeni özellik eklemeden önce mevcut regresyonlar giderilmeli.
- Çalışan ekranlar script ile sıfırdan yazılmamalı.
- Küçük ve kontrollü değişiklikler yapılmalı.
- Web ve Android aynı Supabase veri modelini paylaşmalı.
- UI yetkilendirmesi güvenlik sayılmamalı; RLS ve RPC asıl otoritedir.
- SQL migration'lar ayrı ve idempotent dosyalarda tutulmalı.
- SQL kullanıcı onayı olmadan production ortamında çalıştırılmamalı.
- Her faz sonunda:
  - Full Android build
  - Lint
  - Regresyon testi
  - Gerçek cihaz smoke testi
  yapılmalıdır.
- Tasarım sistemi korunmalı; ekranlarda rastgele hardcoded renk ve ölçü eklenmemeli.
- Ana kullanım hızlı kalmalı; gereksiz animasyon veya ekran adımı eklenmemeli.

---

# 9. Şimdi Başlanacak İş

İlk uygulanacak faz:

> **Faz 8A — DND Regresyonu, Pano Üye Yönetimi ve Profil Ekranı**

Bu faz tamamlanmadan Hızlı Notlar attachment sistemi veya Ajanda geliştirmesine başlanmayacaktır.
