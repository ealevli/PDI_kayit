using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;
using SkiaSharp;
using PDI_WPF.Data;
using PDI_WPF.Services;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows;

namespace PDI_WPF.ViewModels
{
    public partial class ManufacturingAnalysisViewModel : ObservableObject
    {
        private readonly DatabaseService _db;
        private readonly ReportService _reportService;

        [ObservableProperty] private string title = "İMALAT GİDİŞ RAPORLARI";
        [ObservableProperty] private string filterInfo = "";
        [ObservableProperty] private int selectedYear;

        // Grafik verileri
        public ISeries[] TrendSeries { get; set; } = Array.Empty<ISeries>();
        public Axis[] XAxes { get; set; } = Array.Empty<Axis>();
        public Axis[] YAxes { get; set; } = Array.Empty<Axis>();

        // Özet verileri
        [ObservableProperty] private string prevYearTotal = "0";
        [ObservableProperty] private string currYearTotal = "0";
        [ObservableProperty] private string prevYearRate = "0%";
        [ObservableProperty] private string currYearRate = "0%";

        // İmalata giden top hatalar
        [ObservableProperty] private ObservableCollection<ManufacturingTopError> topErrors = new();

        public ObservableCollection<int> YearList { get; set; } = new() { 2024, 2025, 2026 };

        public IRelayCommand RefreshCommand { get; }
        public IRelayCommand EditDataCommand { get; }

        private static readonly string[] TURKISH_MONTHS_SHORT = {
            "", "OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ",
            "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"
        };

        public ManufacturingAnalysisViewModel()
        {
            _db = new DatabaseService();
            _reportService = new ReportService();

            SelectedYear = DateTime.Now.Year;
            RefreshCommand = new RelayCommand(LoadData);
            EditDataCommand = new RelayCommand(OpenEditDialog);

            LoadData();
        }

