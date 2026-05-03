"""
Run once to seed default dynamic checklist items from Dinamik Kontrol Formu_2025.
Usage: python seed_dynamic_items.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
import models
from datetime import datetime

Base.metadata.create_all(bind=engine)

DEFAULT_ITEMS = [
    ("Araç içi koku kontrolü (yakıt, yanık koku vb.)", None),
    ("Yolcu kapı step aydınlatmaları", None),
    ("Dış gövde vinil / grafik yapıştırmaları (varsa)", "Bant kaldırma kalıntısı, hava kabarcığı kontrolü"),
    ("Aksesuar montaj kontrol listesi (varsa)", "Müşteriye özel ekipman montajı tamamlandı mı?"),
    ("Garanti aktivasyon işlemi yapıldı", None),
    ("Müşteri tanıtım formu hazırlandı", "Teslimat öncesi kullanım kılavuzu teslimi"),
    ("GPS/takip cihazı aktivasyonu (varsa)", None),
    ("Araç teslim protokolü imzalandı", None),
]

db = SessionLocal()
try:
    existing = db.query(models.PDIDynamicItem).count()
    if existing > 0:
        print(f"Zaten {existing} dinamik madde mevcut. Seed atlandı.")
    else:
        now = datetime.now().strftime("%d-%m-%Y %H:%M")
        for idx, (baslik, aciklama) in enumerate(DEFAULT_ITEMS, start=1):
            item = models.PDIDynamicItem(
                baslik=baslik,
                aciklama=aciklama,
                aktif=1,
                sira=idx,
                versiyon=1,
                olusturma_tarihi=now,
            )
            db.add(item)
        db.commit()
        print(f"{len(DEFAULT_ITEMS)} dinamik madde eklendi.")
finally:
    db.close()
