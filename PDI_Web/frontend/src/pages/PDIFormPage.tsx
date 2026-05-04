import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
    ClipboardList, MapPin, FileText, Save, CheckCheck,
    Camera, X, ChevronDown, ChevronUp, Search, Plus, Clock
} from 'lucide-react';
import VehicleDiagram from '../components/VehicleDiagram';
import type { VehiclePin } from '../components/VehicleDiagram';
import { FORM_DATA, ARAC_TIPLERI } from '../data/FORM_DATA';
import type { FormSection, FormItem, AltGrup } from '../data/FORM_DATA';

const host = window.location.hostname;
const API = `http://${host}:8000/api/form`;
const ADMIN_API = `http://${host}:8000/api/admin`;

// ─── DT-DDS Colors ──────────────────────────────────────────────────────────
const C = {
    black: '#000000', petrol: '#00677f', bg: '#f2f2f2',
    success: '#209242', error: '#e80000', warning: '#fab700',
    white: '#ffffff', grey20: '#e6e6e6', grey60: '#999999', grey80: '#555555', grey100: '#333333',
};

const ALT_GRUP_COLORS: Record<AltGrup, { bg: string; color: string }> = {
    Mekanik: { bg: '#e0f0ff', color: '#0066cc' },
    Elektrik: { bg: '#fff8e0', color: '#b87700' },
    Boya:     { bg: '#ffe0e0', color: '#cc0000' },
    Süsleme:  { bg: '#e8e0ff', color: '#6600cc' },
};

type CheckStatus = 'tamam' | 'arizali' | 'giderildi' | 'yapildi' | '';

interface ResponseData {
    durum: CheckStatus;
    ariza_tanimi: string;
    hata_nerede_item: string;
    olcum_ilk: string;
    olcum_sonra: string;
    photoFile?: File;
    fotograf_yolu?: string;
}

interface ActiveSession {
    id: number;
    sasi_no?: string;
    arac_tipi: string;
    is_emri_no?: string;
    pdi_personel?: string;
    tarih: string;
    durum: string;
}

const STEPS = [
    { id: 'header',    label: 'Araç Bilgileri', icon: <FileText size={18} /> },
    { id: 'diagram',   label: 'Araç Diyagramı', icon: <MapPin size={18} /> },
    { id: 'checklist', label: 'Kontrol Listesi', icon: <ClipboardList size={18} /> },
    { id: 'dynamic',   label: 'Dinamik Kontrol', icon: <CheckCheck size={18} /> },
    { id: 'finish',    label: 'Tamamla',         icon: <CheckCircle2 size={18} /> },
];

