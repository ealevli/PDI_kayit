from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, DB_DIR
from routers import mechanic, admin, reports, imalat, form
import os

# Create tables if not exists
Base.metadata.create_all(bind=engine)

# SQLite migration: add columns that may not exist on older DBs
from sqlalchemy import text as _text
with engine.connect() as _conn:
    for _col_sql in [
        # pdi_responses — tüm yeni kolonlar (eski DB'de eksik olabilir)
        "ALTER TABLE pdi_responses ADD COLUMN item_label TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN durum TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN ariza_tanimi TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN top_hata TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN alt_grup TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN fotograf_yolu TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN olcum_ilk TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN olcum_sonra TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN kaydeden TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN hata_nerede_item TEXT",
        # pdi_sessions
        "ALTER TABLE pdi_sessions ADD COLUMN imalat_no TEXT",
        "ALTER TABLE pdi_sessions ADD COLUMN wa_no TEXT",
        "ALTER TABLE pdi_sessions ADD COLUMN aku_uretim_tarihi TEXT",
        "ALTER TABLE pdi_sessions ADD COLUMN yangin_tupu_tarihi TEXT",
        "ALTER TABLE pdi_sessions ADD COLUMN genel_aciklamalar TEXT",
        "ALTER TABLE pdi_sessions ADD COLUMN guncelleme_tarihi TEXT",
        "ALTER TABLE pdi_sessions ADD COLUMN synced INTEGER DEFAULT 1",
        # pdi_kayitlari
        "ALTER TABLE pdi_kayitlari ADD COLUMN pdi_session_id INTEGER",
    ]:
        try:
            _conn.execute(_text(_col_sql))
            _conn.commit()
        except Exception:
            pass  # Kolon zaten varsa hata yok sayılır

app = FastAPI(title="PDI Web API (Mechanic Frontend)")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Photo directory serving
PHOTO_DIR = os.path.join(DB_DIR, "..", "backend", "static", "photos")
os.makedirs(PHOTO_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=os.path.join(DB_DIR, "..", "backend", "static")), name="static")

app.include_router(mechanic.router, prefix="/api/mechanic", tags=["Mechanic"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(imalat.router, prefix="/api/imalat", tags=["Imalat"])
app.include_router(form.router, prefix="/api/form", tags=["Form"])

@app.get("/")
def read_root():
    return {"message": "PDI Web API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
