from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ImalatCreate(BaseModel):
    arac_no: str
    tarih: str
    adet: int
    top_hata: str
    hata_metni: str
    kullanici: str

class ImalatResponse(ImalatCreate):
    id: int
    olusturma_tarihi: str

@router.get("/")
def get_imalat_records(db: Session = Depends(get_db)):
    """Fetch all PDI records that were fixed in manufacturing."""
    return db.query(models.PDIKayit).filter(models.PDIKayit.hata_nerede == "İmalat").order_by(models.PDIKayit.id.desc()).all()

@router.post("/", response_model=ImalatResponse)
def create_imalat_record(kayit: ImalatCreate, db: Session = Depends(get_db)):
    db_kayit = models.ImalatKayit(
        **kayit.dict(),
        olusturma_tarihi=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(db_kayit)
    db.commit()
    db.refresh(db_kayit)
    return db_kayit

@router.delete("/{record_id}")
def delete_imalat_record(record_id: int, db: Session = Depends(get_db)):
    kayit = db.query(models.ImalatKayit).filter(models.ImalatKayit.id == record_id).first()
    if not kayit:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    db.delete(kayit)
    db.commit()
    return {"message": "Kayıt başarıyla silindi"}