        public void LoadData()
        {
            try
            {
                FilterInfo = $"{SelectedYear - 1} vs {SelectedYear} Karşılaştırması";

                using var conn = _db.GetConnection();
                conn.Open();

                var prevYearData = new double[12];
                var currYearData = new double[12];
                int prevTotal = 0, currTotal = 0;

                // Her ay için imalat oranlarını hesapla
                for (int m = 1; m <= 12; m++)
                {
                    // Geçen yıl
                    var (prevPdi, prevImalat) = GetMonthlyManufacturingData(conn, m, SelectedYear - 1);
                    prevYearData[m - 1] = prevPdi > 0 ? (double)prevImalat / prevPdi * 100.0 : 0;
                    prevTotal += prevImalat;

                    // Bu yıl
                    var (currPdi, currImalat) = GetMonthlyManufacturingData(conn, m, SelectedYear);
                    currYearData[m - 1] = currPdi > 0 ? (double)currImalat / currPdi * 100.0 : 0;
                    currTotal += currImalat;

                    // Manuel override kontrolü
                    var prevOverride = _reportService.GetManualData("imalat_trend", $"{SelectedYear - 1}-{SelectedYear}", $"prev_{m}");
                    var currOverride = _reportService.GetManualData("imalat_trend", $"{SelectedYear - 1}-{SelectedYear}", $"curr_{m}");

                    if (!string.IsNullOrEmpty(prevOverride) && double.TryParse(prevOverride, out double pv))
                        prevYearData[m - 1] = pv;
                    if (!string.IsNullOrEmpty(currOverride) && double.TryParse(currOverride, out double cv))
                        currYearData[m - 1] = cv;
                }

                // Özet verileri güncelle
                PrevYearTotal = prevTotal.ToString();
                CurrYearTotal = currTotal.ToString();
                PrevYearRate = $"{prevYearData.Average():F1}%";
                CurrYearRate = $"{currYearData.Average():F1}%";

                // Grafik serisi oluştur
                TrendSeries = new ISeries[]
                {
                    new LineSeries<double>
                    {
                        Values = prevYearData,
                        Name = $"{SelectedYear - 1} Yılı",
                        Stroke = new SolidColorPaint(SKColors.Gray) { StrokeThickness = 2 },
                        GeometryStroke = new SolidColorPaint(SKColors.Gray) { StrokeThickness = 2 },
                        GeometrySize = 6,
                        Fill = null
                    },
                    new LineSeries<double>
                    {
                        Values = currYearData,
                        Name = $"{SelectedYear} Yılı",
                        Stroke = new SolidColorPaint(SKColors.DarkBlue) { StrokeThickness = 3 },
                        GeometryStroke = new SolidColorPaint(SKColors.DarkBlue) { StrokeThickness = 3 },
                        GeometrySize = 8,
                        Fill = null,
                        DataLabelsSize = 11,
                        DataLabelsPaint = new SolidColorPaint(SKColors.DarkBlue),
                        DataLabelsPosition = LiveChartsCore.Measure.DataLabelsPosition.Top
                    }
                };

                XAxes = new Axis[]
                {
                    new Axis
                    {
                        Labels = TURKISH_MONTHS_SHORT.Skip(1).ToArray(),
                        LabelsRotation = 0
                    }
                };

                YAxes = new Axis[]
                {
                    new Axis
                    {
                        Name = "İmalat Oranı (%)",
                        MinLimit = 0
                    }
                };

                LoadTopErrors(conn);

                OnPropertyChanged(nameof(TrendSeries));
                OnPropertyChanged(nameof(XAxes));
                OnPropertyChanged(nameof(YAxes));
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Rapor yüklenirken hata oluştu: {ex.Message}", "Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private (int pdiCount, int imalatCount) GetMonthlyManufacturingData(Microsoft.Data.Sqlite.SqliteConnection conn, int month, int year)
        {
            var monthStr = month.ToString("D2");
            var yearStr = year.ToString();

            // PDI yapılan araç sayısı
            var pdiCmd = conn.CreateCommand();
            pdiCmd.CommandText = @"
                SELECT COUNT(DISTINCT sasi_no) FROM pdi_kayitlari
                WHERE (substr(tarih_saat,4,2) = @month AND substr(tarih_saat,7,4) = @year)
                   OR (substr(tarih_saat,6,2) = @month AND substr(tarih_saat,1,4) = @year)";
            pdiCmd.Parameters.AddWithValue("@month", monthStr);
            pdiCmd.Parameters.AddWithValue("@year", yearStr);
            var pdiResult = pdiCmd.ExecuteScalar();
            int pdiCount = pdiResult != null && pdiResult != DBNull.Value ? Convert.ToInt32(pdiResult) : 0;

            // İmalata giden araç sayısı
            var imalatCmd = conn.CreateCommand();
            imalatCmd.CommandText = @"
                SELECT COUNT(*) FROM imalat_kayitlari
                WHERE (substr(tarih,4,2) = @month AND substr(tarih,7,4) = @year)
                   OR (substr(tarih,6,2) = @month AND substr(tarih,1,4) = @year)";
            imalatCmd.Parameters.AddWithValue("@month", monthStr);
            imalatCmd.Parameters.AddWithValue("@year", yearStr);
            var imalatResult = imalatCmd.ExecuteScalar();
            int imalatCount = imalatResult != null && imalatResult != DBNull.Value ? Convert.ToInt32(imalatResult) : 0;

            return (pdiCount, imalatCount);
        }

        private void LoadTopErrors(Microsoft.Data.Sqlite.SqliteConnection conn)
        {
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                SELECT top_hata, COUNT(*) as cnt 
                FROM imalat_kayitlari 
                WHERE (substr(tarih,7,4) = @year OR substr(tarih,1,4) = @year)
                GROUP BY top_hata 
                ORDER BY cnt DESC 
                LIMIT 5";
            cmd.Parameters.AddWithValue("@year", SelectedYear.ToString());

            var results = new List<ManufacturingTopError>();
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                results.Add(new ManufacturingTopError
                {
                    HataAdi = reader.GetString(0),
                    Adet = reader.GetInt32(1)
                });
            }

            TopErrors = new ObservableCollection<ManufacturingTopError>(results);
        }

        private void OpenEditDialog()
        {
            MessageBox.Show("İmalat rapor düzenleme dialog'u henüz uygulanmadı.", "Bilgi", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        partial void OnSelectedYearChanged(int value)
        {
            if (value > 0) LoadData();
        }
    }

    public class ManufacturingTopError
    {
        public string HataAdi { get; set; } = "";
        public int Adet { get; set; }
    }
}
