# PDI Kayıt Sistemi – Streamlit (Supabase Postgres + Supabase Storage)

import os
import uuid
import mimetypes
from io import BytesIO
from datetime import date, timedelta

import pandas as pd
import streamlit as st
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from urllib.parse import quote_plus
from supabase import create_client, Client

# --------------------------- Sabitler ---------------------------
ALT_GRUP = ["Boya", "Süsleme", "Mekanik", "Elektrik,Hepsi"]
HATA_KONUM = [
    "Aydınlatma","Ayırma Duvarı","Ayna","Boya","CAM","Çıta","Defroster","Etiket",
    "Kapak","Kapı","Kaplama","Kelepçe","Klima","Koltuk","Körük","Lamba","Montaj",
    "Motor","Mutfak","Paket Raf","Silecek","Siperlik","Stepne","Şoför yatma yeri",
    "Tapa","Telefon","Torpido","Yazı"
]
ARAC_TIPI = ["Tourismo", "Connecto", "Travego"]

st.set_page_config(page_title="PDI Kayıt Sistemi", layout="wide")

# --- form reset için nonce ---
if "form_nonce" not in st.session_state:
    st.session_state["form_nonce"] = 0

# --------------------- Postgres bağlantı ------------------------
def build_db_url_and_args():
    if "db" in st.secrets:
        s = st.secrets["db"]
        user = s.get("user", "postgres")
        pwd  = quote_plus(s.get("password", ""))
        host = s["host"]
        port = s.get("port", "6543")                 # Supabase pooler
        name = s.get("name", "postgres")
        ssl  = s.get("sslmode", "require")
        url = f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{name}?sslmode={ssl}"
        return url, {}
    url = st.secrets.get("db_url", os.getenv("DB_URL", ""))
    return url, {}

DB_URL, CONNECT_ARGS = build_db_url_and_args()
if not DB_URL:
    st.error("Veritabanı bağlantısı bulunamadı. secrets.toml içinde db_url ya da [db] girin.")
    st.stop()

def try_connect(url, connect_args):
    eng = create_engine(url, pool_pre_ping=True, connect_args=connect_args)
    with eng.connect() as c:
        c.execute(text("SELECT 1"))
    return eng

try:
    engine = try_connect(DB_URL, CONNECT_ARGS)
except OperationalError:
    if ":6543/" in DB_URL:
        alt = DB_URL.replace(":6543/", ":5432/")
        try:
            engine = try_connect(alt, CONNECT_ARGS)
        except OperationalError:
            st.error("Veritabanına bağlanılamadı. Pooler bilgisi (user=postgres.<ref>, port=6543, sslmode=require) ve şifreyi kontrol edin.")
            st.stop()
    else:
        st.error("Veritabanına bağlanılamadı. Host/port/SSL bilgilerini kontrol edin.")
        st.stop()

# --------------------- Supabase Storage -------------------------
def get_supabase():
    sb = st.secrets.get("supabase")
    if not sb:
        return None, None
    url = sb.get("url")
    key = sb.get("service_role")
    bucket = sb.get("bucket", "pdi-fotolar")
    if not url or not key:
        return None, None
    client: Client = create_client(url, key)
    return client, bucket

def ensure_bucket_public(client: Client, bucket: str):
    """Bucket yoksa public olarak oluştur (SDK sürümleriyle uyumlu)."""
    try:
        client.storage.get_bucket(bucket)
        return
    except Exception:
        pass
    try:
        client.storage.create_bucket(bucket, {"public": True})
    except TypeError:
        try:
            client.storage.create_bucket(bucket, options={"public": True})
        except Exception:
            client.storage.create_bucket(bucket)  # son çare (policy'i sonradan panelden public yapabilirsiniz)

