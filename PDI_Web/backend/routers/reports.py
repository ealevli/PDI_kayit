from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from database import get_db
import models
import calendar
from datetime import datetime
from urllib.parse import quote

router = APIRouter()

TURKISH_MONTHS = [
    "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
]


def parse_int(value, default: int = 0) -> int:
    try:
        if value is None or str(value).strip() == "":
            return default
        return int(float(value))
    except (ValueError, TypeError):
        return default


def top_error_context_key(year: int, month: int, hata_adi: str) -> str:
    safe_name = quote((hata_adi or "").strip(), safe="")
    return f"{year}-{month:02d}_{safe_name}"

def get_monthly_stats(db: Session, arac_tipleri: List[str], month: int, year: int):
    stats = []
    for i in range(12):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        
        # SQLite substring logic compatible with both dd-mm-yyyy and yyyy-mm-dd
        # (substr(tarih_saat,4,2) = ? AND substr(tarih_saat,7,4) = ?) OR
        # (substr(tarih_saat,6,2) = ? AND substr(tarih_saat,1,4) = ?)
        m_str = f"{m:02d}"
        y_str = str(y)
        
        query = db.query(
            func.count(func.distinct(models.PDIKayit.sasi_no)).label("arac"),
            func.count(models.PDIKayit.id).label("hata")
        ).filter(models.PDIKayit.arac_tipi.in_(arac_tipleri))
        
        # Date filtering
        query = query.filter(or_(
            (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
            (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
        ))
        
        res = query.first()
        arac = int(res.arac) if res and res.arac else 0
        hata = int(res.hata) if res and res.hata else 0
        rate = float(hata / arac) if arac > 0 else 0.0
        
        stats.insert(0, {
            "month": TURKISH_MONTHS[m][:3],
            "month_full": TURKISH_MONTHS[m],
            "year": y,
            "month_num": m,
            "vehicles": arac,
            "errors": hata,
            "rate": rate
        })
    return stats

@router.get("/trv-tou")
def get_trv_tou_report(month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    types = ["Tourismo", "Travego"]
    monthly_stats = get_monthly_stats(db, types, month, year)

    # Manual overrides - apply to monthly_stats first
    overrides = db.query(models.ReportManualData).filter(models.ReportManualData.report_type == "trv_tou").all()
    override_dict = {f"{o.context_key}_{o.data_key}": o.data_value for o in overrides}
    
    for stat in monthly_stats:
        ctx_key = f"{stat['year']}-{stat['month_num']:02d}"
        ov_v = override_dict.get(f"{ctx_key}_vehicle_count")
        ov_e = override_dict.get(f"{ctx_key}_error_count")
        if ov_v is not None:
            v = int(ov_v)
            e = int(ov_e) if ov_e is not None else stat["errors"]
            stat["vehicles"] = v
            stat["errors"] = e
            stat["rate"] = float(e / v) if v > 0 else 0.0

    # Summary stats (computed after overrides)
    total_v = int(sum(s["vehicles"] for s in monthly_stats))
    total_e = int(sum(s["errors"] for s in monthly_stats))
    avg_12 = float(total_e / total_v) if total_v > 0 else 0.0

    # Helper function for year-wide calculation including overrides
    def get_year_stats(target_year: int):
        total_vehicles = 0
        total_errors = 0
        for m in range(1, 13):
            m_str = f"{m:02d}"
            ctx_key = f"{target_year}-{m_str}"
            ov_v = override_dict.get(f"{ctx_key}_vehicle_count")
            ov_e = override_dict.get(f"{ctx_key}_error_count")
            
            if ov_v is not None:
                v = int(ov_v)
                e = int(ov_e) if ov_e is not None else 0
            else:
                res = db.query(
                    func.count(func.distinct(models.PDIKayit.sasi_no)).label("arac"),
                    func.count(models.PDIKayit.id).label("hata")
                ).filter(
                    models.PDIKayit.arac_tipi.in_(types),
                    or_(
                        (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == str(target_year)),
                        (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == str(target_year))
                    )
                ).first()
                v = int(res.arac) if res and res.arac else 0
                e = int(res.hata) if res and res.hata else 0
            
            total_vehicles += v
            total_errors += e
        
        rate = float(total_errors / total_vehicles) if total_vehicles > 0 else 0.0
        return total_vehicles, total_errors, rate

    prev_v, prev_e, prev_rate = get_year_stats(year - 1)
    curr_v, curr_e, curr_rate = get_year_stats(year)

    # Get report note for current selected month
    report_note = override_dict.get(f"{year}-{month:02d}_report_note", "")
    ctx_key = f"{year}-{month:02d}"
    prev_v = parse_int(override_dict.get(f"{ctx_key}_prev_year_cnt"), prev_v)
    prev_e = parse_int(override_dict.get(f"{ctx_key}_prev_year_err"), prev_e)
    total_v = parse_int(override_dict.get(f"{ctx_key}_last_12_cnt"), total_v)
    total_e = parse_int(override_dict.get(f"{ctx_key}_last_12_err"), total_e)
    curr_v = parse_int(override_dict.get(f"{ctx_key}_curr_year_cnt"), curr_v)
    curr_e = parse_int(override_dict.get(f"{ctx_key}_curr_year_err"), curr_e)

    prev_rate = float(prev_e / prev_v) if prev_v > 0 else 0.0
    avg_12 = float(total_e / total_v) if total_v > 0 else 0.0
    curr_rate = float(curr_e / curr_v) if curr_v > 0 else 0.0
    prev_rate_override = override_dict.get(f"{year}-{month:02d}_prev_year_rate")
    avg_12_override = override_dict.get(f"{year}-{month:02d}_avg_12_month")
    curr_rate_override = override_dict.get(f"{year}-{month:02d}_current_year_rate")
    prev_rate = float(prev_rate_override) if prev_rate_override not in [None, ""] else prev_rate
    avg_12 = float(avg_12_override) if avg_12_override not in [None, ""] else avg_12
    curr_rate = float(curr_rate_override) if curr_rate_override not in [None, ""] else curr_rate

    return {
        "monthly_trend": monthly_stats,
        "summary": {
            "current_month_vehicles": monthly_stats[-1]["vehicles"] if monthly_stats else 0,
            "current_month_errors": monthly_stats[-1]["errors"] if monthly_stats else 0,
            "current_month_rate": monthly_stats[-1]["rate"] if monthly_stats else 0.0,
            "avg_12_month": avg_12,
            
            "prev_year": year - 1,
            "prev_year_rate": prev_rate,
            "prev_year_cnt": prev_v,
            "prev_year_err": prev_e,
            
            "last_12_cnt": total_v,
            "last_12_err": total_e,
            
            "current_year": year,
            "current_year_rate": curr_rate,
            "curr_year_cnt": curr_v,
            "curr_year_err": curr_e,
            "report_note": report_note
        }
    }

@router.get("/conecto")
def get_conecto_report(month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    types = ["Conecto"]
    monthly_stats = get_monthly_stats(db, types, month, year)

    # Manual overrides - apply to monthly_stats first
    overrides = db.query(models.ReportManualData).filter(models.ReportManualData.report_type == "conecto").all()
    override_dict = {f"{o.context_key}_{o.data_key}": o.data_value for o in overrides}
    
    for stat in monthly_stats:
        ctx_key = f"{stat['year']}-{stat['month_num']:02d}"
        ov_v = override_dict.get(f"{ctx_key}_vehicle_count")
        ov_e = override_dict.get(f"{ctx_key}_error_count")
        if ov_v is not None:
            v = int(ov_v)
            e = int(ov_e) if ov_e is not None else stat["errors"]
            stat["vehicles"] = v
            stat["errors"] = e
            stat["rate"] = float(e / v) if v > 0 else 0.0

    # Summary stats (computed after overrides)
    total_v = int(sum(s["vehicles"] for s in monthly_stats))
    total_e = int(sum(s["errors"] for s in monthly_stats))
    avg_12 = float(total_e / total_v) if total_v > 0 else 0.0

    # Helper function for year-wide calculation including overrides
    def get_year_stats(target_year: int):
        total_vehicles = 0
        total_errors = 0
        for m in range(1, 13):
            m_str = f"{m:02d}"
            ctx_key = f"{target_year}-{m_str}"
            ov_v = override_dict.get(f"{ctx_key}_vehicle_count")
            ov_e = override_dict.get(f"{ctx_key}_error_count")
            
            if ov_v is not None:
                v = int(ov_v)
                e = int(ov_e) if ov_e is not None else 0
            else:
                res = db.query(
                    func.count(func.distinct(models.PDIKayit.sasi_no)).label("arac"),
                    func.count(models.PDIKayit.id).label("hata")
                ).filter(
                    models.PDIKayit.arac_tipi.in_(types),
                    or_(
                        (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == str(target_year)),
                        (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == str(target_year))
                    )
                ).first()
                v = int(res.arac) if res and res.arac else 0
                e = int(res.hata) if res and res.hata else 0
            
            total_vehicles += v
            total_errors += e
        
        rate = float(total_errors / total_vehicles) if total_vehicles > 0 else 0.0
        return total_vehicles, total_errors, rate

    prev_v, prev_e, prev_rate = get_year_stats(year - 1)
    curr_v, curr_e, curr_rate = get_year_stats(year)

    # Get report note for current selected month
    report_note = override_dict.get(f"{year}-{month:02d}_report_note", "")
    ctx_key = f"{year}-{month:02d}"
    prev_v = parse_int(override_dict.get(f"{ctx_key}_prev_year_cnt"), prev_v)
    prev_e = parse_int(override_dict.get(f"{ctx_key}_prev_year_err"), prev_e)
    total_v = parse_int(override_dict.get(f"{ctx_key}_last_12_cnt"), total_v)
    total_e = parse_int(override_dict.get(f"{ctx_key}_last_12_err"), total_e)
    curr_v = parse_int(override_dict.get(f"{ctx_key}_curr_year_cnt"), curr_v)
    curr_e = parse_int(override_dict.get(f"{ctx_key}_curr_year_err"), curr_e)

    prev_rate = float(prev_e / prev_v) if prev_v > 0 else 0.0
    avg_12 = float(total_e / total_v) if total_v > 0 else 0.0
    curr_rate = float(curr_e / curr_v) if curr_v > 0 else 0.0
    prev_rate_override = override_dict.get(f"{year}-{month:02d}_prev_year_rate")
    avg_12_override = override_dict.get(f"{year}-{month:02d}_avg_12_month")
    curr_rate_override = override_dict.get(f"{year}-{month:02d}_current_year_rate")
    prev_rate = float(prev_rate_override) if prev_rate_override not in [None, ""] else prev_rate
    avg_12 = float(avg_12_override) if avg_12_override not in [None, ""] else avg_12
    curr_rate = float(curr_rate_override) if curr_rate_override not in [None, ""] else curr_rate

    return {
        "monthly_trend": monthly_stats,
        "summary": {
            "current_month_vehicles": monthly_stats[-1]["vehicles"] if monthly_stats else 0,
            "current_month_errors": monthly_stats[-1]["errors"] if monthly_stats else 0,
            "current_month_rate": monthly_stats[-1]["rate"] if monthly_stats else 0.0,
            "avg_12_month": avg_12,
            "prev_year": year - 1,
            "prev_year_rate": prev_rate,
            "prev_year_cnt": prev_v,
            "prev_year_err": prev_e,
            "last_12_cnt": total_v,
            "last_12_err": total_e,
            "current_year": year,
            "current_year_rate": curr_rate,
            "curr_year_cnt": curr_v,
            "curr_year_err": curr_e,
            "report_note": report_note
        }
    }

@router.get("/top-errors")
def get_top_errors_report(month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    top_hatalar = db.query(models.TopHata).filter(models.TopHata.aktif == 1).all()
    results: List[dict] = []
    
    m_str = f"{month:02d}"
    y_str = str(year)
    
    # Total vehicle counts for rates
    def get_totals(arac_tipi):
        raw = db.query(func.count(func.distinct(models.PDIKayit.sasi_no))).filter(
            models.PDIKayit.arac_tipi == arac_tipi,
            or_(
                (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
                (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
            )
        ).scalar()
        return int(raw) if raw else 0

    trv_total = get_totals("Travego")
    tou_total = get_totals("Tourismo")

    # Apply top5 vehicle total overrides
    top5_overrides = db.query(models.ReportManualData).filter(models.ReportManualData.report_type == "top5").all()
    top5_override_dict = {f"{o.context_key}_{o.data_key}": o.data_value for o in top5_overrides}
    ctx_key = f"{year}-{month:02d}"
    if f"{ctx_key}_trv_total" in top5_override_dict:
        trv_total = parse_int(top5_override_dict[f"{ctx_key}_trv_total"])
    if f"{ctx_key}_tou_total" in top5_override_dict:
        tou_total = parse_int(top5_override_dict[f"{ctx_key}_tou_total"])

    genel_total = trv_total + tou_total

    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    prev_m_str = f"{prev_month:02d}"
    prev_y_str = str(prev_year)

    def get_totals_for_period(arac_tipi: str, m_str: str, y_str: str):
        raw = db.query(func.count(func.distinct(models.PDIKayit.sasi_no))).filter(
            models.PDIKayit.arac_tipi == arac_tipi,
            or_(
                (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
                (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
            )
        ).scalar()
        return int(raw) if raw else 0

    prev_trv_total = get_totals_for_period("Travego", prev_m_str, prev_y_str)
    prev_tou_total = get_totals_for_period("Tourismo", prev_m_str, prev_y_str)
    prev_ctx_key = f"{prev_year}-{prev_month:02d}"
    prev_trv_total = parse_int(top5_override_dict.get(f"{prev_ctx_key}_trv_total"), prev_trv_total)
    prev_tou_total = parse_int(top5_override_dict.get(f"{prev_ctx_key}_tou_total"), prev_tou_total)

    for hata in top_hatalar:
        def get_hata_count(arac_tipi=None):
            q = db.query(func.count(models.PDIKayit.id)).filter(
                models.PDIKayit.top_hata == hata.hata_adi,
                or_(
                    (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
                    (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
                )
            )
            if arac_tipi:
                q = q.filter(models.PDIKayit.arac_tipi == arac_tipi)
            res = q.scalar()
            return int(res) if res else 0

        trv_count = get_hata_count("Travego")
        tou_count = get_hata_count("Tourismo")

        hata_ctx = top_error_context_key(year, month, hata.hata_adi)
        trv_override_key = f"{hata_ctx}_trv_error_count"
        tou_override_key = f"{hata_ctx}_tou_error_count"
        if trv_override_key in top5_override_dict:
            trv_count = parse_int(top5_override_dict[trv_override_key])
        if tou_override_key in top5_override_dict:
            tou_count = parse_int(top5_override_dict[tou_override_key])

        prev_trv_count = db.query(func.count(models.PDIKayit.id)).filter(
            models.PDIKayit.top_hata == hata.hata_adi,
            models.PDIKayit.arac_tipi == "Travego",
            or_(
                (func.substr(models.PDIKayit.tarih_saat, 4, 2) == prev_m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == prev_y_str),
                (func.substr(models.PDIKayit.tarih_saat, 6, 2) == prev_m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == prev_y_str)
            )
        ).scalar() or 0
        prev_tou_count = db.query(func.count(models.PDIKayit.id)).filter(
            models.PDIKayit.top_hata == hata.hata_adi,
            models.PDIKayit.arac_tipi == "Tourismo",
            or_(
                (func.substr(models.PDIKayit.tarih_saat, 4, 2) == prev_m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == prev_y_str),
                (func.substr(models.PDIKayit.tarih_saat, 6, 2) == prev_m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == prev_y_str)
            )
        ).scalar() or 0

        prev_hata_ctx = top_error_context_key(prev_year, prev_month, hata.hata_adi)
        prev_trv_count = parse_int(top5_override_dict.get(f"{prev_hata_ctx}_trv_error_count"), int(prev_trv_count))
        prev_tou_count = parse_int(top5_override_dict.get(f"{prev_hata_ctx}_tou_error_count"), int(prev_tou_count))

        prev_genel_count = prev_trv_count + prev_tou_count
        prev_genel_total = prev_trv_total + prev_tou_total
        prev_avg_rate = (prev_genel_count / prev_genel_total * 100) if prev_genel_total > 0 else 0

        genel_count = trv_count + tou_count
        avg_rate = (genel_count / genel_total * 100) if genel_total > 0 else 0
        change_pct = 0.0
        if prev_avg_rate > 0:
            change_pct = ((avg_rate - prev_avg_rate) / prev_avg_rate) * 100
        elif avg_rate > 0:
            change_pct = 100.0

        if change_pct > 25:
            trend_status = "Dikkat"
            trend_color = "red"
        elif change_pct > 0:
            trend_status = "Artış"
            trend_color = "orange"
        else:
            trend_status = "Düşüş"
            trend_color = "green"
        
        results.append({
            "hata_adi": hata.hata_adi,
            "trv_count": trv_count,
            "tou_count": tou_count,
            "genel_count": genel_count,
            "trv_rate": (trv_count / trv_total * 100) if trv_total > 0 else 0,
            "tou_rate": (tou_count / tou_total * 100) if tou_total > 0 else 0,
            "avg_rate": avg_rate,
            "prev_avg_rate": prev_avg_rate,
            "change_pct": change_pct,
            "trend_status": trend_status,
            "trend_color": trend_color
        })
        
    sorted_results = sorted(results, key=lambda x: x["genel_count"], reverse=True)[:10]

    return {
        "results": sorted_results,
        "overrides": top5_override_dict,
        "totals": {"trv": trv_total, "tou": tou_total, "genel": genel_total}
    }

@router.get("/error-trend")
def get_error_trend(hata_adi: str = Query(...), month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    monthly_data = {"TRV": [], "TOU": []}
    top5_overrides = db.query(models.ReportManualData).filter(
        models.ReportManualData.report_type == "top5"
    ).all()
    top5_override_dict = {f"{o.context_key}_{o.data_key}": o.data_value for o in top5_overrides}
    
    for i in range(12):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        
        m_str = f"{m:02d}"
        y_str = str(y)
        
        def get_stats(arac_tipi):
            total = db.query(func.count(func.distinct(models.PDIKayit.sasi_no))).filter(
                models.PDIKayit.arac_tipi == arac_tipi,
                or_(
                    (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
                    (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
                )
            ).scalar() or 0
            
            hata = db.query(func.count(models.PDIKayit.id)).filter(
                models.PDIKayit.arac_tipi == arac_tipi,
                models.PDIKayit.top_hata == hata_adi,
                or_(
                    (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
                    (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
                )
            ).scalar() or 0

            ctx_key = f"{y}-{m:02d}"
            if arac_tipi == "Travego":
                total = parse_int(top5_override_dict.get(f"{ctx_key}_trv_total"), int(total))
                hata = parse_int(
                    top5_override_dict.get(f"{top_error_context_key(y, m, hata_adi)}_trv_error_count"),
                    int(hata)
                )
            else:
                total = parse_int(top5_override_dict.get(f"{ctx_key}_tou_total"), int(total))
                hata = parse_int(
                    top5_override_dict.get(f"{top_error_context_key(y, m, hata_adi)}_tou_error_count"),
                    int(hata)
                )

            return {"ay": TURKISH_MONTHS[m][:3], "arac": int(total), "hata": int(hata), "oran": float(hata / total) if total > 0 else 0.0}

        monthly_data["TRV"].insert(0, get_stats("Travego"))
        monthly_data["TOU"].insert(0, get_stats("Tourismo"))
        
    return monthly_data

@router.get("/conecto-top3")
def get_conecto_top3(month: int = Query(None), year: int = Query(None), db: Session = Depends(get_db)):
    date_filter = []
    if month and year:
        m_str = f"{month:02d}"
        y_str = str(year)
        date_filter = [
            or_(
                (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str) & (func.cast(func.substr(models.PDIKayit.tarih_saat, 4, 2), models.Integer) <= month),
                (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str) & (func.cast(func.substr(models.PDIKayit.tarih_saat, 6, 2), models.Integer) <= month)
            )
        ]

    query_total = db.query(func.count(models.PDIKayit.id)).filter(models.PDIKayit.arac_tipi == 'Conecto')
    if date_filter:
        query_total = query_total.filter(*date_filter)
    total_errors = query_total.scalar() or 0

    query_top = db.query(
        models.PDIKayit.top_hata,
        func.count(models.PDIKayit.id).label("cnt")
    ).filter(
        models.PDIKayit.arac_tipi == 'Conecto',
        models.PDIKayit.top_hata != None,
        models.PDIKayit.top_hata != ''
    )
    if date_filter:
        query_top = query_top.filter(*date_filter)
    
    top_hatalar = query_top.group_by(models.PDIKayit.top_hata).order_by(func.count(models.PDIKayit.id).desc()).limit(3).all()

    results = []
    for hata, cnt in top_hatalar:
        oran = cnt / total_errors if total_errors > 0 else 0
        results.append({'hata_adi': hata, 'ytd_sayi': cnt, 'oran': oran})

    return {'results': results, 'total_errors': total_errors}

@router.get("/imalat")
def get_imalat_report(month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    m_str = f"{month:02d}"
    y_str = str(year)

    records = db.query(models.PDIKayit).filter(
        models.PDIKayit.hata_nerede == "İmalat",
        or_(
            (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
            (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
        )
    ).order_by(models.PDIKayit.id.asc()).all()

    unique_vehicles = len(set(r.sasi_no for r in records if r.sasi_no))
    error_count = len(records)
    
    # Manual overrides
    overrides = db.query(models.ReportManualData).filter(
        models.ReportManualData.report_type == "imalat",
        models.ReportManualData.context_key == f"{year}-{month:02d}"
    ).all()
    override_dict = {o.data_key: o.data_value for o in overrides}
    
    if "vehicle_count" in override_dict and override_dict["vehicle_count"].strip():
        unique_vehicles = int(override_dict["vehicle_count"])
    if "error_count" in override_dict and override_dict["error_count"].strip():
        error_count = int(override_dict["error_count"])

    record_list = [{"sasi_no": r.sasi_no, "bb_no": r.bb_no, "tarih_saat": r.tarih_saat, "tespitler": r.hata_konumu or r.tespitler or ""} for r in records]

    return {"summary": {"count": unique_vehicles, "error_count": error_count}, "records": record_list}

@router.get("/imalat-oranlar")
def get_imalat_oranlar(year1: int = Query(...), year2: int = Query(...), db: Session = Depends(get_db)):
    month_names = ["", "OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"]
    result = []
    for m in range(1, 13):
        m_str = f"{m:02d}"
        row = {"month": month_names[m]}
        for yr in [year1, year2]:
            y_str = str(yr)
            total = db.query(func.count(func.distinct(models.PDIKayit.sasi_no))).filter(
                or_(
                    (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
                    (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
                )
            ).scalar() or 0
            imalat = db.query(func.count(func.distinct(models.PDIKayit.sasi_no))).filter(
                models.PDIKayit.hata_nerede == "İmalat",
                or_(
                    (func.substr(models.PDIKayit.tarih_saat, 4, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str),
                    (func.substr(models.PDIKayit.tarih_saat, 6, 2) == m_str) & (func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str)
                )
            ).scalar() or 0
            pct = round((imalat / total * 100), 1) if total > 0 else None
            row[f"year{yr}"] = pct
        result.append(row)
    return {"data": result, "year1": year1, "year2": year2}

@router.get("/imalat-top-hata")
def get_imalat_top_hata(month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    y_str = str(year)
    ytd_records = db.query(models.PDIKayit).filter(
        models.PDIKayit.hata_nerede == "İmalat",
        or_(
            func.substr(models.PDIKayit.tarih_saat, 7, 4) == y_str,
            func.substr(models.PDIKayit.tarih_saat, 1, 4) == y_str
        )
    ).all()

    def extract_month(tarih):
        if tarih and len(tarih) >= 7:
            if len(tarih) > 4 and tarih[2] == '-':
                try: return int(tarih[3:5])
                except: pass
            elif len(tarih) > 6 and tarih[4] == '-':
                try: return int(tarih[5:7])
                except: pass
        return 0

    filtered = [r for r in ytd_records if extract_month(r.tarih_saat) <= month]
    unique_vehicles = len(set(r.sasi_no for r in filtered if r.sasi_no))
    total_errors = len(filtered)

    from collections import Counter
    hata_counts = Counter(r.top_hata for r in filtered if r.top_hata)
    results = [{"hata_adi": h, "count": c, "oran": round(c / total_errors * 100, 1) if total_errors > 0 else 0} for h, c in hata_counts.most_common()]

    return {"results": results, "unique_vehicles": unique_vehicles, "total_errors": total_errors}
