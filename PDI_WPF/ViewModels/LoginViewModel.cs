using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PDI_WPF.Data;
using PDI_WPF.Models;
using Dapper;
using System.Windows;

namespace PDI_WPF.ViewModels
{
    public partial class LoginViewModel : ObservableObject
    {
        private readonly MainViewModel _mainVM;
        private readonly DatabaseService _db;

        [ObservableProperty] private string username = "admin";
        [ObservableProperty] private string password = "admin123";

        public IRelayCommand LoginCommand { get; }

        public LoginViewModel(MainViewModel mainVM)
        {
            _mainVM = mainVM;
            _db = new DatabaseService();
            LoginCommand = new RelayCommand(Login);
        }

        private void Login()
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var user = conn.QueryFirstOrDefault<User>("SELECT * FROM users WHERE username = @Username AND password = @Password", 
                new { Username, Password });

            if (user != null)
            {
                _mainVM.CurrentUser = user;
                _mainVM.IsSidebarVisible = true;
                _mainVM.NavigateDashboardCommand.Execute(null);
            }
            else
            {
                MessageBox.Show("Hatalı kullanıcı adı veya şifre!");
            }
        }
    }
}
