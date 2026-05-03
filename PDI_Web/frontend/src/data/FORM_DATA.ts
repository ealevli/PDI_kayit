export type ItemType = 'check' | 'measurement' | 'info';
export type ColumnSet = 'tam_ariz_gider' | 'yapildi';

export interface FormItem {
    no: string;
    label: string;
    type?: ItemType;
    unit?: string;
    measureNote?: string;
}

export interface FormSubSection {
    no: string;
    title: string;
    columns?: ColumnSet;
    items: FormItem[];
}

export type AltGrup = 'Mekanik' | 'Elektrik' | 'Boya' | 'Süsleme';

export interface FormSection {
    no: string;
    title: string;
    altGrup: AltGrup;
    subSections: FormSubSection[];
}

export interface VehicleFormData {
    aracTipi: string;
    sections: FormSection[];
}

// ─── TOURISMO 16 ─────────────────────────────────────────────────────────────
const tourismo: VehicleFormData = {
    aracTipi: 'Tourismo 16',
    sections: [
        {
            no: '1', title: 'GENEL KONTROLLER', altGrup: 'Boya',
            subSections: [
                {
                    no: '1.1', title: 'Belge Kontrolleri',
                    items: [
                        { no: '1.1.1', label: 'Araç teslim evrakları (fatura, ruhsat vb.)' },
                        { no: '1.1.2', label: 'Kullanım kılavuzu ve servis kitabı' },
                        { no: '1.1.3', label: 'Garanti belgesi' },
                        { no: '1.1.4', label: 'Radyo kodu kartı' },
                    ]
                },
                {
                    no: '1.2', title: 'Dış Görünüm',
                    items: [
                        { no: '1.2.1', label: 'Boya hasarı / çizik kontrolü' },
                        { no: '1.2.2', label: 'Plaka taşıyıcı ve plaka' },
                        { no: '1.2.3', label: 'Dış aydınlatma lambaları (far, stop, sinyal, gündüz farı)' },
                        { no: '1.2.4', label: 'Ön tampon ve ızgara' },
                        { no: '1.2.5', label: 'Arka tampon' },
                        { no: '1.2.6', label: 'Yan paneller ve kaportalar' },
                        { no: '1.2.7', label: 'Bagaj kapıları ve menteşeleri' },
                        { no: '1.2.8', label: 'Servis kapakları ve kilitleri' },
                        { no: '1.2.9', label: 'Ön cam ve silecekler' },
                        { no: '1.2.10', label: 'Yan camlar ve contaları' },
                        { no: '1.2.11', label: 'Ayna ve ısıtma sistemi' },
                    ]
                },
                {
                    no: '1.3', title: 'Lastik ve Jant',
                    items: [
                        { no: '1.3.1', label: 'Ön lastik basınçları ve diş derinliği' },
                        { no: '1.3.2', label: 'Arka lastik basınçları ve diş derinliği' },
                        { no: '1.3.3', label: 'Stepne lastik durumu' },
                        { no: '1.3.4', label: 'Jant hasarı kontrolü' },
                        { no: '1.3.5', label: 'Teker somunları tork kontrolü' },
                    ]
                },
            ]
        },
        {
            no: '3', title: 'MOTOR VE AKTARMA ORGANLARI', altGrup: 'Mekanik',
            subSections: [
                {
                    no: '3.1', title: 'Motor Bölmesi',
                    items: [
                        { no: '3.1.1', label: 'Motor yağı seviyesi ve sızdırmazlığı' },
                        { no: '3.1.2', label: 'Soğutma suyu seviyesi ve antifriz oranı' },
                        { no: '3.1.3', label: 'Fren hidrolik yağı seviyesi' },
                        { no: '3.1.4', label: 'Direksiyon hidrolik yağı seviyesi' },
                        { no: '3.1.5', label: 'Cam suyu seviyesi ve bağlantıları' },
                        { no: '3.1.6', label: 'Akü bağlantıları ve elektrolit seviyesi' },
                        { no: '3.1.7', label: 'Akü üretim tarihi', type: 'info' },
                        { no: '3.1.8', label: 'Hava filtresi durumu' },
                        { no: '3.1.9', label: 'Kayış gerilimi - Alternatör 2', type: 'measurement', unit: 'Hz', measureNote: '>110 Hz' },
                        { no: '3.1.10', label: 'Kayış gerilimi - Alternatör 3', type: 'measurement', unit: 'Hz', measureNote: '>124 Hz' },
                        { no: '3.1.11', label: 'Kayış gerilimi - Fan tahrik', type: 'measurement', unit: 'Hz', measureNote: '>41 Hz' },
                        { no: '3.1.12', label: 'V kayış durumu ve gerilimi' },
                        { no: '3.1.13', label: 'Motor bordo altı sızdırmazlık' },
                        { no: '3.1.14', label: 'Yakıt sistemi sızdırmazlığı' },
                    ]
                },
                {
                    no: '3.2', title: 'Şanzıman ve Aktarma',
                    items: [
                        { no: '3.2.1', label: 'Şanzıman yağı seviyesi ve sızdırmazlığı' },
                        { no: '3.2.2', label: 'Kardanlar ve mafsallar' },
                        { no: '3.2.3', label: 'Diferansiyel yağ seviyesi' },
                        { no: '3.2.4', label: 'Şanzıman çalışması (N, D, R testi)' },
                    ]
                },
                {
                    no: '3.3', title: 'Yavaşlatma Sistemi (Retarder)',
                    items: [
                        { no: '3.3.1', label: 'Yavaşlatıcı yağ seviyesi' },
                        { no: '3.3.2', label: 'Yavaşlatıcı çalışma testi' },
                        { no: '3.3.3', label: 'Ekzoz freni çalışma testi' },
                    ]
                },
            ]
        },
        {
            no: '4', title: 'FREN SİSTEMİ VE SÜSPANSIYON', altGrup: 'Mekanik',
            subSections: [
                {
                    no: '4.1', title: 'Hava Freni',
                    items: [
                        { no: '4.1.1', label: 'Hava tankı dolum süresi ve basıncı' },
                        { no: '4.1.2', label: 'Park freni çalışması ve göstergesi' },
                        { no: '4.1.3', label: 'Servis fren pedal oyunu ve etkinliği' },
                        { no: '4.1.4', label: 'ABS/ASR kontrolü' },
                        { no: '4.1.5', label: 'EBS ve fren elektroniği hata kodu' },
                        { no: '4.1.6', label: 'Hava kaçağı testi (basınç düşüşü <0.2 bar/dk)' },
                    ]
                },
                {
                    no: '4.2', title: 'Süspansiyon',
                    items: [
                        { no: '4.2.1', label: 'Hava körüğü basınç kontrolü' },
                        { no: '4.2.2', label: 'Hava körüğü sızdırmazlığı' },
                        { no: '4.2.3', label: 'Süspansiyon yüksekliği ayarı' },
                        { no: '4.2.4', label: 'Amortisör bağlantıları' },
                        { no: '4.2.5', label: 'Ön aks ayarı (rot balans)' },
                    ]
                },
            ]
        },
        {
            no: '8', title: 'İÇ DONANIM VE ELEKTRİK', altGrup: 'Elektrik',
            subSections: [
                {
                    no: '8.1', title: 'Sürücü Bölmesi',
                    items: [
                        { no: '8.1.1', label: 'Gösterge paneli ve ikaz lambaları' },
                        { no: '8.1.2', label: 'Direksiyon ayarı (yatay/dikey)' },
                        { no: '8.1.3', label: 'Dikiz aynaları ve ısıtma' },
                        { no: '8.1.4', label: 'Kapı açma/kapama mekanizmaları' },
                        { no: '8.1.5', label: 'Sürücü koltuğu ayarı ve kemer' },
                        { no: '8.1.6', label: 'Klima ve ısıtma kontrolleri (sürücü)' },
                        { no: '8.1.7', label: 'Radyo/multimedya sistemi' },
                        { no: '8.1.8', label: 'Dahili aydınlatma (sürücü bölgesi)' },
                        { no: '8.1.9', label: 'Korna çalışması' },
                        { no: '8.1.10', label: 'Silecek / cam suyu sistemi' },
                    ]
                },
                {
                    no: '8.2', title: 'Yolcu Bölmesi',
                    items: [
                        { no: '8.2.1', label: 'Yolcu koltukları (kemer, ayar, tepsi)' },
                        { no: '8.2.2', label: 'Bagaj bölmeleri üst ve kapılar' },
                        { no: '8.2.3', label: 'Okuma lambaları ve havalandırma nozulları' },
                        { no: '8.2.4', label: 'Yolcu klima/ısıtma sistemi' },
                        { no: '8.2.5', label: 'Perdeler ve mekanizması' },
                        { no: '8.2.6', label: 'Müzik/video sistemi (yolcu)' },
                        { no: '8.2.7', label: 'USB/220V priz çalışmaları' },
                        { no: '8.2.8', label: 'Bilet/kart okuyucu sistemi' },
                        { no: '8.2.9', label: 'Buzdolabı / mutfak ünitesi' },
                        { no: '8.2.10', label: 'Tuvalet bölmesi ve su sistemi' },
                    ]
                },
                {
                    no: '8.3', title: 'Kapılar ve Güvenlik',
                    items: [
                        { no: '8.3.1', label: 'Ön kapı açılış/kapanış ve sensörler' },
                        { no: '8.3.2', label: 'Orta kapı açılış/kapanış ve sensörler' },
                        { no: '8.3.3', label: 'Acil çıkış kapıları ve ikaz' },
                        { no: '8.3.4', label: 'Yangın tüpü kontrolü' },
                        { no: '8.3.5', label: 'Yangın tüpü gelecek kontrol tarihi', type: 'info' },
                        { no: '8.3.6', label: 'İlk yardım kiti' },
                        { no: '8.3.7', label: 'Takoz ve reflektif üçgen' },
                    ]
                },
                {
                    no: '8.4', title: 'Son İşlemler', columns: 'yapildi',
                    items: [
                        { no: '8.4.1', label: 'Araç içi temizlik (koltuk, döşeme, cam)' },
                        { no: '8.4.2', label: 'Motor bölmesi temizliği' },
                        { no: '8.4.3', label: 'Dış yıkama' },
                        { no: '8.4.4', label: 'Yakıt ikmali yapıldı' },
                        { no: '8.4.5', label: 'Araç test sürüşü yapıldı' },
                        { no: '8.4.6', label: 'Teşhis cihazı bağlandı, hata kodu yok' },
                        { no: '8.4.7', label: 'Servis uyarı mesajları sıfırlandı' },
                        { no: '8.4.8', label: 'PDI kontrol formu dolduruldu' },
                    ]
                },
            ]
        },
    ]
};

