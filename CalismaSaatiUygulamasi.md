# Çalışma Saati Takip Uygulaması

Bu uygulama; kullanıcıların günlük, haftalık ve aylık çalışma saatlerini
kolayca takip edebilmesi için tasarlanmış modern ve responsive bir zaman
takip sistemidir. Uygulama React, Context API ve Tailwind CSS
kullanılarak geliştirilmiştir.

## 🚀 Özellikler

### 📅 Ay Bazlı Otomatik Takvim

-   İçinde bulunulan ay otomatik olarak seçilir.
-   Ay değiştirildiğinde, o aya ait tüm günler otomatik listelenir.
-   Kullanıcı her gün için **giriş saati**, **çıkış saati** ve isteğe
    bağlı **öğle molası** süresini girebilir.

## ⏱️ Çalışma Süresi Hesaplama

-   Her gün için girilen saatlerden toplam çalışma süresi otomatik
    hesaplanır.
-   Haftalık ve aylık toplam çalışma süreleri anında güncellenir.
-   Hatalı veri girişine karşı kullanıcı uyarılır.

## ⚙️ Ayarlar Modülü

Uygulamada bir **ayarlar modalı** bulunur. Bu modülden:

-   Varsayılan **çalışma saati ücreti** belirlenebilir.
-   Varsayılan **tatil günleri** seçilebilir.
-   Haftanın her günü için varsayılan **giriş--çıkış saatleri**
    tanımlanabilir.
-   Tüm takvime uygulanan genel ayarlar, kullanıcı tarafından gün
    bazında değiştirilebilir.

## 💾 Veri Yönetimi

-   Kullanıcının girdiği tüm veriler uygulama context'inde tutulur.
-   UUID ile her güne benzersiz bir kayıt oluşturulur.
-   Veriler anlık olarak güncellenir ve kullanıcı arayüzüne yansıtılır.

## 🎨 Arayüz ve Deneyim

-   Tailwind CSS ile modern ve sade bir görünüm.
-   Koyu mod desteği.
-   Her gün için özel panel, haftalık özet barı, aylık toplam süre
    alanı.
-   Kullanıcı dostu, mobil uyumlu tasarım.

## 🧩 Kullanılan Teknolojiler

-   **React**
-   **Context API**
-   **useState, useEffect, useCallback, useMemo**
-   **Tailwind CSS**
-   **UUID**

## 📌 Gelecek Geliştirmeler (Opsiyonel)

-   PDF veya Excel olarak dışa aktarma.
-   Çoklu kullanıcı desteği.
-   Çalışma raporu grafiklerinin eklenmesi.
-   Sunucu tabanlı veri kaydı (Laravel API entegrasyonu).
