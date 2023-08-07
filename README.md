# Auto-Luac
Auto-luac sayesinde belirtilen klasör ve dosyalarınız ekstra bir şey yapmanız gerekmeden .luac haline getirilir ve düzenlendikçe yeniden derlenir.
## Kullanım
Dosyalar indirildikten sonra [baslat.bat](./baslat.bat) içindeki betik mümkünse [index.exe](./index.exe) dosyasını, aksi takdirde [Node.js](https://nodejs.org/en/download) aracılığıyla [index.js](./index.js) dosyasını çalıştırır. Kullanılmayacak olanı silmenizde sakınca yoktur ancak [index.js](./index.js) dosyası ayrıyeten [fetch.js](./fetch.js) dosyasını da gerektirir.
## Çalıştırmak
[baslat.bat](./baslat.bat) dosyasını açmanız çalıştırmak için yeterli olacaktır.

Her ne kadar derlenecek dosyanın üzerine yazılmayacak olsa da dosyalarınızın yedeğini almanız tavsiye edilir.

## Gelişmiş Ayarlar
Ayarlar dosyasına `luacKlasörsüz` metnini yeni bir satır olarak eklerseniz derlenen dosyalar luac klasörü oluşturulup içine yerleştirilmek yerine aynı konuma .luac uzantısıyla kaydedilir. Bu seçenek eklenmediğinde luac klasörünün içine o dosyanın normal konumuna kadarki klasörler oluşturulur ve dosya oraya yerleştirilir. Böylelikle `.luac` uzantılı dosyaları diğer dosyaların olduğu konuma kopyalamanız gerektiğinde klasördeki her şeyi olduğu gibi kopyaladığınızda tüm dosyalar olması gerektiği yerde olacaktır.

Ayarlar dosyasına `hataUyarı` metnini yeni bir satır olarak ekleyerek derleme hatası olduğunda sadece yazıyla değil [bildirim sesiyle](https://www.youtube.com/watch?v=-toF9dfdFxI) de anlayabilirsiniz.

Ayarlar dosyasına `logsuz` metnini yeni bir satır olarak ekleyerek derlenen ve yeniden derlenen dosyaların isminin gözükmesini engelleyebilirsiniz, hata mesajları yine gözükecektir.

Birden fazla değer belirtilebilen şeylerde (istisnalar ve seçilenler gibi) diğer değerleri `+` ile ayırabilirsiniz.

İstisnalar ve seçilenler için klasör belirttiğinizde tercihiniz o klasörün içindeki tüm konumlar için geçerli olur.