def upload_files_to_storage(files) -> list[str]:
    """Streamlit UploadedFile listesini Supabase Storage'a yükler, public URL döner."""
    client, bucket = get_supabase()
    if client is None:
        st.error("Fotoğraf yüklemek için Secrets’e [supabase] {url, service_role, bucket} ekleyin.")
        return []

    ensure_bucket_public(client, bucket)

    urls: list[str] = []
    for f in files:
        ext = os.path.splitext(f.name)[1].lower() or ".jpg"
        key = f"pdi/{date.today().isoformat()}/{uuid.uuid4().hex}{ext}"
        data = f.read()
        ctype = f.type or mimetypes.guess_type(f.name)[0] or "application/octet-stream"

        # upload imzası sürüme göre değişebiliyor: önce yeni imza, olmazsa eski
        try:
            client.storage.from_(bucket).upload(
                file=data,
                path=key,
                file_options={"contentType": ctype, "upsert": True},
            )
        except TypeError:
            client.storage.from_(bucket).upload(path=key, file=data)

        public_url = client.storage.from_(bucket).get_public_url(key)
        urls.append(public_url)

    return urls

# --------------------- İlk kurulum ------------------------------
def init_db():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users(
                username TEXT PRIMARY KEY,
                password TEXT,
                role INT,
                aciklama TEXT
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS pdi_kayitlari(
                id SERIAL PRIMARY KEY,
                bb_no TEXT,
                sasi_no TEXT,
                arac_tipi TEXT,
                is_emri_no TEXT,
                alt_grup TEXT,
                tespitler TEXT,
                hata_konumu TEXT,
                fotograf_yolu TEXT,
                tarih_saat TEXT,
                kullanici TEXT
            );
        """))
        conn.execute(text("""
            INSERT INTO users(username,password,role,aciklama)
            VALUES ('admin','admin123',1,'Sistem Yöneticisi')
            ON CONFLICT (username) DO NOTHING;
        """))

init_db()

# ----------------------- Giriş ----------------------------------
def login_form():
    st.title("PDI Kayıt Sistemi – Giriş")
    u = st.text_input("Kullanıcı adı", key="login_u")
    p = st.text_input("Şifre", type="password", key="login_p")
    if st.button("Giriş", key="btn_login"):
        with engine.begin() as conn:
            row = conn.execute(
                text("SELECT role FROM users WHERE username=:u AND password=:p"),
                {"u": u, "p": p}
            ).fetchone()
        if row:
            st.session_state["user"] = u
            st.session_state["role"] = "admin" if row[0] == 1 else "viewer"
            st.rerun()
        else:
            st.error("Kullanıcı adı veya şifre hatalı.")

if "user" not in st.session_state:
    login_form()
    st.stop()

user = st.session_state["user"]
role = st.session_state.get("role", "viewer")

with st.sidebar:
    st.markdown(f"**Giriş yapan:** {user} ({role})")
    if st.button("Çıkış", key="btn_logout"):
        for k in ("user", "role"):
            st.session_state.pop(k, None)
        st.rerun()

st.title("PDI Kayıtları")

# ----------------------- Filtreler ------------------------------
c1, c2, c3, c4, c5, c6 = st.columns([1.2, 1.5, 1.2, 1.5, 1.5, 1.2])
f_sasi = c1.text_input("Şasi No (içeren)", key="flt_sasi")
d1, d2 = c2.date_input("Tarih Aralığı",
                       (date.today() - timedelta(days=7), date.today()),
                       key="flt_tarih", format="DD.MM.YYYY")
f_alt  = c3.selectbox("Alt Grup", ["Tümü"] + ALT_GRUP, key="flt_alt")
f_hata = c4.selectbox("Hata Konumu", ["Tümü"] + HATA_KONUM, key="flt_hata")
f_kul  = c5.text_input("Kullanıcı (boş=hepsi)", key="flt_kul")
f_arac = c6.selectbox("Araç Tipi", ["Tümü"] + ARAC_TIPI, key="flt_arac")

where = ["1=1"]
params = {"d1": d1.strftime("%Y%m%d"), "d2": d2.strftime("%Y%m%d")}
if f_sasi:
    where.append("sasi_no ILIKE :sasi"); params["sasi"] = f"%{f_sasi}%"
if f_alt != "Tümü":
    where.append("alt_grup = :alt"); params["alt"] = f_alt
if f_hata != "Tümü":
    where.append("hata_konumu ILIKE :hk"); params["hk"] = f"%{f_hata}%"
if f_kul:
    where.append("kullanici = :u"); params["u"] = f_kul
if f_arac != "Tümü":
    where.append("arac_tipi = :arac"); params["arac"] = f_arac
where.append("(substr(tarih_saat,7,4)||substr(tarih_saat,4,2)||substr(tarih_saat,1,2)) BETWEEN :d1 AND :d2")

SQL_LIST = f"""
SELECT id,
       bb_no AS "BB No",
       sasi_no AS "Şasi No",
       arac_tipi AS "Araç Tipi",
       is_emri_no AS "İş Emri No",
       tarih_saat AS "PDI Yapılış Tarihi",
       tespitler AS "Tespitler",
       hata_konumu AS "Hata Konumu",
       alt_grup AS "Alt Grup",
       kullanici AS "Kullanıcı",
       fotograf_yolu
FROM pdi_kayitlari
WHERE {' AND '.join(where)}
ORDER BY id DESC;
"""

with engine.begin() as conn:
    df = pd.read_sql(text(SQL_LIST), conn, params=params)

st.dataframe(df.drop(columns=["fotograf_yolu"]), use_container_width=True, height=420)

# --------------------- Excel Çıktısı ----------------------------
def df_to_xlsx_bytes(frame: pd.DataFrame) -> bytes:
    from openpyxl.workbook import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill
    wb = Workbook(); ws = wb.active; ws.title = "PDI"
    cols = ["BB No","Şasi No","Araç Tipi","İş Emri No","PDI Yapılış Tarihi",
            "Tespitler","Hata Konumu","Alt Grup"]
    ws.append(cols)
    for row in frame[cols].itertuples(index=False):
        ws.append(list(row))
    header_fill = PatternFill("solid", fgColor="3F4C5C")
    header_font = Font(bold=True, color="FFFFFF")
    for cell in ws[1]:
        cell.fill = header_fill; cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
    buf = BytesIO(); wb.save(buf); return buf.getvalue()

st.download_button(
    "Excel indir",
    data=df_to_xlsx_bytes(df),
    file_name="pdi_kayitlari.xlsx",
    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    key="btn_excel"
)

# --------------------- 📷 Fotoğraf Galerisi ----------------------
with st.expander("📷 Fotoğraf Galerisi", expanded=False):
    g1, g2, g3, g4, g5 = st.columns([1.2, 1.6, 1.2, 1.2, 1])
    gal_sasi = g1.text_input("Şasi No (içeren)", key="gal_sasi")
    gal_d1, gal_d2 = g2.date_input(
        "Tarih Aralığı",
        (date.today() - timedelta(days=30), date.today()),
        key="gal_tarih",
        format="DD.MM.YYYY"
    )
    gal_alt = g3.selectbox("Alt Grup", ["Tümü"] + ALT_GRUP, key="gal_alt")
    gal_arac = g4.selectbox("Araç Tipi", ["Tümü"] + ARAC_TIPI, key="gal_arac")
    thumb = g5.slider("Önizleme", min_value=100, max_value=400, value=180, key="gal_size")

    gal_where = [
        "fotograf_yolu IS NOT NULL",
        "length(trim(fotograf_yolu)) > 0",
        "(substr(tarih_saat,7,4)||substr(tarih_saat,4,2)||substr(tarih_saat,1,2)) BETWEEN :d1 AND :d2"
    ]
    gal_params = {"d1": gal_d1.strftime("%Y%m%d"), "d2": gal_d2.strftime("%Y%m%d")}
    if gal_sasi:
        gal_where.append("sasi_no ILIKE :sasi"); gal_params["sasi"] = f"%{gal_sasi}%"
    if gal_alt != "Tümü":
        gal_where.append("alt_grup = :alt"); gal_params["alt"] = gal_alt
    if gal_arac != "Tümü":
        gal_where.append("arac_tipi = :arac"); gal_params["arac"] = gal_arac

    GAL_SQL = f"""
    SELECT id,
           sasi_no AS "Şasi No",
           arac_tipi AS "Araç Tipi",
           alt_grup  AS "Alt Grup",
           hata_konumu AS "Hata Konumu",
           tarih_saat AS "PDI Yapılış Tarihi",
           fotograf_yolu
    FROM pdi_kayitlari
    WHERE {' AND '.join(gal_where)}
    ORDER BY id DESC;
    """
    with engine.begin() as conn:
        gal_df = pd.read_sql(text(GAL_SQL), conn, params=gal_params)

    st.caption(f"Toplam fotoğraflı kayıt: **{len(gal_df)}**")

    if gal_df.empty:
        st.info("Seçili filtrelerle fotoğraf bulunamadı.")
    else:
        for _, r in gal_df.iterrows():
            urls = [u.strip() for u in (r["fotograf_yolu"] or "").split(",") if u.strip()]
            if not urls:
                continue
            st.markdown(
                f'**ID #{int(r["id"])}** • **{r["Şasi No"]}** • {r["PDI Yapılış Tarihi"]} • '
                f'{r["Araç Tipi"]} • {r["Alt Grup"]} • {r["Hata Konumu"] or ""}'
            )
            st.image(urls, width=thumb, clamp=True)
            links = " | ".join(f"[{i+1}]({u})" for i, u in enumerate(urls[:10]))
            if links:
                st.caption("Bağlantılar: " + links)
            st.divider()

st.markdown("---")

# --------------------- Yeni Kayıt Ekle --------------------------
nonce = st.session_state["form_nonce"]
with st.expander("➕ Yeni Kayıt Ekle", expanded=False):
    col1, col2, col3 = st.columns(3)
    bb_no   = col1.text_input("BB No", key=f"new_bb_{nonce}")
    sasi_no = col2.text_input("Şasi No", key=f"new_sasi_{nonce}")
    arac    = col3.selectbox("Araç Tipi", ARAC_TIPI, key=f"new_arac_{nonce}")

    col4, col5, col6 = st.columns(3)
    is_emri   = col4.text_input("İş Emri No", key=f"new_isemri_{nonce}")
    pdi_tarih = col5.date_input("PDI Yapılış Tarihi", value=date.today(),
                                key=f"new_tarih_{nonce}", format="DD.MM.YYYY")
    alt_grup  = col6.selectbox("Alt Grup", ALT_GRUP, key=f"new_alt_{nonce}")

    tespitler = st.text_area("Tespitler", height=120, key=f"new_tespit_{nonce}")
    hata_konumu_sel = st.multiselect("Hata Konumu", HATA_KONUM,
                                     key=f"new_hata_{nonce}", placeholder="Seçiniz…")

    uploaded_files = st.file_uploader(
        "Fotoğraf yükle (birden fazla seçebilirsiniz)",
        type=["png","jpg","jpeg"], accept_multiple_files=True,
        key=f"new_upload_{nonce}"
    )

    if st.button("Kaydı Ekle", key=f"btn_ekle_{nonce}"):
        if not sasi_no:
            st.warning("Şasi No gerekli.")
        else:
            photo_urls = upload_files_to_storage(uploaded_files) if uploaded_files else []
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT INTO pdi_kayitlari
                    (bb_no, sasi_no, arac_tipi, is_emri_no, alt_grup, tespitler,
                     hata_konumu, fotograf_yolu, tarih_saat, kullanici)
                    VALUES (:bb, :sasi, :arac, :isn, :alt, :t, :hk, :fp, :ts, :kul)
                """), {
                    "bb": (bb_no or "").strip(),
                    "sasi": (sasi_no or "").strip(),
                    "arac": arac,
                    "isn": (is_emri or "").strip(),
                    "alt": alt_grup,
                    "t": (tespitler or "").strip(),
                    "hk": ", ".join(hata_konumu_sel),
                    "fp": ", ".join(photo_urls),
                    "ts": pdi_tarih.strftime("%d-%m-%Y") + " 00:00:00",
                    "kul": user
                })
            st.success("Kayıt eklendi.")
            st.session_state["form_nonce"] += 1  # formu tamamen sıfırla
            st.rerun()