// ─── TRAVEGO SHD ─────────────────────────────────────────────────────────────
const travego: VehicleFormData = {
    aracTipi: 'Travego SHD',
    sections: [
        {
            no: '1', title: 'GENEL KONTROLLER',
            subSections: [
                {
                    no: '1.1', title: 'Belge Kontrolleri',
                    items: [
                        { no: '1.1.1', label: 'Araç teslim evrakları (fatura, ruhsat vb.)' },
                        { no: '1.1.2', label: 'Kullanım kılavuzu ve servis kitabı' },
                        { no: '1.1.3', label: 'Garanti belgesi' },
                        { no: '1.1.4', label: 'Radyo kodu kartı' },
                    ]
                },
                {
                    no: '1.2', title: 'Dış Görünüm',
                    items: [
                        { no: '1.2.1', label: 'Boya hasarı / çizik kontrolü' },
                        { no: '1.2.2', label: 'Plaka taşıyıcı ve plaka' },
                        { no: '1.2.3', label: 'Dış aydınlatma lambaları (far, stop, sinyal, gündüz farı)' },
                        { no: '1.2.4', label: 'Ön tampon ve ızgara' },
                        { no: '1.2.5', label: 'Arka tampon' },
                        { no: '1.2.6', label: 'Yan paneller ve kaportalar' },
                        { no: '1.2.7', label: 'Bagaj kapıları ve menteşeleri' },
                        { no: '1.2.8', label: 'Servis kapakları ve kilitleri' },
                        { no: '1.2.9', label: 'Ön cam ve silecekler' },
                        { no: '1.2.10', label: 'Yan camlar ve contaları' },
                        { no: '1.2.11', label: 'Ayna ve ısıtma sistemi' },
                        { no: '1.2.12', label: 'Üst bagaj kapıları (SHD özel)' },
                    ]
                },
                {
                    no: '1.3', title: 'Lastik ve Jant',
                    items: [
                        { no: '1.3.1', label: 'Ön lastik basınçları ve diş derinliği' },
                        { no: '1.3.2', label: 'Arka lastik basınçları ve diş derinliği' },
                        { no: '1.3.3', label: 'Stepne lastik durumu' },
                        { no: '1.3.4', label: 'Jant hasarı kontrolü' },
                        { no: '1.3.5', label: 'Teker somunları tork kontrolü' },
                    ]
                },
            ]
        },
        {
            no: '2', title: 'ÜST KAT KONTROLLERI (SHD)', altGrup: 'Süsleme',
            subSections: [
                {
                    no: '2.1', title: 'Üst Kat Yolcu Bölmesi',
                    items: [
                        { no: '2.1.1', label: 'Üst kat yolcu koltukları' },
                        { no: '2.1.2', label: 'Üst kat aydınlatma' },
                        { no: '2.1.3', label: 'Üst kat klima çıkışları' },
                        { no: '2.1.4', label: 'Üst kat acil çıkış (tavan kaçış kapağı)' },
                        { no: '2.1.5', label: 'Üst kat perdeler' },
                        { no: '2.1.6', label: 'Üst kat USB/priz çalışmaları' },
                        { no: '2.1.7', label: 'Merdiven ve korkuluklar' },
                    ]
                },
                {
                    no: '2.2', title: 'Alt Kat Salon',
                    items: [
                        { no: '2.2.1', label: 'Alt kat koltukları ve kemerleri' },
                        { no: '2.2.2', label: 'Alt kat bagaj bölmeleri' },
                        { no: '2.2.3', label: 'Alt kat aydınlatma' },
                        { no: '2.2.4', label: 'Alt kat klima/ısıtma' },
                        { no: '2.2.5', label: 'Tuvalet bölmesi ve su sistemi' },
                        { no: '2.2.6', label: 'Galley / mutfak ünitesi' },
                    ]
                },
            ]
        },
        {
            no: '3', title: 'MOTOR VE AKTARMA ORGANLARI', altGrup: 'Mekanik',
            subSections: [
                {
                    no: '3.1', title: 'Motor Bölmesi',
                    items: [
                        { no: '3.1.1', label: 'Motor yağı seviyesi ve sızdırmazlığı' },
                        { no: '3.1.2', label: 'Soğutma suyu seviyesi ve antifriz oranı' },
                        { no: '3.1.3', label: 'Fren hidrolik yağı seviyesi' },
                        { no: '3.1.4', label: 'Direksiyon hidrolik yağı seviyesi' },
                        { no: '3.1.5', label: 'Cam suyu seviyesi ve bağlantıları' },
                        { no: '3.1.6', label: 'Akü bağlantıları ve elektrolit seviyesi' },
                        { no: '3.1.7', label: 'Akü üretim tarihi', type: 'info' },
                        { no: '3.1.8', label: 'Hava filtresi durumu' },
                        { no: '3.1.9', label: 'Kayış gerilimi - Alternatör 2', type: 'measurement', unit: 'Hz', measureNote: '>110 Hz' },
                        { no: '3.1.10', label: 'Kayış gerilimi - Alternatör 3', type: 'measurement', unit: 'Hz', measureNote: '>124 Hz' },
                        { no: '3.1.11', label: 'Kayış gerilimi - Fan tahrik', type: 'measurement', unit: 'Hz', measureNote: '>41 Hz' },
                        { no: '3.1.12', label: 'V kayış durumu ve gerilimi' },
                        { no: '3.1.13', label: 'Motor bordo altı sızdırmazlık' },
                        { no: '3.1.14', label: 'Yakıt sistemi sızdırmazlığı' },
                    ]
                },
                {
                    no: '3.2', title: 'Şanzıman ve Aktarma',
                    items: [
                        { no: '3.2.1', label: 'Şanzıman yağı seviyesi ve sızdırmazlığı' },
                        { no: '3.2.2', label: 'Kardanlar ve mafsallar' },
                        { no: '3.2.3', label: 'Diferansiyel yağ seviyesi' },
                        { no: '3.2.4', label: 'Şanzıman çalışması (N, D, R testi)' },
                    ]
                },
                {
                    no: '3.3', title: 'Yavaşlatma Sistemi',
                    items: [
                        { no: '3.3.1', label: 'Yavaşlatıcı yağ seviyesi' },
                        { no: '3.3.2', label: 'Yavaşlatıcı çalışma testi' },
                        { no: '3.3.3', label: 'Ekzoz freni çalışma testi' },
                    ]
                },
            ]
        },
        {
            no: '4', title: 'FREN SİSTEMİ VE SÜSPANSIYON', altGrup: 'Mekanik',
            subSections: [
                {
                    no: '4.1', title: 'Hava Freni',
                    items: [
                        { no: '4.1.1', label: 'Hava tankı dolum süresi ve basıncı' },
                        { no: '4.1.2', label: 'Park freni çalışması ve göstergesi' },
                        { no: '4.1.3', label: 'Servis fren pedal oyunu ve etkinliği' },
                        { no: '4.1.4', label: 'ABS/ASR kontrolü' },
                        { no: '4.1.5', label: 'EBS ve fren elektroniği hata kodu' },
                        { no: '4.1.6', label: 'Hava kaçağı testi' },
                    ]
                },
                {
                    no: '4.2', title: 'Süspansiyon',
                    items: [
                        { no: '4.2.1', label: 'Hava körüğü basınç kontrolü' },
                        { no: '4.2.2', label: 'Hava körüğü sızdırmazlığı' },
                        { no: '4.2.3', label: 'Süspansiyon yüksekliği ayarı' },
                        { no: '4.2.4', label: 'Amortisör bağlantıları' },
                        { no: '4.2.5', label: 'Ön aks ayarı (rot balans)' },
                    ]
                },
            ]
        },
    ]
};

