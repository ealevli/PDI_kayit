using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PDI_WPF.Data;
using Dapper;
using System.Collections.ObjectModel;
using System;
using System.Windows;

namespace PDI_WPF.ViewModels
{
    public partial class ManufacturingViewModel : ObservableObject
    {
        private readonly DatabaseService _db;

        [ObservableProperty] private ObservableCollection<ManufacturingItem> items = new();
        
        // Form Fields
        [ObservableProperty] private string aracNo = "";
        [ObservableProperty] private string hataMetni = "";
        [ObservableProperty] private string selectedTopHata = "Boya";

        public IRelayCommand SendToManufacturingCommand { get; }
        public IRelayCommand RefreshCommand { get; }

        public ManufacturingViewModel()
        {
            _db = new DatabaseService();
            SendToManufacturingCommand = new RelayCommand(SendToManufacturing);
            RefreshCommand = new RelayCommand(LoadData);
            LoadData();
        }

        private void LoadData()
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var data = conn.Query<ManufacturingItem>("SELECT id as Id, arac_no as AracNo, tarih as Tarih, top_hata as TopHata, durum as Durum FROM imalat_kayitlari ORDER BY id DESC");
            Items = new ObservableCollection<ManufacturingItem>(data);
        }

        private void SendToManufacturing()
        {
            if (string.IsNullOrEmpty(AracNo)) return;

            using var conn = _db.GetConnection();
            conn.Open();
            conn.Execute("INSERT INTO imalat_kayitlari (arac_no, tarih, top_hata, hata_metni, durum, kullanici) VALUES (@AracNo, @Tarih, @TopHata, @HataMetni, 'Bekleniyor', 'admin')",
                new { AracNo, Tarih = DateTime.Now.ToString("dd-MM-yyyy"), TopHata = SelectedTopHata, HataMetni });

            MessageBox.Show("İmalat kaydı oluşturuldu.");
            LoadData();
        }
    }

    public class ManufacturingItem
    {
        public int Id { get; set; }
        public string AracNo { get; set; } = "";
        public string Tarih { get; set; } = "";
        public string TopHata { get; set; } = "";
        public string Durum { get; set; } = "";
    }
}
