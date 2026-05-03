from sqlalchemy import Column, Integer, String
from database import Base

class PDIKayit(Base):
    __tablename__ = "pdi_kayitlari"

    id = Column(Integer, primary_key=True, index=True)
    bb_no = Column(String, nullable=True)
    sasi_no = Column(String, index=True, nullable=True)
    arac_tipi = Column(String, index=True, nullable=True)
    is_emri_no = Column(String, nullable=True)
    alt_grup = Column(String, nullable=True)
    tespitler = Column(String, nullable=True)
    hata_konumu = Column(String, nullable=True)
    fotograf_yolu = Column(String, nullable=True)
    tarih_saat = Column(String, index=True, nullable=True)
    kullanici = Column(String, nullable=True)
    duzenleyen = Column(String, nullable=True)
    grup_no = Column(String, nullable=True)
    parca_tanimi = Column(String, nullable=True)
    hata_tanimi = Column(String, nullable=True)
    musteri_sikayeti = Column(String, nullable=True)
    musteri_beklentisi = Column(String, nullable=True)
    musteri_geri_bildirimi = Column(String, nullable=True)
    musteri_teyidi = Column(String, nullable=True)
    musteri_talebi = Column(String, nullable=True)
    musteri_adi = Column(String, nullable=True)
    musteri_soyadi = Column(String, nullable=True)
    musteri_iletisim = Column(String, nullable=True)
    musteri_adresi = Column(String, nullable=True)
    top_hata = Column(String, index=True, nullable=True)
    hata_nerede = Column(String, nullable=True) # Options: 'TUM' (PDI), 'İmalat'
    pdi_session_id = Column(Integer, nullable=True, index=True)  # PDI form'undan geldiyse session ID

class TopHata(Base):
    __tablename__ = "top_hatalar"
    id = Column(Integer, primary_key=True, index=True)
    hata_adi = Column(String, unique=True, index=True)
    aktif = Column(Integer, default=1) # 1: aktif, 0: pasif

class ReportManualData(Base):
    __tablename__ = "report_manual_data"
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, index=True) # e.g., 'trv_tou'
    context_key = Column(String, index=True) # e.g., 'donuts'
    data_key = Column(String, index=True)    # e.g., 'prev_year_rate'
    data_value = Column(String)

class ImalatKayit(Base):
    __tablename__ = "imalat_kayitlari"
    id = Column(Integer, primary_key=True, index=True)
    arac_no = Column(String, index=True)
    tarih = Column(String, index=True)
    adet = Column(Integer)
    top_hata = Column(String)
    hata_metni = Column(String)
    kullanici = Column(String)
    olusturma_tarihi = Column(String)

# Lookup tables for dynamic dropdowns
class AracTipiLookUp(Base):
    __tablename__ = "lookup_arac_tipi"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class AltGrupLookUp(Base):
    __tablename__ = "lookup_alt_grup"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class HataKonumuLookUp(Base):
    __tablename__ = "lookup_hata_konumu"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class HataNeredeLookUp(Base):
    __tablename__ = "lookup_hata_nerede"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class ImalatHataTakip(Base):
    __tablename__ = "imalat_hata_takip"
    id = Column(Integer, primary_key=True, index=True)
    konu = Column(String)
    aciklama = Column(String, nullable=True)
    cozuldu = Column(Integer, default=0) # 0: hayir, 1: evet
    olusturma_tarihi = Column(String)

class ManuelCozulen(Base):
    __tablename__ = "manuel_cozulenler"
    id = Column(Integer, primary_key=True, index=True)
    hata = Column(String)
    donem = Column(String)  # format: "3-2026" (month-year)

class PDIDetay(Base):
    __tablename__ = "pdi_detaylari"
    id = Column(Integer, primary_key=True, index=True)
    pdi_id = Column(Integer, index=True)
    aciklama = Column(String, nullable=True)
    fotograf_yolu = Column(String, nullable=True)

# ─── PDI Form (Dijital Checklist) ─────────────────────────────────────────────

class PDISession(Base):
    """Bir aracın tüm PDI form oturumu"""
    __tablename__ = "pdi_sessions"
    id = Column(Integer, primary_key=True, index=True)
    sasi_no = Column(String, index=True, nullable=True)
    arac_tipi = Column(String, index=True)          # 'Tourismo', 'Travego', 'Conecto'
    is_emri_no = Column(String, nullable=True)
    bb_no = Column(String, nullable=True)
    imalat_no = Column(String, nullable=True)
    wa_no = Column(String, nullable=True)
    pdi_personel = Column(String, nullable=True)
    tarih = Column(String, index=True)              # DD-MM-YYYY
    durum = Column(String, default='devam')         # 'devam' | 'tamamlandi'
    form_version = Column(Integer, default=1)
    aku_uretim_tarihi = Column(String, nullable=True)
    yangin_tupu_tarihi = Column(String, nullable=True)
    genel_aciklamalar = Column(String, nullable=True)
    olusturma_tarihi = Column(String)
    guncelleme_tarihi = Column(String, nullable=True)
    synced = Column(Integer, default=1)             # 0: offline pending

class PDIResponse(Base):
    """Her checklist maddesinin cevabı"""
    __tablename__ = "pdi_responses"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, index=True)
    item_no = Column(String, index=True)            # '1.8.1'
    item_label = Column(String, nullable=True)      # Madde metni (raporlara taşınır)
    durum = Column(String, nullable=True)           # 'tamam' | 'arizali' | 'giderildi' | 'yapildi'
    ariza_tanimi = Column(String, nullable=True)
    top_hata = Column(String, nullable=True)        # top_hatalar.hata_adi — rapor beslemek için
    alt_grup = Column(String, nullable=True)        # Bölüm başlığı (ör. "Motor Bölmesi")
    fotograf_yolu = Column(String, nullable=True)
    olcum_ilk = Column(String, nullable=True)       # İlk ölçüm değeri
    olcum_sonra = Column(String, nullable=True)     # Ayardan sonraki değer
    kaydeden = Column(String, nullable=True)        # Bu maddeyi kaydeden ustanın adı
    hata_nerede_item = Column(String, nullable=True)  # Giderildi seçilince: TUM/İmalat/Diğer

class PDIVehiclePin(Base):
    """Araç diyagramı üzerine konulan hata pinleri"""
    __tablename__ = "pdi_vehicle_pins"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, index=True)
    view = Column(String)                           # 'on' | 'arka' | 'sol' | 'sag'
    x_percent = Column(String)                      # "42.5"
    y_percent = Column(String)                      # "30.1"
    aciklama = Column(String, nullable=True)
    fotograf_yolu = Column(String, nullable=True)

class PDIDynamicItem(Base):
    """Admin tarafından yönetilen dinamik kontrol listesi (Dinamik Kontrol Formu)"""
    __tablename__ = "pdi_dynamic_items"
    id = Column(Integer, primary_key=True, index=True)
    baslik = Column(String)
    aciklama = Column(String, nullable=True)        # Detaylı açıklama
    aktif = Column(Integer, default=1)
    sira = Column(Integer, default=0)
    versiyon = Column(Integer, default=1)
    olusturma_tarihi = Column(String)

class PDIDynamicResponse(Base):
    """Dinamik form maddesinin cevabı"""
    __tablename__ = "pdi_dynamic_responses"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, index=True)
    dynamic_item_id = Column(Integer, index=True)
    kontrol_edildi = Column(Integer, default=0)     # 0 | 1
    aciklama = Column(String, nullable=True)
    fotograf_yolu = Column(String, nullable=True)
