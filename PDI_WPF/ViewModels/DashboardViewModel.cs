using CommunityToolkit.Mvvm.ComponentModel;
using PDI_WPF.Data;
using Dapper;

namespace PDI_WPF.ViewModels
{
    public partial class DashboardViewModel : ObservableObject
    {
        private readonly DatabaseService _db;

        [ObservableProperty] private int totalVehicles;
        [ObservableProperty] private int totalErrors;
        [ObservableProperty] private int tourismoCount;
        [ObservableProperty] private int travegoCount;
        [ObservableProperty] private int connectoCount;

        public DashboardViewModel()
        {
            _db = new DatabaseService();
            LoadData();
        }

        public void LoadData()
        {
            using var conn = _db.GetConnection();
            conn.Open();
            TotalVehicles = conn.ExecuteScalar<int>("SELECT COUNT(DISTINCT sasi_no) FROM pdi_kayitlari");
            TotalErrors = conn.ExecuteScalar<int>("SELECT COUNT(*) FROM pdi_kayitlari");
            TourismoCount = conn.ExecuteScalar<int>("SELECT COUNT(DISTINCT sasi_no) FROM pdi_kayitlari WHERE arac_tipi='Tourismo'");
            TravegoCount = conn.ExecuteScalar<int>("SELECT COUNT(DISTINCT sasi_no) FROM pdi_kayitlari WHERE arac_tipi='Travego'");
            ConnectoCount = conn.ExecuteScalar<int>("SELECT COUNT(DISTINCT sasi_no) FROM pdi_kayitlari WHERE arac_tipi='Connecto'");
        }
    }
}
