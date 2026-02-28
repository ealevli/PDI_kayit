using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PDI_WPF.Data;
using PDI_WPF.Models;
using Dapper;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Linq;

namespace PDI_WPF.ViewModels
{
    public partial class RecordListViewModel : ObservableObject
    {
        private readonly DatabaseService _db;
        private List<PdiRecord> _allRecords = new();

        [ObservableProperty] private ObservableCollection<PdiRecord> records = new();
        [ObservableProperty] private string searchSasi = "";

        public IRelayCommand RefreshCommand { get; }

        public RecordListViewModel()
        {
            _db = new DatabaseService();
            RefreshCommand = new RelayCommand(LoadData);
            LoadData();
        }

        partial void OnSearchSasiChanged(string value)
        {
            FilterRecords();
        }

        private void LoadData()
        {
            using var conn = _db.GetConnection();
            conn.Open();
            // Veritabanındaki kolon isimleriyle (bb_no, sasi_no vb.) Modeldeki propertyleri eşliyoruz
            _allRecords = conn.Query<PdiRecord>(@"
                SELECT id as Id, bb_no as BbNo, sasi_no as SasiNo, arac_tipi as AracTipi, 
                       tespitler as Tespitler, top_hata as TopHata, tarih_saat as TarihSaat 
                FROM pdi_kayitlari 
                ORDER BY id DESC").ToList();
            
            FilterRecords();
        }

        private void FilterRecords()
        {
            var filtered = _allRecords.AsEnumerable();
            if (!string.IsNullOrEmpty(SearchSasi))
            {
                filtered = filtered.Where(r => r.SasiNo.Contains(SearchSasi));
            }
            Records = new ObservableCollection<PdiRecord>(filtered);
        }
    }
}
