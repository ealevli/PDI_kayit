using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;
using SkiaSharp;
using System;
using System.Collections.ObjectModel;
using System.Windows;
using PDI_WPF.Services;
using PDI_WPF.Models;

namespace PDI_WPF.ViewModels
{
    public partial class ReportViewModel : ObservableObject
    {
        private readonly ReportService _reportService;
        private readonly string _reportType;
        private readonly string[] _aracTipleri;
        private readonly string _contextKey;

        [ObservableProperty] private string title;
        [ObservableProperty] private string reportMonthInfo;
        [ObservableProperty] private string currentMonthName = "OCAK 2026";

        // Gauge Altı Metinleri
        [ObservableProperty] private string gauge1Title = "";
        [ObservableProperty] private string gauge1Value = "0.00";
        [ObservableProperty] private string gauge1Text = "";
        
        [ObservableProperty] private string gauge2Title = "";
        [ObservableProperty] private string gauge2Value = "0.00";
        [ObservableProperty] private string gauge2Text = "";
        
        [ObservableProperty] private string gauge3Title = "";
        [ObservableProperty] private string gauge3Value = "0.00";
        [ObservableProperty] private string gauge3Text = "";

        // Seçili ay/yıl
        [ObservableProperty] private int selectedMonth;
        [ObservableProperty] private int selectedYear;

        public ISeries[] MainChartSeries { get; set; } = Array.Empty<ISeries>();
        public Axis[] XAxes { get; set; } = Array.Empty<Axis>();
        public Axis[] YAxes { get; set; } = Array.Empty<Axis>();

        public ISeries[] Gauge1Series { get; set; } = Array.Empty<ISeries>();
        public ISeries[] Gauge2Series { get; set; } = Array.Empty<ISeries>();
        public ISeries[] Gauge3Series { get; set; } = Array.Empty<ISeries>();

        // Filtre Listesi
        public ObservableCollection<string> MonthList { get; set; } = new();
        public ObservableCollection<int> YearList { get; set; } = new() { 2024, 2025, 2026 };

        public IRelayCommand RefreshCommand { get; }
        public IRelayCommand EditDataCommand { get; }

        // Renk tanımları
        private SKColor _colorBar1;
        private SKColor _colorBar2;
        private SKColor _colorLine;

        public ReportViewModel(string reportType)
        {
            _reportType = reportType;
            _reportService = new ReportService();

            // TRV & TOU mu yoksa Connecto mu?
            if (reportType == "CONNECTO")
            {
                _aracTipleri = new[] { "Connecto" };
                _contextKey = "connecto";
                Title = "CONNECTO RAPORU";
                // Connecto Renkleri (Gri/Turuncu Tonları)
                _colorBar1 = SKColors.LightGray;
                _colorBar2 = SKColors.DarkOrange;
                _colorLine = SKColors.Black;
            }
            else
            {
                _aracTipleri = new[] { "Tourismo", "Travego" };
                _contextKey = "trv_tou";
                Title = "TRV & TOU RAPORU";
                // TRV & TOU Renkleri
                _colorBar1 = SKColors.LightBlue;
                _colorBar2 = SKColors.DarkSlateBlue;
                _colorLine = SKColors.Red;
            }

            // Ay listesi oluştur
            for (int i = 1; i <= 12; i++)
            {
                MonthList.Add(ReportService.GetMonthName(i));
            }

            // Varsayılan olarak mevcut ay/yıl
            SelectedMonth = DateTime.Now.Month;
            SelectedYear = DateTime.Now.Year;
            CurrentMonthName = $"{ReportService.GetMonthName(SelectedMonth)} {SelectedYear}";

            RefreshCommand = new RelayCommand(LoadData);
            EditDataCommand = new RelayCommand(OpenEditDialog);

            LoadData();
        }

