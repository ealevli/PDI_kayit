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
        "ALTER TABLE pdi_responses ADD COLUMN kaydeden TEXT",
        "ALTER TABLE pdi_responses ADD COLUMN hata_nerede_item TEXT",
    ]:
        try:
            _conn.execute(_text(_col_sql))
            _conn.commit()
        except Exception:
            pass

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
