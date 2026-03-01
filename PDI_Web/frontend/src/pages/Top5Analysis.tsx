import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts';
import { Calendar, Edit2, TrendingUp, X, Loader2, Save } from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

const years = [2024, 2025, 2026];
const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const toCtxMonth = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;
const toErrorCtx = (year: number, month: number, hataAdi: string) => `${toCtxMonth(year, month)}_${encodeURIComponent(hataAdi)}`;

const Top5Analysis: React.FC = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [selectedHata, setSelectedHata] = useState<string | null>(null);
    const [trendData, setTrendData] = useState<any>(null);
    const [loadingTrend, setLoadingTrend] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [manualMap, setManualMap] = useState<Record<string, string>>({});
    const [editData, setEditData] = useState({
        year: String(new Date().getFullYear()),
        month: String(new Date().getMonth() + 1),
        trv_total: '',
        tou_total: '',
        trv_error_count: '',
        tou_error_count: ''
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/reports/top-errors`, { params: { month, year } });
            setData(res.data);
        } catch (err) {
            console.error('Top errors fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrend = async (hataName: string, m = month, y = year) => {
        setSelectedHata(hataName);
        setLoadingTrend(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/reports/error-trend`, {
                params: { hata_adi: hataName, month: m, year: y }
            });
            setTrendData(res.data);
        } catch (err) {
            console.error('Trend fetch error:', err);
        } finally {
            setLoadingTrend(false);
        }
    };

    const fetchAllManualData = async () => {
        const res = await axios.get(`${API_BASE_URL}/admin/manual-data/top5`);
        setManualMap(res.data || {});
        return res.data || {};
    };

    const getSelectedResultCounts = (hataName: string) => {
        const row = (data?.results || []).find((r: any) => r.hata_adi === hataName);
        return {
            trv_error_count: String(row?.trv_count ?? 0),
            tou_error_count: String(row?.tou_count ?? 0),
            trv_total: String(data?.totals?.trv ?? 0),
            tou_total: String(data?.totals?.tou ?? 0)
        };
    };

    const fetchCurrentPeriodStats = async (hataName: string, m: number, y: number) => {
        try {
            const trend = await axios.get(`${API_BASE_URL}/reports/error-trend`, {
                params: { hata_adi: hataName, month: m, year: y }
            });
            const trvLast = trend.data?.TRV?.[trend.data.TRV.length - 1] || { arac: 0, hata: 0 };
            const touLast = trend.data?.TOU?.[trend.data.TOU.length - 1] || { arac: 0, hata: 0 };
            return {
                trv_total: String(trvLast.arac ?? 0),
                tou_total: String(touLast.arac ?? 0),
                trv_error_count: String(trvLast.hata ?? 0),
                tou_error_count: String(touLast.hata ?? 0)
            };
        } catch {
            return { trv_total: '0', tou_total: '0', trv_error_count: '0', tou_error_count: '0' };
        }
    };

    const hydrateEditData = async (hataName: string, m: number, y: number, map?: Record<string, string>) => {
        const manual = map || manualMap;
        const baseCtx = toCtxMonth(y, m);
        const errCtx = toErrorCtx(y, m, hataName);

        const fallback = (m === month && y === year) ? getSelectedResultCounts(hataName) : await fetchCurrentPeriodStats(hataName, m, y);

        setEditData({
            year: String(y),
            month: String(m),
            trv_total: manual[`${baseCtx}_trv_total`] ?? fallback.trv_total,
            tou_total: manual[`${baseCtx}_tou_total`] ?? fallback.tou_total,
            trv_error_count: manual[`${errCtx}_trv_error_count`] ?? fallback.trv_error_count,
            tou_error_count: manual[`${errCtx}_tou_error_count`] ?? fallback.tou_error_count
        });
    };

    const openEditModalForSelectedHata = async () => {
        if (!selectedHata) return;
        const map = await fetchAllManualData();
        await hydrateEditData(selectedHata, month, year, map);
        setShowEditModal(true);
    };

    const handleEditMonthYearChange = async (key: 'month' | 'year', value: string) => {
        if (!selectedHata) return;
        const nextMonth = key === 'month' ? Number(value) : Number(editData.month);
        const nextYear = key === 'year' ? Number(value) : Number(editData.year);
        await hydrateEditData(selectedHata, nextMonth, nextYear);
    };

    const handleSaveManual = async () => {
        if (!selectedHata) return;

        const targetMonth = Number(editData.month);
        const targetYear = Number(editData.year);
        const monthCtx = toCtxMonth(targetYear, targetMonth);
        const errorCtx = toErrorCtx(targetYear, targetMonth, selectedHata);

        const writes = [
            { context_key: monthCtx, data_key: 'trv_total', data_value: editData.trv_total },
            { context_key: monthCtx, data_key: 'tou_total', data_value: editData.tou_total },
            { context_key: errorCtx, data_key: 'trv_error_count', data_value: editData.trv_error_count },
            { context_key: errorCtx, data_key: 'tou_error_count', data_value: editData.tou_error_count }
        ];

        for (const item of writes) {
            await axios.post(`${API_BASE_URL}/admin/manual-data`, {
                report_type: 'top5',
                context_key: item.context_key,
                data_key: item.data_key,
                data_value: item.data_value
            });
        }

        await fetchAllManualData();
        setShowEditModal(false);
        await fetchReport();
        await fetchTrend(selectedHata, month, year);
    };

    useEffect(() => {
        fetchReport();
        fetchAllManualData();
    }, [month, year]);

    if (loading && !data) return <div className="p-8 text-center text-slate-600 font-medium">Yükleniyor...</div>;

    const results = data?.results || [];
    const chartData = results.map((r: any) => ({ name: r.hata_adi, genel: r.genel_count }));

    const trvTotal = Number(editData.trv_total || 0);
    const touTotal = Number(editData.tou_total || 0);
    const trvHata = Number(editData.trv_error_count || 0);
    const touHata = Number(editData.tou_error_count || 0);
    const trvRate = trvTotal > 0 ? (trvHata / trvTotal) * 100 : 0;
    const touRate = touTotal > 0 ? (touHata / touTotal) * 100 : 0;
    const genelRate = trvTotal + touTotal > 0 ? ((trvHata + touHata) / (trvTotal + touTotal)) * 100 : 0;

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 text-slate-900">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-blue-700" size={28} />
                        TÜM TOP HATALARIN ANALİZİ
                    </h1>
                    <p className="text-slate-600 text-sm font-medium mt-1 uppercase tracking-wider">Travego & Tourismo için en çok karşılaşılan 10 hata</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <Calendar size={18} className="text-slate-500 ml-2" />
                        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent text-slate-900 px-3 py-1.5 focus:outline-none text-sm font-bold cursor-pointer">
                            {months.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                        </select>
                        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent text-slate-900 px-3 py-1.5 focus:outline-none text-sm font-bold border-l border-slate-200 cursor-pointer">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Hata Dağılımı (Sayısal)</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{months[month - 1]} {year} — Araç Başına Hata</p>
                    </div>
                </div>

                <div className="h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#cbd5e1" opacity={0.6} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={240} tick={{ fontSize: 10, fontWeight: 800, fill: '#475569' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }} itemStyle={{ color: '#0f172a', fontSize: '13px', fontWeight: 600 }} />
                            <Bar dataKey="genel" fill="url(#blueGrad)" radius={[0, 8, 8, 0]} barSize={24}>
                                <defs>
                                    <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.85} />
                                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.45} />
                                    </linearGradient>
                                </defs>
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Detaylı Oran Tablosu</h2>
                        <div className="flex gap-4 mt-2">
                            <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">TRV: {data?.totals?.trv || 0} ARAÇ</span>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">TOU: {data?.totals?.tou || 0} ARAÇ</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200">
                                <th className="px-8 py-5">TOP HATA TANIMI</th>
                                <th className="px-8 py-5 text-center">TRAVEGO %</th>
                                <th className="px-8 py-5 text-center">TOURISMO %</th>
                                <th className="px-8 py-5 text-center">GENEL ORTALAMA %</th>
                                <th className="px-8 py-5 text-center">DURUM</th>
                                <th className="px-8 py-5 text-right">AKSİYON</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {results.map((r: any) => (
                                <tr key={r.hata_adi} className="group hover:bg-slate-50 transition-all duration-300">
                                    <td className="px-8 py-5"><div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{r.hata_adi}</div></td>
                                    <td className="px-8 py-5 text-center font-bold text-slate-600">%{r.trv_rate.toFixed(2)}</td>
                                    <td className="px-8 py-5 text-center font-bold text-slate-600">%{r.tou_rate.toFixed(2)}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-black">%{r.avg_rate.toFixed(2)}</span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-lg border text-xs font-black ${
                                            r.trend_color === 'red'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : r.trend_color === 'orange'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {r.trend_status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button onClick={() => fetchTrend(r.hata_adi)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 rounded-xl transition-all font-bold text-xs flex items-center gap-2 ml-auto">
                                            <TrendingUp size={14} className="text-blue-700" /> TREND ANALİZİ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedHata && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 relative">
                        <button onClick={() => setSelectedHata(null)} className="absolute top-8 right-8 bg-slate-100 p-2 rounded-full text-slate-500 hover:text-slate-900 transition-all z-20">
                            <X size={24} />
                        </button>

                        <div className="p-10">
                            <div className="mb-8 flex items-start justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">{selectedHata}</h2>
                                    <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">Son 12 Ay Trend Analizi (Travego vs Tourismo)</p>
                                </div>
                                <button onClick={openEditModalForSelectedHata} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm">
                                    <Edit2 size={14} />
                                    Bu Top Hata İçin Veri Düzenle
                                </button>
                            </div>

                            {loadingTrend ? (
                                <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-500">
                                    <Loader2 className="animate-spin text-blue-700" size={40} />
                                    <span className="font-black tracking-widest text-xs uppercase">Analiz Yapılıyor...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="h-[400px] w-full mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={trendData?.TRV.map((item: any, i: number) => ({ ay: item.ay, trv: (item.oran * 100).toFixed(2), tou: (trendData.TOU[i].oran * 100).toFixed(2) }))}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.8} />
                                                <XAxis dataKey="ay" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#0f172a' }} itemStyle={{ color: '#0f172a' }} />
                                                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px' }} />
                                                <Line name="TRAVEGO %" type="monotone" dataKey="trv" stroke="#1d4ed8" strokeWidth={4} dot={{ r: 5, fill: '#1d4ed8', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 8 }} />
                                                <Line name="TOURISMO %" type="monotone" dataKey="tou" stroke="#d97706" strokeWidth={4} dot={{ r: 5, fill: '#d97706', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                        <table className="w-full text-center text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                                    <th className="p-4 border-r border-slate-200 text-left w-32 font-black">DÖNEM</th>
                                                    {trendData?.TRV.map((item: any) => <th key={item.ay} className="p-4 border-r border-slate-200">{item.ay}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="font-bold">
                                                <tr className="border-t border-slate-200">
                                                    <td className="p-4 border-r border-slate-200 text-left text-blue-700 font-black">TRAVEGO</td>
                                                    {trendData?.TRV.map((item: any) => <td key={item.ay} className="p-4 border-r border-slate-200 text-slate-700">%{(item.oran * 100).toFixed(1)}</td>)}
                                                </tr>
                                                <tr className="border-t border-slate-200">
                                                    <td className="p-4 border-r border-slate-200 text-left text-amber-700 font-black">TOURISMO</td>
                                                    {trendData?.TOU.map((item: any) => <td key={item.ay} className="p-4 border-r border-slate-200 text-slate-700">%{(item.oran * 100).toFixed(1)}</td>)}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && selectedHata && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-8 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Top Hata Bazlı Veri Düzenleme</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{selectedHata}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:text-slate-900 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">RAPOR YILI</label>
                                    <select className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-blue-500 outline-none transition-all font-bold" value={editData.year} onChange={(e) => handleEditMonthYearChange('year', e.target.value)}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">RAPOR AYI</label>
                                    <select className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-blue-500 outline-none transition-all font-bold" value={editData.month} onChange={(e) => handleEditMonthYearChange('month', e.target.value)}>
                                        {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">TRV ARAÇ SAYISI</label>
                                    <input type="number" className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-blue-500 outline-none transition-all font-bold" value={editData.trv_total} onChange={(e) => setEditData({ ...editData, trv_total: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">TRV HATA SAYISI</label>
                                    <input type="number" className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-red-400 outline-none transition-all font-bold" value={editData.trv_error_count} onChange={(e) => setEditData({ ...editData, trv_error_count: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">TOU ARAÇ SAYISI</label>
                                    <input type="number" className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-emerald-500 outline-none transition-all font-bold" value={editData.tou_total} onChange={(e) => setEditData({ ...editData, tou_total: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">TOU HATA SAYISI</label>
                                    <input type="number" className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-red-400 outline-none transition-all font-bold" value={editData.tou_error_count} onChange={(e) => setEditData({ ...editData, tou_error_count: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-blue-900 font-semibold">TRV Oran: <span className="font-black">%{trvRate.toFixed(2)}</span></div>
                                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-900 font-semibold">TOU Oran: <span className="font-black">%{touRate.toFixed(2)}</span></div>
                                <div className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-slate-800 font-semibold">Genel: <span className="font-black">%{genelRate.toFixed(2)}</span></div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-200 flex gap-4">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl transition-all font-bold tracking-tight uppercase">İptal</button>
                            <button onClick={handleSaveManual} className="flex-1 px-4 py-4 bg-blue-700 hover:bg-blue-600 text-white rounded-2xl transition-all font-black tracking-tight uppercase flex items-center justify-center gap-2">
                                <Save size={20} /> Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Top5Analysis;
