using Microsoft.Data.Sqlite;
using System;
using System.IO;

namespace PDI_WPF.Data
{
    public class DatabaseService
    {
        private readonly string _dbPath;

        public DatabaseService()
        {
            _dbPath = Path.Combine(Environment.CurrentDirectory, "pdi_veritabani.db");
            InitializeDatabase();
        }

        public SqliteConnection GetConnection() => new SqliteConnection($"Data Source={_dbPath}");

        private void InitializeDatabase()
        {
            using var conn = GetConnection();
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                -- Kullanıcılar tablosu
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY, 
                    password TEXT, 
                    role INTEGER, 
                    aciklama TEXT
                );
                
                -- PDI kayıtları tablosu
                CREATE TABLE IF NOT EXISTS pdi_kayitlari (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    bb_no TEXT, 
                    sasi_no TEXT, 
                    arac_tipi TEXT,
                    is_emri_no TEXT, 
                    alt_grup TEXT, 
                    tespitler TEXT, 
                    hata_konumu TEXT, 
                    fotograf_yolu TEXT,
                    tarih_saat TEXT, 
                    kullanici TEXT, 
                    duzenleyen TEXT, 
                    grup_no TEXT, 
                    parca_tanimi TEXT,
                    hata_tanimi TEXT, 
                    top_hata TEXT
                );
                
                -- İmalat kayıtları tablosu
                CREATE TABLE IF NOT EXISTS imalat_kayitlari (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    arac_no TEXT, 
                    tarih TEXT, 
                    adet INTEGER DEFAULT 1,
                    top_hata TEXT, 
                    hata_metni TEXT, 
                    durum TEXT DEFAULT 'Bekleniyor', 
                    kullanici TEXT
                );
                
                -- Top hatalar tablosu (standartlaştırılmış hata isimleri)
                CREATE TABLE IF NOT EXISTS top_hatalar (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hata_adi TEXT UNIQUE,
                    aktif INTEGER DEFAULT 1
                );
                
                -- Manuel rapor verileri tablosu (override veriler)
                CREATE TABLE IF NOT EXISTS report_manual_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    report_type TEXT,
                    context_key TEXT,
                    data_key TEXT,
                    data_value TEXT,
                    UNIQUE(report_type, context_key, data_key)
                );
                
                -- Varsayılan admin kullanıcısı
                INSERT OR IGNORE INTO users VALUES ('admin', 'admin123', 1, 'Sistem Yöneticisi');
                
                -- Varsayılan top hatalar
                INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES ('Boya');
                INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES ('Uyumsuzluk');
                INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES ('Çizik');
                INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES ('Leke');
                INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES ('Montaj Hatası');
                INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES ('Mekanik');
                INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES ('Elektrik');
                INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES ('Döşeme');
            ";
            cmd.ExecuteNonQuery();
        }

        #region Manual Data Operations
        
        /// <summary>
        /// Manuel rapor verisini kaydet veya güncelle
        /// </summary>
        public void SaveManualData(string reportType, string contextKey, string dataKey, string value)
        {
            using var conn = GetConnection();
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO report_manual_data (report_type, context_key, data_key, data_value) 
                VALUES (@rt, @ck, @dk, @dv)
                ON CONFLICT(report_type, context_key, data_key) 
                DO UPDATE SET data_value = @dv";
            cmd.Parameters.AddWithValue("@rt", reportType);
            cmd.Parameters.AddWithValue("@ck", contextKey);
            cmd.Parameters.AddWithValue("@dk", dataKey);
            cmd.Parameters.AddWithValue("@dv", value);
            cmd.ExecuteNonQuery();
        }

        /// <summary>
        /// Manuel rapor verisini al (yoksa null döner)
        /// </summary>
        public string? GetManualData(string reportType, string contextKey, string dataKey)
        {
            using var conn = GetConnection();
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                SELECT data_value FROM report_manual_data 
                WHERE report_type = @rt AND context_key = @ck AND data_key = @dk";
            cmd.Parameters.AddWithValue("@rt", reportType);
            cmd.Parameters.AddWithValue("@ck", contextKey);
            cmd.Parameters.AddWithValue("@dk", dataKey);
            var result = cmd.ExecuteScalar();
            return result?.ToString();
        }

        #endregion

        #region Top Hata Operations

        /// <summary>
        /// Aktif top hataları getir
        /// </summary>
        public List<string> GetActiveTopHatalar()
        {
            using var conn = GetConnection();
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT hata_adi FROM top_hatalar WHERE aktif = 1 ORDER BY hata_adi";
            
            var result = new List<string>();
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                result.Add(reader.GetString(0));
            }
            return result;
        }

        /// <summary>
        /// Yeni top hata ekle
        /// </summary>
        public void AddTopHata(string hataAdi)
        {
            using var conn = GetConnection();
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT OR IGNORE INTO top_hatalar (hata_adi) VALUES (@ha)";
            cmd.Parameters.AddWithValue("@ha", hataAdi);
            cmd.ExecuteNonQuery();
        }

        /// <summary>
        /// Top hatayı sil (pasifleştir)
        /// </summary>
        public void DeleteTopHata(string hataAdi)
        {
            using var conn = GetConnection();
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "UPDATE top_hatalar SET aktif = 0 WHERE hata_adi = @ha";
            cmd.Parameters.AddWithValue("@ha", hataAdi);
            cmd.ExecuteNonQuery();
        }

        #endregion
    }
}
