using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ClosedXML.Excel;
using PDI_WPF.Data;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows;
using Microsoft.Win32;

namespace PDI_WPF.ViewModels
{
    public partial class DataUploadViewModel : ObservableObject
    {
        private readonly DatabaseService _db;

        [ObservableProperty] private string filePath = "";
        [ObservableProperty] private string resultText = "";
        [ObservableProperty] private bool isImporting = false;
        [ObservableProperty] private ObservableCollection<string> detectedColumns = new();

        public IRelayCommand BrowseCommand { get; }
        public IRelayCommand ImportCommand { get; }

        // Kolon eşleştirme haritası (Python'dan birebir)
        private static readonly Dictionary<string, string[]> ColumnMappings = new()
        {
            {"bb_no", new[] {"BB No", "BB NO", "BBNO", "BB"}},
            {"sasi_no", new[] {"Şasi No", "ŞASİ NO", "SASİ NO", "Sasi No", "SASI NO", "SASI", "CHASSIS", "ŞASİ"}},
            {"arac_tipi", new[] {"Araç Tipi", "ARAÇ TİPİ", "ARAC TIPI", "TİP", "ARAC", "TIP", "MODEL", "ARAÇ"}},
            {"is_emri", new[] {"İş Emri No", "İŞ EMRİ NO", "IS EMRI NO", "İŞ EMRİ", "IS EMRI", "ISEMRI", "İŞEMRİ"}},
            {"tarih", new[] {"PDI Tarihi", "PDI TARİHİ", "PDI Yapılış Tarihi", "Tarih", "TARİH", "YAPILIŞ TARİHİ", "PDI DATE", "DATE"}},
            {"tespitler", new[] {"Tespitler", "TESPİTLER", "TESPITLER", "HATA", "TESPİT", "FINDINGS", "DESCRIPTION", "AÇIKLAMA"}},
            {"konum", new[] {"Hata Konumu", "HATA KONUMU", "KONUM", "HATA YERİ", "LOCATION", "YER"}},
            {"grup", new[] {"Alt Grup", "ALT GRUP", "GRUP", "SUBGROUP", "ALTGRUP"}}
        };

        // Araç tipi dönüşüm haritası (Python'dan birebir)
        private static readonly Dictionary<string, string> TypeMappings = new(StringComparer.OrdinalIgnoreCase)
        {
            {"TOU", "Tourismo"}, {"TRV", "Travego"}, {"CON", "Connecto"},
            {"TOURISMO", "Tourismo"}, {"TRAVEGO", "Travego"}, {"CONNECTO", "Connecto"},
            {"TOURİSMO", "Tourismo"}, {"İNTOURO", "Intouro"}, {"INTOURO", "Intouro"}
        };

        public DataUploadViewModel()
        {
            _db = new DatabaseService();
            BrowseCommand = new RelayCommand(Browse);
            ImportCommand = new RelayCommand(Import, () => !string.IsNullOrEmpty(FilePath) && !IsImporting);
        }

        private void Browse()
        {
            var dialog = new OpenFileDialog
            {
                Filter = "Excel Dosyaları|*.xlsx;*.xls|Tüm Dosyalar|*.*",
                Title = "Excel Dosyası Seç"
            };

            if (dialog.ShowDialog() == true)
            {
                FilePath = dialog.FileName;
                AnalyzeFile();
            }
        }

        private void AnalyzeFile()
        {
            try
            {
                using var workbook = new XLWorkbook(FilePath);
                var worksheet = workbook.Worksheet(1);
                var headerRow = worksheet.Row(1);

                DetectedColumns.Clear();
                var sb = new StringBuilder();
                sb.AppendLine("📄 Dosya analiz ediliyor...");

                var columns = headerRow.CellsUsed().Select(c => c.GetString().Trim()).ToList();
                sb.AppendLine($"📊 Algılanan Sütunlar ({columns.Count} adet):");

                foreach (var col in columns)
                {
                    if (!string.IsNullOrEmpty(col))
                    {
                        DetectedColumns.Add(col);
                        var mappedTo = FindMappedColumn(col);
                        string status = mappedTo != null ? $"✅ -> {mappedTo}" : "❓ Bilinmiyor";
                        sb.AppendLine($"  • {col} {status}");
                    }
                }

                ResultText = sb.ToString();
            }
            catch (Exception ex)
            {
                ResultText = $"❌ Dosya okunamadı: {ex.Message}";
            }
        }

        private string? FindMappedColumn(string columnName)
        {
            var normalized = NormalizeString(columnName);
            foreach (var mapping in ColumnMappings)
            {
                foreach (var alias in mapping.Value)
                {
                    if (NormalizeString(alias) == normalized)
                        return mapping.Key;
                }
            }
            return null;
        }

        /// <summary>
        /// Türkçe karakterleri ASCII'ye çevirir ve küçük harfe dönüştürür
        /// Python'daki str_norm fonksiyonunun karşılığı
        /// </summary>
        private static string NormalizeString(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";

            var mapping = new Dictionary<char, char>
            {
                {'ç', 'c'}, {'Ç', 'c'}, {'ğ', 'g'}, {'Ğ', 'g'},
                {'ı', 'i'}, {'İ', 'i'}, {'ö', 'o'}, {'Ö', 'o'},
                {'ş', 's'}, {'Ş', 's'}, {'ü', 'u'}, {'Ü', 'u'},
                {'â', 'a'}, {'î', 'i'}, {'û', 'u'}
            };

            var sb = new StringBuilder();
            foreach (var c in s.ToLowerInvariant())
            {
                if (mapping.TryGetValue(c, out char mapped))
                    sb.Append(mapped);
                else if (char.IsLetterOrDigit(c))
                    sb.Append(c);
            }
            return sb.ToString().ToUpperInvariant();
        }

