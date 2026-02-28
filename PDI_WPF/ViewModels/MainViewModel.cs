using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PDI_WPF.Models;

namespace PDI_WPF.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        [ObservableProperty] private object currentView;
        [ObservableProperty] private bool isSidebarVisible;
        [ObservableProperty] private User? currentUser;

        public LoginViewModel LoginVM { get; }
        public DashboardViewModel DashboardVM { get; }
        public ReportViewModel ReportVM_Trv { get; }
        public ReportViewModel ReportVM_Con { get; }
        public RecordListViewModel RecordListVM { get; }
        public TopErrorAnalysisViewModel TopHataAnalizVM { get; }
        public ManufacturingViewModel ManufacturingVM { get; }
        public NewRecordViewModel NewRecordVM { get; }
        public ErrorDetailViewModel? ErrorDetailVM { get; set; }
        
        // Yönetim Sayfaları
        public UserManagementViewModel UserManagementVM { get; }
        public TopErrorManagementViewModel TopErrorManagementVM { get; }
        public DataUploadViewModel DataUploadVM { get; }
        public ManufacturingAnalysisViewModel ManufacturingAnalysisVM { get; }

        // Navigation Commands
        public IRelayCommand NavigateDashboardCommand { get; }
        public IRelayCommand NavigateReportTrvCommand { get; }
        public IRelayCommand NavigateReportConCommand { get; }
        public IRelayCommand NavigateTopAnalizCommand { get; }
        public IRelayCommand NavigateRecordListCommand { get; }
        public IRelayCommand NavigateNewRecordCommand { get; }
        public IRelayCommand NavigateManufacturingCommand { get; }
        public IRelayCommand NavigateManufacturingAnalysisCommand { get; }
        
        public IRelayCommand NavigateUserManagementCommand { get; }
        public IRelayCommand NavigateTopErrorManagementCommand { get; }
        public IRelayCommand NavigateDataUploadCommand { get; }
        
        public IRelayCommand<string> NavigateErrorDetailCommand { get; }
        public IRelayCommand LogoutCommand { get; }

        public MainViewModel()
        {
            LoginVM = new LoginViewModel(this);
            DashboardVM = new DashboardViewModel();
            
            // TRV & TOU ve Connecto için FARKLI raporlar
            ReportVM_Trv = new ReportViewModel("TRV_TOU"); 
            ReportVM_Con = new ReportViewModel("CONNECTO"); 
            
            RecordListVM = new RecordListViewModel();
            TopHataAnalizVM = new TopErrorAnalysisViewModel(NavigateToErrorDetail);
            ManufacturingVM = new ManufacturingViewModel();
            NewRecordVM = new NewRecordViewModel();
            
            // Yönetim ViewModelleri
            UserManagementVM = new UserManagementViewModel();
            TopErrorManagementVM = new TopErrorManagementViewModel();
            DataUploadVM = new DataUploadViewModel();
            ManufacturingAnalysisVM = new ManufacturingAnalysisViewModel();

            currentView = LoginVM;
            isSidebarVisible = false;

            // Navigation Commands
            NavigateDashboardCommand = new RelayCommand(() => { 
                DashboardVM.LoadData();
                CurrentView = DashboardVM; 
                IsSidebarVisible = true; 
            });
            
            NavigateReportTrvCommand = new RelayCommand(() => { 
                ReportVM_Trv.LoadData();
                CurrentView = ReportVM_Trv; 
                IsSidebarVisible = true; 
            });
            
            NavigateReportConCommand = new RelayCommand(() => { 
                ReportVM_Con.LoadData();
                CurrentView = ReportVM_Con; 
                IsSidebarVisible = true; 
            });
            
            NavigateTopAnalizCommand = new RelayCommand(() => { 
                TopHataAnalizVM.LoadData();
                CurrentView = TopHataAnalizVM; 
                IsSidebarVisible = true; 
            });
            
            NavigateRecordListCommand = new RelayCommand(() => { 
                CurrentView = RecordListVM; 
                IsSidebarVisible = true; 
            });
            
            NavigateNewRecordCommand = new RelayCommand(() => { 
                CurrentView = NewRecordVM; 
                IsSidebarVisible = true; 
            });
            
            NavigateManufacturingCommand = new RelayCommand(() => { 
                CurrentView = ManufacturingVM; 
                IsSidebarVisible = true; 
            });
            
            NavigateManufacturingAnalysisCommand = new RelayCommand(() => { 
                ManufacturingAnalysisVM.LoadData();
                CurrentView = ManufacturingAnalysisVM; 
                IsSidebarVisible = true; 
            });
            
            NavigateUserManagementCommand = new RelayCommand(() => { 
                CurrentView = UserManagementVM; 
                IsSidebarVisible = true; 
            });
            
            NavigateTopErrorManagementCommand = new RelayCommand(() => { 
                CurrentView = TopErrorManagementVM; 
                IsSidebarVisible = true; 
            });
            
            NavigateDataUploadCommand = new RelayCommand(() => { 
                CurrentView = DataUploadVM; 
                IsSidebarVisible = true; 
            });

            NavigateErrorDetailCommand = new RelayCommand<string>((errorName) => { 
                ErrorDetailVM = new ErrorDetailViewModel(errorName ?? "Hata Detayı");
                CurrentView = ErrorDetailVM; 
            });

            LogoutCommand = new RelayCommand(() => { 
                CurrentUser = null; 
                CurrentView = LoginVM; 
                IsSidebarVisible = false; 
            });
        }

        private void NavigateToErrorDetail(string errorName)
        {
            NavigateErrorDetailCommand.Execute(errorName);
        }
    }
}
