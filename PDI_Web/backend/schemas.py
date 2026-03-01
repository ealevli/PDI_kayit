from pydantic import BaseModel
from typing import Optional

class MechanicCreate(BaseModel):
    is_emri_no: Optional[str] = None
    bb_no: Optional[str] = None
    sasi_no: Optional[str] = None
    arac_tipi: Optional[str] = None
    tarih_saat: Optional[str] = None
    alt_grup: Optional[str] = None
    tespitler: Optional[str] = None

class MechanicResponse(BaseModel):
    id: int
    message: str
    
class PhotoUploadResponse(BaseModel):
    photo_path: str
    message: str

class PDIKayitBase(BaseModel):
    is_emri_no: Optional[str] = None
    bb_no: Optional[str] = None
    sasi_no: Optional[str] = None
    arac_tipi: Optional[str] = None
    tarih_saat: Optional[str] = None
    alt_grup: Optional[str] = None
    tespitler: Optional[str] = None
    fotograf_yolu: Optional[str] = None
    top_hata: Optional[str] = None
    hata_nerede: Optional[str] = "TUM"

class PDIKayitUpdate(PDIKayitBase):
    hata_konumu: Optional[str] = None
    grup_no: Optional[str] = None
    parca_tanimi: Optional[str] = None
    hata_tanimi: Optional[str] = None
    musteri_sikayeti: Optional[str] = None

class PDIKayitDetail(PDIKayitBase):
    id: int
    hata_konumu: Optional[str] = None
    grup_no: Optional[str] = None
    parca_tanimi: Optional[str] = None
    hata_tanimi: Optional[str] = None
    kullanici: Optional[str] = None
    hata_nerede: Optional[str] = None

    class Config:
        from_attributes = True

class TopHataSchema(BaseModel):
    id: int
    hata_adi: str
    aktif: int
    class Config:
        from_attributes = True

class ManualDataUpdate(BaseModel):
    report_type: str
    context_key: str
    data_key: str
    data_value: str

class LookUpSchema(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class LookUpCreate(BaseModel):
    name: str

class ImalatHataTakipBase(BaseModel):
    konu: str
    aciklama: Optional[str] = None
    cozuldu: Optional[int] = 0

class ImalatHataTakipCreate(ImalatHataTakipBase):
    pass

class ImalatHataTakipSchema(ImalatHataTakipBase):
    id: int
    olusturma_tarihi: str
    class Config:
        from_attributes = True

class ManuelCozulenCreate(BaseModel):
    hata: str
    donem: str  # e.g. "3-2026"

class ManuelCozulenSchema(ManuelCozulenCreate):
    id: int
    class Config:
        from_attributes = True

class PDIDetayCreate(BaseModel):
    aciklama: str

class PDIDetaySchema(PDIDetayCreate):
    id: int
    pdi_id: int
    fotograf_yolu: Optional[str] = None
    class Config:
        from_attributes = True
