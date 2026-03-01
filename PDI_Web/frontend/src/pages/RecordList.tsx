import React, { useEffect, useState } from 'react';
import axios from 'axios';

const host = window.location.hostname;
const ADMIN_API = `http://${host}:8000/api/admin`;

const months = [
    { label: 'TÜMÜ', value: '' },
    { label: 'Ocak', value: '1' }, { label: 'Şubat', value: '2' }, { label: 'Mart', value: '3' },
    { label: 'Nisan', value: '4' }, { label: 'Mayıs', value: '5' }, { label: 'Haziran', value: '6' },
    { label: 'Temmuz', value: '7' }, { label: 'Ağustos', value: '8' }, { label: 'Eylül', value: '9' },
    { label: 'Ekim', value: '10' }, { label: 'Kasım', value: '11' }, { label: 'Aralık', value: '12' }
];

const years = ['TÜMÜ', '2024', '2025', '2026'];

const RecordList: React.FC = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);

    // Filters
    const [sasiNo, setSasiNo] = useState('');
    const [aracTipi, setAracTipi] = useState('');
    const [altGrup, setAltGrup] = useState('');
    const [ay, setAy] = useState('');
    const [yil, setYil] = useState('');
    const [hataNerede, setHataNerede] = useState('');

    // Lookups
    const [lookups, setLookups] = useState<any>({ aracTipi: [], altGrup: [], hataNerede: [], hataKonumu: [], topHatalar: [] });

    // Edit modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [detaylar, setDetaylar] = useState<any[]>([]);
    const [newDetay, setNewDetay] = useState('');
    const [detayPhotoFiles, setDetayPhotoFiles] = useState<{ [id: number]: File }>({});

    useEffect(() => {
        const fetchLookups = async () => {
            const [tp, ag, hn, hk, th] = await Promise.all([
                axios.get(`${ADMIN_API}/lookups/arac-tipi`),
                axios.get(`${ADMIN_API}/lookups/alt-grup`),
                axios.get(`${ADMIN_API}/lookups/hata-nerede`),
                axios.get(`${ADMIN_API}/lookups/hata-konumu`),
                axios.get(`${ADMIN_API}/top-hatalar`)
            ]);
            setLookups({ aracTipi: tp.data, altGrup: ag.data, hataNerede: hn.data, hataKonumu: hk.data, topHatalar: th.data });
        };
        fetchLookups();
        fetchRecords();
    }, []);

    const fetchRecords = (filters?: any) => {
        setLoading(true);
        const f = filters || {};
        const params: any = {};
        if (f.sasiNo) params.sasi_no = f.sasiNo;
        if (f.aracTipi) params.arac_tipi = f.aracTipi;
        if (f.altGrup) params.alt_grup = f.altGrup;
        if (f.ay) params.ay = f.ay;
        if (f.yil) params.yil = f.yil;
        if (f.hataNerede) params.hata_nerede = f.hataNerede;
        axios.get(`${ADMIN_API}/kayitlar`, { params })
            .then(res => setRecords(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleFilter = () => {
        fetchRecords({ sasiNo, aracTipi, altGrup, ay, yil, hataNerede });
    };

    const handleExcel = () => {
        const params = new URLSearchParams();
        if (sasiNo) params.set('sasi_no', sasiNo);
        if (aracTipi) params.set('arac_tipi', aracTipi);
        if (altGrup) params.set('alt_grup', altGrup);
        if (ay) params.set('ay', ay);
        if (yil) params.set('yil', yil);
        if (hataNerede) params.set('hata_nerede', hataNerede);
        window.open(`${ADMIN_API}/kayitlar/export?${params.toString()}`, '_blank');
    };

    const handleDonemSil = async () => {
        if (!ay || !yil) {
            alert('Dönem silmek için ay ve yıl seçiniz.');
            return;
        }
        if (!window.confirm(`${ay}/${yil} dönemindeki tüm kayıtlar silinecek. Emin misiniz?`)) return;
        // Delete all filtered records
        const params: any = { ay, yil };
        if (aracTipi) params.arac_tipi = aracTipi;
        const res = await axios.get(`${ADMIN_API}/kayitlar`, { params: { ...params, limit: 9999 } });
        for (const r of res.data) {
            await axios.delete(`${ADMIN_API}/kayit/${r.id}`);
        }
        fetchRecords({ sasiNo, aracTipi, altGrup, ay, yil, hataNerede });
    };

    const handleEdit = async (record: any) => {
        setEditingRecord({ ...record });
        const res = await axios.get(`${ADMIN_API}/kayit/${record.id}/detaylar`);
        setDetaylar(res.data);
        setIsEditOpen(true);
    };

    const handleAddDetay = async () => {
        if (!newDetay.trim()) return;
        const res = await axios.post(`${ADMIN_API}/kayit/${editingRecord.id}/detay`, { aciklama: newDetay });
        setDetaylar(prev => [...prev, res.data]);
        setNewDetay('');
    };

    const handleDeleteDetay = async (detayId: number) => {
        await axios.delete(`${ADMIN_API}/kayit/detay/${detayId}`);
        setDetaylar(prev => prev.filter(d => d.id !== detayId));
    };

    const handleDetayPhoto = async (detayId: number) => {
        const file = detayPhotoFiles[detayId];
        if (!file) return;
        const fd = new FormData();
        fd.append('photo', file);
        await axios.post(`${ADMIN_API}/kayit/detay/${detayId}/photo`, fd);
        const res = await axios.get(`${ADMIN_API}/kayit/${editingRecord.id}/detaylar`);
        setDetaylar(res.data);
        setDetayPhotoFiles(prev => { const n = { ...prev }; delete n[detayId]; return n; });
    };

    const handleUpdate = async () => {
        await axios.put(`${ADMIN_API}/kayit/${editingRecord.id}`, editingRecord);
        setIsEditOpen(false);
        fetchRecords({ sasiNo, aracTipi, altGrup, ay, yil, hataNerede });
    };

    const inputStyle: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem', height: '32px' };
    const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', backgroundColor: '#fff' };

    return (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
            {/* Filter Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>Şasi No:</div>
                    <input value={sasiNo} onChange={e => setSasiNo(e.target.value)} style={{ ...inputStyle, width: '130px' }} placeholder="" aria-label="Şasi No" />
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>Araç Tipi:</div>
                    <select value={aracTipi} onChange={e => setAracTipi(e.target.value)} style={{ ...selectStyle, width: '120px' }} aria-label="Araç Tipi">
                        <option value="">Tümü</option>
                        {lookups.aracTipi.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>Alt Grup:</div>
                    <select value={altGrup} onChange={e => setAltGrup(e.target.value)} style={{ ...selectStyle, width: '120px' }} aria-label="Alt Grup">
                        <option value="">Tümü</option>
                        {lookups.altGrup.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>Dönem:</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <select value={ay} onChange={e => setAy(e.target.value)} style={{ ...selectStyle, width: '90px' }} aria-label="Dönem Ay">
                            {months.map(m => <option key={m.label} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={yil} onChange={e => setYil(e.target.value)} style={{ ...selectStyle, width: '80px' }} aria-label="Dönem Yıl">
                            {years.map(y => <option key={y} value={y === 'TÜMÜ' ? '' : y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>Hata Nerede Giderildi:</div>
                    <select value={hataNerede} onChange={e => setHataNerede(e.target.value)} style={{ ...selectStyle, width: '150px' }} aria-label="Hata Nerede Giderildi">
                        <option value="">TÜMÜ</option>
                        {lookups.hataNerede.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                </div>
                <button onClick={handleFilter} style={{ padding: '6px 18px', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', height: '32px', fontSize: '0.85rem' }}>
                    FİLTRELE
                </button>
                <button onClick={handleExcel} style={{ padding: '6px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', height: '32px', fontSize: '0.85rem' }}>
                    EXCEL İNDİR
                </button>
                <button onClick={handleDonemSil} style={{ padding: '6px 18px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', height: '32px', fontSize: '0.85rem' }}>
                    DÖNEMİ SİL
                </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                            {['ID', 'BB No', 'Şasi No', 'Araç', 'Tarih', 'Alt Grup', 'Hata', 'Top Hata', 'Hata Nerede Giderildi', 'Ekleyen'].map(h => (
                                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Yükleniyor...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Kayıt bulunamadı.</td></tr>
                        ) : records.map(r => (
                            <tr
                                key={r.id}
                                onClick={() => setSelectedRecord(r.id === selectedRecord?.id ? null : r)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedRecord(r.id === selectedRecord?.id ? null : r); }}
                                tabIndex={0}
                                style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', backgroundColor: selectedRecord?.id === r.id ? '#eff6ff' : 'transparent' }}
                                onMouseEnter={e => { if (selectedRecord?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                                onMouseLeave={e => { if (selectedRecord?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                onFocus={e => { if (selectedRecord?.id !== r.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                                onBlur={e => { if (selectedRecord?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <td style={{ padding: '8px 12px' }}>{r.id}</td>
                                <td style={{ padding: '8px 12px' }}>{r.bb_no || ''}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.sasi_no || ''}</td>
                                <td style={{ padding: '8px 12px' }}>{r.arac_tipi || ''}</td>
                                <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{r.tarih_saat || ''}</td>
                                <td style={{ padding: '8px 12px' }}>{r.alt_grup || ''}</td>
                                <td style={{ padding: '8px 12px' }}>{r.hata_konumu || ''}</td>
                                <td style={{ padding: '8px 12px' }}>{r.top_hata || ''}</td>
                                <td style={{ padding: '8px 12px' }}>{r.hata_nerede || ''}</td>
                                <td style={{ padding: '8px 12px' }}>{r.kullanici || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Status bar */}
            <div style={{ marginTop: '10px', padding: '6px 12px', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '0.8rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{selectedRecord ? `Seçili: ID ${selectedRecord.id} — ${selectedRecord.sasi_no}` : 'Kayıt seçiniz...'}</span>
                <span>{records.length} kayıt</span>
            </div>

            {/* Bottom Edit Button */}
            {selectedRecord && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                        onClick={() => handleEdit(selectedRecord)}
                        style={{ padding: '8px 24px', backgroundColor: '#ca8a04', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        DÜZENLE / DETAY
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {isEditOpen && editingRecord && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '900px', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {/* Modal Header */}
                        <div style={{ backgroundColor: '#111827', color: '#fff', padding: '18px 25px', borderRadius: '12px 12px 0 0' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '1px' }}>KAYIT DÜZENLE</h2>
                        </div>

                        <div style={{ padding: '25px', flex: 1 }}>
                            {/* Section: Araç ve Hata Bilgileri */}
                            <div style={{ marginBottom: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', letterSpacing: '1px' }}>ARAÇ VE HATA BİLGİLERİ</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>BB No</label>
                                    <input value={editingRecord.bb_no || ''} onChange={e => setEditingRecord({ ...editingRecord, bb_no: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="BB No" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Şasi No</label>
                                    <input value={editingRecord.sasi_no || ''} onChange={e => setEditingRecord({ ...editingRecord, sasi_no: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="Şasi No" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Araç Tipi</label>
                                    <select value={editingRecord.arac_tipi || ''} onChange={e => setEditingRecord({ ...editingRecord, arac_tipi: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="Araç Tipi">
                                        <option value="">Seçiniz</option>
                                        {lookups.aracTipi.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>İş Emri No</label>
                                    <input value={editingRecord.is_emri_no || ''} onChange={e => setEditingRecord({ ...editingRecord, is_emri_no: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="İş Emri No" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Tarih (G-A-Y)</label>
                                    <input value={editingRecord.tarih_saat || ''} onChange={e => setEditingRecord({ ...editingRecord, tarih_saat: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="Tarih" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Alt Grup</label>
                                    <select value={editingRecord.alt_grup || ''} onChange={e => setEditingRecord({ ...editingRecord, alt_grup: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="Alt Grup">
                                        <option value="">Seçiniz</option>
                                        {lookups.altGrup.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Hata Nerede Giderildi?</label>
                                    <select value={editingRecord.hata_nerede || ''} onChange={e => setEditingRecord({ ...editingRecord, hata_nerede: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="Hata Nerede Giderildi">
                                        <option value="">Seçiniz</option>
                                        {lookups.hataNerede.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Hata Konumu</label>
                                    <select value={editingRecord.hata_konumu || ''} onChange={e => setEditingRecord({ ...editingRecord, hata_konumu: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="Hata Konumu">
                                        <option value="">Seçiniz</option>
                                        {lookups.hataKonumu.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Top Hata (imalat için)</label>
                                    <select value={editingRecord.top_hata || ''} onChange={e => setEditingRecord({ ...editingRecord, top_hata: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }} aria-label="Top Hata">
                                        <option value="">Seçiniz</option>
                                        {lookups.topHatalar.map((t: any) => <option key={t.id} value={t.hata_adi}>{t.hata_adi}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Section: Tespit Detayları */}
                            <div style={{ marginBottom: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', letterSpacing: '1px' }}>TESPİT DETAYLARI (Yazın ve Enter'a basın)</div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <input
                                    value={newDetay}
                                    onChange={e => setNewDetay(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddDetay(); }}
                                    placeholder="Yeni tespit girin..."
                                    aria-label="Yeni tespit açıklaması"
                                    style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem' }}
                                />
                                <button onClick={handleAddDetay} style={{ padding: '8px 16px', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>EKLE</button>
                            </div>
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', minHeight: '150px', padding: '10px', backgroundColor: '#fafafa' }}>
                                {detaylar.length === 0 && <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Tespit detayı bulunmuyor.</span>}
                                {detaylar.map(d => (
                                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '6px 8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                                        <span style={{ flex: 1, fontSize: '0.85rem' }}>• {d.aciklama}</span>
                                        {d.fotograf_yolu ? (
                                            <button
                                                onClick={() => window.open(`http://${host}:8000/static/photos/${d.fotograf_yolu}`, '_blank')}
                                                style={{ padding: '4px 10px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                            >
                                                Fotoğraf Var
                                            </button>
                                        ) : (
                                            <label style={{ padding: '4px 10px', backgroundColor: '#6b7280', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                                Fotoğraf Ekle
                                                <input type="file" accept="image/*" style={{ display: 'none' }} aria-label="Fotoğraf seç" onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setDetayPhotoFiles(prev => ({ ...prev, [d.id]: file }));
                                                }} />
                                            </label>
                                        )}
                                        {detayPhotoFiles[d.id] && (
                                            <button onClick={() => handleDetayPhoto(d.id)} style={{ padding: '4px 10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Yükle</button>
                                        )}
                                        <button onClick={() => handleDeleteDetay(d.id)} style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <button
                            onClick={handleUpdate}
                            style={{ backgroundColor: '#111827', color: '#fff', padding: '18px', textAlign: 'center', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', letterSpacing: '2px', borderRadius: '0 0 12px 12px', width: '100%', border: 'none' }}
                        >
                            KAYDET VE KAPAT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecordList;