// ─── CONECTO SOLO / G ────────────────────────────────────────────────────────
const conecto: VehicleFormData = {
    aracTipi: 'Conecto',
    sections: [
        {
            no: '1', title: 'GENEL KONTROLLER',
            subSections: [
                {
                    no: '1.1', title: 'Belge Kontrolleri',
                    items: [
                        { no: '1.1.1', label: 'Araç teslim evrakları (fatura, ruhsat vb.)' },
                        { no: '1.1.2', label: 'Kullanım kılavuzu ve servis kitabı' },
                        { no: '1.1.3', label: 'Garanti belgesi' },
                        { no: '1.1.4', label: 'Radyo kodu kartı' },
                    ]
                },
                {
                    no: '1.2', title: 'Dış Görünüm',
                    items: [
                        { no: '1.2.1', label: 'Boya hasarı / çizik kontrolü' },
                        { no: '1.2.2', label: 'Plaka taşıyıcı ve plaka' },
                        { no: '1.2.3', label: 'Dış aydınlatma lambaları (far, stop, sinyal)' },
                        { no: '1.2.4', label: 'Ön tampon ve ızgara' },
                        { no: '1.2.5', label: 'Arka tampon' },
                        { no: '1.2.6', label: 'Yan paneller ve kaportalar' },
                        { no: '1.2.7', label: 'Servis kapakları ve kilitleri' },
                        { no: '1.2.8', label: 'Ön cam ve silecekler' },
                        { no: '1.2.9', label: 'Yan camlar ve contaları' },
                        { no: '1.2.10', label: 'Ayna ve ısıtma sistemi' },
                    ]
                },
                {
                    no: '1.3', title: 'Lastik ve Jant',
                    items: [
                        { no: '1.3.1', label: 'Lastik basınçları ve diş derinliği' },
                        { no: '1.3.2', label: 'Stepne (varsa) durumu' },
                        { no: '1.3.3', label: 'Jant hasarı kontrolü' },
                        { no: '1.3.4', label: 'Teker somunları tork kontrolü' },
                    ]
                },
            ]
        },
        {
            no: '3', title: 'MOTOR VE AKTARMA ORGANLARI', altGrup: 'Mekanik',
            subSections: [
                {
                    no: '3.1', title: 'Motor Bölmesi',
                    items: [
                        { no: '3.1.1', label: 'Motor yağı seviyesi ve sızdırmazlığı' },
                        { no: '3.1.2', label: 'Soğutma suyu seviyesi ve antifriz oranı' },
                        { no: '3.1.3', label: 'Fren hidrolik yağı seviyesi' },
                        { no: '3.1.4', label: 'Cam suyu seviyesi ve bağlantıları' },
                        { no: '3.1.5', label: 'Akü bağlantıları ve elektrolit seviyesi' },
                        { no: '3.1.6', label: 'Akü üretim tarihi', type: 'info' },
                        { no: '3.1.7', label: 'Hava filtresi durumu' },
                        { no: '3.1.8', label: 'Kayış gerilimi - Alternatör 2', type: 'measurement', unit: 'Hz', measureNote: '>110 Hz' },
                        { no: '3.1.9', label: 'Kayış gerilimi - Alternatör 3', type: 'measurement', unit: 'Hz', measureNote: '>124 Hz' },
                        { no: '3.1.10', label: 'Kayış gerilimi - Fan tahrik', type: 'measurement', unit: 'Hz', measureNote: '>41 Hz' },
                        { no: '3.1.11', label: 'Motor bordo altı sızdırmazlık' },
                        { no: '3.1.12', label: 'Yakıt sistemi sızdırmazlığı' },
                    ]
                },
                {
                    no: '3.2', title: 'Şanzıman ve Aktarma',
                    items: [
                        { no: '3.2.1', label: 'Şanzıman yağı seviyesi ve sızdırmazlığı' },
                        { no: '3.2.2', label: 'Kardanlar ve mafsallar' },
                        { no: '3.2.3', label: 'Diferansiyel yağ seviyesi' },
                        { no: '3.2.4', label: 'Şanzıman çalışması (N, D, R testi)' },
                    ]
                },
            ]
        },
        {
            no: '4', title: 'FREN SİSTEMİ VE SÜSPANSIYON', altGrup: 'Mekanik',
            subSections: [
                {
                    no: '4.1', title: 'Hava Freni',
                    items: [
                        { no: '4.1.1', label: 'Hava tankı dolum süresi ve basıncı' },
                        { no: '4.1.2', label: 'Park freni çalışması ve göstergesi' },
                        { no: '4.1.3', label: 'Servis fren pedal oyunu ve etkinliği' },
                        { no: '4.1.4', label: 'ABS/ASR kontrolü' },
                        { no: '4.1.5', label: 'Hava kaçağı testi' },
                    ]
                },
                {
                    no: '4.2', title: 'Süspansiyon',
                    items: [
                        { no: '4.2.1', label: 'Hava körüğü basınç kontrolü' },
                        { no: '4.2.2', label: 'Hava körüğü sızdırmazlığı' },
                        { no: '4.2.3', label: 'Süspansiyon yüksekliği ayarı' },
                        { no: '4.2.4', label: 'Amortisör bağlantıları' },
                    ]
                },
            ]
        },
        {
            no: '8', title: 'İÇ DONANIM VE ELEKTRİK', altGrup: 'Elektrik',
            subSections: [
                {
                    no: '8.1', title: 'Sürücü Bölmesi',
                    items: [
                        { no: '8.1.1', label: 'Gösterge paneli ve ikaz lambaları' },
                        { no: '8.1.2', label: 'Direksiyon ayarı' },
                        { no: '8.1.3', label: 'Dikiz aynaları ve ısıtma' },
                        { no: '8.1.4', label: 'Kapı açma/kapama mekanizmaları' },
                        { no: '8.1.5', label: 'Sürücü koltuğu ayarı ve kemer' },
                        { no: '8.1.6', label: 'Klima/ısıtma (sürücü)' },
                        { no: '8.1.7', label: 'Korna çalışması' },
                        { no: '8.1.8', label: 'Silecek / cam suyu' },
                    ]
                },
                {
                    no: '8.2', title: 'Yolcu Bölmesi',
                    items: [
                        { no: '8.2.1', label: 'Yolcu koltukları ve kemerleri' },
                        { no: '8.2.2', label: 'Tutunma barları ve ayakta yolcu alanı' },
                        { no: '8.2.3', label: 'Yolcu klima/ısıtma sistemi' },
                        { no: '8.2.4', label: 'İç aydınlatma' },
                        { no: '8.2.5', label: 'Bilgi ekranları (varsa)' },
                        { no: '8.2.6', label: 'Bilet / kart okuyucu sistemi' },
                    ]
                },
                {
                    no: '8.3', title: 'Kapılar ve Güvenlik',
                    items: [
                        { no: '8.3.1', label: 'Ön kapı açılış/kapanış ve sensörler' },
                        { no: '8.3.2', label: 'Orta kapı açılış/kapanış ve sensörler' },
                        { no: '8.3.3', label: 'Arka kapı açılış/kapanış ve sensörler' },
                        { no: '8.3.4', label: 'Acil çıkış kapıları ve ikaz' },
                        { no: '8.3.5', label: 'Yangın tüpü kontrolü' },
                        { no: '8.3.6', label: 'Yangın tüpü gelecek kontrol tarihi', type: 'info' },
                        { no: '8.3.7', label: 'İlk yardım kiti' },
                        { no: '8.3.8', label: 'Takoz ve reflektif üçgen' },
                    ]
                },
                {
                    no: '8.4', title: 'Son İşlemler', columns: 'yapildi',
                    items: [
                        { no: '8.4.1', label: 'Araç içi temizlik' },
                        { no: '8.4.2', label: 'Motor bölmesi temizliği' },
                        { no: '8.4.3', label: 'Dış yıkama' },
                        { no: '8.4.4', label: 'Yakıt ikmali yapıldı' },
                        { no: '8.4.5', label: 'Araç test sürüşü yapıldı' },
                        { no: '8.4.6', label: 'Teşhis cihazı bağlandı, hata kodu yok' },
                        { no: '8.4.7', label: 'Servis uyarı mesajları sıfırlandı' },
                        { no: '8.4.8', label: 'PDI kontrol formu dolduruldu' },
                    ]
                },
            ]
        },
    ]
};

export const FORM_DATA: Record<string, VehicleFormData> = {
    'Tourismo 16': tourismo,
    'Travego SHD': travego,
    'Conecto': conecto,
};

export const ARAC_TIPLERI = Object.keys(FORM_DATA);
