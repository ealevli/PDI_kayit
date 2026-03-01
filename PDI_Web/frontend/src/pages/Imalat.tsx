import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Hammer, List as ListIcon, Trash2, PlusCircle, Search } from 'lucide-react';

const host = window.location.hostname;
const IMALAT_API = `http://${host}:8000/api/imalat`;
const ADMIN_API = `http://${host}:8000/api/admin`;

const Imalat: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'form' | 'list'>('list');
    const [records, setRecords] = useState<any[]>([]);
    const [topHatalar, setTopHatalar] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        arac_no: '',
        tarih: new Date().toISOString().split('T')[0],
        adet: 1,
        top_hata: '',
        hata_metni: '',
        kullanici: 'Yönetici'
    });

    useEffect(() => {
        fetchTopHatalar();
        if (activeTab === 'list') {
            fetchRecords();
        }
    }, [activeTab]);

    const fetchRecords = () => {
        setLoading(true);
        axios.get(IMALAT_API)
            .then(res => setRecords(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const fetchTopHatalar = () => {
        axios.get(`${ADMIN_API}/top-hatalar`)
            .then(res => setTopHatalar(res.data))
            .catch(err => console.error(err));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        axios.post(IMALAT_API, formData)
            .then(() => {
                alert('İmalata gönderim kaydı oluşturuldu.');
                setFormData({ ...formData, arac_no: '', top_hata: '', hata_metni: '' });
                setActiveTab('list');
            })
            .catch(err => console.error(err));
    };

    const handleDelete = (id: number) => {
        if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
        axios.delete(`${IMALAT_API}/${id}`)
            .then(() => fetchRecords())
            .catch(err => console.error(err));
    };

    const filteredRecords = records.filter(r =>
        (r.sasi_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.top_hata || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, fontWeight: 800 }}>İmalat Raporları ve Yönetimi</h1>
                    <p style={{ color: '#666', margin: 0 }}>İmalata gönderilen araçların takibi</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f4f4f4', padding: '5px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setActiveTab('list')}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            backgroundColor: activeTab === 'list' ? '#fff' : 'transparent',
                            boxShadow: activeTab === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: activeTab === 'list' ? 600 : 400
                        }}
                    >
                        <ListIcon size={18} /> Kayıtlar
                    </button>
                    <button
                        onClick={() => setActiveTab('form')}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            backgroundColor: activeTab === 'form' ? '#000' : 'transparent',
                            color: activeTab === 'form' ? '#fff' : '#000',
                            fontWeight: activeTab === 'form' ? 600 : 400
                        }}
                    >
                        <PlusCircle size={18} /> Yeni Gönderim
                    </button>
                </div>
            </div>

            {activeTab === 'form' && (
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>İmalata Araç Gönderim Formu</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Araç / Şasi No</label>
                                <input required name="arac_no" value={formData.arac_no} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} aria-label="Araç / Şasi No" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Tarih</label>
                                <input type="date" required name="tarih" value={formData.tarih} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} aria-label="Tarih" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Adet</label>
                                <input type="number" required name="adet" value={formData.adet} onChange={handleChange} min="1" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} aria-label="Adet" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Top Hata Seçimi</label>
                                <select required name="top_hata" value={formData.top_hata} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} aria-label="Top Hata Seçimi">
                                    <option value="">Seçiniz...</option>
                                    {topHatalar.map(h => <option key={h.id} value={h.hata_adi}>{h.hata_adi}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Hata Metni / Açıklama</label>
                            <textarea name="hata_metni" value={formData.hata_metni} onChange={handleChange} rows={4} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }} aria-label="Hata Metni / Açıklama"></textarea>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Kullanıcı (Oluşturan)</label>
                            <input name="kullanici" value={formData.kullanici} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }} readOnly aria-label="Kullanıcı" />
                        </div>

                        <div style={{ marginTop: '10px', textAlign: 'right' }}>
                            <button type="submit" style={{ backgroundColor: '#000', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Hammer size={18} /> İmalata Gönder
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'list' && (
                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Araç Kayıtları</h3>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#999" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                            <input
                                type="text"
                                placeholder="Araç No veya Hata Ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #ddd', width: '250px' }}
                                aria-label="Araç No veya Hata Ara"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <p>Yükleniyor...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '12px 15px', color: '#666', fontWeight: 600 }}>Tarih</th>
                                        <th style={{ padding: '12px 15px', color: '#666', fontWeight: 600 }}>Araç No</th>
                                        <th style={{ padding: '12px 15px', color: '#666', fontWeight: 600 }}>Adet</th>
                                        <th style={{ padding: '12px 15px', color: '#666', fontWeight: 600 }}>Top Hata</th>
                                        <th style={{ padding: '12px 15px', color: '#666', fontWeight: 600 }}>Hata Metni</th>
                                        <th style={{ padding: '12px 15px', color: '#666', fontWeight: 600 }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map((r) => (
                                        <tr key={r.id ?? r.sasi_no} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px 15px' }}>{r.tarih_saat}</td>
                                            <td style={{ padding: '12px 15px', fontWeight: 500 }}>{r.sasi_no}</td>
                                            <td style={{ padding: '12px 15px' }}>{r.adet}</td>
                                            <td style={{ padding: '12px 15px' }}>{r.top_hata}</td>
                                            <td style={{ padding: '12px 15px', color: '#666', fontSize: '0.9rem' }}>{r.tespitler || '-'}</td>
                                            <td style={{ padding: '12px 15px' }}>
                                                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                                Kayıt bulunamadı.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Imalat;