# --------------------- Düzenleme (admin) ------------------------
if role != "admin":
    st.info("Kayıt düzenleme yalnızca admin için açıktır.")
else:
    with st.expander("✏️ Kayıt Düzenle", expanded=False):
        if df.empty:
            st.warning("Düzenlenecek kayıt yok.")
        else:
            rid = st.selectbox("Kayıt seç (ID)", df["id"], key="edit_rid")
            rec = df[df["id"] == rid].iloc[0]

            c1, c2, c3 = st.columns(3)
            e_bb   = c1.text_input("BB No", rec["BB No"] or "", key=f"edit_bb_{rid}")
            e_sasi = c2.text_input("Şasi No", rec["Şasi No"] or "", key=f"edit_sasi_{rid}")
            idx_arac = ARAC_TIPI.index(rec["Araç Tipi"]) if rec["Araç Tipi"] in ARAC_TIPI else 0
            e_arac = c3.selectbox("Araç Tipi", ARAC_TIPI, index=idx_arac, key=f"edit_arac_{rid}")

            c4, c5, c6 = st.columns(3)
            e_isemri = c4.text_input("İş Emri No", rec["İş Emri No"] or "", key=f"edit_isemri_{rid}")
            ds = (rec["PDI Yapılış Tarihi"] or "01-01-2000").split(" ")[0]
            d_default = pd.to_datetime(ds, format="%d-%m-%Y", errors="coerce").date() if ds else date.today()
            e_tarih = c5.date_input("PDI Yapılış Tarihi", value=d_default,
                                    key=f"edit_tarih_{rid}", format="DD.MM.YYYY")
            idx_alt = ALT_GRUP.index(rec["Alt Grup"]) if rec["Alt Grup"] in ALT_GRUP else 0
            e_alt = c6.selectbox("Alt Grup", ALT_GRUP, index=idx_alt, key=f"edit_alt_{rid}")

            e_tespit = st.text_area("Tespitler", rec["Tespitler"] or "", height=120, key=f"edit_tespit_{rid}")
            mevcut_hk = [h.strip() for h in (rec["Hata Konumu"] or "").split(",") if h.strip()]
            e_hk = st.multiselect("Hata Konumu", HATA_KONUM,
                                  default=[h for h in mevcut_hk if h in HATA_KONUM],
                                  key=f"edit_hata_{rid}")

            eski_urls = (rec["fotograf_yolu"] or "").split(",")
            eski_urls = [u.strip() for u in eski_urls if u.strip()]
            if eski_urls:
                st.caption("Kayıtlı fotoğraflar (ilk 3):")
                st.image(eski_urls[:3], width=180)

            yeni_fotolar = st.file_uploader(
                "Yeni fotoğraf(lar) ekle (opsiyonel)",
                type=["png","jpg","jpeg"], accept_multiple_files=True,
                key=f"edit_upload_{rid}"
            )

            col_btn1, col_btn2 = st.columns([1,1])
            if col_btn1.button("Güncelle", key=f"btn_guncelle_{rid}"):
                add_urls = upload_files_to_storage(yeni_fotolar) if yeni_fotolar else []
                merged_urls = ", ".join([u for u in (eski_urls + add_urls) if u])
                ts = e_tarih.strftime("%d-%m-%Y") + " 00:00:00"
                with engine.begin() as conn:
                    conn.execute(text("""
                        UPDATE pdi_kayitlari SET
                          bb_no=:bb, sasi_no=:sasi, arac_tipi=:arac, is_emri_no=:isn,
                          alt_grup=:alt, tespitler=:t, hata_konumu=:hk, tarih_saat=:ts,
                          fotograf_yolu=:fp
                        WHERE id=:id
                    """), {
                        "bb": (e_bb or "").strip(),
                        "sasi": (e_sasi or "").strip(),
                        "arac": e_arac,
                        "isn": (e_isemri or "").strip(),
                        "alt": e_alt, "t": (e_tespit or "").strip(),
                        "hk": ", ".join(e_hk), "ts": ts, "fp": merged_urls, "id": int(rid)
                    })
                st.success("Kayıt güncellendi.")
                st.rerun()

            if col_btn2.button("Sil", key=f"btn_sil_{rid}"):
                with engine.begin() as conn:
                    conn.execute(text("DELETE FROM pdi_kayitlari WHERE id=:id"), {"id": int(rid)})
                st.success("Kayıt silindi.")
                st.rerun()

