namespace PDI_WPF.Models
{
    /// <summary>
    /// Kullanıcı modeli
    /// </summary>
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
        public string Role { get; set; } = "";
        public string Aciklama { get; set; } = "";
    }

    /// <summary>
    /// PDI kaydı modeli - pdi_kayitlari tablosu
    /// </summary>
    public class PdiRecord
    {
        public int Id { get; set; }
        public string BbNo { get; set; } = "";
        public string SasiNo { get; set; } = "";
        public string AracTipi { get; set; } = "";
        public string IsEmriNo { get; set; } = "";
        public string AltGrup { get; set; } = "";
        public string Tespitler { get; set; } = "";
        public string HataKonumu { get; set; } = "";
        public string FotografYolu { get; set; } = "";
        public string TarihSaat { get; set; } = "";
        public string Kullanici { get; set; } = "";
        public string Duzenleyen { get; set; } = "";
        public string GrupNo { get; set; } = "";
        public string ParcaTanimi { get; set; } = "";
        public string HataTanimi { get; set; } = "";
        public string TopHata { get; set; } = "";
    }

    /// <summary>
    /// Top hata tanımları - top_hatalar tablosu
    /// </summary>
    public class TopHata
    {
        public int Id { get; set; }
        public string HataAdi { get; set; } = "";
        public bool Aktif { get; set; } = true;
    }

    /// <summary>
    /// Manuel rapor verileri - report_manual_data tablosu
    /// Raporlardaki otomatik hesaplamaları ezmek (override) için kullanılır
    /// </summary>
    public class ReportManualData
    {
        public int Id { get; set; }
        /// <summary>Hangi rapor? (combo, donuts, top5_table, imalat_trend)</summary>
        public string ReportType { get; set; } = "";
        /// <summary>Hangi alt bağlam? (trv_tou, connecto, imalat_trend)</summary>
        public string ContextKey { get; set; } = "";
        /// <summary>Hangi veri noktası? (arac_0, hata_5, oran_11)</summary>
        public string DataKey { get; set; } = "";
        /// <summary>Kullanıcının girdiği değer</summary>
        public string DataValue { get; set; } = "";
    }

    /// <summary>
    /// İmalat kaydı modeli - imalat_kayitlari tablosu
    /// </summary>
    public class ImalatRecord
    {
        public int Id { get; set; }
        public string AracNo { get; set; } = "";
        public string Tarih { get; set; } = "";
        public int Adet { get; set; } = 1;
        public string TopHata { get; set; } = "";
        public string HataMetni { get; set; } = "";
        public string Durum { get; set; } = "Bekleniyor";
        public string Kullanici { get; set; } = "";
    }

    /// <summary>
    /// Aylık istatistik verisi (hesaplama sonucu)
    /// </summary>
    public class MonthlyStats
    {
        public string Ay { get; set; } = "";       // Kısa ad: "OCA", "ŞUB"
        public string AyFull { get; set; } = "";   // Tam ad: "OCAK", "ŞUBAT"
        public int Yil { get; set; }
        public int AracSayisi { get; set; }
        public int HataSayisi { get; set; }
        public double HataOrani { get; set; }
    }

    /// <summary>
    /// Aylık rapor verileri (hesaplama sonucu)
    /// </summary>
    public class MonthlyReportData
    {
        public List<MonthlyStats> MonthlyStats { get; set; } = new();
        
        // Mevcut ay
        public int CurrentMonthVehicles { get; set; }
        public double CurrentMonthRate { get; set; }
        
        // Son 12 ay ortalaması
        public double Avg12Month { get; set; }
        public int Last12Vehicles { get; set; }
        public int Last12Errors { get; set; }
        
        // Geçen yıl
        public int PrevYear { get; set; }
        public int PrevYearVehicles { get; set; }
        public int PrevYearErrors { get; set; }
        public double PrevYearRate { get; set; }
        
        // Mevcut yıl
        public int CurrentYear { get; set; }
        public int CurrYearVehicles { get; set; }
        public int CurrYearErrors { get; set; }
        public double CurrYearRate { get; set; }
    }

    /// <summary>
    /// Top 5 analiz satırı (hesaplama sonucu)
    /// </summary>
    public class TopErrorAnalysisItem
    {
        public string HataAdi { get; set; } = "";
        public double TrvRate { get; set; }        // Travego yüzdesi
        public double TouRate { get; set; }        // Tourismo yüzdesi
        public double AvgRate { get; set; }        // Genel ortalama
        public double Diff { get; set; }           // Önceki aya göre değişim
        public string DurumText { get; set; } = "Stabil";
        public string DurumColor { get; set; } = "Black";
    }

    /// <summary>
    /// Gauge/Donut grafik verileri
    /// </summary>
    public class GaugeData
    {
        public string Title { get; set; } = "";
        public double Value { get; set; }
        public int Vehicles { get; set; }
        public int Errors { get; set; }
        public string DetailText => $"Araç: {Vehicles} | Hata: {Errors}";
    }
}
