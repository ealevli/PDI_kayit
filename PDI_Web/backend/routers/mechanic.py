import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db, DB_DIR
import models
import schemas

router = APIRouter()

PHOTO_DIR = os.path.join(DB_DIR, "..", "backend", "static", "photos")
os.makedirs(PHOTO_DIR, exist_ok=True)

@router.post("/kayit", response_model=schemas.MechanicResponse)
def create_pdi_kayit(
    is_emri_no: str = Form(None),
    bb_no: str = Form(None),
    sasi_no: str = Form(None),
    arac_tipi: str = Form(None),
    tarih_saat: str = Form(None),
    alt_grup: str = Form(None),
    tespitler: str = Form(None),
    hata_nerede: str = Form("TUM"),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # Validation
    if not sasi_no:
        raise HTTPException(status_code=400, detail="Şasi No zorunludur.")
        
    photo_path = None
    if photo:
        ext = os.path.splitext(photo.filename)[1]
        if not ext:
            ext = ".jpg" # varsayılan uzantı
        filename = f"{sasi_no}_{datetime.now().strftime('%Y%H%M%S')}{ext}"
        filepath = os.path.join(PHOTO_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
            
        photo_path = filepath
        
    db_kayit = models.PDIKayit(
        is_emri_no=is_emri_no,
        bb_no=bb_no,
        sasi_no=sasi_no,
        arac_tipi=arac_tipi,
        tarih_saat=tarih_saat,
        alt_grup=alt_grup,
        tespitler=tespitler,
        hata_nerede=hata_nerede,
        fotograf_yolu=photo_path,
        kullanici="Usta (Mobil)" # default user for mechanic
    )
    db.add(db_kayit)
    db.commit()
    db.refresh(db_kayit)
    
    return {"id": db_kayit.id, "message": "Kayıt başarıyla oluşturuldu."}
