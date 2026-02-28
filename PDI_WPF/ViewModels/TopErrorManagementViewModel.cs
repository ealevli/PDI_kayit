using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PDI_WPF.Data;
using System.Collections.ObjectModel;
using System.Windows;

namespace PDI_WPF.ViewModels
{
    public partial class TopErrorManagementViewModel : ObservableObject
    {
        private readonly DatabaseService _db;

        [ObservableProperty] private ObservableCollection<string> topHatalar = new();
        [ObservableProperty] private string? selectedHata;
        [ObservableProperty] private string newHataAdi = "";

        public IRelayCommand AddHataCommand { get; }
        public IRelayCommand DeleteHataCommand { get; }
        public IRelayCommand RefreshCommand { get; }

        public TopErrorManagementViewModel()
        {
            _db = new DatabaseService();

            AddHataCommand = new RelayCommand(AddHata);
            DeleteHataCommand = new RelayCommand(DeleteHata, () => SelectedHata != null);
            RefreshCommand = new RelayCommand(LoadHatalar);

            LoadHatalar();
        }

        private void LoadHatalar()
        {
            var data = _db.GetActiveTopHatalar();
            TopHatalar = new ObservableCollection<string>(data);
        }

        private void AddHata()
        {
            if (string.IsNullOrWhiteSpace(NewHataAdi))
            {
                MessageBox.Show("Hata adı boş olamaz!", "Uyarı", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            _db.AddTopHata(NewHataAdi.Trim());
            MessageBox.Show($"'{NewHataAdi}' hatası eklendi.", "Başarılı", MessageBoxButton.OK, MessageBoxImage.Information);
            NewHataAdi = "";
            LoadHatalar();
        }

        private void DeleteHata()
        {
            if (SelectedHata == null) return;

            var result = MessageBox.Show($"'{SelectedHata}' hatasını silmek istediğinizden emin misiniz?",
                "Onay", MessageBoxButton.YesNo, MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                _db.DeleteTopHata(SelectedHata);
                MessageBox.Show("Hata silindi.", "Başarılı", MessageBoxButton.OK, MessageBoxImage.Information);
                LoadHatalar();
            }
        }

        partial void OnSelectedHataChanged(string? value)
        {
            (DeleteHataCommand as RelayCommand)?.NotifyCanExecuteChanged();
        }
    }
}