# --------------------- Kullanıcı Yönetimi (yalnız admin) --------
st.subheader("Kullanıcı Yönetimi")
if role != "admin":
    st.info("Bu bölüm yalnızca admin için görünür.")
else:
    with st.expander("➕ Yeni Kullanıcı Ekle", expanded=False):
        nu = st.text_input("Kullanıcı adı", key="usr_add_u")
        npw = st.text_input("Şifre", type="password", key="usr_add_p")
        nrole = st.selectbox("Rol", ["Kullanıcı", "Yönetici"], index=0, key="usr_add_r")
        nacik = st.text_input("Açıklama", key="usr_add_a")
        if st.button("Ekle", key="usr_add_btn"):
            if not nu or not npw:
                st.warning("Kullanıcı adı ve şifre boş olamaz.")
            else:
                try:
                    with engine.begin() as conn:
                        conn.execute(
                            text("""
                                INSERT INTO users (username,password,role,aciklama)
                                VALUES (:u,:p,:r,:a)
                            """),
                            {"u": nu.strip(), "p": npw, "r": 1 if nrole=="Yönetici" else 0, "a": nacik.strip()}
                        )
                    st.success(f'"{nu}" kullanıcısı eklendi.')
                    st.rerun()
                except Exception:
                    st.error("Kullanıcı eklenemedi. (Muhtemelen kullanıcı adı mevcut.)")

    st.markdown("### Mevcut kullanıcılar")
    with engine.begin() as conn:
        df_users = pd.read_sql(text("SELECT username, role, aciklama FROM users ORDER BY username"), conn)

    for _, row in df_users.iterrows():
        u = row["username"]
        rol_txt = "Yönetici" if row["role"] == 1 else "Kullanıcı"
        c1, c2, c3, c4, c5 = st.columns([2,1.2,3,1.4,1])
        c1.write(f"**{u}**")
        c2.write(rol_txt)
        new_pw = c3.text_input("Yeni şifre", type="password", key=f"usr_reset_{u}", placeholder="(opsiyonel)")
        if c4.button("Şifre Kaydet", key=f"usr_reset_btn_{u}"):
            if not new_pw:
                st.warning("Yeni şifre boş olamaz.")
            else:
                with engine.begin() as conn:
                    conn.execute(text("UPDATE users SET password=:p WHERE username=:u"), {"p": new_pw, "u": u})
                st.success(f'"{u}" şifresi güncellendi.')
                st.rerun()
        if c5.button("Sil", key=f"usr_del_{u}"):
            if u == "admin":
                st.warning("admin kullanıcısı silinemez.")
            else:
                with engine.begin() as conn:
                    conn.execute(text("DELETE FROM users WHERE username=:u"), {"u": u})
                st.success(f'"{u}" silindi.')
                st.rerun()
