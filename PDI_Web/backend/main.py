from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, DB_DIR
from routers import mechanic, admin, reports, imalat
import os

# Create tables if not exists
Base.metadata.create_all(bind=engine)

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

@app.get("/")
def read_root():
    return {"message": "PDI Web API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
