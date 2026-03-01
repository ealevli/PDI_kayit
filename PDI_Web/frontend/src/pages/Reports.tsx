import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart,
    PieChart, Pie, Cell, LabelList, Line, Legend
} from 'recharts';
import { Calendar, Edit2, Info, X, Save } from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

const MONTHS = [
    { id: 1, name: 'Ocak' }, { id: 2, name: 'Şubat' }, { id: 3, name: 'Mart' },
    { id: 4, name: 'Nisan' }, { id: 5, name: 'Mayıs' }, { id: 6, name: 'Haziran' },
    { id: 7, name: 'Temmuz' }, { id: 8, name: 'Ağustos' }, { id: 9, name: 'Eylül' },
    { id: 10, name: 'Ekim' }, { id: 11, name: 'Kasım' }, { id: 12, name: 'Aralık' }
];

const YEARS = [2024, 2025, 2026];

const Reports: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editModalTab, setEditModalTab] = useState<'monthly' | 'pie'>('monthly');
    const [allManualData, setAllManualData] = useState<any>({});
    const [editData, setEditData] = useState({
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
        vehicle_count: '',
        error_count: '',
        report_note: '',
        prev_year_cnt: '',
        prev_year_err: '',
        last_12_cnt: '',
        last_12_err: '',
        curr_year_cnt: '',
        curr_year_err: ''
    });

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/reports/trv-tou`, {
                params: { month: selectedMonth, year: selectedYear }
            });
            setReportData(res.data);
        } catch (err) {
            console.error('Report fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllManualData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/manual-data/trv_tou`);
            setAllManualData(res.data);
            return res.data;
        } catch (err) {
            console.error('Manual data fetch error:', err);
            return {};
        }
    };

    const fetchComputedMonthValues = async (month: number, year: number) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/reports/trv-tou`, { params: { month, year } });
            const summary = res.data?.summary || {};
            return {
                vehicle_count: String(summary.current_month_vehicles ?? 0),
                error_count: String(summary.current_month_errors ?? 0),
                prev_year_cnt: String(summary.prev_year_cnt ?? 0),
                prev_year_err: String(summary.prev_year_err ?? 0),
                last_12_cnt: String(summary.last_12_cnt ?? 0),
                last_12_err: String(summary.last_12_err ?? 0),
                curr_year_cnt: String(summary.curr_year_cnt ?? 0),
                curr_year_err: String(summary.curr_year_err ?? 0)
            };
        } catch {
            return { vehicle_count: '0', error_count: '0', prev_year_cnt: '0', prev_year_err: '0', last_12_cnt: '0', last_12_err: '0', curr_year_cnt: '0', curr_year_err: '0' };
        }
    };

    const setEditDataForPeriod = async (month: number, year: number, manualSource?: any) => {
        const source = manualSource || allManualData;
        const ctxKey = `${year}-${String(month).padStart(2, '0')}`;
        const computed = await fetchComputedMonthValues(month, year);

        setEditData({
            month: String(month),
            year: String(year),
            vehicle_count: source[`${ctxKey}_vehicle_count`] ?? computed.vehicle_count,
            error_count: source[`${ctxKey}_error_count`] ?? computed.error_count,
            report_note: source[`${ctxKey}_report_note`] || '',
            prev_year_cnt: source[`${ctxKey}_prev_year_cnt`] ?? computed.prev_year_cnt,
            prev_year_err: source[`${ctxKey}_prev_year_err`] ?? computed.prev_year_err,
            last_12_cnt: source[`${ctxKey}_last_12_cnt`] ?? computed.last_12_cnt,
            last_12_err: source[`${ctxKey}_last_12_err`] ?? computed.last_12_err,
            curr_year_cnt: source[`${ctxKey}_curr_year_cnt`] ?? computed.curr_year_cnt,
            curr_year_err: source[`${ctxKey}_curr_year_err`] ?? computed.curr_year_err
        });
    };

    useEffect(() => {
        fetchReportData();
        fetchAllManualData();
    }, [selectedMonth, selectedYear]);

    const openEditModal = async () => {
        const freshManual = await fetchAllManualData();
        await setEditDataForPeriod(selectedMonth, selectedYear, freshManual);
        setEditModalTab('monthly');
        setShowEditModal(true);
    };

    const handleEditMonthYearChange = async (key: string, val: string) => {
        const nextMonth = key === 'month' ? Number(val) : Number(editData.month);
        const nextYear = key === 'year' ? Number(val) : Number(editData.year);
        await setEditDataForPeriod(nextMonth, nextYear);
    };

    const handleSaveManual = async () => {
        try {
            const payload = [
                { key: 'vehicle_count', val: editData.vehicle_count },
                { key: 'error_count', val: editData.error_count },
                { key: 'report_note', val: editData.report_note },
                { key: 'prev_year_cnt', val: editData.prev_year_cnt },
                { key: 'prev_year_err', val: editData.prev_year_err },
                { key: 'last_12_cnt', val: editData.last_12_cnt },
                { key: 'last_12_err', val: editData.last_12_err },
                { key: 'curr_year_cnt', val: editData.curr_year_cnt },
                { key: 'curr_year_err', val: editData.curr_year_err }
            ];

            const contextKey = `${editData.year}-${editData.month.padStart(2, '0')}`;

            for (const p of payload) {
                await axios.post(`${API_BASE_URL}/admin/manual-data`, {
                    report_type: 'trv_tou',
                    context_key: contextKey,
                    data_key: p.key,
                    data_value: p.val
                });
            }

            setShowEditModal(false);
            fetchReportData();
            fetchAllManualData();
        } catch (err) {
            console.error(err);
            alert('Kaydedilirken bir hata oluştu.');
        }
    };

    const DonutChart = ({ title, value, detail, statsDetail, color = '#2563eb' }: any) => {
        const pieData = [
            { name: 'Rate', value: Math.min(value, 5) },
            { name: 'Remaining', value: Math.max(0, 5 - value) }
        ];

        return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</div>
                <div className="relative w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={52}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell key="cell-0" fill={color} />
                                <Cell key="cell-1" fill="#e2e8f0" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">AVG</span>
                        <span className="text-xl font-black" style={{ color }}>
                            {Number(value || 0).toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium text-center">{detail}</div>
                {statsDetail && <div className="text-[10px] text-slate-500 mt-1 font-semibold text-center">{statsDetail}</div>}
            </div>
        );
    };

    if (loading && !reportData) return <div className="p-8 text-slate-700">Yükleniyor...</div>;

    const summary = reportData?.summary || {};
    const selectedMonthName = MONTHS.find(m => m.id === selectedMonth)?.name;
    const editVehicle = Number(editData.vehicle_count || 0);
    const editError = Number(editData.error_count || 0);
    const editRate = editVehicle > 0 ? editError / editVehicle : 0;
    const rateLabelRenderer = (props: any) => {
        const { x, y, value } = props;
        if (typeof x !== 'number' || typeof y !== 'number') return null;
        const numericValue = Number(value || 0);
        const val = numericValue.toFixed(2);
        const textX = x;
        const textY = Math.max(18, y - 14);
        return (
            <g>
                <rect x={textX - 20} y={textY - 15} width={40} height={20} rx={6} fill="#ffffff" fillOpacity={0.96} />
                <text x={textX} y={textY} textAnchor="middle" fill="#dc2626" fontSize="12" fontWeight={900}>{val}</text>
            </g>
        );
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-900">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">TRV & TOU PDI RAPORU</h1>
                    <p className="text-slate-600 text-sm">Tourismo ve Travego araç tipi analizleri</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <Calendar size={16} className="text-slate-500 ml-2" />
                        <select
                            className="bg-transparent text-slate-900 px-2 py-1 focus:outline-none text-sm font-bold cursor-pointer"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {MONTHS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <select
                            className="bg-transparent text-slate-900 px-2 py-1 focus:outline-none text-sm font-bold border-l border-slate-200 cursor-pointer"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={openEditModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl transition-all font-bold text-sm"
                    >
                        <Edit2 size={16} />
                        Veri Düzenle
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Info size={18} className="text-blue-700" /> RAPOR ÖZETİ
                </h3>
                <p className="text-slate-700 leading-relaxed text-sm lg:text-base font-medium">
                    {selectedYear} {selectedMonthName} ayında PDI yapılan [TRV & TOU] araç sayısı
                    <span className="text-blue-700 font-black mx-2 text-lg">{summary.current_month_vehicles}</span>
                    adettir. Son 12 ay ortalama hata oranı araç başı
                    <span className="text-blue-700 font-black mx-2 text-lg">{summary.avg_12_month?.toFixed(2)}</span>
                    adet olup, {selectedMonthName} ayı özelinde
                    <span className="text-red-600 font-black mx-2 text-lg">{summary.current_month_rate?.toFixed(2)}</span>
                    adet olarak gerçekleşmiştir.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">PDI HATA TRENDİ</h3>
                            <p className="text-slate-600 text-xs">Son 12 aylık araç başı hata oranı gelişimi</p>
                        </div>
                        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                            <span className="text-blue-700 font-black text-base">
                                {summary.current_month_rate?.toFixed(2)} <small className="font-medium opacity-70 ml-1">ort/araç</small>
                            </span>
                        </div>
                    </div>

                    <div className="h-[420px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={reportData?.monthly_trend} margin={{ top: 30, right: 30, left: 0, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.65} />
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.12} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} opacity={0.8} />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={15} />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, (dataMax: number) => dataMax === 0 ? 100 : Math.ceil(dataMax * 1.3)]}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#dc2626"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, (dataMax: number) => dataMax === 0 ? 5 : Math.max(5, Math.ceil(dataMax * 1.5))]}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}
                                />
                                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                                <Bar yAxisId="left" name="Araç Sayısı" dataKey="vehicles" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={24} />
                                <Line
                                    name="Hata Oranı"
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#ef4444"
                                    strokeWidth={4}
                                    dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                                    activeDot={{ r: 8, strokeWidth: 0, fill: '#ef4444' }}
                                >
                                    <LabelList dataKey="rate" content={rateLabelRenderer} />
                                </Line>
                                <Bar yAxisId="left" name="Hata Sayısı" dataKey="errors" fill="#1e3a5f" radius={[8, 8, 0, 0]} barSize={24} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <DonutChart title="ÖNCEKİ YIL AVG" value={summary.prev_year_rate || 0} detail={`${summary.prev_year || '-'} Yılı Genel Ortalaması`} statsDetail={`Araç: ${summary.prev_year_cnt || 0} | Hata: ${summary.prev_year_err || 0}`} color="#94a3b8" />
                    <DonutChart title="SON 12 AY AVG" value={summary.avg_12_month || 0} detail="Hareketli 12 Aylık Performans" statsDetail={`Araç: ${summary.last_12_cnt || 0} | Hata: ${summary.last_12_err || 0}`} color="#2563eb" />
                    <DonutChart title="MEVCUT YIL AVG" value={summary.current_year_rate || 0} detail={`${selectedYear} Yılı Güncel Durum`} statsDetail={`Araç: ${summary.curr_year_cnt || 0} | Hata: ${summary.curr_year_err || 0}`} color="#059669" />
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[180px] transition-all">
                <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <Edit2 size={20} className="text-emerald-700" />
                    </div>
                    RAPOR NOTLARI
                </h3>
                <div className="text-slate-600 italic text-sm lg:text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {summary.report_note || "Bu ay için henüz bir not eklenmemiş. 'Veri Düzenle' butonundan yönetici notu ekleyebilirsiniz."}
                </div>
            </div>

            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-8 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manuel Veri Yönetimi</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">TRV & TOU Raporu</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">RAPOR YILI</label>
                                    <select
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-blue-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                                        value={editData.year}
                                        onChange={(e) => handleEditMonthYearChange('year', e.target.value)}
                                    >
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">RAPOR AYI</label>
                                    <select
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-blue-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                                        value={editData.month}
                                        onChange={(e) => handleEditMonthYearChange('month', e.target.value)}
                                    >
                                        {MONTHS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ARAÇ SAYISI</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-blue-400 outline-none transition-all font-bold"
                                        value={editData.vehicle_count}
                                        onChange={(e) => setEditData({ ...editData, vehicle_count: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">HATA SAYISI</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 focus:border-red-400 outline-none transition-all font-bold"
                                        value={editData.error_count}
                                        onChange={(e) => setEditData({ ...editData, error_count: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200">
                                <button type="button" onClick={() => setEditModalTab('monthly')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${editModalTab === 'monthly' ? 'bg-white text-blue-700 border border-blue-200' : 'text-slate-600'}`}>Aylık Veri</button>
                                <button type="button" onClick={() => setEditModalTab('pie')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${editModalTab === 'pie' ? 'bg-white text-blue-700 border border-blue-200' : 'text-slate-600'}`}>Pie Chart Düzenle</button>
                            </div>

                            {editModalTab === 'monthly' ? (
                                <>
                                    <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-900 font-semibold">
                                        Hesaplanan oran: <span className="font-black">{editRate.toFixed(2)}</span> ort/araç
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">YÖNETİCİ RAPOR NOTU</label>
                                        <textarea
                                            className="w-full bg-white border-2 border-slate-200 rounded-3xl px-5 py-4 text-slate-900 focus:border-emerald-500 outline-none transition-all h-32 resize-none font-medium"
                                            value={editData.report_note}
                                            onChange={(e) => setEditData({ ...editData, report_note: e.target.value })}
                                            placeholder="Raporun altında görüntülenecek notları buraya ekleyin..."
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                                        <h4 className="text-sm font-black text-slate-800">ÖNCEKİ YIL</h4>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold" placeholder="Araç" value={editData.prev_year_cnt} onChange={(e) => setEditData({ ...editData, prev_year_cnt: e.target.value })} />
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold" placeholder="Hata" value={editData.prev_year_err} onChange={(e) => setEditData({ ...editData, prev_year_err: e.target.value })} />
                                        <div className="text-xs font-semibold text-slate-600">Oran: {(Number(editData.prev_year_cnt) > 0 ? Number(editData.prev_year_err) / Number(editData.prev_year_cnt) : 0).toFixed(2)}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                                        <h4 className="text-sm font-black text-slate-800">SON 12 AY</h4>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold" placeholder="Araç" value={editData.last_12_cnt} onChange={(e) => setEditData({ ...editData, last_12_cnt: e.target.value })} />
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold" placeholder="Hata" value={editData.last_12_err} onChange={(e) => setEditData({ ...editData, last_12_err: e.target.value })} />
                                        <div className="text-xs font-semibold text-slate-600">Oran: {(Number(editData.last_12_cnt) > 0 ? Number(editData.last_12_err) / Number(editData.last_12_cnt) : 0).toFixed(2)}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                                        <h4 className="text-sm font-black text-slate-800">MEVCUT YIL</h4>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold" placeholder="Araç" value={editData.curr_year_cnt} onChange={(e) => setEditData({ ...editData, curr_year_cnt: e.target.value })} />
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold" placeholder="Hata" value={editData.curr_year_err} onChange={(e) => setEditData({ ...editData, curr_year_err: e.target.value })} />
                                        <div className="text-xs font-semibold text-slate-600">Oran: {(Number(editData.curr_year_cnt) > 0 ? Number(editData.curr_year_err) / Number(editData.curr_year_cnt) : 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-200 flex gap-4">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl transition-all font-bold tracking-tight"
                            >
                                İPTAL
                            </button>
                            <button
                                onClick={handleSaveManual}
                                className="flex-1 px-4 py-4 bg-blue-700 hover:bg-blue-600 text-white rounded-2xl transition-all font-black tracking-tight flex items-center justify-center gap-2"
                            >
                                <Save size={20} />
                                DEĞİŞİKLİKLERİ KAYDET
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
