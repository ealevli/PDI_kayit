using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PDI_WPF.Services;
using PDI_WPF.Models;
using System;
using System.Collections.ObjectModel;
using System.Windows;

namespace PDI_WPF.ViewModels
{
    public partial class TopErrorAnalysisViewModel : ObservableObject
    {
        private readonly ReportService _reportService;

        [ObservableProperty] private ObservableCollection<TopErrorAnalysisItem> analysisData = new();
        [ObservableProperty] private string title = "TOP 5 HATA ANALİZİ";
        [ObservableProperty] private string filterInfo = "";
        [ObservableProperty] private int selectedMonth;
        [ObservableProperty] private int selectedYear;

        public ObservableCollection<string> MonthList { get; set; } = new();
        public ObservableCollection<int> YearList { get; set; } = new() { 2024, 2025, 2026 };

        public IRelayCommand RefreshCommand { get; }
        public IRelayCommand EditDataCommand { get; }
        public IRelayCommand<TopErrorAnalysisItem> ViewDetailCommand { get; }

        // MainViewModel referansı (navigasyon için)
        private readonly Action<string>? _navigateToDetail;

        public TopErrorAnalysisViewModel(Action<string>? navigateToDetail = null)
        {
            _reportService = new ReportService();
            _navigateToDetail = navigateToDetail;

            // Ay listesi oluştur
            for (int i = 1; i <= 12; i++)
            {
                MonthList.Add(ReportService.GetMonthName(i));
            }

            // Varsayılan olarak mevcut ay/yıl
            SelectedMonth = DateTime.Now.Month;
            SelectedYear = DateTime.Now.Year;

            RefreshCommand = new RelayCommand(LoadData);
            EditDataCommand = new RelayCommand(OpenEditDialog);
            ViewDetailCommand = new RelayCommand<TopErrorAnalysisItem>(ViewDetail);

            LoadData();
        }

        public void LoadData()
        {
            try
            {
                FilterInfo = $"{ReportService.GetMonthName(SelectedMonth)} {SelectedYear} - TRV & TOU Analizi";
                
                var data = _reportService.GetTop5Analysis(SelectedMonth, SelectedYear);
                AnalysisData = new ObservableCollection<TopErrorAnalysisItem>(data);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Analiz yüklenirken hata oluştu: {ex.Message}", "Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void ViewDetail(TopErrorAnalysisItem? item)
        {
            if (item != null && _navigateToDetail != null)
            {
                _navigateToDetail(item.HataAdi);
            }
        }

        private void OpenEditDialog()
        {
            MessageBox.Show("Top 5 analiz düzenleme dialog'u henüz uygulanmadı.", "Bilgi", MessageBoxButton.OK, MessageBoxImage.Information);
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
}
