import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Award, TrendingUp, AlertCircle } from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

const MONTHS = [
    { id: 1, name: "Ocak" }, { id: 2, name: "Şubat" }, { id: 3, name: "Mart" },
    { id: 4, name: "Nisan" }, { id: 5, name: "Mayıs" }, { id: 6, name: "Haziran" },
    { id: 7, name: "Temmuz" }, { id: 8, name: "Ağustos" }, { id: 9, name: "Eylül" },
    { id: 10, name: "Ekim" }, { id: 11, name: "Kasım" }, { id: 12, name: "Aralık" }
];

type ViewMode = 'mtd' | 'ytd';

const ConectoTop3: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<ViewMode>('mtd');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/reports/conecto-top3`, {
                params: { month: selectedMonth, year: selectedYear, mode: viewMode }
            });
            setData(res.data);
        } catch (err) {
            console.error("Conecto Top 3 fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [selectedMonth, selectedYear, viewMode]);

    if (loading && !data) return <div className="p-8 text-center text-white font-medium">Yükleniyor...</div>;

    const results = data?.results || [];
    const monthName = MONTHS.find(m => m.id === selectedMonth)?.name ?? '';
    const periodLabel = viewMode === 'ytd'
        ? `${selectedYear} Ocak – ${monthName} (YTD)`
        : `${selectedYear} ${monthName} (Aylık)`;

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-md shadow-2xl">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <Award className="text-yellow-500" size={28} />
                        CONECTO TOP 3 HATA ANALİZİ
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-wider">
                        {viewMode === 'mtd' ? 'Seçili Aya Ait En Kritik Odak Noktaları' : 'Yılbaşından Seçili Aya Kümülatif Analiz (YTD)'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* YTD / MTD Toggle */}
                    <div className="flex items-center bg-black/40 rounded-xl border border-gray-800 p-1">
                        <button
                            onClick={() => setViewMode('mtd')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                viewMode === 'mtd'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            MTD
                        </button>
                        <button
                            onClick={() => setViewMode('ytd')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                viewMode === 'ytd'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            YTD
                        </button>
                    </div>

                    {/* Month / Year selectors */}
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-gray-800">
                        <Calendar size={18} className="text-gray-500 ml-2" />
                        <select
                            className="bg-transparent text-white px-3 py-1.5 focus:outline-none text-sm font-bold cursor-pointer"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {MONTHS.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>)}
                        </select>
                        <select
                            className="bg-transparent text-white px-3 py-1.5 focus:outline-none text-sm font-bold border-l border-gray-800 cursor-pointer"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Banner Section */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-900/20 rounded-[2.5rem] p-10 border border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <TrendingUp size={240} />
                </div>

                <div className="relative z-10 text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6">
                        {viewMode === 'ytd' ? 'YTD — Kümülatif Özet' : 'MTD — Aylık Özet'}
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">
                        {periodLabel}
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed font-medium">
                        Bu dönemde toplam{' '}
                        <span className="text-white font-black underline decoration-emerald-500/50 decoration-4 underline-offset-4">
                            {data?.total_errors}
                        </span>{' '}
                        hata kaydı analiz edilmiştir.
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {results.map((r: any, idx: number) => (
                        <div key={r.hata_adi} className="group relative">
                            <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 transition-all duration-300 hover:border-emerald-500/40 hover:-translate-y-2 shadow-xl hover:shadow-emerald-500/10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:scale-110 ${
                                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-600' :
                                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                               'bg-gradient-to-br from-orange-400 to-red-800'
                                }`}>
                                    <span className="text-2xl font-black text-white italic">#{idx + 1}</span>
                                </div>

                                <div className="h-16 flex items-center mb-6 border-b border-gray-800/50 pb-4">
                                    <h3 className="text-base lg:text-lg font-black text-white leading-tight line-clamp-2 uppercase">
                                        {r.hata_adi}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">HATA SAYISI</span>
                                        <span className="text-2xl font-black text-white tabular-nums">{r.ytd_sayi}</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-gray-500">PAYI</span>
                                            <span className="text-emerald-400 font-black">%{(r.oran * 100).toFixed(1)}</span>
                                        </div>
                                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                style={{ width: `${Math.min(100, r.oran * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {results.length === 0 && !loading && (
                        <div className="col-span-3 py-20 text-center bg-black/20 rounded-3xl border border-dashed border-gray-800">
                            <div className="flex flex-col items-center gap-4 text-gray-600">
                                <AlertCircle size={48} />
                                <p className="text-lg font-bold italic uppercase tracking-widest">Seçili dönem için veri bulunamadı</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Separator / Footer context */}
            <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent rounded-full"></div>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Conecto Kalite Standartları Analizi</p>
            </div>
        </div>
    );
};

export default ConectoTop3;
