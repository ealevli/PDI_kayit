import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Settings as SettingsIcon, Plus, Trash2, ListTree, Truck,
    Layers, MapPin, CheckCircle2, FileUp, AlertCircle,
    CheckCircle, Loader2
} from 'lucide-react';
import ExcelImport from './ExcelImport';

const host = window.location.hostname;
const ADMIN_API = `http://${host}:8000/api/admin`;

interface LookupItem {
    id: number;
    name: string;
}

interface TopHata {
    id: number;
    hata_adi: string;
    aktif: boolean;
}

type TabType = 'tophata' | 'arac-tipi' | 'alt-grup' | 'hata-konumu' | 'hata-nerede' | 'excel-import';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('excel-import');
    const [hatalar, setHatalar] = useState<TopHata[]>([]);
    const [lookups, setLookups] = useState<LookupItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

    useEffect(() => {
        if (activeTab === 'excel-import') return;
        if (activeTab === 'tophata') {
            fetchHatalar();
        } else {
            fetchLookups();
        }
    }, [activeTab]);

    const fetchHatalar = () => {
        setLoading(true);
        axios.get(`${ADMIN_API}/top-hatalar`)
            .then(res => setHatalar(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const fetchLookups = () => {
        setLoading(true);
        axios.get(`${ADMIN_API}/lookups/${activeTab}`)
            .then(res => setLookups(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const showMsg = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3500);
    };

    const addItem = () => {
        if (!newItem.trim()) return;

        if (activeTab === 'tophata') {
            axios.post(`${ADMIN_API}/top-hatalar`, { hata_adi: newItem })
                .then(() => {
                    setNewItem('');
                    fetchHatalar();
                    showMsg('Yeni hata başarıyla eklendi.', 'success');
                })
                .catch(() => showMsg('Ekleme sırasında hata oluştu.', 'error'));
        } else {
            axios.post(`${ADMIN_API}/lookups/${activeTab}`, { name: newItem })
                .then(() => {
                    setNewItem('');
                    fetchLookups();
                    showMsg('Seçenek başarıyla eklendi.', 'success');
                })
                .catch(() => showMsg('Ekleme sırasında hata oluştu.', 'error'));
        }
    };

    const deleteItem = (id: number) => {
        if (!window.confirm('Bu öğeyi silmek istediğinize emin misiniz?')) return;

        const url = activeTab === 'tophata'
            ? `${ADMIN_API}/top-hatalar/${id}`
            : `${ADMIN_API}/lookups/${activeTab}/${id}`;

        axios.delete(url)
            .then(() => {
                activeTab === 'tophata' ? fetchHatalar() : fetchLookups();
                showMsg('Öğe silindi.', 'success');
            })
            .catch(() => showMsg('Silinirken bir hata oluştu.', 'error'));
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'excel-import', label: 'Eski Veri Yükle', icon: <FileUp size={18} /> },
        { id: 'tophata', label: 'Top Hatalar', icon: <ListTree size={18} /> },
        { id: 'arac-tipi', label: 'Araç Tipleri', icon: <Truck size={18} /> },
        { id: 'alt-grup', label: 'Alt Gruplar', icon: <Layers size={18} /> },
        { id: 'hata-konumu', label: 'Hata Konumları', icon: <MapPin size={18} /> },
        { id: 'hata-nerede', label: 'Giderilen Yerler', icon: <CheckCircle2 size={18} /> }
    ];

    const currentRows = activeTab === 'tophata'
        ? hatalar.map(h => ({ id: h.id, name: h.hata_adi }))
        : lookups;

    return (
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto text-slate-900">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-700 rounded-2xl text-white">
                        <SettingsIcon size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SİSTEM AYARLARI</h1>
                        <p className="text-slate-600 text-sm font-medium">Veri yönetimi ve sistem parametreleri</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all duration-300 font-bold text-sm whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-blue-700 text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'excel-import' ? (
                <ExcelImport />
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] p-8 space-y-8">
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="flex-1 space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                Yeni {tabs.find(t => t.id === activeTab)?.label} Ekle
                            </label>
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder={`${tabs.find(t => t.id === activeTab)?.label} ismini giriniz...`}
                                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-slate-400"
                                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                            />
                        </div>
                        <button
                            onClick={addItem}
                            className="bg-blue-700 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl transition-all font-black flex items-center gap-3"
                        >
                            <Plus size={24} />
                            SİSTEME EKLE
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-600" size={48} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentRows.map(item => (
                                <div key={item.id} className="group flex justify-between items-center p-5 bg-white border border-slate-200 rounded-2xl transition-all hover:bg-slate-50 hover:border-slate-300">
                                    <span className="font-bold text-slate-800 tracking-tight">{item.name}</span>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="p-2.5 bg-red-50 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && currentRows.length === 0 && (
                        <div className="py-16 text-center text-slate-500 font-bold uppercase tracking-widest bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            Kayıtlı Veri Bulunmamaktadır
                        </div>
                    )}
                </div>
            )}

            {message.text && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right duration-300 z-[100] ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                    {message.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle size={22} />}
                    <span className="font-bold tracking-tight">{message.text}</span>
                </div>
            )}
        </div>
    );
};

export default Settings;
