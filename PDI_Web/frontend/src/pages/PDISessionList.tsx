import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Trash2, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

const host = window.location.hostname;
const API = `http://${host}:8000/api/form`;

interface Session {
    id: number;
    sasi_no?: string;
    arac_tipi: string;
    is_emri_no?: string;
    bb_no?: string;
    pdi_personel?: string;
    tarih: string;
    durum: string;
    olusturma_tarihi: string;
}

interface SessionDetail {
    id: number;
    sasi_no?: string;
    arac_tipi: string;
    is_emri_no?: string;
    bb_no?: string;
    imalat_no?: string;
    wa_no?: string;
    pdi_personel?: string;
    tarih: string;
    durum: string;
    aku_uretim_tarihi?: string;
    yangin_tupu_tarihi?: string;
    genel_aciklamalar?: string;
    olusturma_tarihi: string;
    responses: Array<{
        item_no: string;
        durum: string;
        ariza_tanimi?: string;
        olcum_ilk?: string;
        olcum_sonra?: string;
        fotograf_yolu?: string;
    }>;
    pins: Array<{
        id: number;
        view: string;
        x_percent: string;
        y_percent: string;
        aciklama?: string;
        fotograf_yolu?: string;
    }>;
    dynamic_responses: Array<{
        dynamic_item_id: number;
        kontrol_edildi: number;
        aciklama?: string;
    }>;
}

export default function PDISessionList() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<SessionDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/sessions`);
            setSessions(res.data);
        } finally {
            setLoading(false);
        }
    }

    function openForm(id: number) {
        window.open(`/usta?session=${id}`, '_blank');
    }

    async function openDetail(id: number) {
        setDetailLoading(true);
        try {
            const res = await axios.get(`${API}/sessions/${id}`);
            setSelected(res.data);
        } finally {
            setDetailLoading(false);
        }
    }

    async function deleteSession(id: number) {
        if (!window.confirm('Bu PDI oturumunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
        await axios.delete(`${API}/sessions/${id}`);
        setSessions(prev => prev.filter(s => s.id !== id));
        if (selected?.id === id) setSelected(null);
    }

    const arizaliCount = (s: SessionDetail) => s.responses.filter(r => r.durum === 'arizali').length;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.4rem' }}>PDI Form Oturumları</h1>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.88rem' }}>
                        Ustalar tarafından doldurulan dijital PDI formları
                    </p>
                </div>
                <a
                    href="/usta"
                    target="_blank"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 18px', background: '#000', color: '#fff',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
                    }}
                >
                    <ExternalLink size={16} /> Yeni Form Aç
                </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '20px', alignItems: 'start' }}>
                {/* List */}
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    {loading ? (
                        <p style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>Yükleniyor...</p>
                    ) : sessions.length === 0 ? (
                        <p style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Henüz PDI formu doldurulmamış.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                    {['ID', 'Araç Tipi', 'Şasi No', 'Personel', 'Tarih', 'Durum', ''].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map(s => (
                                    <tr
                                        key={s.id}
                                        style={{
                                            borderBottom: '1px solid #f3f4f6',
                                            background: selected?.id === s.id ? '#f0f9ff' : '#fff',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => s.durum !== 'tamamlandi' ? openForm(s.id) : openDetail(s.id)}
                                    >
                                        <td style={tdStyle}><span style={{ fontWeight: 700, color: '#374151' }}>#{s.id}</span></td>
                                        <td style={tdStyle}>{s.arac_tipi}</td>
                                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.82rem' }}>{s.sasi_no || '—'}</td>
                                        <td style={tdStyle}>{s.pdi_personel || '—'}</td>
                                        <td style={tdStyle}>{s.tarih}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                                                background: s.durum === 'tamamlandi' ? '#f0faf3' : '#fff7ed',
                                                color: s.durum === 'tamamlandi' ? '#209242' : '#d97706',
                                                border: `1px solid ${s.durum === 'tamamlandi' ? '#86efac' : '#fcd34d'}`,
                                            }}>
                                                {s.durum === 'tamamlandi' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {s.durum === 'tamamlandi' ? 'Tamamlandı' : 'Devam Ediyor'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); s.durum !== 'tamamlandi' ? openForm(s.id) : openDetail(s.id); }}
                                                    style={s.durum !== 'tamamlandi' ? { ...actionBtn, color: '#00677f', borderColor: '#00677f', background: '#f0fafd' } : actionBtn}
                                                    title={s.durum !== 'tamamlandi' ? 'Forma Git' : 'Detay'}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                                                    style={{ ...actionBtn, color: '#e80000', background: '#fff5f5', borderColor: '#fecaca' }}
                                                    title="Sil"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Detail panel */}
                {selected && (
                    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', position: 'sticky', top: '20px' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>
                                #{selected.id} — {selected.arac_tipi}
                            </h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>✕</button>
                        </div>

                        {detailLoading ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Yükleniyor...</p>
                        ) : (
                            <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                                {/* Meta */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                                    {[
                                        ['Şasi No', selected.sasi_no],
                                        ['İş Emri', selected.is_emri_no],
                                        ['BB No', selected.bb_no],
                                        ['İmalat No', selected.imalat_no],
                                        ['WA No', selected.wa_no],
                                        ['Personel', selected.pdi_personel],
                                        ['Tarih', selected.tarih],
                                        ['Akü Tarihi', selected.aku_uretim_tarihi],
                                    ].map(([k, v]) => v ? (
                                        <div key={k as string} style={{ background: '#f9fafb', borderRadius: '6px', padding: '8px 10px' }}>
                                            <p style={{ margin: '0 0 2px', fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>{k}</p>
                                            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{v}</p>
                                        </div>
                                    ) : null)}
                                </div>

                                {/* Arızalı items */}
                                {arizaliCount(selected) > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color: '#e80000', textTransform: 'uppercase' }}>
                                            Arızalar ({arizaliCount(selected)})
                                        </p>
                                        <div style={{ border: '1px solid #fecaca', borderRadius: '8px', overflow: 'hidden' }}>
                                            {selected.responses.filter(r => r.durum === 'arizali').map(r => (
                                                <div key={r.item_no} style={{ padding: '10px 12px', borderBottom: '1px solid #fef2f2', background: '#fff5f5' }}>
                                                    <p style={{ margin: '0 0 2px', fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{r.item_no}</p>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563' }}>{r.ariza_tanimi || '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pins */}
                                {selected.pins.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>
                                            Diyagram Pinleri ({selected.pins.length})
                                        </p>
                                        {selected.pins.map(pin => (
                                            <div key={pin.id} style={{ display: 'flex', gap: '8px', padding: '8px 10px', background: '#f9fafb', borderRadius: '6px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00677f', minWidth: '30px' }}>{pin.view.toUpperCase()}</span>
                                                <span style={{ fontSize: '0.78rem', color: '#374151' }}>{pin.aciklama || `(${pin.x_percent}%, ${pin.y_percent}%)`}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selected.genel_aciklamalar && (
                                    <div>
                                        <p style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>
                                            Genel Açıklamalar
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#4b5563', background: '#f9fafb', padding: '10px', borderRadius: '6px' }}>
                                            {selected.genel_aciklamalar}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem',
    fontWeight: 700, color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase',
};
const tdStyle: React.CSSProperties = {
    padding: '13px 16px', fontSize: '0.88rem', verticalAlign: 'middle', color: '#374151',
};
const actionBtn: React.CSSProperties = {
    padding: '7px', border: '1px solid #e5e7eb', borderRadius: '6px',
    background: '#f9fafb', cursor: 'pointer', color: '#374151',
    display: 'flex', alignItems: 'center',
};