        private void Import()
        {
            if (string.IsNullOrEmpty(FilePath) || !File.Exists(FilePath))
            {
                MessageBox.Show("Lütfen geçerli bir Excel dosyası seçin.", "Uyarı", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            IsImporting = true;
            var sb = new StringBuilder();

            try
            {
                using var workbook = new XLWorkbook(FilePath);
                var worksheet = workbook.Worksheet(1);

                // Başlık satırından kolon indekslerini bul
                var headerRow = worksheet.Row(1);
                var columnIndices = new Dictionary<string, int>();

                foreach (var cell in headerRow.CellsUsed())
                {
                    var colName = cell.GetString().Trim();
                    var mappedCol = FindMappedColumn(colName);
                    if (mappedCol != null && !columnIndices.ContainsKey(mappedCol))
                    {
                        columnIndices[mappedCol] = cell.Address.ColumnNumber;
                    }
                }

                sb.AppendLine("🔍 Kolon Eşleştirme:");
                foreach (var kv in columnIndices)
                    sb.AppendLine($"  • {kv.Key} -> Sütun {kv.Value}");

                // Veri satırlarını oku
                using var conn = _db.GetConnection();
                conn.Open();

                int successCount = 0, errorCount = 0;
                var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 1;

                for (int row = 2; row <= lastRow; row++)
                {
                    try
                    {
                        var sasiNo = GetCellValue(worksheet, row, columnIndices, "sasi_no");
                        if (string.IsNullOrEmpty(sasiNo))
                        {
                            errorCount++;
                            continue;
                        }

                        var bbNo = GetCellValue(worksheet, row, columnIndices, "bb_no");
                        var aracTipiRaw = GetCellValue(worksheet, row, columnIndices, "arac_tipi");
                        var aracTipi = ConvertAracTipi(aracTipiRaw);
                        var isEmri = GetCellValue(worksheet, row, columnIndices, "is_emri");
                        var tarih = GetCellValue(worksheet, row, columnIndices, "tarih");
                        var tespitler = GetCellValue(worksheet, row, columnIndices, "tespitler");
                        var konum = GetCellValue(worksheet, row, columnIndices, "konum");
                        var grup = GetCellValue(worksheet, row, columnIndices, "grup");

                        // Tarih formatını düzenle
                        if (!string.IsNullOrEmpty(tarih))
                        {
                            if (DateTime.TryParse(tarih, out DateTime dt))
                                tarih = dt.ToString("dd-MM-yyyy HH:mm");
                        }
                        else
                        {
                            tarih = DateTime.Now.ToString("dd-MM-yyyy HH:mm");
                        }

                        var cmd = conn.CreateCommand();
                        cmd.CommandText = @"
                            INSERT INTO pdi_kayitlari 
                            (bb_no, sasi_no, arac_tipi, is_emri_no, tarih_saat, tespitler, hata_konumu, alt_grup, kullanici, top_hata)
                            VALUES (@bb, @sasi, @arac, @isemri, @tarih, @tespit, @konum, @grup, @user, @tophata)";

                        cmd.Parameters.AddWithValue("@bb", bbNo);
                        cmd.Parameters.AddWithValue("@sasi", sasiNo);
                        cmd.Parameters.AddWithValue("@arac", aracTipi);
                        cmd.Parameters.AddWithValue("@isemri", isEmri);
                        cmd.Parameters.AddWithValue("@tarih", tarih);
                        cmd.Parameters.AddWithValue("@tespit", tespitler);
                        cmd.Parameters.AddWithValue("@konum", konum);
                        cmd.Parameters.AddWithValue("@grup", grup);
                        cmd.Parameters.AddWithValue("@user", "ExcelImport");
                        cmd.Parameters.AddWithValue("@tophata", grup); // Alt grup = Top hata varsayılan

                        cmd.ExecuteNonQuery();
                        successCount++;
                    }
                    catch
                    {
                        errorCount++;
                    }
                }

                sb.AppendLine();
                sb.AppendLine($"✅ {successCount} kayıt başarıyla eklendi.");
                if (errorCount > 0)
                    sb.AppendLine($"❌ {errorCount} kayıt hatalı (eksik şasi no veya diğer hatalar)");

                ResultText = sb.ToString();
                MessageBox.Show($"{successCount} kayıt başarıyla içeri aktarıldı.", "Başarılı", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                ResultText = $"❌ İçeri aktarma hatası: {ex.Message}";
                MessageBox.Show($"İçeri aktarma sırasında hata oluştu: {ex.Message}", "Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                IsImporting = false;
            }
        }

        private string GetCellValue(IXLWorksheet ws, int row, Dictionary<string, int> indices, string key)
        {
            if (indices.TryGetValue(key, out int col))
            {
                var value = ws.Cell(row, col).GetString()?.Trim() ?? "";
                return value;
            }
            return "";
        }

        private string ConvertAracTipi(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return "Tourismo";

            var upper = raw.Trim().ToUpperInvariant();
            if (TypeMappings.TryGetValue(upper, out string? mapped))
                return mapped;

            // Kısmi eşleşme dene
            if (upper.Contains("TOU")) return "Tourismo";
            if (upper.Contains("TRV") || upper.Contains("TRAV")) return "Travego";
            if (upper.Contains("CON")) return "Connecto";
            if (upper.Contains("INT")) return "Intouro";

            return "Tourismo"; // Varsayılan
        }

        partial void OnFilePathChanged(string value)
        {
            (ImportCommand as RelayCommand)?.NotifyCanExecuteChanged();
        }
    }
}
