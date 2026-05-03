import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, GripVertical, CheckCircle2, XCircle, Save, X } from 'lucide-react';

const host = window.location.hostname;
const API = `http://${host}:8000/api/form`;

interface DynamicItem {
    id: number;
    baslik: string;
    aciklama?: string;
    aktif: number;
    sira: number;
}

interface EditState {
    id?: number;
    baslik: string;
    aciklama: string;
}

export default function DynamikFormYonetim() {
    const [items, setItems] = useState<DynamicItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editState, setEditState] = useState<EditState | null>(null);
    const [saving, setSaving] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/dynamic-items?include_inactive=1`);
            setItems(res.data);
        } catch {
            const res = await axios.get(`${API}/dynamic-items`);
            setItems(res.data);
        } finally {
            setLoading(false);
        }
    }

    async function save() {
        if (!editState || !editState.baslik.trim()) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('baslik', editState.baslik.trim());
            if (editState.aciklama) fd.append('aciklama', editState.aciklama.trim());

            if (editState.id) {
                await axios.put(`${API}/dynamic-items/${editState.id}`, fd);
            } else {
                await axios.post(`${API}/dynamic-items`, fd);
            }
            await load();
            setEditState(null);
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(item: DynamicItem) {
        const fd = new FormData();
        fd.append('baslik', item.baslik);
        if (item.aciklama) fd.append('aciklama', item.aciklama);
        fd.append('aktif', item.aktif === 1 ? '0' : '1');
        await axios.put(`${API}/dynamic-items/${item.id}`, fd);
        await load();
    }

    async function deleteItem(id: number) {
        if (!window.confirm('Bu maddeyi silmek istediğinizden emin misiniz?')) return;
        await axios.delete(`${API}/dynamic-items/${id}`);
        await load();
    }

    const visibleItems = showInactive ? items : items.filter(i => i.aktif === 1);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.4rem' }}>Dinamik Kontrol Formu</h1>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.88rem' }}>
                        PDI formunda görünecek dinamik kontrol maddelerini yönetin
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                        Pasif maddeleri göster
                    </label>
                    <button
                        onClick={() => setEditState({ baslik: '', aciklama: '' })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', background: '#000', color: '#fff',
                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.88rem',
                        }}
                    >
                        <Plus size={16} /> Yeni Madde
                    </button>
                </div>
            </div>

            {loading ? (
                <p style={{ color: '#6b7280' }}>Yükleniyor...</p>
            ) : (
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    {visibleItems.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                            <CheckCircle2 size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                            <p style={{ margin: 0 }}>Henüz dinamik kontrol maddesi eklenmemiş.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                    <th style={thStyle}>Sıra</th>
                                    <th style={thStyle}>Madde Başlığı</th>
                                    <th style={thStyle}>Açıklama</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Durum</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleItems.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: item.aktif === 0 ? 0.5 : 1 }}>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
                                                <GripVertical size={14} />
                                                <span style={{ fontWeight: 700 }}>{item.sira}</span>
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{item.baslik}</td>
                                        <td style={{ ...tdStyle, color: '#6b7280', fontSize: '0.82rem' }}>{item.aciklama || '—'}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <button
                                                onClick={() => toggleActive(item)}
                                                title={item.aktif === 1 ? 'Pasif yap' : 'Aktif yap'}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                {item.aktif === 1
                                                    ? <CheckCircle2 size={20} color="#209242" />
                                                    : <XCircle size={20} color="#e80000" />
                                                }
                                            </button>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => setEditState({ id: item.id, baslik: item.baslik, aciklama: item.aciklama || '' })}
                                                    style={actionBtn}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    style={{ ...actionBtn, color: '#e80000', background: '#fff5f5' }}
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
            )}

            {/* Info box */}
            <div style={{ marginTop: '20px', padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#0369a1' }}>
                    <strong>Bilgi:</strong> Bu sayfada eklediğiniz maddeler, PDI formunun "Dinamik Kontrol" adımında Usta tarafından doldurulur.
                    Aktif maddeleri pasif yaparak formda görünmesini engelleyebilirsiniz.
                </p>
            </div>

            {/* Edit Modal */}
            {editState && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontWeight: 800 }}>
                                {editState.id ? 'Maddeyi Düzenle' : 'Yeni Madde Ekle'}
                            </h3>
                            <button onClick={() => setEditState(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} color="#6b7280" />
                            </button>
                        </div>

                        <label style={labelStyle}>Madde Başlığı *</label>
                        <input
                            autoFocus
                            value={editState.baslik}
                            onChange={e => setEditState({ ...editState, baslik: e.target.value })}
                            placeholder="Kontrol edilecek madde..."
                            style={inputStyle}
                        />

                        <label style={{ ...labelStyle, marginTop: '14px' }}>Açıklama (opsiyonel)</label>
                        <textarea
                            rows={3}
                            value={editState.aciklama}
                            onChange={e => setEditState({ ...editState, aciklama: e.target.value })}
                            placeholder="Usta için ek açıklama..."
                            style={{ ...inputStyle, resize: 'none' }}
                        />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => setEditState(null)}
                                style={{ flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#374151', fontWeight: 700, cursor: 'pointer' }}
                            >
                                İptal
                            </button>
                            <button
                                onClick={save}
                                disabled={saving || !editState.baslik.trim()}
                                style={{
                                    flex: 2, padding: '12px', border: 'none', borderRadius: '8px',
                                    background: !editState.baslik.trim() ? '#e5e7eb' : '#000',
                                    color: !editState.baslik.trim() ? '#9ca3af' : '#fff',
                                    fontWeight: 700, cursor: !editState.baslik.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                            >
                                <Save size={16} />
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#6b7280',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: '0.88rem',
    verticalAlign: 'middle',
};

const actionBtn: React.CSSProperties = {
    padding: '7px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#f9fafb',
    cursor: 'pointer',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.88rem',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#374151',
    marginBottom: '5px',
};
