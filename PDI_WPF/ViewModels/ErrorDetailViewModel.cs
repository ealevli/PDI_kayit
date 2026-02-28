using CommunityToolkit.Mvvm.ComponentModel;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;
using SkiaSharp;
using System.Collections.ObjectModel;
using System.Collections.Generic;

namespace PDI_WPF.ViewModels
{
    public partial class ErrorDetailViewModel : ObservableObject
    {
        [ObservableProperty] private string title = "Detay Analiz";
        
        public ISeries[] DetailSeries { get; set; } = { };
        public Axis[] XAxes { get; set; } = { };
        public ObservableCollection<DetailGridItem> GridData { get; set; } = new();

        public ErrorDetailViewModel(string errorName)
        {
            Title = $"{errorName} - Son 12 Ay Analizi";
            LoadMockData();
        }

        private void LoadMockData()
        {
            var aylar = new[] { "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA", "OCA" };
            
            DetailSeries = new ISeries[]
            {
                new LineSeries<double> { 
                    Values = new double[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, 
                    Name = "TRV Hata Oranı", 
                    Stroke = new SolidColorPaint(SKColors.Blue) { StrokeThickness = 3 },
                    Fill = null,
                    GeometrySize = 8,
                    DataLabelsSize = 13,
                    DataLabelsPaint = new SolidColorPaint(SKColors.Blue),
                    DataLabelsPosition = LiveChartsCore.Measure.DataLabelsPosition.Top
                },
                new LineSeries<double> { 
                    Values = new double[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 100 }, 
                    Name = "TOU Hata Oranı", 
                    Stroke = new SolidColorPaint(SKColors.Orange) { StrokeThickness = 3 },
                    Fill = null,
                    GeometrySize = 8,
                    DataLabelsSize = 13,
                    DataLabelsPaint = new SolidColorPaint(SKColors.Orange),
                    DataLabelsPosition = LiveChartsCore.Measure.DataLabelsPosition.Top
                }
            };

            XAxes = new Axis[] { new Axis { Labels = aylar, LabelsRotation = -45 } };

            // Tablo verileri (Python'daki 4. görsel yapısı)
            GridData.Add(new DetailGridItem { RowHeader = "TRV Araç Sayısı", Sub = "10", Mar = "30", Nis = "20", May = "24", Haz = "21", Tem = "13", Agu = "11", Eyl = "17", Eki = "1", Kas = "1", Ara = "0", Oca = "0" });
            GridData.Add(new DetailGridItem { RowHeader = "TRV Hata Oranı", Sub = "%0", Mar = "%0", Nis = "%0", May = "%0", Haz = "%0", Tem = "%0", Agu = "%0", Eyl = "%0", Eki = "%0", Kas = "%0", Ara = "%0", Oca = "%0" });
            GridData.Add(new DetailGridItem { RowHeader = "TOU Araç Sayısı", Sub = "10", Mar = "33", Nis = "36", May = "51", Haz = "20", Tem = "18", Agu = "10", Eyl = "9", Eki = "5", Kas = "9", Ara = "0", Oca = "1" });
            GridData.Add(new DetailGridItem { RowHeader = "TOU Hata Oranı", Sub = "%0", Mar = "%0", Nis = "%0", May = "%0", Haz = "%0", Tem = "%0", Agu = "%0", Eyl = "%0", Eki = "%0", Kas = "%11", Ara = "%0", Oca = "%100" });
        }
    }

    public class DetailGridItem
    {
        public string RowHeader { get; set; } = "";
        public string Sub { get; set; } = ""; public string Mar { get; set; } = ""; public string Nis { get; set; } = "";
        public string May { get; set; } = ""; public string Haz { get; set; } = ""; public string Tem { get; set; } = "";
        public string Agu { get; set; } = ""; public string Eyl { get; set; } = ""; public string Eki { get; set; } = "";
        public string Kas { get; set; } = ""; public string Ara { get; set; } = ""; public string Oca { get; set; } = "";
    }
}
