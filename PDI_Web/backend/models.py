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
