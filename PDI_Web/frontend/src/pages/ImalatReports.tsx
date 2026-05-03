import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { Edit2, X, Trash2 } from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:8000/api`;
const ADMIN_API = `http://${window.location.hostname}:8000/api/admin`;

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const ImalatReports: React.FC = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState('ozet');

    const [ozetData, setOzetData] = useState<any>(null);
    const [oranlarData, setOranlarData] = useState<any>(null);
    const [yilGrubu, setYilGrubu] = useState(`${new Date().getFullYear() - 1}-${new Date().getFullYear()}`);
    const [topHataData, setTopHataData] = useState<any>(null);
    const [cozulenler, setCozulenler] = useState<any[]>([]);
    const [newCozulen, setNewCozulen] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
        vehicle_count: '',
        error_count: ''
    });

    const yilGrubuOptions = ['2024-2025', '2025-2026', '2026-2027'];

    const fetchAllManualData = async () => {
        try {
            const res = await axios.get(`${ADMIN_API}/manual-data/imalat`);
            return res.data;
        } catch {
            return {};
        }
    };

    const fetchComputedMonthValues = async (targetMonth: number, targetYear: number) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/reports/imalat`, { params: { month: targetMonth, year: targetYear } });
            return {
                vehicle_count: String(res.data?.summary?.count ?? 0),
                error_count: String(res.data?.summary?.error_count ?? 0)
            };
        } catch {
            return { vehicle_count: '0', error_count: '0' };
        }
    };

    const hydrateEditData = async (targetMonth: number, targetYear: number, manualData?: any) => {
        const source = manualData || await fetchAllManualData();
        const ctxKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        const computed = await fetchComputedMonthValues(targetMonth, targetYear);
        setEditData({
            month: String(targetMonth),
            year: String(targetYear),
            vehicle_count: source[`${ctxKey}_vehicle_count`] ?? computed.vehicle_count,
            error_count: source[`${ctxKey}_error_count`] ?? computed.error_count
        });
    };

    const openEditModal = async () => {
        const manualData = await fetchAllManualData();
        await hydrateEditData(month, year, manualData);
        setShowEditModal(true);
    };

    const handleEditMonthYearChange = async (key: string, value: string) => {
        const targetMonth = key === 'month' ? Number(value) : Number(editData.month);
        const targetYear = key === 'year' ? Number(value) : Number(editData.year);
        await hydrateEditData(targetMonth, targetYear);
    };

    const handleSaveManual = async () => {
        try {
            const ctxKey = `${editData.year}-${String(editData.month).padStart(2, '0')}`;
            await axios.post(`${ADMIN_API}/manual-data`, {
                report_type: 'imalat', context_key: ctxKey, data_key: 'vehicle_count', data_value: editData.vehicle_count
            });
            await axios.post(`${ADMIN_API}/manual-data`, {
                report_type: 'imalat', context_key: ctxKey, data_key: 'error_count', data_value: editData.error_count
            });
            setShowEditModal(false);
            fetchOzet();
        } catch {
            alert("Hata oluştu.");
        }
    };

    const fetchOzet = async () => {
        try { const res = await axios.get(`${API_BASE_URL}/reports/imalat`, { params: { month, year } }); setOzetData(res.data); } catch { }
    };
    const fetchOranlar = async () => {
        const [y1, y2] = yilGrubu.split('-').map(Number);
        try { const res = await axios.get(`${API_BASE_URL}/reports/imalat-oranlar`, { params: { year1: y1, year2: y2 } }); setOranlarData(res.data); } catch { }
    };
    const fetchTopHata = async () => {
        try { const res = await axios.get(`${API_BASE_URL}/reports/imalat-top-hata`, { params: { month, year } }); setTopHataData(res.data); } catch { }
    };
    const fetchCozulenler = async () => {
        try { const res = await axios.get(`${ADMIN_API}/manuel-cozulenler`); setCozulenler(res.data); } catch { }
    };

    useEffect(() => { fetchOzet(); fetchTopHata(); }, [month, year]);
    useEffect(() => { fetchOranlar(); }, [yilGrubu]);
    useEffect(() => { fetchCozulenler(); }, []);

    const handleAddCozulen = async () => {
        if (!newCozulen.trim()) return;
        await axios.post(`${ADMIN_API}/manuel-cozulenler`, { hata: newCozulen, donem: `${month}-${year}` });
        setNewCozulen('');
        fetchCozulenler();
    };

    const handleDeleteCozulen = async (id: number) => {
        if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;
        await axios.delete(`${ADMIN_API}/manuel-cozulenler/${id}`);
        fetchCozulenler();
    };

    const TabButton = ({ id, label }: { id: string; label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '10px 20px', border: '1px solid #d1d5db',
                borderBottom: activeTab === id ? '2px solid #111827' : '1px solid #d1d5db',
                background: activeTab === id ? '#fff' : '#f9fafb',
                color: activeTab === id ? '#111827' : '#6b7280',
                fontWeight: activeTab === id ? 700 : 500, fontSize: '0.82rem',
                cursor: 'pointer', borderRadius: '4px 4px 0 0', marginRight: '2px'
            }}
        >{label}</button>
    );

    const [yg1, yg2] = yilGrubu.split('-').map(Number);
    const ytdLabel = `${year - 1} \u2192 ${year} YTD${month} \u0130yile\u015fen/\u00c7\u00f6z\u00fclen Hatalar`;

    return (
        <div style={{ fontFamily: 'Segoe UI, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', margin: 0 }}>İMALAT VERİ ANALİZİ VE RAPORLARI</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={openEditModal}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 12px', backgroundColor: '#e5e7eb', color: '#111827',
                            border: '1px solid #d1d5db', borderRadius: '4px', fontWeight: 600,
                            cursor: 'pointer', fontSize: '0.85rem', marginRight: '8px'
                        }}
                    >
                        <Edit2 size={14} /> Veri Düzenle
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rapor Ayı:</span>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }} aria-label="Rapor Ayı">
                        {MONTHS_TR.map((m, i) => <option key={m} value={i + 1}>{m.toUpperCase()}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }} aria-label="Rapor Yılı">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #d1d5db' }}>
                <TabButton id="ozet" label="AYLIK ÖZET TABLO" />
                <TabButton id="oranlar" label="İMALAT GİDİŞ ORANLARI" />
                <TabButton id="top5" label="TOP HATA ANALİZİ" />
                <TabButton id="cozulen" label="ÇÖZÜLEN/İYİLEŞENLER" />
            </div>

            <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderTop: 'none', padding: '20px', minHeight: '500px' }}>

                {activeTab === 'ozet' && (
                    <div>
                        <div style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '20px', fontWeight: 600 }}>
                            {year} yılı {MONTHS_TR[month - 1]} ayında imalata <strong>{ozetData?.summary?.count ?? 0}</strong> adet araç gönderilmiş olup, <strong>{ozetData?.summary?.error_count ?? 0}</strong> adet hata tespit edilmiştir.
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr>
                                    {['Sıra', 'Araç No', 'İmalata Gitme Tarihi', 'Hata'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'center', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 700 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(ozetData?.records || []).map((r: any, i: number) => (
                                    <tr key={r.id ?? r.sasi_no ?? i}>
                                        <td style={{ padding: '8px 14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{i + 1}</td>
                                        <td style={{ padding: '8px 14px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: 600 }}>{r.sasi_no}</td>
                                        <td style={{ padding: '8px 14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{r.tarih_saat}</td>
                                        <td style={{ padding: '8px 14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{r.tespitler}</td>
                                    </tr>
                                ))}
                                {!ozetData?.records?.length && (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', border: '1px solid #e5e7eb' }}>Bu ay için imalat kaydı bulunamadı.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'oranlar' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Kıyaslama Yıl Grubu:</label>
                            <select value={yilGrubu} onChange={e => setYilGrubu(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }} aria-label="Kıyaslama Yıl Grubu">
                                {yilGrubuOptions.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '20px', fontWeight: 500, fontSize: '0.9rem' }}>
                            PDI yapılan araçların, {yg2} yılında ortalama %{(() => {
                                const vals = (oranlarData?.data || []).map((d: any) => d[`year${yg2}`]).filter((v: any) => v !== null && v !== undefined);
                                return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : '0.0';
                            })()} kadarı, {MONTHS_TR[month - 1]} ayı özelinde ise %{oranlarData?.data?.[month - 1]?.[`year${yg2}`] ?? '0.0'} imalata geri gönderilmiştir.
                        </div>
                        <div style={{ width: '100%', height: '420px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={oranlarData?.data || []} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `%${v}`} domain={[0, 100]} />
                                    <Tooltip formatter={(v: any) => [`%${v}`, '']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend formatter={(val) => val === `year${yg2}` ? `${yg2} Yılı Oranı` : `${yg1} Yılı Oranı`} />
                                    <Line type="linear" dataKey={`year${yg2}`} name={`year${yg2}`} stroke="#f97316" strokeWidth={2} dot={{ r: 5, fill: '#f97316' }} connectNulls={false}>
                                        <LabelList dataKey={`year${yg2}`} position="top" formatter={(v: any) => v !== null && v !== undefined ? `%${v}` : ''} style={{ fill: '#f97316', fontSize: 11, fontWeight: 700 }} />
                                    </Line>
                                    <Line type="linear" dataKey={`year${yg1}`} name={`year${yg1}`} stroke="#9ca3af" strokeWidth={2} dot={{ r: 5, fill: '#9ca3af' }} connectNulls={false}>
                                        <LabelList dataKey={`year${yg1}`} position="top" formatter={(v: any) => v !== null && v !== undefined ? `%${v}` : ''} style={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'top5' && (
                    <div>
                        <div style={{ padding: '12px 16px', border: '2px solid #3b82f6', borderRadius: '4px', marginBottom: '20px', fontWeight: 700, color: '#1d4ed8' }}>
                            {year} {MONTHS_TR[month - 1]} ayı itibarıyla; imalata gönderilen <strong>{topHataData?.unique_vehicles ?? 0}</strong> araçta <strong>{topHataData?.total_errors ?? 0}</strong> adet hata tespit edilmiştir.
                        </div>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>
                                {year} YTD İMALAT TOP HATA ANALİZİ
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700 }}>İMALATA GÖNDERİLEN ARAÇLARDA TOP HATA</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>HATA SAYISI</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>ORAN</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>İŞLEM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(topHataData?.results || []).map((r: any) => (
                                        <tr key={r.hata_adi} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '10px 16px' }}>{r.hata_adi}</td>
                                            <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>{r.count}</td>
                                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>%{r.oran}</td>
                                            <td style={{ padding: '10px 16px', textAlign: 'center', color: '#9ca3af' }}>-</td>
                                        </tr>
                                    ))}
                                    {!topHataData?.results?.length && (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>Veri bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'cozulen' && (
                    <div>
                        <div style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, marginBottom: '15px', color: '#374151' }}>
                            {year} {MONTHS_TR[month - 1]} sonu itibarı ile iyileşen/çözülen hatalar:
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>+ Yeni Hata Ekle:</span>
                            <input
                                value={newCozulen}
                                onChange={e => setNewCozulen(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddCozulen(); }}
                                aria-label="Yeni çözülen hata"
                                style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                            <button onClick={handleAddCozulen} style={{ padding: '6px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>EKLE</button>
                        </div>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ytdLabel}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Güncel Durum</span>
                            </div>
                            {cozulenler.length === 0 && (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Kayıt bulunamadı.</div>
                            )}
                            {cozulenler.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                        • {item.hata}
                                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: '8px' }}>({item.donem})</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ padding: '4px 14px', backgroundColor: '#16a34a', color: '#fff', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>✓ Solved</span>
                                        <button
                                            onClick={() => handleDeleteCozulen(item.id)}
                                            title="Sil"
                                            style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', color: '#e80000', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Veri Düzenle</h2>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Rapor Dönemi</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <select
                                        value={editData.month}
                                        onChange={e => handleEditMonthYearChange('month', e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', fontWeight: 600 }}
                                    >
                                        {MONTHS_TR.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                    </select>
                                    <select
                                        value={editData.year}
                                        onChange={e => handleEditMonthYearChange('year', e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', fontWeight: 600 }}
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Gönderilen Araç Sayısı</label>
                                <input
                                    type="number"
                                    value={editData.vehicle_count}
                                    onChange={e => setEditData({ ...editData, vehicle_count: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Hata Sayısı</label>
                                <input
                                    type="number"
                                    value={editData.error_count}
                                    onChange={e => setEditData({ ...editData, error_count: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ padding: '8px 10px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1e3a8a', fontSize: '0.82rem', fontWeight: 600 }}>
                                Seçilen ay için oran otomatik hesaplanır: {Number(editData.vehicle_count || 0) > 0 ? `%${((Number(editData.error_count || 0) / Number(editData.vehicle_count)) * 100).toFixed(2)}` : '%0.00'}
                            </div>
                        </div>
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>İptal</button>
                            <button onClick={handleSaveManual} style={{ padding: '8px 16px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Kaydet</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImalatReports;
