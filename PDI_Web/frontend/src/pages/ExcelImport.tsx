import React, { useState } from 'react';
import axios from 'axios';
import {
    UploadCloud,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle2,
    Info,
    ChevronRight,
    Loader2,
    Database,
    Zap
} from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

const ExcelImport: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/import-excel`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult({
                success: true,
                message: `${res.data.count} adet kayıt başarıyla yüklendi!`,
                details: res.data.errors
            });
            setFile(null);
        } catch (err: any) {
            setResult({
                success: false,
                message: err.response?.data?.detail || "Dosya yüklenirken bir hata oluştu."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-900">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Database size={120} />
                </div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                        <Zap size={12} /> Veri Entegrasyonu
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">GEÇMİŞ VERİ YÜKLEME</h1>
                    <p className="text-slate-600 font-medium max-w-2xl">Excel dosyalarından toplu veri aktarımı yaparak raporlarınızı geçmişe dönük zenginleştirin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-3xl p-12 hover:border-blue-500/60 transition-all group bg-slate-50">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="excel-upload"
                            />
                            <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                                <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl">
                                    <UploadCloud className="text-blue-500" size={40} />
                                </div>
                                <span className="text-xl font-black text-slate-900 mb-2">Dosya Seçin</span>
                                <span className="text-slate-600 text-sm font-medium">veya buraya sürükleyin</span>
                                {file && (
                                    <div className="mt-6 px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center gap-3 animate-in zoom-in">
                                        <FileSpreadsheet className="text-blue-400" size={18} />
                                        <span className="text-blue-200 font-bold text-sm tracking-tight">{file.name}</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className={`w-full mt-8 py-5 rounded-2xl font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 shadow-2xl ${!file || loading
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-1 shadow-blue-500/20 hover:shadow-blue-500/40'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    İŞLENİYOR...
                                </>
                            ) : (
                                <>AKTIRIMI BAŞLAT</>
                            )}
                        </button>

                        {/* Results */}
                        {result && (
                            <div className={`mt-8 p-6 rounded-2xl border flex gap-4 animate-in slide-in-from-top duration-300 ${result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                {result.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                <div>
                                    <p className="font-black text-lg leading-tight mb-1 uppercase tracking-tight">{result.success ? "BAŞARILI" : "HATA"}</p>
                                    <p className="text-sm font-medium opacity-80">{result.message}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions Section */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <Info className="text-orange-500" size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Excel Formatı</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: "Araç Tipi", desc: "Arac Tipi, Sasi No, BB No, Is Emri No, Alt Grup, Tarih Saat" },
                                { label: "Esnek Eşleştirme", desc: "Sütun adlarını otomatik algılar (örn: 'Sasi No' veya 'CHASSIS')" },
                                { label: "Normalizasyon", desc: "'TOU' -> 'Tourismo', 'TRV' -> 'Travego' dönüşümü yapar." },
                                { label: "Tarih Formatı", desc: "GG-AA-YYYY veya YYYY-AA-GG formatlarını destekler." }
                            ].map((item, i) => (
                                <div key={i} className="group p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ChevronRight size={14} className="text-orange-500" />
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.label}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 p-6 rounded-[2rem] border border-blue-500/20 shadow-2xl border-dashed">
                        <p className="text-xs font-bold text-blue-300 leading-relaxed italic">
                            "Excel dosyasındaki veriler doğrudan pdi_kayitlari tablosuna eklenir. Lütfen yükleme yapmadan önce sütun başlıklarını kontrol edin."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelImport;
