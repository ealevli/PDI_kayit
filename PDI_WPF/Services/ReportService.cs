using Microsoft.Data.Sqlite;
using PDI_WPF.Data;
using PDI_WPF.Models;
using System;
using System.Collections.Generic;

namespace PDI_WPF.Services
{
    /// <summary>
    /// Rapor hesaplama ve manuel override yönetimi servisi
    /// Python'daki calculate_monthly_data, get_top5_hata_analysis fonksiyonlarının karşılığı
    /// </summary>
    public class ReportService
    {
        private readonly DatabaseService _db;

        // Türkçe ay isimleri (Python'daki TURKISH_MONTHS)
        private static readonly string[] TURKISH_MONTHS = {
            "", "OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN",
            "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"
        };

        private static readonly string[] TURKISH_MONTHS_SHORT = {
            "", "OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ",
            "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"
        };

        public ReportService()
        {
            _db = new DatabaseService();
        }

        #region Manual Data Operations

        public void SaveManualData(string reportType, string contextKey, string dataKey, string value)
        {
            _db.SaveManualData(reportType, contextKey, dataKey, value);
        }

        public string? GetManualData(string reportType, string contextKey, string dataKey)
        {
            return _db.GetManualData(reportType, contextKey, dataKey);
        }

        #endregion

        #region Monthly Report Data

        /// <summary>
        /// Aylık rapor verilerini hesapla (Python'daki calculate_monthly_data)
        /// </summary>
        /// <param name="aracTipleri">Araç tipleri ("Tourismo", "Travego" veya "Connecto")</param>
        /// <param name="month">Ay (1-12)</param>
        /// <param name="year">Yıl</param>
        /// <returns>Aylık rapor verileri</returns>
        /// <summary>
        /// Aylık rapor verilerini hesapla (manuel override'lar dahil)
        /// </summary>
        public MonthlyReportData CalculateMonthlyData(string[] aracTipleri, int month, int year, string contextKey)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            var monthlyStats = new List<MonthlyStats>();
            int totalVehicles = 0, totalErrors = 0;

            // Son 12 ay için veri al
            for (int i = 0; i < 12; i++)
            {
                int m = month - i;
                int y = year;
                while (m <= 0) { m += 12; y--; }

                var (rawVehicles, rawErrors) = GetMonthlyCountsRaw(conn, aracTipleri, m, y);
                
                // Override kontrolü (indeks 0: en güncel ay, 11: 12 ay öncesi)
                // Python'daki mantık: i (0..11) 
                int vehicles = GetOverriddenInt("combo", contextKey, $"arac_{i}", rawVehicles);
                int errors = GetOverriddenInt("combo", contextKey, $"hata_{i}", rawErrors);
                
                double rawRate = vehicles > 0 ? (double)errors / vehicles : 0;
                double rate = GetOverriddenDouble("combo", contextKey, $"oran_{i}", rawRate);

                monthlyStats.Insert(0, new MonthlyStats
                {
                    Ay = TURKISH_MONTHS_SHORT[m],
                    AyFull = TURKISH_MONTHS[m],
                    Yil = y,
                    AracSayisi = vehicles,
                    HataSayisi = errors,
                    HataOrani = rate
                });

                totalVehicles += vehicles;
                totalErrors += errors;
            }

            // Mevcut ay
            var current = monthlyStats.Count > 0 ? monthlyStats[^1] : new MonthlyStats();
            double avg12 = totalVehicles > 0 ? (double)totalErrors / totalVehicles : 0;

            // Geçen yıl ortalaması
            var (lyVehicles, lyErrors) = GetYearlyCountsRaw(conn, aracTipleri, year - 1);
            double lyRate = lyVehicles > 0 ? (double)lyErrors / lyVehicles : 0;

            // Mevcut yıl ortalaması
            var (cyVehicles, cyErrors) = GetYearlyCountsRaw(conn, aracTipleri, year);
            double cyRate = cyVehicles > 0 ? (double)cyErrors / cyVehicles : 0;