export default function PDIFormPage() {
    // ── State ────────────────────────────────────────────────────────────────
    const [screen, setScreen] = useState<'landing' | 'form'>('landing');
    const [step, setStep] = useState(0);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [sectionSaving, setSectionSaving] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);

    // Landing state
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [lookupSasi, setLookupSasi] = useState('');
    const [lookupError, setLookupError] = useState('');

    // Header fields
    const [aracTipi, setAracTipi] = useState('');
    const [sasiNo, setSasiNo] = useState('');
    const [isEmriNo, setIsEmriNo] = useState('');
    const [bbNo, setBbNo] = useState('');
    const [imalatNo, setImalatNo] = useState('');
    const [waNo, setWaNo] = useState('');
    const [pdiPersonel, setPdiPersonel] = useState('');

    // Checklist responses
    const [responses, setResponses] = useState<Record<string, ResponseData>>({});
    // Per-section: who saved it and what name they entered
    const [sectionSavedBy, setSectionSavedBy] = useState<Record<string, string>>({});
    const [sectionUsta, setSectionUsta] = useState<Record<string, string>>({});

    // Diagram pins
    const [pins, setPins] = useState<VehiclePin[]>([]);

    // Dynamic form
    const [dynamicItems, setDynamicItems] = useState<Array<{ id: number; baslik: string; aciklama?: string }>>([]);
    const [dynamicResponses, setDynamicResponses] = useState<Record<number, { kontrol_edildi: boolean; aciklama: string }>>({});

    // Finish fields
    const [genelAciklamalar, setGenelAciklamalar] = useState('');
    const [akuTarihi, setAkuTarihi] = useState('');
    const [yanginTupu, setYanginTupu] = useState('');

    // Lookups — varsayılan değerlerle başlat (API başarısız olsa bile dropdown çalışır)
    const [hataNeredeler, setHataNeredeler] = useState<string[]>(['TUM', 'İmalat', 'Diğer']);

    // UI
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [errorToast, setErrorToast] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [step0Error, setStep0Error] = useState('');
    const [landingLoading, setLandingLoading] = useState(true);
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    function showError(msg: string) {
        setErrorToast(msg);
        setTimeout(() => setErrorToast(''), 4000);
    }

    const formData = aracTipi ? FORM_DATA[aracTipi] : null;

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        // Aktif session'ları yükle — tamamlanınca landing ekranı göster
        axios.get(`${API}/sessions/active`)
            .then(r => setActiveSessions(r.data))
            .catch(() => {})
            .finally(() => setLandingLoading(false));

        axios.get(`${API}/dynamic-items`).then(r => setDynamicItems(r.data)).catch(() => {});

        // Hata nerede lookup — API değerleriyle varsayılanın üstüne yaz
        axios.get(`${ADMIN_API}/lookups/hata-nerede`)
            .then(r => {
                const names = r.data.map((x: any) => x.name).filter(Boolean);
                if (names.length > 0) setHataNeredeler(names);
            })
            .catch(() => {}); // varsayılan zaten set edildi
    }, []);

    // ── Session management ────────────────────────────────────────────────────
    async function ensureSession(): Promise<number> {
        if (sessionId) return sessionId;
        const fd = new FormData();
        fd.append('arac_tipi', aracTipi);
        if (sasiNo) fd.append('sasi_no', sasiNo);
        if (isEmriNo) fd.append('is_emri_no', isEmriNo);
        if (bbNo) fd.append('bb_no', bbNo);
        if (imalatNo) fd.append('imalat_no', imalatNo);
        if (waNo) fd.append('wa_no', waNo);
        if (pdiPersonel) fd.append('pdi_personel', pdiPersonel);
        const res = await axios.post(`${API}/sessions`, fd);
        const id = res.data.id;
        setSessionId(id);
        return id;
    }

    async function loadSession(id: number) {
        const res = await axios.get(`${API}/sessions/${id}`);
        const { session, responses: rdata, pins: pdata, dynamic_responses } = res.data;
        setSessionId(id);
        setAracTipi(session.arac_tipi || '');
        setSasiNo(session.sasi_no || '');
        setIsEmriNo(session.is_emri_no || '');
        setBbNo(session.bb_no || '');
        setImalatNo(session.imalat_no || '');
        setWaNo(session.wa_no || '');
        setPdiPersonel(session.pdi_personel || '');
        setAkuTarihi(session.aku_uretim_tarihi || '');
        setYanginTupu(session.yangin_tupu_tarihi || '');
        setGenelAciklamalar(session.genel_aciklamalar || '');

        const respMap: Record<string, ResponseData> = {};
        const ustaMap: Record<string, string> = {};
        const savedByMap: Record<string, string> = {};
        for (const r of rdata) {
            respMap[r.item_no] = {
                durum: r.durum || '',
                ariza_tanimi: r.ariza_tanimi || '',
                hata_nerede_item: r.hata_nerede_item || '',
                olcum_ilk: r.olcum_ilk || '',
                olcum_sonra: r.olcum_sonra || '',
                fotograf_yolu: r.fotograf_yolu,
            };
            // Derive section no from item_no prefix (e.g. "3.1.2" → "3")
            const sectionNo = r.item_no?.split('.')[0];
            if (r.kaydeden && sectionNo && !ustaMap[sectionNo]) {
                ustaMap[sectionNo] = r.kaydeden;
                savedByMap[sectionNo] = `${r.kaydeden} tarafından kaydedildi`;
            }
        }
        setResponses(respMap);
        setSectionUsta(ustaMap);
        setSectionSavedBy(savedByMap);
        setPins(pdata.map((p: any) => ({ ...p, x_percent: String(p.x_percent), y_percent: String(p.y_percent) })));
        const drMap: Record<number, { kontrol_edildi: boolean; aciklama: string }> = {};
        for (const d of dynamic_responses) {
            drMap[d.dynamic_item_id] = { kontrol_edildi: !!d.kontrol_edildi, aciklama: d.aciklama || '' };
        }
        setDynamicResponses(drMap);
        setScreen('form');
    }

    async function handleSasiLookup() {
        setLookupError('');
        if (!lookupSasi.trim()) return;
        try {
            const res = await axios.get(`${API}/sessions/by-sasi/${lookupSasi.trim()}`);
            await loadSession(res.data.id);
        } catch {
            setLookupError('Bu şasi numarasına ait devam eden PDI bulunamadı.');
        }
    }

    // ── Section save ──────────────────────────────────────────────────────────
    async function saveSectionResponses(section: FormSection) {
        setSectionSaving(section.no);
        const usta = sectionUsta[section.no]?.trim() || '';
        try {
            const sid = await ensureSession();

            // Update session header fields
            const headerFd = new FormData();
            headerFd.append('arac_tipi', aracTipi);
            if (sasiNo) headerFd.append('sasi_no', sasiNo);
            if (isEmriNo) headerFd.append('is_emri_no', isEmriNo);
            if (bbNo) headerFd.append('bb_no', bbNo);
            if (pdiPersonel) headerFd.append('pdi_personel', pdiPersonel);
            await axios.put(`${API}/sessions/${sid}`, headerFd);

            for (const ss of section.subSections) {
                for (const item of ss.items) {
                    const resp = responses[item.no];
                    if (!resp?.durum) continue;
                    const fd = new FormData();
                    fd.append('item_no', item.no);
                    fd.append('item_label', item.label);
                    fd.append('alt_grup', section.altGrup);
                    fd.append('durum', resp.durum);
                    if (resp.ariza_tanimi) fd.append('ariza_tanimi', resp.ariza_tanimi);
                    if (resp.hata_nerede_item) fd.append('hata_nerede_item', resp.hata_nerede_item);
                    if (resp.olcum_ilk) fd.append('olcum_ilk', resp.olcum_ilk);
                    if (resp.olcum_sonra) fd.append('olcum_sonra', resp.olcum_sonra);
                    if (usta) fd.append('kaydeden', usta);
                    await axios.post(`${API}/sessions/${sid}/responses`, fd);
                    if (resp.photoFile) {
                        const pfd = new FormData();
                        pfd.append('photo', resp.photoFile);
                        await axios.post(`${API}/sessions/${sid}/responses/${item.no}/photo`, pfd);
                    }
                }
            }

            setSectionSavedBy(prev => ({
                ...prev,
                [section.no]: usta ? `${usta} tarafından kaydedildi` : 'Kaydedildi ✓',
            }));
        } finally {
            setSectionSaving(null);
        }
    }

    // ── Full save ─────────────────────────────────────────────────────────────
    async function saveAll() {
        if (!aracTipi) {
            showError('Araç tipi seçilmedi. Lütfen 1. adımdan araç tipini seçin.');
            return;
        }
        setSaving(true);
        try {
            const sid = await ensureSession();
            const headerFd = new FormData();
            headerFd.append('arac_tipi', aracTipi);
            if (sasiNo) headerFd.append('sasi_no', sasiNo);
            if (isEmriNo) headerFd.append('is_emri_no', isEmriNo);
            if (bbNo) headerFd.append('bb_no', bbNo);
            if (imalatNo) headerFd.append('imalat_no', imalatNo);
            if (waNo) headerFd.append('wa_no', waNo);
            if (pdiPersonel) headerFd.append('pdi_personel', pdiPersonel);
            if (akuTarihi) headerFd.append('aku_uretim_tarihi', akuTarihi);
            if (yanginTupu) headerFd.append('yangin_tupu_tarihi', yanginTupu);
            if (genelAciklamalar) headerFd.append('genel_aciklamalar', genelAciklamalar);
            await axios.put(`${API}/sessions/${sid}`, headerFd);

            if (formData) {
                for (const section of formData.sections) {
                    const usta = sectionUsta[section.no]?.trim() || '';
                    for (const ss of section.subSections) {
                        for (const item of ss.items) {
                            const resp = responses[item.no];
                            if (!resp?.durum) continue;
                            const fd = new FormData();
                            fd.append('item_no', item.no);
                            fd.append('item_label', item.label);
                            fd.append('alt_grup', section.altGrup);
                            fd.append('durum', resp.durum);
                            if (resp.ariza_tanimi) fd.append('ariza_tanimi', resp.ariza_tanimi);
                            if (resp.hata_nerede_item) fd.append('hata_nerede_item', resp.hata_nerede_item);
                            if (resp.olcum_ilk) fd.append('olcum_ilk', resp.olcum_ilk);
                            if (resp.olcum_sonra) fd.append('olcum_sonra', resp.olcum_sonra);
                            if (usta) fd.append('kaydeden', usta);
                            await axios.post(`${API}/sessions/${sid}/responses`, fd);
                            if (resp.photoFile) {
                                const pfd = new FormData();
                                pfd.append('photo', resp.photoFile);
                                await axios.post(`${API}/sessions/${sid}/responses/${item.no}/photo`, pfd);
                            }
                        }
                    }
                }
            }

            for (const pin of pins) {
                if (pin.id) continue;
                const fd = new FormData();
                fd.append('view', pin.view);
                fd.append('x_percent', pin.x_percent);
                fd.append('y_percent', pin.y_percent);
                if (pin.aciklama) fd.append('aciklama', pin.aciklama);
                const pinRes = await axios.post(`${API}/sessions/${sid}/pins`, fd);
                if (pin.photoFile) {
                    const pfd = new FormData();
                    pfd.append('photo', pin.photoFile);
                    await axios.post(`${API}/sessions/${sid}/pins/${pinRes.data.id}/photo`, pfd);
                }
            }

            for (const [idStr, dr] of Object.entries(dynamicResponses)) {
                const fd = new FormData();
                fd.append('dynamic_item_id', idStr);
                fd.append('kontrol_edildi', dr.kontrol_edildi ? '1' : '0');
                if (dr.aciklama) fd.append('aciklama', dr.aciklama);
                await axios.post(`${API}/sessions/${sid}/dynamic-responses`, fd);
            }

            // Başarı bildirimi
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 5000);

        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || 'Kayıt sırasında bir hata oluştu.';
            showError(msg);
            throw err;
        } finally {
            setSaving(false);
        }
    }

    async function saveAndExit() {
        if (aracTipi) {
            setSaving(true);
            try {
                await saveAll();
            } catch {
                // saveAll already shows error toast; still navigate back
            } finally {
                setSaving(false);
            }
        }
        const r = await axios.get(`${API}/sessions/active`).catch(() => ({ data: [] }));
        setActiveSessions(r.data as ActiveSession[]);
        setScreen('landing');
    }

    async function completeForm() {
        if (!aracTipi) {
            showError('Araç tipi seçilmedi. Lütfen 1. adımdan araç tipini seçin.');
            return;
        }
        setSaving(true);
        try {
            await saveAll();
            const sid = sessionId || await ensureSession();
            const fd = new FormData();
            if (genelAciklamalar) fd.append('genel_aciklamalar', genelAciklamalar);
            await axios.post(`${API}/sessions/${sid}/complete`, fd);
            setCompleted(true);
        } catch (err: any) {
            if (!errorToast) {
                const msg = err?.response?.data?.detail || err?.message || 'Tamamlama sırasında bir hata oluştu.';
                showError(msg);
            }
        } finally {
            setSaving(false);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function setResponse(item_no: string, patch: Partial<ResponseData>) {
        setResponses(prev => {
            const existing = prev[item_no] || { durum: '' as CheckStatus, ariza_tanimi: '', hata_nerede_item: '', olcum_ilk: '', olcum_sonra: '' };
            return { ...prev, [item_no]: { ...existing, ...patch } };
        });
    }

    function countIssues() {
        return Object.values(responses).filter(r => r.durum === 'arizali').length;
    }

    function sectionProgress(section: FormSection) {
        const items = section.subSections.flatMap(ss => ss.items);
        const done = items.filter(i => responses[i.no]?.durum).length;
        const issues = items.filter(i => responses[i.no]?.durum === 'arizali').length;
        return { done, total: items.length, issues };
    }

    // ── Render: single item ───────────────────────────────────────────────────
    function renderItem(item: FormItem, isYapildi: boolean) {
        const resp = responses[item.no] || { durum: '' as CheckStatus, ariza_tanimi: '', hata_nerede_item: '', olcum_ilk: '', olcum_sonra: '' };
        const isArızalı = resp.durum === 'arizali';
        const isGiderildi = resp.durum === 'giderildi';

        const statusBtn = (status: CheckStatus, label: string, color: string) => {
            const active = resp.durum === status;
            return (
                <button
                    key={status}
                    onClick={() => setResponse(item.no, { durum: active ? '' : status })}
                    style={{
                        padding: '8px 10px', flex: 1, border: `2px solid ${active ? color : C.grey20}`,
                        borderRadius: '6px', background: active ? color : '#fff',
                        color: active ? '#fff' : C.grey80, fontWeight: 700,
                        fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                >
                    {label}
                </button>
            );
        };

        return (
            <div key={item.no} style={{ padding: '12px 14px', borderBottom: `1px solid ${C.grey20}`, background: isArızalı ? '#fff5f5' : '#fff' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: C.grey60, fontWeight: 700, minWidth: '36px', paddingTop: '2px' }}>{item.no}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: C.grey100, lineHeight: 1.4 }}>
                            {item.label}
                            {item.measureNote && <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: C.petrol, fontWeight: 600 }}>({item.measureNote})</span>}
                        </p>

                        {/* Info fields — tarih seçici */}
                        {item.type === 'info' && (() => {
                            const isAku = item.no.includes('3.1.7') || item.no.includes('3.1.6');
                            const val = isAku ? akuTarihi : yanginTupu;
                            const setVal = isAku ? setAkuTarihi : setYanginTupu;
                            return (
                                <input
                                    type="date"
                                    value={val}
                                    onChange={e => setVal(e.target.value)}
                                    style={{ ...inputStyle, colorScheme: 'light' }}
                                />
                            );
                        })()}

                        {/* Measurement */}
                        {item.type === 'measurement' && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.72rem', color: C.grey60, display: 'block', marginBottom: '3px' }}>İlk ({item.unit})</label>
                                    <input type="number" inputMode="decimal" value={resp.olcum_ilk} onChange={e => setResponse(item.no, { olcum_ilk: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.72rem', color: C.grey60, display: 'block', marginBottom: '3px' }}>Sonra ({item.unit})</label>
                                    <input type="number" inputMode="decimal" value={resp.olcum_sonra} onChange={e => setResponse(item.no, { olcum_sonra: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                        )}

                        {/* Status buttons */}
                        {item.type !== 'info' && (
                            <div style={{ display: 'flex', gap: '6px', marginBottom: (isArızalı || isGiderildi) ? '8px' : 0 }}>
                                {isYapildi ? statusBtn('yapildi', '✓ Yapıldı', C.success) : (
                                    <>
                                        {statusBtn('tamam', '✓ Tamam', C.success)}
                                        {statusBtn('arizali', '✕ Arızalı', C.error)}
                                        {statusBtn('giderildi', '↩ Giderildi', C.warning)}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Giderildi → hata nerede dropdown */}
                        {isGiderildi && hataNeredeler.length > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.72rem', color: C.grey60, display: 'block', marginBottom: '3px', fontWeight: 600 }}>Nerede Giderildi?</label>
                                <select
                                    value={resp.hata_nerede_item}
                                    onChange={e => setResponse(item.no, { hata_nerede_item: e.target.value })}
                                    style={{ ...inputStyle, color: resp.hata_nerede_item ? C.black : C.grey60 }}
                                >
                                    <option value="">Seçiniz...</option>
                                    {hataNeredeler.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Arızalı details */}
                        {isArızalı && (
                            <div>
                                <textarea rows={2} placeholder="Arıza tanımı..." value={resp.ariza_tanimi}
                                    onChange={e => setResponse(item.no, { ariza_tanimi: e.target.value })}
                                    style={{ ...inputStyle, resize: 'none', marginBottom: '6px' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input ref={el => { fileRefs.current[item.no] = el; }}
                                        type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                                        onChange={e => { const f = e.target.files?.[0]; if (f) setResponse(item.no, { photoFile: f }); }} />
                                    {resp.photoFile ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <img src={URL.createObjectURL(resp.photoFile)} alt="preview"
                                                style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: `1px solid ${C.grey20}` }} />
                                            <button onClick={() => setResponse(item.no, { photoFile: undefined })}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.error }}><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => fileRefs.current[item.no]?.click()}
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: C.bg, border: `1px solid ${C.grey20}`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', color: C.grey80 }}>
                                            <Camera size={14} /> Fotoğraf
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Render: section ───────────────────────────────────────────────────────
    function renderSection(section: FormSection) {
        const { done, total, issues } = sectionProgress(section);
        const isCollapsed = collapsedSections[section.no];
        const altGrupStyle = ALT_GRUP_COLORS[section.altGrup];
        const savedBy = sectionSavedBy[section.no];
        const isSaving = sectionSaving === section.no;

        return (
            <div key={section.no} style={{ marginBottom: '12px', background: '#fff', borderRadius: '10px', border: `1px solid ${C.grey20}`, overflow: 'hidden' }}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderBottom: isCollapsed ? 'none' : `1px solid ${C.grey20}` }}>
                    <button onClick={() => setCollapsedSections(p => ({ ...p, [section.no]: !p[section.no] }))}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: altGrupStyle.bg, color: altGrupStyle.color }}>
                            {section.altGrup}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: C.black, flex: 1 }}>{section.no}. {section.title}</span>
                        <span style={{ fontSize: '0.75rem', color: C.grey60 }}>{done}/{total}</span>
                        {issues > 0 && <span style={{ background: C.error, color: '#fff', borderRadius: '10px', padding: '2px 7px', fontSize: '0.7rem', fontWeight: 700 }}>{issues}</span>}
                        {isCollapsed ? <ChevronDown size={16} color={C.grey60} /> : <ChevronUp size={16} color={C.grey60} />}
                    </button>

                    {/* Per-section usta + save */}
                    {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <input
                                value={sectionUsta[section.no] || ''}
                                onChange={e => setSectionUsta(p => ({ ...p, [section.no]: e.target.value }))}
                                placeholder="Usta adı"
                                style={{ width: '100px', padding: '6px 8px', border: `1.5px solid ${C.grey20}`, borderRadius: '6px', fontSize: '0.75rem', background: '#fff', color: C.black, fontFamily: 'inherit' }}
                            />
                            <button
                                onClick={() => saveSectionResponses(section)}
                                disabled={isSaving}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                                    background: savedBy ? '#f0faf3' : C.petrol, color: savedBy ? C.success : '#fff',
                                    border: `1px solid ${savedBy ? C.success : C.petrol}`, borderRadius: '6px',
                                    fontWeight: 700, fontSize: '0.75rem', cursor: isSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                                }}
                            >
                                <Save size={13} />
                                {isSaving ? '...' : savedBy ? '✓' : 'Kaydet'}
                            </button>
                        </div>
                    )}
                </div>

                {savedBy && (
                    <div style={{ padding: '5px 14px', background: '#f0faf3', borderBottom: `1px solid ${C.grey20}`, fontSize: '0.72rem', color: C.success, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCheck size={12} /> {savedBy}
                    </div>
                )}

                {!isCollapsed && section.subSections.map(ss => (
                    <div key={ss.no} style={{ borderTop: `1px solid ${C.grey20}` }}>
                        <div style={{ padding: '7px 14px', background: C.bg, borderBottom: `1px solid ${C.grey20}` }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.grey80 }}>{ss.no} — {ss.title}</span>
                            {ss.columns === 'yapildi' && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: C.success, fontWeight: 600 }}>SON İŞLEMLER</span>}
                        </div>
                        {ss.items.map(item => renderItem(item, ss.columns === 'yapildi'))}
                    </div>
                ))}
            </div>
        );
    }

    // ── Steps ─────────────────────────────────────────────────────────────────
    function renderStepHeader() {
        return (
            <div style={{ padding: '20px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>Araç Bilgileri</h2>
                <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: C.grey60 }}>Araç tipini ve bilgilerini girin</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Araç Tipi *</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {ARAC_TIPLERI.map(t => (
                                <button key={t} onClick={() => { setAracTipi(t); setStep0Error(''); }} style={{
                                    padding: '10px 18px', borderRadius: '8px',
                                    border: `2px solid ${aracTipi === t ? C.petrol : step0Error ? C.error : C.grey20}`,
                                    background: aracTipi === t ? C.petrol : '#fff',
                                    color: aracTipi === t ? '#fff' : C.grey80,
                                    fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                                }}>{t}</button>
                            ))}
                        </div>
                        {step0Error && <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: C.error, fontWeight: 600 }}>{step0Error}</p>}
                    </div>
                    <div><label style={labelStyle}>Şasi No</label><input value={sasiNo} onChange={e => setSasiNo(e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>İş Emri No</label><input value={isEmriNo} onChange={e => setIsEmriNo(e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>BB No</label><input value={bbNo} onChange={e => setBbNo(e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>İmalat No</label><input value={imalatNo} onChange={e => setImalatNo(e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>WA No</label><input value={waNo} onChange={e => setWaNo(e.target.value)} style={inputStyle} /></div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>PDI Sorumlusu</label>
                        <input value={pdiPersonel} onChange={e => setPdiPersonel(e.target.value)} placeholder="PDI'yi başlatan / sorumlu kişi" style={inputStyle} />
                        <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: C.grey60 }}>Her usta, Kontrol Listesi'nde kendi bölümünün yanındaki "Usta adı" alanına adını girerek sadece o bölümü kaydedebilir.</p>
                    </div>
                </div>
            </div>
        );
    }

    function renderStepDiagram() {
        return (
            <div style={{ padding: '20px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>Araç Diyagramı</h2>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: C.grey60 }}>Hatalı noktaları araç üzerine işaretleyin</p>
                <VehicleDiagram pins={pins} onChange={setPins} />
            </div>
        );
    }

    function renderStepChecklist() {
        if (!formData) return <div style={{ padding: '20px', textAlign: 'center', color: C.grey60 }}>Lütfen önce araç tipini seçin.</div>;
        const issues = countIssues();
        return (
            <div style={{ padding: '16px' }}>
                {/* Alt grup legend */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {(Object.entries(ALT_GRUP_COLORS) as [AltGrup, { bg: string; color: string }][]).map(([g, s]) => (
                        <span key={g} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: s.bg, color: s.color }}>{g}</span>
                    ))}
                    <span style={{ fontSize: '0.75rem', color: C.grey60, alignSelf: 'center' }}>— her bölümü kendi ustası doldurur</span>
                </div>

                {issues > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff5f5', border: `1px solid ${C.error}`, borderRadius: '8px', padding: '8px 12px', marginBottom: '12px' }}>
                        <AlertTriangle size={16} color={C.error} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.error }}>{issues} arıza tespit edildi</span>
                    </div>
                )}

                {formData.sections.map(section => renderSection(section))}
            </div>
        );
    }

    function renderStepDynamic() {
        return (
            <div style={{ padding: '20px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>Dinamik Kontrol</h2>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: C.grey60 }}>Yönetim tarafından belirlenen özel kontrol maddeleri</p>
                {dynamicItems.length === 0 ? (
                    <p style={{ color: C.grey60, textAlign: 'center', padding: '30px' }}>Madde tanımlanmamış.</p>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${C.grey20}`, overflow: 'hidden' }}>
                        {dynamicItems.map((item, idx) => {
                            const dr = dynamicResponses[item.id] || { kontrol_edildi: false, aciklama: '' };
                            return (
                                <div key={item.id} style={{ padding: '14px 16px', borderBottom: idx < dynamicItems.length - 1 ? `1px solid ${C.grey20}` : 'none', background: dr.kontrol_edildi ? '#f0faf3' : '#fff' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => setDynamicResponses(p => ({ ...p, [item.id]: { ...dr, kontrol_edildi: !dr.kontrol_edildi } }))}
                                            style={{ width: '28px', height: '28px', minWidth: '28px', border: `2px solid ${dr.kontrol_edildi ? C.success : C.grey20}`, background: dr.kontrol_edildi ? C.success : '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {dr.kontrol_edildi && <CheckCheck size={16} color="#fff" />}
                                        </button>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.9rem' }}>{item.baslik}</p>
                                            {item.aciklama && <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: C.grey60 }}>{item.aciklama}</p>}
                                            <textarea rows={2} value={dr.aciklama} onChange={e => setDynamicResponses(p => ({ ...p, [item.id]: { ...dr, aciklama: e.target.value } }))} placeholder="Açıklama..." style={{ ...inputStyle, resize: 'none', marginTop: '4px' }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    function renderStepFinish() {
        const totalItems = formData ? formData.sections.flatMap(s => s.subSections.flatMap(ss => ss.items)).length : 0;
        const answered = Object.values(responses).filter(r => r.durum).length;
        const issues = countIssues();

        return (
            <div style={{ padding: '20px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>Tamamla & Kaydet</h2>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: C.grey60 }}>Son kontrol ve kayıt</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    {[
                        ['Kontrol Edilen', `${answered}/${totalItems}`, C.black, '#fff'],
                        ['Arıza', String(issues), issues > 0 ? C.error : C.success, issues > 0 ? '#fff5f5' : '#f0faf3'],
                        ['Diyagram Pini', String(pins.length), C.black, '#fff'],
                        ['Dinamik', `${Object.values(dynamicResponses).filter(d => d.kontrol_edildi).length}/${dynamicItems.length}`, C.black, '#fff'],
                    ].map(([label, val, textColor, bg]) => (
                        <div key={label as string} style={{ background: bg as string, border: `1px solid ${C.grey20}`, borderRadius: '10px', padding: '12px' }}>
                            <p style={{ margin: '0 0 2px', fontSize: '0.7rem', color: C.grey60, fontWeight: 700, textTransform: 'uppercase' }}>{label}</p>
                            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: textColor as string }}>{val}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                        <label style={labelStyle}>Akü Üretim Tarihi</label>
                        <input type="date" value={akuTarihi} onChange={e => setAkuTarihi(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' }} />
                    </div>
                    <div>
                        <label style={labelStyle}>Yangın Tüpü Kontrol Tarihi</label>
                        <input type="date" value={yanginTupu} onChange={e => setYanginTupu(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' }} />
                    </div>
                </div>

                <label style={labelStyle}>Genel Açıklamalar</label>
                <textarea rows={3} value={genelAciklamalar} onChange={e => setGenelAciklamalar(e.target.value)} style={{ ...inputStyle, resize: 'none', marginBottom: '16px' }} />

                {issues > 0 && (
                    <div style={{ background: '#fff5f5', border: `1px solid ${C.error}`, borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.85rem', color: C.error }}>Tespit Edilen Arızalar:</p>
                        {Object.entries(responses).filter(([, r]) => r.durum === 'arizali').map(([no, r]) => (
                            <div key={no} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.grey80, minWidth: '38px' }}>{no}</span>
                                <span style={{ fontSize: '0.75rem', color: C.grey100 }}>{r.ariza_tanimi || '—'}</span>
                            </div>
                        ))}
                    </div>
                )}

                {!aracTipi && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff5f5', border: `1px solid ${C.error}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                        <AlertTriangle size={16} color={C.error} />
                        <span style={{ fontSize: '0.82rem', color: C.error, fontWeight: 600 }}>Araç tipi seçilmedi — 1. adıma dönüp araç tipini seçin.</span>
                    </div>
                )}

                <button onClick={saveAll} disabled={saving} style={{ ...btnOutline, marginBottom: '10px' }}>
                    <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Taslak Olarak Kaydet'}
                </button>
                <button onClick={completeForm} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                    <CheckCircle2 size={16} /> {saving ? 'Kaydediliyor...' : 'PDI\'yi Tamamla'}
                </button>
            </div>
        );
    }

    // ── Landing screen ────────────────────────────────────────────────────────
    if (screen === 'landing') {
        return (
            <div style={{ minHeight: '100vh', background: C.bg }}>
                <div style={{ background: C.black, height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="/mercedes-logo.svg" alt="" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>PDI FORM</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none' }}>
                            <ChevronLeft size={14} /> Yönetici
                        </a>
                        <button
                            onClick={() => setScreen('form')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: C.petrol, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                            <Plus size={15} /> Yeni PDI
                        </button>
                    </div>
                </div>

                <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }}>
                    <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '4px' }}>PDI Kontrol Formu</h2>
                    <p style={{ color: C.grey60, fontSize: '0.85rem', marginBottom: '24px' }}>Mevcut bir PDI'ya devam edin veya yeni başlatın.</p>

                    {/* Yükleniyor */}
                    {landingLoading && (
                        <div style={{ textAlign: 'center', padding: '20px', color: C.grey60, fontSize: '0.85rem' }}>
                            Devam eden PDI'lar yükleniyor...
                        </div>
                    )}

                    {/* Continue by sasi no */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: `1px solid ${C.grey20}` }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Devam Eden PDI'ya Katıl</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={lookupSasi} onChange={e => setLookupSasi(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSasiLookup(); }}
                                placeholder="Şasi numarasını girin..."
                                style={{ ...inputStyle, flex: 1 }} />
                            <button onClick={handleSasiLookup} style={{ padding: '10px 16px', background: C.petrol, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Search size={16} /> Ara
                            </button>
                        </div>
                        {lookupError && <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: C.error }}>{lookupError}</p>}
                    </div>

                    {/* Active sessions list */}
                    {activeSessions.length > 0 && (
                        <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${C.grey20}`, overflow: 'hidden', marginBottom: '16px' }}>
                            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.grey20}` }}>
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} color={C.petrol} /> Devam Eden PDI'lar
                                </h3>
                            </div>
                            {activeSessions.map(s => (
                                <button key={s.id} onClick={() => loadSession(s.id)}
                                    style={{ width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', borderBottom: `1px solid ${C.grey20}`, background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                                    <div>
                                        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '0.9rem' }}>{s.arac_tipi} — {s.sasi_no || 'Şasi yok'}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: C.grey60 }}>{s.pdi_personel || 'Personel yok'} · {s.tarih}</p>
                                    </div>
                                    <ChevronRight size={18} color={C.grey60} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* New PDI */}
                    <button
                        onClick={() => setScreen('form')}
                        style={{ width: '100%', padding: '16px', background: C.black, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Plus size={20} /> Yeni PDI Başlat
                    </button>
                </div>
            </div>
        );
    }

    // ── Completed ─────────────────────────────────────────────────────────────
    if (completed) {
        return (
            <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 30px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                    <CheckCircle2 size={50} color={C.success} style={{ marginBottom: '16px' }} />
                    <h2 style={{ margin: '0 0 8px', fontWeight: 800 }}>PDI Tamamlandı!</h2>
                    <p style={{ margin: '0 0 24px', color: C.grey60, fontSize: '0.9rem' }}>{aracTipi} — {sasiNo || '—'} başarıyla kaydedildi.</p>
                    <button onClick={() => { setScreen('landing'); setSessionId(null); setCompleted(false); setResponses({}); setPins([]); setAracTipi(''); setSasiNo(''); }}
                        style={{ padding: '12px 24px', background: C.black, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                        Yeni PDI Başlat
                    </button>
                </div>
            </div>
        );
    }

    // ── Main form ─────────────────────────────────────────────────────────────
    const stepContent = [renderStepHeader, renderStepDiagram, renderStepChecklist, renderStepDynamic, renderStepFinish];

    return (
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
            {/* Error toast */}
            {errorToast && (
                <div style={{ position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: C.error, color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '90vw', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={16} />
                    {errorToast}
                    <button onClick={() => setErrorToast('')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '4px', padding: 0 }}><X size={16} /></button>
                </div>
            )}

            {/* Başarı toast */}
            {saveSuccess && (
                <div style={{ position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: C.success, color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', maxWidth: '90vw', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={16} />
                    Taslak kaydedildi!
                    <button
                        onClick={async () => { setSaveSuccess(false); const r = await axios.get(`${API}/sessions/active`).catch(() => ({ data: [] })); setActiveSessions(r.data as ActiveSession[]); setScreen('landing'); }}
                        style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '6px', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Listeye Dön
                    </button>
                    <button onClick={() => setSaveSuccess(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
                </div>
            )}
            <div style={{ background: C.black, height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={saveAndExit} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', borderRadius: '6px' }} title="PDI listesine dön">
                        <ChevronLeft size={18} color={C.grey60} />
                        <img src="/mercedes-logo.svg" alt="" style={{ height: '26px', filter: 'brightness(0) invert(1)' }} />
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>PDI FORM</span>
                    </button>
                    {aracTipi && <span style={{ color: C.petrol, fontWeight: 700, fontSize: '0.75rem', background: 'rgba(0,103,127,0.25)', padding: '2px 8px', borderRadius: '20px' }}>{aracTipi}</span>}
                    {sessionId && <span style={{ color: C.grey60, fontSize: '0.68rem' }}>#{sessionId}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'rgba(255,255,255,0.08)', color: C.grey60, border: '1px solid rgba(255,255,255,0.15)', borderRadius: '7px', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none' }}>
                        Yönetici
                    </a>
                    <button
                        onClick={saveAndExit}
                        disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', background: saving ? C.grey60 : C.petrol, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                        <Save size={13} /> {saving ? '...' : 'Kaydet ve Çık'}
                    </button>
                </div>
            </div>

            {/* Step tabs */}
            <div style={{ background: '#fff', borderBottom: `1px solid ${C.grey20}`, display: 'flex', overflowX: 'auto' }}>
                {STEPS.map((s, i) => (
                    <button key={s.id} onClick={() => setStep(i)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 14px', whiteSpace: 'nowrap', border: 'none', background: 'none', borderBottom: `3px solid ${step === i ? C.petrol : 'transparent'}`, color: step === i ? C.petrol : C.grey60, fontWeight: step === i ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer' }}>
                        {s.icon}
                        <span>{s.label}</span>
                        {i === 2 && countIssues() > 0 && <span style={{ background: C.error, color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '0.68rem', fontWeight: 700 }}>{countIssues()}</span>}
                    </button>
                ))}
                {/* Step label */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingRight: '14px', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.grey80 }}>{STEPS[step].label}</span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
                {stepContent[step]()}
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${C.grey20}`, padding: '10px 16px', display: 'flex', gap: '10px', boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' }}>
                {step > 0 && (
                    <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: '12px', border: `1.5px solid ${C.grey20}`, borderRadius: '10px', background: '#fff', color: C.grey80, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <ChevronLeft size={16} /> Geri
                    </button>
                )}
                {step < STEPS.length - 1 && (
                    <button
                        onClick={() => {
                            if (step === 0 && !aracTipi) {
                                setStep0Error('Lütfen araç tipini seçin.');
                                return;
                            }
                            setStep0Error('');
                            setStep(step + 1);
                        }}
                        style={{ flex: 2, padding: '12px', border: 'none', borderRadius: '10px', background: C.black, color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        İleri <ChevronRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1.5px solid ${C.grey20}`, fontSize: '0.88rem',
    background: '#fff', color: C.black,
    fontFamily: 'Daimler CS, Inter, -apple-system, sans-serif',
    boxSizing: 'border-box', outline: 'none',
};

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.78rem', fontWeight: 700,
    color: C.grey80, marginBottom: '5px', letterSpacing: '0.3px',
};

const btnOutline: React.CSSProperties = {
    width: '100%', padding: '13px', border: `1.5px solid ${C.petrol}`, borderRadius: '10px',
    background: '#fff', color: C.petrol, fontWeight: 700, fontSize: '0.9rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
};

const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '13px', border: 'none', borderRadius: '10px',
    background: C.black, color: '#fff', fontWeight: 700, fontSize: '0.9rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
};
