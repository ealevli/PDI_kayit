# PDI Uygulaması - C# / WPF Migration Rehberi

## 📋 İçindekiler
1. [Neden C# / WPF?](#neden-c--wpf)
2. [Avantajlar](#avantajlar)
3. [Dezavantajlar ve Kayıplar](#dezavantajlar-ve-kayıplar)
4. [Kurulum Gereksinimleri](#kurulum-gereksinimleri)
5. [Proje Yapısı](#proje-yapısı)
6. [Geçiş Stratejisi](#geçiş-stratejisi)
7. [Kod Eşleştirme Tablosu](#kod-eşleştirme-tablosu)
8. [Tahmini Zaman](#tahmini-zaman)

---

## 🎯 Neden C# / WPF?

| Özellik | Python/Tkinter | C#/WPF |
|---------|---------------|--------|
| **Performans** | Orta | Çok Yüksek |
| **Bellek Kullanımı** | Yüksek | Düşük |
| **UI Kalitesi** | Temel | Modern/Profesyonel |
| **Grafik Rendering** | Yavaş (Canvas) | Hızlı (DirectX) |
| **Dağıtım** | Runtime gerekli | Tek EXE (self-contained) |
| **Windows Entegrasyonu** | Sınırlı | Native |

---

## ✅ Avantajlar

### 1. **Performans (10x-50x Hız Artışı)**
- Compiled kod, interpreted değil
- Native Windows API erişimi
- Async/await ile non-blocking UI
- Virtualized listeler (binlerce kayıt sorunsuz)

### 2. **Modern UI Özellikleri**
```xml
<!-- XAML ile kolay styling -->
<Button Style="{StaticResource ModernButton}" 
        Content="KAYDET" 
        Command="{Binding SaveCommand}"/>
```
- XAML ile deklaratif UI
- Data Binding (otomatik güncelleme)
- Animasyonlar ve geçişler
- Tema desteği (koyu/açık mod)

### 3. **Grafik Performansı**
- LiveCharts2 veya OxyPlot kütüphaneleri
- Hardware acceleration
- Smooth zooming/panning

### 4. **Kolay Dağıtım**
```bash
# Tek dosya publish
dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true
```
- Python kurulumu gereksiz
- Tek EXE dosyası (50-80 MB)
- ClickOnce ile otomatik güncelleme

### 5. **Profesyonel Araçlar**
- Visual Studio entegrasyonu
- IntelliSense (kod tamamlama)
- Debugging araçları
- Unit test desteği

---

## ❌ Dezavantajlar ve Kayıplar

### 1. **Öğrenme Eğrisi**
| Konu | Zorluk | Süre |
|------|--------|------|
| C# Syntax | Orta | 1-2 hafta |
| XAML/WPF | Yüksek | 2-3 hafta |
| MVVM Pattern | Yüksek | 1-2 hafta |
| Entity Framework | Orta | 1 hafta |

### 2. **Geçiş Sürecinde Kayıplar**
- **Hızlı prototipleme:** Python'da daha hızlı değişiklik yapılır
- **Cross-platform:** WPF sadece Windows (alternatif: MAUI)
- **Geliştirme hızı:** Başlangıçta yavaş, sonra hızlanır

### 3. **Kod Miktarı**
```python
# Python (3 satır)
btn = tk.Button(root, text="Tıkla", command=self.save)
btn.pack()
```

```csharp
// C# + XAML (5+ satır)
// XAML:
<Button Content="Tıkla" Command="{Binding SaveCommand}"/>

// ViewModel:
public ICommand SaveCommand => new RelayCommand(Save);
private void Save() { /* ... */ }
```

### 4. **Ekosistem Farklılıkları**
- pandas → LINQ / Dapper
- matplotlib → LiveCharts2 / OxyPlot
- PIL → System.Drawing / ImageSharp
- sqlite3 → Microsoft.Data.Sqlite / EF Core

---

## 🛠️ Kurulum Gereksinimleri

### Geliştirme Ortamı
1. **Visual Studio 2022** (Community - ücretsiz)
   - Workload: ".NET Desktop Development"
   
2. **.NET 8 SDK**
   ```bash
   winget install Microsoft.DotNet.SDK.8
   ```

3. **Gerekli NuGet Paketleri**
   ```xml
   <PackageReference Include="Microsoft.Data.Sqlite" Version="8.0.0" />
   <PackageReference Include="LiveChartsCore.SkiaSharpView.WPF" Version="2.0.0" />
   <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
   <PackageReference Include="ClosedXML" Version="0.102.2" />
   ```

---

## 📁 Proje Yapısı

```
PDI.WPF/
├── PDI.WPF.csproj              # Proje dosyası
├── App.xaml                     # Uygulama giriş noktası
├── MainWindow.xaml              # Ana pencere
│
├── Views/                       # XAML sayfaları
│   ├── LoginView.xaml
│   ├── DashboardView.xaml
│   ├── ReportTrvTouView.xaml
│   ├── ReportConnectoView.xaml
│   └── RecordListView.xaml
│
├── ViewModels/                  # İş mantığı
│   ├── MainViewModel.cs
│   ├── LoginViewModel.cs
│   ├── DashboardViewModel.cs
│   └── ReportViewModel.cs
│
├── Models/                      # Veri modelleri
│   ├── PdiRecord.cs
│   ├── User.cs
│   └── TopHata.cs
│
├── Services/                    # Veritabanı, API
│   ├── DatabaseService.cs
│   └── ReportService.cs
│
├── Converters/                  # UI dönüştürücüler
│   └── BoolToVisibilityConverter.cs
│
└── Resources/                   # Stiller, resimler
    ├── Styles.xaml
    └── Colors.xaml
```

---

## 🔄 Geçiş Stratejisi

### Aşama 1: Temel Yapı (1-2 hafta)
1. Visual Studio'da yeni WPF projesi oluştur
2. MVVM yapısını kur
3. SQLite bağlantısını yapılandır
4. Login ekranını oluştur

### Aşama 2: Veri Katmanı (1 hafta)
1. Model sınıflarını oluştur (PdiRecord, User, vb.)
2. Repository pattern ile CRUD işlemleri
3. Mevcut SQLite veritabanını kullan (uyumlu)

### Aşama 3: UI Sayfaları (2-3 hafta)
1. Dashboard
2. Rapor sayfaları (TRV/TOU, Connecto)
3. Kayıt listesi ve form
4. İmalat modülü

### Aşama 4: Grafikler (1 hafta)
1. LiveCharts2 entegrasyonu
2. Bar + Line combo chart
3. Donut/Pie charts

### Aşama 5: Polish (1 hafta)
1. Animasyonlar
2. Tema desteği
3. Error handling
4. Test ve hata düzeltme

---

## 📊 Kod Eşleştirme Tablosu

| Python/Tkinter | C#/WPF Karşılığı |
|----------------|------------------|
| `tk.Tk()` | `MainWindow : Window` |
| `tk.Frame` | `<Grid>`, `<StackPanel>` |
| `tk.Label` | `<TextBlock>` |
| `tk.Button` | `<Button>` |
| `tk.Entry` | `<TextBox>` |
| `ttk.Combobox` | `<ComboBox>` |
| `ttk.Treeview` | `<DataGrid>` veya `<ListView>` |
| `tk.Canvas` | `<Canvas>` veya Chart kütüphanesi |
| `messagebox.showinfo()` | `MessageBox.Show()` |
| `sqlite3.connect()` | `SqliteConnection` |
| `pack()`, `grid()` | XAML Layout (Grid, StackPanel) |
| `command=self.func` | `Command="{Binding FuncCommand}"` |
| `StringVar()` | `ObservableProperty` |

---

## ⏱️ Tahmini Zaman

| Senaryo | Süre |
|---------|------|
| **Deneyimli C# geliştirici** | 3-4 hafta |
| **Python bilen, C# yeni öğrenen** | 6-8 hafta |
| **Sıfırdan öğrenen** | 10-12 hafta |

### Paralel Strateji (Önerilen)
1. Python versiyonu çalışmaya devam eder
2. C# versiyonu arka planda geliştirilir
3. Hazır olunca geçiş yapılır
4. Aynı SQLite veritabanını kullanır (veri kaybı yok)

---

## 🚀 Örnek Başlangıç Kodu

### 1. Model (Models/PdiRecord.cs)
```csharp
public class PdiRecord
{
    public int Id { get; set; }
    public string BbNo { get; set; }
    public string SasiNo { get; set; }
    public string AracTipi { get; set; }
    public string TopHata { get; set; }
    public DateTime TarihSaat { get; set; }
}
```

### 2. ViewModel (ViewModels/DashboardViewModel.cs)
```csharp
public partial class DashboardViewModel : ObservableObject
{
    [ObservableProperty]
    private int toplamArac;
    
    [ObservableProperty]
    private int toplamHata;
    
    public DashboardViewModel()
    {
        LoadData();
    }
    
    private void LoadData()
    {
        using var db = new SqliteConnection("Data Source=pdi_veritabani.db");
        ToplamArac = db.ExecuteScalar<int>("SELECT COUNT(DISTINCT sasi_no) FROM pdi_kayitlari");
        ToplamHata = db.ExecuteScalar<int>("SELECT COUNT(*) FROM pdi_kayitlari");
    }
}
```

### 3. View (Views/DashboardView.xaml)
```xml
<UserControl x:Class="PDI.Views.DashboardView">
    <Grid>
        <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
            <!-- Kart 1 -->
            <Border Style="{StaticResource CardStyle}">
                <StackPanel>
                    <TextBlock Text="TOPLAM ARAÇ" Style="{StaticResource CardTitle}"/>
                    <TextBlock Text="{Binding ToplamArac}" Style="{StaticResource CardNumber}"/>
                </StackPanel>
            </Border>
            
            <!-- Kart 2 -->
            <Border Style="{StaticResource CardStyle}">
                <StackPanel>
                    <TextBlock Text="TOPLAM HATA" Style="{StaticResource CardTitle}"/>
                    <TextBlock Text="{Binding ToplamHata}" Style="{StaticResource CardNumber}"/>
                </StackPanel>
            </Border>
        </StackPanel>
    </Grid>
</UserControl>
```

---

## 📌 Sonuç

### Ne Zaman C#/WPF'e Geçmeli?
✅ Performans kritik hale geldiğinde  
✅ Kullanıcı sayısı arttığında  
✅ Profesyonel dağıtım gerektiğinde  
✅ Long-term maintenance planlanıyorsa  

### Ne Zaman Python'da Kalmalı?
✅ Hızlı prototipleme gerektiğinde  
✅ Tek kullanıcılı küçük uygulamalarda  
✅ Geliştirme kaynağı sınırlıysa  

---

*Bu rehber, PDI uygulamasının C#/WPF'e taşınması için hazırlanmıştır.*
*Hazırlayan: Antigravity AI Assistant*
*Tarih: Ocak 2026*
