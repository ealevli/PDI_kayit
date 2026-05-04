import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from database import get_db, DB_DIR
import models

router = APIRouter()

PHOTO_DIR = os.path.join(DB_DIR, "..", "backend", "static", "photos", "form")
os.makedirs(PHOTO_DIR, exist_ok=True)


def _now_str():
    return datetime.now().strftime("%d-%m-%Y %H:%M")


def _today_str():
    return datetime.now().strftime("%d-%m-%Y")


# ─── Sessions ─────────────────────────────────────────────────────────────────

@router.post("/sessions")
def create_session(
    sasi_no: str = Form(None),
    arac_tipi: str = Form(None),
    is_emri_no: str = Form(None),
    bb_no: str = Form(None),
    imalat_no: str = Form(None),
    wa_no: str = Form(None),
    pdi_personel: str = Form(None),
    tarih: str = Form(None),
    db: Session = Depends(get_db)
):
    session = models.PDISession(
        sasi_no=sasi_no,
        arac_tipi=arac_tipi,
        is_emri_no=is_emri_no,
        bb_no=bb_no,
        imalat_no=imalat_no,
        wa_no=wa_no,
        pdi_personel=pdi_personel,
        tarih=tarih or _today_str(),
        durum="devam",
        olusturma_tarihi=_now_str(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "message": "Oturum oluşturuldu."}


@router.get("/sessions/active")
def list_active_sessions(db: Session = Depends(get_db)):
    """Bugünkü + devam eden oturumları döndür (usta landing ekranı için)"""
    today = datetime.now().strftime("%d-%m-%Y")
    sessions = db.query(models.PDISession).filter(
        models.PDISession.durum == "devam"
    ).order_by(models.PDISession.id.desc()).limit(20).all()
    return [
        {
            "id": s.id, "sasi_no": s.sasi_no, "arac_tipi": s.arac_tipi,
            "is_emri_no": s.is_emri_no, "pdi_personel": s.pdi_personel,
            "tarih": s.tarih, "durum": s.durum, "olusturma_tarihi": s.olusturma_tarihi,
        }
        for s in sessions
    ]


@router.get("/sessions/by-sasi/{sasi_no}")
def find_session_by_sasi(sasi_no: str, db: Session = Depends(get_db)):
    """Şasi numarasına göre devam eden oturumu bul"""
    session = db.query(models.PDISession).filter(
        models.PDISession.sasi_no == sasi_no,
        models.PDISession.durum == "devam"
    ).order_by(models.PDISession.id.desc()).first()
    if not session:
        raise HTTPException(status_code=404, detail="Devam eden oturum bulunamadı.")
    return {"id": session.id, "sasi_no": session.sasi_no, "arac_tipi": session.arac_tipi,
            "tarih": session.tarih, "pdi_personel": session.pdi_personel}


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(models.PDISession).order_by(models.PDISession.id.desc()).all()
    return [
        {
            "id": s.id,
            "sasi_no": s.sasi_no,
            "arac_tipi": s.arac_tipi,
            "is_emri_no": s.is_emri_no,
            "pdi_personel": s.pdi_personel,
            "tarih": s.tarih,
            "durum": s.durum,
            "olusturma_tarihi": s.olusturma_tarihi,
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(models.PDISession).filter(models.PDISession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Oturum bulunamadı.")
    responses = db.query(models.PDIResponse).filter(models.PDIResponse.session_id == session_id).all()
    pins = db.query(models.PDIVehiclePin).filter(models.PDIVehiclePin.session_id == session_id).all()
    dynamic_responses = db.query(models.PDIDynamicResponse).filter(models.PDIDynamicResponse.session_id == session_id).all()
    return {
        "session": {
            "id": s.id, "sasi_no": s.sasi_no, "arac_tipi": s.arac_tipi,
            "is_emri_no": s.is_emri_no, "bb_no": s.bb_no, "imalat_no": s.imalat_no,
            "wa_no": s.wa_no, "pdi_personel": s.pdi_personel, "tarih": s.tarih,
            "durum": s.durum, "aku_uretim_tarihi": s.aku_uretim_tarihi,
            "yangin_tupu_tarihi": s.yangin_tupu_tarihi, "genel_aciklamalar": s.genel_aciklamalar,
            "olusturma_tarihi": s.olusturma_tarihi,
        },
        "responses": [
            {
                "id": r.id, "item_no": r.item_no, "durum": r.durum,
                "ariza_tanimi": r.ariza_tanimi, "fotograf_yolu": r.fotograf_yolu,
                "olcum_ilk": r.olcum_ilk, "olcum_sonra": r.olcum_sonra,
                "hata_nerede_item": r.hata_nerede_item,
                "kaydeden": r.kaydeden,
            }
            for r in responses
        ],
        "pins": [
            {
                "id": p.id, "view": p.view, "x_percent": p.x_percent,
                "y_percent": p.y_percent, "aciklama": p.aciklama,
                "fotograf_yolu": p.fotograf_yolu,
            }
            for p in pins
        ],
        "dynamic_responses": [
            {
                "id": dr.id, "dynamic_item_id": dr.dynamic_item_id,
                "kontrol_edildi": dr.kontrol_edildi, "aciklama": dr.aciklama,
                "fotograf_yolu": dr.fotograf_yolu,
            }
            for dr in dynamic_responses
        ],
    }


@router.put("/sessions/{session_id}")
def update_session(
    session_id: int,
    sasi_no: str = Form(None),
    is_emri_no: str = Form(None),
    bb_no: str = Form(None),
    imalat_no: str = Form(None),
    wa_no: str = Form(None),
    pdi_personel: str = Form(None),
    tarih: str = Form(None),
    aku_uretim_tarihi: str = Form(None),
    yangin_tupu_tarihi: str = Form(None),
    genel_aciklamalar: str = Form(None),
    durum: str = Form(None),
    db: Session = Depends(get_db)
):
    s = db.query(models.PDISession).filter(models.PDISession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Oturum bulunamadı.")
    if sasi_no is not None: s.sasi_no = sasi_no
    if is_emri_no is not None: s.is_emri_no = is_emri_no
    if bb_no is not None: s.bb_no = bb_no
    if imalat_no is not None: s.imalat_no = imalat_no
    if wa_no is not None: s.wa_no = wa_no
    if pdi_personel is not None: s.pdi_personel = pdi_personel
    if tarih is not None: s.tarih = tarih
    if aku_uretim_tarihi is not None: s.aku_uretim_tarihi = aku_uretim_tarihi
    if yangin_tupu_tarihi is not None: s.yangin_tupu_tarihi = yangin_tupu_tarihi
    if genel_aciklamalar is not None: s.genel_aciklamalar = genel_aciklamalar
    if durum is not None: s.durum = durum
    s.guncelleme_tarihi = _now_str()
    db.commit()
    return {"message": "Güncellendi."}


@router.post("/sessions/{session_id}/complete")
def complete_session(
    session_id: int,
    genel_aciklamalar: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Formu tamamla ve her arızalı maddeyi ayrı pdi_kayitlari satırı olarak besle.
    Böylece top_hata bazlı raporlar, Excel manipülasyonu olmadan direkt beslenir.
    """
    s = db.query(models.PDISession).filter(models.PDISession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Oturum bulunamadı.")

    if genel_aciklamalar:
        s.genel_aciklamalar = genel_aciklamalar

    # Zaten tamamlanmışsa tekrar besleme
    if s.durum == "tamamlandi":
        s.guncelleme_tarihi = _now_str()
        db.commit()
        return {"message": "Zaten tamamlandı.", "kayit_count": 0}

    # Arızalı + Giderildi maddelerin hepsi kayıta düşer
    kayit_edilecek = db.query(models.PDIResponse).filter(
        models.PDIResponse.session_id == session_id,
        models.PDIResponse.durum.in_(["arizali", "giderildi"])
    ).all()

    created_ids = []

    if kayit_edilecek:
        for r in kayit_edilecek:
            # Giderildi ise nerede giderildiğini kullan; arızalı ise "TUM" (PDI tespit etti)
            if r.durum == "giderildi":
                hata_nerede = r.hata_nerede_item or "TUM"
            else:
                hata_nerede = "TUM"

            kayit = models.PDIKayit(
                sasi_no=s.sasi_no,
                arac_tipi=s.arac_tipi,
                is_emri_no=s.is_emri_no,
                bb_no=s.bb_no,
                grup_no=r.item_no,
                tespitler=r.ariza_tanimi or r.item_label or r.item_no,
                hata_konumu=r.item_label or r.item_no,
                fotograf_yolu=r.fotograf_yolu,
                tarih_saat=s.tarih,
                kullanici=r.kaydeden or s.pdi_personel or "Usta (Form)",
                hata_nerede=hata_nerede,
                alt_grup=r.alt_grup or "Genel",
                top_hata=r.top_hata,
                pdi_session_id=session_id,
            )
            db.add(kayit)
            db.flush()
            created_ids.append(kayit.id)
    else:
        # Hata yoksa yine de özet bir kayıt oluştur (araç sayısı için)
        kayit = models.PDIKayit(
            sasi_no=s.sasi_no,
            arac_tipi=s.arac_tipi,
            is_emri_no=s.is_emri_no,
            bb_no=s.bb_no,
            tespitler="Hata tespit edilmedi.",
            tarih_saat=s.tarih,
            kullanici=s.pdi_personel or "Usta (Form)",
            hata_nerede="TUM",
            alt_grup="Genel",
            pdi_session_id=session_id,
        )
        db.add(kayit)
        db.flush()
        created_ids.append(kayit.id)

    s.durum = "tamamlandi"
    s.guncelleme_tarihi = _now_str()
    db.commit()
    return {
        "message": "Form tamamlandı.",
        "kayit_count": len(created_ids),
        "pdi_kayit_ids": created_ids,
    }


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    db.query(models.PDIResponse).filter(models.PDIResponse.session_id == session_id).delete()
    db.query(models.PDIVehiclePin).filter(models.PDIVehiclePin.session_id == session_id).delete()
    db.query(models.PDIDynamicResponse).filter(models.PDIDynamicResponse.session_id == session_id).delete()
    db.query(models.PDISession).filter(models.PDISession.id == session_id).delete()
    db.commit()
    return {"message": "Oturum silindi."}


# ─── Responses (Checklist) ────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/responses")
def save_response(
    session_id: int,
    item_no: str = Form(...),
    item_label: str = Form(None),
    alt_grup: str = Form(None),
    durum: str = Form(None),
    ariza_tanimi: str = Form(None),
    hata_nerede_item: str = Form(None),
    olcum_ilk: str = Form(None),
    olcum_sonra: str = Form(None),
    kaydeden: str = Form(None),
    db: Session = Depends(get_db)
):
    existing = db.query(models.PDIResponse).filter(
        models.PDIResponse.session_id == session_id,
        models.PDIResponse.item_no == item_no
    ).first()
    if existing:
        existing.durum = durum
        existing.ariza_tanimi = ariza_tanimi
        existing.hata_nerede_item = hata_nerede_item
        existing.olcum_ilk = olcum_ilk
        existing.olcum_sonra = olcum_sonra
        if item_label: existing.item_label = item_label
        if alt_grup: existing.alt_grup = alt_grup
        if kaydeden: existing.kaydeden = kaydeden
    else:
        existing = models.PDIResponse(
            session_id=session_id,
            item_no=item_no,
            item_label=item_label,
            alt_grup=alt_grup,
            durum=durum,
            ariza_tanimi=ariza_tanimi,
            hata_nerede_item=hata_nerede_item,
            olcum_ilk=olcum_ilk,
            olcum_sonra=olcum_sonra,
            kaydeden=kaydeden,
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return {"id": existing.id}


@router.post("/sessions/{session_id}/responses/{item_no}/photo")
def upload_response_photo(
    session_id: int,
    item_no: str,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    safe_item = item_no.replace(".", "_")
    ext = os.path.splitext(photo.filename)[1] or ".jpg"
    filename = f"session_{session_id}_item_{safe_item}_{datetime.now().strftime('%H%M%S')}{ext}"
    filepath = os.path.join(PHOTO_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(photo.file, f)

    existing = db.query(models.PDIResponse).filter(
        models.PDIResponse.session_id == session_id,
        models.PDIResponse.item_no == item_no
    ).first()
    if existing:
        existing.fotograf_yolu = filepath
    else:
        existing = models.PDIResponse(
            session_id=session_id, item_no=item_no, fotograf_yolu=filepath
        )
        db.add(existing)
    db.commit()
    return {"fotograf_yolu": f"/static/photos/form/{filename}"}


# ─── Vehicle Pins ─────────────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/pins")
def add_pin(
    session_id: int,
    view: str = Form(...),
    x_percent: str = Form(...),
    y_percent: str = Form(...),
    aciklama: str = Form(None),
    db: Session = Depends(get_db)
):
    pin = models.PDIVehiclePin(
        session_id=session_id,
        view=view,
        x_percent=x_percent,
        y_percent=y_percent,
        aciklama=aciklama,
    )
    db.add(pin)
    db.commit()
    db.refresh(pin)
    return {"id": pin.id}


@router.post("/sessions/{session_id}/pins/{pin_id}/photo")
def upload_pin_photo(
    session_id: int,
    pin_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    pin = db.query(models.PDIVehiclePin).filter(models.PDIVehiclePin.id == pin_id).first()
    if not pin:
        raise HTTPException(status_code=404, detail="Pin bulunamadı.")
    ext = os.path.splitext(photo.filename)[1] or ".jpg"
    filename = f"pin_{pin_id}_{datetime.now().strftime('%H%M%S')}{ext}"
    filepath = os.path.join(PHOTO_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(photo.file, f)
    pin.fotograf_yolu = filepath
    db.commit()
    return {"fotograf_yolu": f"/static/photos/form/{filename}"}


@router.put("/sessions/{session_id}/pins/{pin_id}")
def update_pin(
    session_id: int,
    pin_id: int,
    aciklama: str = Form(None),
    db: Session = Depends(get_db)
):
    pin = db.query(models.PDIVehiclePin).filter(models.PDIVehiclePin.id == pin_id).first()
    if not pin:
        raise HTTPException(status_code=404, detail="Pin bulunamadı.")
    if aciklama is not None:
        pin.aciklama = aciklama
    db.commit()
    return {"message": "Pin güncellendi."}


@router.delete("/sessions/{session_id}/pins/{pin_id}")
def delete_pin(session_id: int, pin_id: int, db: Session = Depends(get_db)):
    pin = db.query(models.PDIVehiclePin).filter(models.PDIVehiclePin.id == pin_id).first()
    if pin and pin.fotograf_yolu and os.path.exists(pin.fotograf_yolu):
        try:
            os.remove(pin.fotograf_yolu)
        except Exception:
            pass
    db.query(models.PDIVehiclePin).filter(models.PDIVehiclePin.id == pin_id).delete()
    db.commit()
    return {"message": "Pin silindi."}


# ─── Dynamic Items (Admin) ────────────────────────────────────────────────────

@router.get("/dynamic-items")
def list_dynamic_items(include_inactive: int = 0, db: Session = Depends(get_db)):
    q = db.query(models.PDIDynamicItem)
    if not include_inactive:
        q = q.filter(models.PDIDynamicItem.aktif == 1)
    items = q.order_by(models.PDIDynamicItem.sira).all()
    return [
        {
            "id": i.id, "baslik": i.baslik, "aciklama": i.aciklama,
            "aktif": i.aktif, "sira": i.sira, "versiyon": i.versiyon,
            "olusturma_tarihi": i.olusturma_tarihi,
        }
        for i in items
    ]


@router.post("/dynamic-items")
def create_dynamic_item(
    baslik: str = Form(...),
    aciklama: str = Form(None),
    sira: int = Form(0),
    db: Session = Depends(get_db)
):
    item = models.PDIDynamicItem(
        baslik=baslik,
        aciklama=aciklama,
        sira=sira,
        olusturma_tarihi=_now_str(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id}


@router.put("/dynamic-items/{item_id}")
def update_dynamic_item(
    item_id: int,
    baslik: str = Form(None),
    aciklama: str = Form(None),
    sira: int = Form(None),
    aktif: int = Form(None),
    db: Session = Depends(get_db)
):
    item = db.query(models.PDIDynamicItem).filter(models.PDIDynamicItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Madde bulunamadı.")
    if baslik is not None: item.baslik = baslik
    if aciklama is not None: item.aciklama = aciklama
    if sira is not None: item.sira = sira
    if aktif is not None: item.aktif = aktif
    item.versiyon = (item.versiyon or 1) + 1
    db.commit()
    return {"message": "Güncellendi."}


@router.delete("/dynamic-items/{item_id}")
def delete_dynamic_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.PDIDynamicItem).filter(models.PDIDynamicItem.id == item_id).first()
    if item:
        item.aktif = 0
    db.commit()
    return {"message": "Silindi."}


# ─── Dynamic Responses ────────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/dynamic-responses")
def save_dynamic_response(
    session_id: int,
    dynamic_item_id: int = Form(...),
    kontrol_edildi: int = Form(0),
    aciklama: str = Form(None),
    db: Session = Depends(get_db)
):
    existing = db.query(models.PDIDynamicResponse).filter(
        models.PDIDynamicResponse.session_id == session_id,
        models.PDIDynamicResponse.dynamic_item_id == dynamic_item_id
    ).first()
    if existing:
        existing.kontrol_edildi = kontrol_edildi
        existing.aciklama = aciklama
    else:
        existing = models.PDIDynamicResponse(
            session_id=session_id,
            dynamic_item_id=dynamic_item_id,
            kontrol_edildi=kontrol_edildi,
            aciklama=aciklama,
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return {"id": existing.id}


@router.post("/sessions/{session_id}/dynamic-responses/{dr_id}/photo")
def upload_dynamic_photo(
    session_id: int,
    dr_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    dr = db.query(models.PDIDynamicResponse).filter(models.PDIDynamicResponse.id == dr_id).first()
    if not dr:
        raise HTTPException(status_code=404, detail="Bulunamadı.")
    ext = os.path.splitext(photo.filename)[1] or ".jpg"
    filename = f"dyn_{dr_id}_{datetime.now().strftime('%H%M%S')}{ext}"
    filepath = os.path.join(PHOTO_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(photo.file, f)
    dr.fotograf_yolu = filepath
    db.commit()
    return {"fotograf_yolu": f"/static/photos/form/{filename}"}