            return new MonthlyReportData
            {
                MonthlyStats = monthlyStats,
                CurrentMonthVehicles = current.AracSayisi,
                CurrentMonthRate = current.HataOrani,
                Avg12Month = avg12,
                Last12Vehicles = totalVehicles,
                Last12Errors = totalErrors,
                PrevYear = year - 1,
                PrevYearVehicles = lyVehicles,
                PrevYearErrors = lyErrors,
                PrevYearRate = lyRate,
                CurrentYear = year,
                CurrYearVehicles = cyVehicles,
                CurrYearErrors = cyErrors,
                CurrYearRate = cyRate
            };
        }

        /// <summary>
        /// Belirli ay için araç ve hata sayısını getir (raw SQL)
        /// </summary>
        private (int vehicles, int errors) GetMonthlyCountsRaw(SqliteConnection conn, string[] aracTipleri, int month, int year)
        {
            var placeholders = string.Join(",", aracTipleri.Select((_, i) => $"@t{i}"));
            var monthStr = month.ToString("D2");
            var yearStr = year.ToString();

            var cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                SELECT COUNT(DISTINCT sasi_no) as arac, COUNT(*) as hata
                FROM pdi_kayitlari 
                WHERE arac_tipi IN ({placeholders})
                AND (
                    (substr(tarih_saat,4,2) = @month AND substr(tarih_saat,7,4) = @year) OR
                    (substr(tarih_saat,6,2) = @month AND substr(tarih_saat,1,4) = @year)
                )";

            for (int i = 0; i < aracTipleri.Length; i++)
                cmd.Parameters.AddWithValue($"@t{i}", aracTipleri[i]);
            cmd.Parameters.AddWithValue("@month", monthStr);
            cmd.Parameters.AddWithValue("@year", yearStr);

            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                int vehicles = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
                int errors = reader.IsDBNull(1) ? 0 : reader.GetInt32(1);
                return (vehicles, errors);
            }
            return (0, 0);
        }

        /// <summary>
        /// Belirli yıl için toplam araç ve hata sayısını getir
        /// </summary>
        private (int vehicles, int errors) GetYearlyCountsRaw(SqliteConnection conn, string[] aracTipleri, int year)
        {
            var placeholders = string.Join(",", aracTipleri.Select((_, i) => $"@t{i}"));
            var yearStr = year.ToString();

            var cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                SELECT COUNT(DISTINCT sasi_no), COUNT(*) 
                FROM pdi_kayitlari 
                WHERE arac_tipi IN ({placeholders})
                AND (substr(tarih_saat,7,4) = @year OR substr(tarih_saat,1,4) = @year)";

            for (int i = 0; i < aracTipleri.Length; i++)
                cmd.Parameters.AddWithValue($"@t{i}", aracTipleri[i]);
            cmd.Parameters.AddWithValue("@year", yearStr);

            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                int vehicles = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
                int errors = reader.IsDBNull(1) ? 0 : reader.GetInt32(1);
                return (vehicles, errors);
            }
            return (0, 0);
        }

        #endregion

        #region Top 5 Analysis

        /// <summary>
        /// Top 5 hata analizini hesapla (Python'daki get_top5_hata_analysis)
        /// NOT: Bu analiz sadece TRV ve TOU için yapılır
        /// </summary>
        public List<TopErrorAnalysisItem> GetTop5Analysis(int month, int year)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            // Override kontrolü: Eğer manuel top5 listesi varsa, veritabanını boşver ve onu döndür
            // Ancak burada yapı biraz farklı, tüm listeyi override etmek yerine
            // Her satırın her hücresini override edebiliyoruz.

            var topHatalar = _db.GetActiveTopHatalar();
            var results = new List<TopErrorAnalysisItem>();

            // Tarih filtresi helper (her iki formatı da destekler)
            string dateFilter = @"(
                (substr(tarih_saat,4,2) = @month AND substr(tarih_saat,7,4) = @year) OR
                (substr(tarih_saat,6,2) = @month AND substr(tarih_saat,1,4) = @year)
            )";

            var monthStr = month.ToString("D2");
            var yearStr = year.ToString();

            // Toplam araç sayıları
            int trvTotal = GetTotalVehicles(conn, "Travego", monthStr, yearStr, dateFilter);
            int touTotal = GetTotalVehicles(conn, "Tourismo", monthStr, yearStr, dateFilter);

            // Önceki ay
            int prevM = month - 1;
            int prevY = year;
            if (prevM <= 0) { prevM = 12; prevY--; }
            var prevMonthStr = prevM.ToString("D2");
            var prevYearStr = prevY.ToString();

            int prevTrvTotal = GetTotalVehicles(conn, "Travego", prevMonthStr, prevYearStr, dateFilter);
            int prevTouTotal = GetTotalVehicles(conn, "Tourismo", prevMonthStr, prevYearStr, dateFilter);

            // İlk 10 hatayı al (veya veritabanındaki tüm aktif hataları)
            for (int i = 0; i < topHatalar.Count; i++)
            {
                var hataAdi = topHatalar[i];
                
                // Manuel Hata Adı Override
                string manualHata = _db.GetManualData("top5_table", "top5", $"hata_{i}") ?? "";
                if (!string.IsNullOrEmpty(manualHata)) hataAdi = manualHata;

                int trvCount = GetErrorCount(conn, "Travego", hataAdi, monthStr, yearStr, dateFilter);
                int touCount = GetErrorCount(conn, "Tourismo", hataAdi, monthStr, yearStr, dateFilter);

                double rawTrvRate = trvTotal > 0 ? (double)trvCount / trvTotal * 100.0 : 0;
                double rawTouRate = touTotal > 0 ? (double)touCount / touTotal * 100.0 : 0;

                double trvRate = GetOverriddenDouble("top5_table", "top5", $"trv_{i}", rawTrvRate);
                double touRate = GetOverriddenDouble("top5_table", "top5", $"tou_{i}", rawTouRate);

                // Ortalamayı hesapla (veya override et)
                int allCount = trvCount + touCount;
                int allTotal = trvTotal + touTotal;
                double rawAvgRate = allTotal > 0 ? (double)allCount / allTotal * 100.0 : 0;
                double avgRate = GetOverriddenDouble("top5_table", "top5", $"avg_{i}", rawAvgRate);

                // Önceki ay karşılaştırma (Diff)
                int prevTrvCount = GetErrorCount(conn, "Travego", hataAdi, prevMonthStr, prevYearStr, dateFilter);
                int prevTouCount = GetErrorCount(conn, "Tourismo", hataAdi, prevMonthStr, prevYearStr, dateFilter);
                int prevAllCount = prevTrvCount + prevTouCount;
                int prevAllTotal = prevTrvTotal + prevTouTotal;
                double prevAvgRate = prevAllTotal > 0 ? (double)prevAllCount / prevAllTotal * 100.0 : 0;
                
                double diff = avgRate - prevAvgRate; // Diff otomatik hesaplanıyor, ama manuel status override edilebilir

                // Durum belirleme
                string durumText = "Stabil";
                string durumColor = "Black";
                
                // Manuel status override
                string manualStatus = _db.GetManualData("top5_table", "top5", $"status_{i}") ?? "";
                if (!string.IsNullOrEmpty(manualStatus))
                {
                    durumText = manualStatus;
                    // Basit renk mantığı
                    if (durumText.Contains("Artış")) durumColor = "Red";
                    else if (durumText.Contains("İyileşme")) durumColor = "Green";
                }
                else
                {
                    if (diff > 5) { durumText = $"⚠ Kritik Artış (+{diff:F1}%)"; durumColor = "Red"; }
                    else if (diff > 0) { durumText = $"↑ Artış (+{diff:F1}%)"; durumColor = "Orange"; }
                    else if (diff < -5) { durumText = $"✓ İyileşme ({diff:F1}%)"; durumColor = "Green"; }
                    else if (diff < 0) { durumText = $"↓ Azalış ({diff:F1}%)"; durumColor = "DarkGreen"; }
                }

                results.Add(new TopErrorAnalysisItem
                {
                    HataAdi = hataAdi,
                    TrvRate = trvRate,
                    TouRate = touRate,
                    AvgRate = avgRate,
                    Diff = diff,
                    DurumText = durumText,
                    DurumColor = durumColor
                });
            }

            // Orana göre sırala (en yüksek önce) - Override edilmişse sıralama bozulabilir, bu istenen bir durum olabilir.
            results.Sort((a, b) => b.AvgRate.CompareTo(a.AvgRate));
            
            return results;
        }

        private int GetTotalVehicles(SqliteConnection conn, string aracTipi, string month, string year, string dateFilter)
        {
            var cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                SELECT COUNT(DISTINCT sasi_no) 
                FROM pdi_kayitlari 
                WHERE arac_tipi = @aracTipi AND {dateFilter}";
            cmd.Parameters.AddWithValue("@aracTipi", aracTipi);
            cmd.Parameters.AddWithValue("@month", month);
            cmd.Parameters.AddWithValue("@year", year);

            var result = cmd.ExecuteScalar();
            return result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
        }

        private int GetErrorCount(SqliteConnection conn, string aracTipi, string hataAdi, string month, string year, string dateFilter)
        {
            var cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                SELECT COUNT(*) 
                FROM pdi_kayitlari 
                WHERE arac_tipi = @aracTipi AND top_hata = @hataAdi AND {dateFilter}";
            cmd.Parameters.AddWithValue("@aracTipi", aracTipi);
            cmd.Parameters.AddWithValue("@hataAdi", hataAdi);
            cmd.Parameters.AddWithValue("@month", month);
            cmd.Parameters.AddWithValue("@year", year);

            var result = cmd.ExecuteScalar();
            return result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
        }

        #endregion

        #region Gauge Data with Overrides

        /// <summary>
        /// Gauge verilerini getir (manuel override'ları uygulayarak)
        /// </summary>
        public List<GaugeData> GetGaugeData(string[] aracTipleri, int year, string contextKey)
        {
            var data = CalculateMonthlyData(aracTipleri, DateTime.Now.Month, year, contextKey);

            var gauges = new List<GaugeData>
            {
                new GaugeData
                {
                    Title = $"{data.PrevYear} Yılı AVG",
                    Value = GetOverriddenDouble("donuts", contextKey, "value_0", data.PrevYearRate), // ContextKey düzeltildi
                    Vehicles = GetOverriddenInt("donuts", contextKey, "vehicles_0", data.PrevYearVehicles),
                    Errors = GetOverriddenInt("donuts", contextKey, "errors_0", data.PrevYearErrors)
                },
                new GaugeData
                {
                    Title = "Son 12 Ay AVG",
                    Value = GetOverriddenDouble("donuts", contextKey, "value_1", data.Avg12Month),
                    Vehicles = GetOverriddenInt("donuts", contextKey, "vehicles_1", data.Last12Vehicles),
                    Errors = GetOverriddenInt("donuts", contextKey, "errors_1", data.Last12Errors)
                },
                new GaugeData
                {
                    Title = $"{data.CurrentYear} Yılı AVG",
                    Value = GetOverriddenDouble("donuts", contextKey, "value_2", data.CurrYearRate),
                    Vehicles = GetOverriddenInt("donuts", contextKey, "vehicles_2", data.CurrYearVehicles),
                    Errors = GetOverriddenInt("donuts", contextKey, "errors_2", data.CurrYearErrors)
                }
            };

            return gauges;
        }

        private double GetOverriddenDouble(string reportType, string contextKey, string dataKey, double defaultValue)
        {
            var manual = _db.GetManualData(reportType, contextKey, dataKey);
            if (!string.IsNullOrEmpty(manual))
            {
                // Virgül/nokta ayrımını handle et
                manual = manual.Replace(",", ".");
                if (double.TryParse(manual, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double val))
                    return val;
            }
            return defaultValue;
        }

        private int GetOverriddenInt(string reportType, string contextKey, string dataKey, int defaultValue)
        {
            var manual = _db.GetManualData(reportType, contextKey, dataKey);
            if (!string.IsNullOrEmpty(manual) && int.TryParse(manual, out int val))
                return val;
            return defaultValue;
        }

        #endregion

        #region Helper Methods

        public static string GetMonthName(int month) => TURKISH_MONTHS[month];
        public static string GetMonthShortName(int month) => TURKISH_MONTHS_SHORT[month];

        #endregion
    }
}