        public void LoadData()
        {
            try
            {
                CurrentMonthName = $"{ReportService.GetMonthName(SelectedMonth)} {SelectedYear}";
                // Service artık override'ları kendisi hallediyor
                var data = _reportService.CalculateMonthlyData(_aracTipleri, SelectedMonth, SelectedYear, _contextKey);

                // Rapor özet metni
                string reportLabel = _reportType == "CONNECTO" ? "CONNECTO" : "TRV & TOU";
                ReportMonthInfo = $"{SelectedYear} {ReportService.GetMonthName(SelectedMonth)} ayında PDI yapılan [{reportLabel}] araç sayısı {data.CurrentMonthVehicles} adettir. " +
                    $"Son 12 ay ortalama hata oranı araç başı {data.Avg12Month:F2} adet olup, " +
                    $"{ReportService.GetMonthName(SelectedMonth)} ayı özelinde {data.CurrentMonthRate:F2} adet olarak gerçekleşmiştir.";

                // Grafik verileri hazırla
                var aylar = new string[12];
                var aracSayisi = new double[12];
                var hataSayisi = new double[12];
                var hataOrani = new double[12];

                for (int i = 0; i < data.MonthlyStats.Count && i < 12; i++)
                {
                    var stat = data.MonthlyStats[i];
                    aylar[i] = stat.Ay;
                    // Service'den gelen veriler zaten override edilmiş durumda
                    aracSayisi[i] = stat.AracSayisi;
                    hataSayisi[i] = stat.HataSayisi;
                    hataOrani[i] = stat.HataOrani;
                }

                MainChartSeries = new ISeries[]
                {
                    new ColumnSeries<double>
                    {
                        Values = aracSayisi,
                        Name = "Araç Sayısı",
                        Fill = new SolidColorPaint(_colorBar1),
                        Padding = 2,
                        ScalesYAt = 0,
                        DataLabelsSize = 10,
                        DataLabelsPaint = new SolidColorPaint(SKColors.Black),
                        DataLabelsPosition = LiveChartsCore.Measure.DataLabelsPosition.Top
                    },
                    new ColumnSeries<double>
                    {
                        Values = hataSayisi,
                        Name = "Hata Sayısı",
                        Fill = new SolidColorPaint(_colorBar2),
                        Padding = 2,
                        ScalesYAt = 0,
                        DataLabelsSize = 10,
                        DataLabelsPaint = new SolidColorPaint(SKColors.White),
                        DataLabelsPosition = LiveChartsCore.Measure.DataLabelsPosition.Middle
                    },
                    new LineSeries<double>
                    {
                        Values = hataOrani,
                        Name = "Hata Oranı",
                        Fill = null,
                        GeometrySize = 8,
                        Stroke = new SolidColorPaint(_colorLine) { StrokeThickness = 3 },
                        GeometryStroke = new SolidColorPaint(_colorLine) { StrokeThickness = 3 },
                        ScalesYAt = 1,
                        DataLabelsSize = 12,
                        DataLabelsPaint = new SolidColorPaint(_colorLine),
                        DataLabelsPosition = LiveChartsCore.Measure.DataLabelsPosition.Top
                    }
                };

                XAxes = new Axis[]
                {
                    new Axis
                    {
                        Labels = aylar,
                        LabelsRotation = -45,
                        UnitWidth = 1,
                        MinStep = 1
                    }
                };

                YAxes = new Axis[]
                {
                    new Axis { Name = "Adet", MinLimit = 0, NameTextSize = 12 },
                    new Axis { Name = "Oran", MinLimit = 0, NameTextSize = 12, Position = LiveChartsCore.Measure.AxisPosition.End }
                };

                // Gauge verileri
                UpdateGaugeData();

                OnPropertyChanged(nameof(MainChartSeries));
                OnPropertyChanged(nameof(XAxes));
                OnPropertyChanged(nameof(YAxes));
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Rapor yüklenirken hata oluştu: {ex.Message}", "Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void UpdateGaugeData()
        {
            var gauges = _reportService.GetGaugeData(_aracTipleri, SelectedYear, _contextKey);

            if (gauges.Count >= 3)
            {
                // Gauge 1: Geçen Yıl
                Gauge1Title = gauges[0].Title;
                Gauge1Value = gauges[0].Value.ToString("F2");
                Gauge1Text = gauges[0].DetailText;
                Gauge1Series = CreateGaugeSeries(gauges[0].Value);

                // Gauge 2: Son 12 Ay
                Gauge2Title = gauges[1].Title;
                Gauge2Value = gauges[1].Value.ToString("F2");
                Gauge2Text = gauges[1].DetailText;
                Gauge2Series = CreateGaugeSeries(gauges[1].Value);

                // Gauge 3: Mevcut Yıl
                Gauge3Title = gauges[2].Title;
                Gauge3Value = gauges[2].Value.ToString("F2");
                Gauge3Text = gauges[2].DetailText;
                Gauge3Series = CreateGaugeSeries(gauges[2].Value);

                OnPropertyChanged(nameof(Gauge1Series));
                OnPropertyChanged(nameof(Gauge2Series));
                OnPropertyChanged(nameof(Gauge3Series));
            }
        }

        private ISeries[] CreateGaugeSeries(double value)
        {
            var color = _reportType == "CONNECTO" ? SKColors.DarkOrange : SKColors.CadetBlue;
            double maxValue = 5.0;
            double remaining = maxValue - value > 0 ? maxValue - value : 0;

            return new ISeries[]
            {
                new PieSeries<double>
                {
                    Values = new double[] { value },
                    InnerRadius = 60,
                    MaxRadialColumnWidth = 15,
                    Fill = new SolidColorPaint(color),
                    DataLabelsPosition = LiveChartsCore.Measure.PolarLabelsPosition.ChartCenter,
                    DataLabelsPaint = null
                },
                new PieSeries<double>
                {
                    Values = new double[] { remaining },
                    InnerRadius = 60,
                    MaxRadialColumnWidth = 15,
                    Fill = new SolidColorPaint(new SKColor(230, 230, 230))
                }
            };
        }

        private void OpenEditDialog()
        {
            // TODO: Düzenleme dialog'u açılacak
            MessageBox.Show("Veri düzenleme dialog'u henüz uygulanmadı.\nBu özellik yakında eklenecek.", "Bilgi", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        partial void OnSelectedMonthChanged(int value)
        {
            if (value > 0) LoadData();
        }

        partial void OnSelectedYearChanged(int value)
        {
            if (value > 0) LoadData();
        }
    }

    public class TopErrorItem
    {
        public string HataAdi { get; set; } = "";
        public int Adet { get; set; }
    }
}
