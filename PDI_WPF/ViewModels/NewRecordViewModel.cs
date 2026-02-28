using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PDI_WPF.Data;
using PDI_WPF.Models;
using Dapper;
using System;
using System.Windows;
using System.Collections.Generic;

namespace PDI_WPF.ViewModels
{
    public partial class NewRecordViewModel : ObservableObject
    {
        private readonly DatabaseService _db;

        [ObservableProperty] private string bbNo = "";
        [ObservableProperty] private string sasiNo = "";
        [ObservableProperty] private string selectedAracTipi = "Tourismo";
        [ObservableProperty] private string selectedAltGrup = "Boya";
        [ObservableProperty] private string isEmriNo = "";
        [ObservableProperty] private string tespitler = "";
        [ObservableProperty] private string hataKonumu = "";
        [ObservableProperty] private string selectedTopHata = "Boya";

        public List<string> AracTipleri { get; } = new() { "Tourismo", "Travego", "Connecto", "Intouro" };
        public List<string> AltGruplar { get; } = new() { "Boya", "Kaporta", "Mekanik", "Elektrik", "Döşeme" };
        public List<string> TopHatalar { get; } = new() { "Boya", "Uyumsuzluk", "Çizik", "Leke", "Montaj Hatası" };

        public IRelayCommand SaveCommand { get; }

        public NewRecordViewModel()
        {
            _db = new DatabaseService();
            SaveCommand = new RelayCommand(SaveRecord);
        }

        private void SaveRecord()
        {
            if (string.IsNullOrEmpty(SasiNo)) { MessageBox.Show("Şasi No boş bırakılamaz!"); return; }

            using var conn = _db.GetConnection();
            conn.Open();
            var sql = @"INSERT INTO pdi_kayitlari (bb_no, sasi_no, arac_tipi, is_emri_no, alt_grup, tespitler, hata_konumu, top_hata, tarih_saat, kullanici) 
                        VALUES (@BbNo, @SasiNo, @SelectedAracTipi, @IsEmriNo, @SelectedAltGrup, @Tespitler, @HataKonumu, @SelectedTopHata, @Tarih, @User)";
            
            conn.Execute(sql, new { 
                BbNo, SasiNo, SelectedAracTipi, IsEmriNo, SelectedAltGrup, Tespitler, HataKonumu, SelectedTopHata,
                Tarih = DateTime.Now.ToString("dd-MM-yyyy HH:mm"),
                User = "admin" 
            });

            MessageBox.Show("Kayıt başarıyla eklendi.");
            ClearForm();
        }

        private void ClearForm()
        {
            BbNo = SasiNo = IsEmriNo = Tespitler = HataKonumu = "";
        }
    }
}
