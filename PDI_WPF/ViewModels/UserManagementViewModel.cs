using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PDI_WPF.Data;
using PDI_WPF.Models;
using Dapper;
using System.Collections.ObjectModel;
using System.Windows;

namespace PDI_WPF.ViewModels
{
    public partial class UserManagementViewModel : ObservableObject
    {
        private readonly DatabaseService _db;

        [ObservableProperty] private ObservableCollection<User> users = new();
        [ObservableProperty] private User? selectedUser;

        // Form alanları
        [ObservableProperty] private string newUsername = "";
        [ObservableProperty] private string newPassword = "";
        [ObservableProperty] private string newRole = "Kullanıcı";
        [ObservableProperty] private string newAciklama = "";

        public ObservableCollection<string> RoleList { get; } = new() { "Yönetici", "Kullanıcı", "Misafir" };

        public IRelayCommand AddUserCommand { get; }
        public IRelayCommand DeleteUserCommand { get; }
        public IRelayCommand UpdateUserCommand { get; }
        public IRelayCommand RefreshCommand { get; }

        public UserManagementViewModel()
        {
            _db = new DatabaseService();

            AddUserCommand = new RelayCommand(AddUser);
            DeleteUserCommand = new RelayCommand(DeleteUser, () => SelectedUser != null);
            UpdateUserCommand = new RelayCommand(UpdateUser, () => SelectedUser != null);
            RefreshCommand = new RelayCommand(LoadUsers);

            LoadUsers();
        }

        private void LoadUsers()
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var data = conn.Query<User>("SELECT username as Username, password as Password, role as Role, aciklama as Aciklama FROM users ORDER BY username");
            Users = new ObservableCollection<User>(data);
        }

        private void AddUser()
        {
            if (string.IsNullOrWhiteSpace(NewUsername))
            {
                MessageBox.Show("Kullanıcı adı boş olamaz!", "Uyarı", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            if (string.IsNullOrWhiteSpace(NewPassword))
            {
                MessageBox.Show("Şifre boş olamaz!", "Uyarı", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            using var conn = _db.GetConnection();
            conn.Open();
            
            try
            {
                int roleInt = NewRole == "Yönetici" ? 1 : (NewRole == "Kullanıcı" ? 2 : 3);
                conn.Execute("INSERT INTO users (username, password, role, aciklama) VALUES (@u, @p, @r, @a)",
                    new { u = NewUsername, p = NewPassword, r = roleInt, a = NewAciklama });
                
                MessageBox.Show("Kullanıcı başarıyla eklendi.", "Başarılı", MessageBoxButton.OK, MessageBoxImage.Information);
                ClearForm();
                LoadUsers();
            }
            catch
            {
                MessageBox.Show("Bu kullanıcı adı zaten mevcut!", "Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void DeleteUser()
        {
            if (SelectedUser == null) return;

            if (SelectedUser.Username == "admin")
            {
                MessageBox.Show("Admin kullanıcısı silinemez!", "Uyarı", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var result = MessageBox.Show($"'{SelectedUser.Username}' kullanıcısını silmek istediğinizden emin misiniz?",
                "Onay", MessageBoxButton.YesNo, MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                using var conn = _db.GetConnection();
                conn.Open();
                conn.Execute("DELETE FROM users WHERE username = @u", new { u = SelectedUser.Username });
                LoadUsers();
            }
        }

        private void UpdateUser()
        {
            if (SelectedUser == null) return;

            using var conn = _db.GetConnection();
            conn.Open();
            conn.Execute("UPDATE users SET password = @p, aciklama = @a WHERE username = @u",
                new { u = SelectedUser.Username, p = SelectedUser.Password, a = SelectedUser.Aciklama });
            
            MessageBox.Show("Kullanıcı güncellendi.", "Başarılı", MessageBoxButton.OK, MessageBoxImage.Information);
            LoadUsers();
        }

        private void ClearForm()
        {
            NewUsername = "";
            NewPassword = "";
            NewRole = "Kullanıcı";
            NewAciklama = "";
        }

        partial void OnSelectedUserChanged(User? value)
        {
            (DeleteUserCommand as RelayCommand)?.NotifyCanExecuteChanged();
            (UpdateUserCommand as RelayCommand)?.NotifyCanExecuteChanged();
        }
    }
}
