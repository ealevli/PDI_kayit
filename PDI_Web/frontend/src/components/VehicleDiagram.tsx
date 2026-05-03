import React, { useState, useRef } from 'react';
import { MapPin, X, Camera, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export type DiagramView = 'on' | 'arka' | 'sol' | 'sag';

export interface VehiclePin {
    id?: number;
    tempId?: string;
    view: DiagramView;
    x_percent: string;
    y_percent: string;
    aciklama: string;
    fotograf_yolu?: string;
    photoFile?: File;
}

interface Props {
    sessionId?: number;
    pins: VehiclePin[];
    onChange: (pins: VehiclePin[]) => void;
    readonly?: boolean;
}

const VIEWS: { key: DiagramView; label: string }[] = [
    { key: 'on', label: 'Ön' },
    { key: 'sol', label: 'Sol' },
    { key: 'sag', label: 'Sağ' },
    { key: 'arka', label: 'Arka' },
];

// Inline SVG views for each side of the bus
function BusSVG({ view }: { view: DiagramView }) {
    const style: React.CSSProperties = { width: '100%', height: '100%' };

    if (view === 'on') return (
        <svg viewBox="0 0 400 220" style={style} xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="30" width="320" height="160" rx="18" fill="#e8e8e8" stroke="#555" strokeWidth="2.5" />
            {/* windshield */}
            <rect x="70" y="45" width="260" height="95" rx="10" fill="#b8d4e8" stroke="#555" strokeWidth="1.5" />
            {/* wiper area */}
            <line x1="120" y1="140" x2="200" y2="100" stroke="#555" strokeWidth="1.5" />
            <line x1="280" y1="140" x2="200" y2="100" stroke="#555" strokeWidth="1.5" />
            {/* headlights */}
            <ellipse cx="80" cy="165" rx="28" ry="16" fill="#fffacd" stroke="#888" strokeWidth="1.5" />
            <ellipse cx="320" cy="165" rx="28" ry="16" fill="#fffacd" stroke="#888" strokeWidth="1.5" />
            {/* grille */}
            <rect x="150" y="155" width="100" height="22" rx="4" fill="#ccc" stroke="#888" strokeWidth="1" />
            <line x1="175" y1="155" x2="175" y2="177" stroke="#999" strokeWidth="1" />
            <line x1="200" y1="155" x2="200" y2="177" stroke="#999" strokeWidth="1" />
            <line x1="225" y1="155" x2="225" y2="177" stroke="#999" strokeWidth="1" />
            {/* bumper */}
            <rect x="40" y="178" width="320" height="12" rx="4" fill="#bbb" stroke="#888" strokeWidth="1" />
            {/* logo area */}
            <circle cx="200" cy="35" r="10" fill="#aaa" stroke="#555" strokeWidth="1" />
            <text x="200" y="212" textAnchor="middle" fontSize="12" fill="#666" fontFamily="sans-serif">ÖN</text>
        </svg>
    );

    if (view === 'arka') return (
        <svg viewBox="0 0 400 220" style={style} xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="30" width="320" height="160" rx="18" fill="#e8e8e8" stroke="#555" strokeWidth="2.5" />
            {/* rear window */}
            <rect x="120" y="45" width="160" height="70" rx="8" fill="#b8d4e8" stroke="#555" strokeWidth="1.5" />
            {/* tail lights */}
            <rect x="45" y="145" width="55" height="30" rx="5" fill="#ffcccc" stroke="#888" strokeWidth="1.5" />
            <rect x="300" y="145" width="55" height="30" rx="5" fill="#ffcccc" stroke="#888" strokeWidth="1.5" />
            {/* exhaust */}
            <ellipse cx="340" cy="185" rx="12" ry="6" fill="#bbb" stroke="#888" strokeWidth="1" />
            {/* bumper */}
            <rect x="40" y="178" width="320" height="12" rx="4" fill="#bbb" stroke="#888" strokeWidth="1" />
            {/* engine access */}
            <rect x="150" y="130" width="100" height="35" rx="4" fill="#d0d0d0" stroke="#888" strokeWidth="1" />
            <text x="200" y="212" textAnchor="middle" fontSize="12" fill="#666" fontFamily="sans-serif">ARKA</text>
        </svg>
    );

    if (view === 'sol') return (
        <svg viewBox="0 0 600 220" style={style} xmlns="http://www.w3.org/2000/svg">
            {/* bus body */}
            <rect x="20" y="35" width="560" height="150" rx="14" fill="#e8e8e8" stroke="#555" strokeWidth="2.5" />
            {/* roof line */}
            <rect x="20" y="35" width="560" height="18" rx="8" fill="#d0d0d0" stroke="#555" strokeWidth="1.5" />
            {/* windows row */}
            <rect x="40" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="115" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="190" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="265" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="340" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="415" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="490" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            {/* door */}
            <rect x="100" y="120" width="55" height="65" rx="4" fill="#d0e8d0" stroke="#666" strokeWidth="1.5" />
            <line x1="127" y1="120" x2="127" y2="185" stroke="#999" strokeWidth="1" />
            {/* wheels */}
            <circle cx="110" cy="195" r="22" fill="#555" stroke="#333" strokeWidth="2" />
            <circle cx="110" cy="195" r="12" fill="#888" />
            <circle cx="450" cy="195" r="22" fill="#555" stroke="#333" strokeWidth="2" />
            <circle cx="450" cy="195" r="12" fill="#888" />
            <circle cx="510" cy="195" r="22" fill="#555" stroke="#333" strokeWidth="2" />
            <circle cx="510" cy="195" r="12" fill="#888" />
            <text x="300" y="215" textAnchor="middle" fontSize="12" fill="#666" fontFamily="sans-serif">SOL TARAF</text>
        </svg>
    );

    // sag (right side)
    return (
        <svg viewBox="0 0 600 220" style={style} xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="35" width="560" height="150" rx="14" fill="#e8e8e8" stroke="#555" strokeWidth="2.5" />
            <rect x="20" y="35" width="560" height="18" rx="8" fill="#d0d0d0" stroke="#555" strokeWidth="1.5" />
            {/* windows row */}
            <rect x="40" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="115" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="190" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="265" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="340" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="415" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            <rect x="490" y="60" width="60" height="50" rx="5" fill="#b8d4e8" stroke="#666" strokeWidth="1.5" />
            {/* service hatches */}
            <rect x="60" y="125" width="70" height="40" rx="4" fill="#e0d8c8" stroke="#888" strokeWidth="1.5" />
            <rect x="160" y="125" width="70" height="40" rx="4" fill="#e0d8c8" stroke="#888" strokeWidth="1.5" />
            <rect x="350" y="125" width="70" height="40" rx="4" fill="#e0d8c8" stroke="#888" strokeWidth="1.5" />
            <rect x="450" y="125" width="70" height="40" rx="4" fill="#e0d8c8" stroke="#888" strokeWidth="1.5" />
            {/* wheels */}
            <circle cx="110" cy="195" r="22" fill="#555" stroke="#333" strokeWidth="2" />
            <circle cx="110" cy="195" r="12" fill="#888" />
            <circle cx="450" cy="195" r="22" fill="#555" stroke="#333" strokeWidth="2" />
            <circle cx="450" cy="195" r="12" fill="#888" />
            <circle cx="510" cy="195" r="22" fill="#555" stroke="#333" strokeWidth="2" />
            <circle cx="510" cy="195" r="12" fill="#888" />
            <text x="300" y="215" textAnchor="middle" fontSize="12" fill="#666" fontFamily="sans-serif">SAĞ TARAF</text>
        </svg>
    );
}

let tempIdCounter = 0;
function newTempId() { return `tmp_${++tempIdCounter}`; }

export default function VehicleDiagram({ pins, onChange, readonly = false }: Props) {
    const [activeView, setActiveView] = useState<DiagramView>('sol');
    const [selectedPin, setSelectedPin] = useState<string | null>(null);
    const [editingPin, setEditingPin] = useState<VehiclePin | null>(null);
    const diagramRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const viewPins = pins.filter(p => p.view === activeView);

    function handleDiagramClick(e: React.MouseEvent<HTMLDivElement>) {
        if (readonly) return;
        const rect = diagramRef.current!.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const newPin: VehiclePin = {
            tempId: newTempId(),
            view: activeView,
            x_percent: x.toFixed(1),
            y_percent: y.toFixed(1),
            aciklama: '',
        };
        setEditingPin(newPin);
        setSelectedPin(null);
    }

    function handlePinClick(e: React.MouseEvent, pin: VehiclePin) {
        e.stopPropagation();
        const key = pin.id?.toString() || pin.tempId || '';
        setSelectedPin(selectedPin === key ? null : key);
    }

    function savePin() {
        if (!editingPin) return;
        const exists = editingPin.id !== undefined || pins.some(p => p.tempId === editingPin.tempId);
        if (exists) {
            onChange(pins.map(p =>
                (p.id && p.id === editingPin.id) || (p.tempId && p.tempId === editingPin.tempId)
                    ? editingPin : p
            ));
        } else {
            onChange([...pins, editingPin]);
        }
        setEditingPin(null);
    }

    function deletePin(pin: VehiclePin) {
        onChange(pins.filter(p =>
            !(p.id && p.id === pin.id) && !(p.tempId && p.tempId === pin.tempId)
        ));
        setSelectedPin(null);
    }

    function editPin(pin: VehiclePin) {
        setEditingPin({ ...pin });
        setSelectedPin(null);
    }

    function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !editingPin) return;
        setEditingPin({ ...editingPin, photoFile: file });
    }

    const viewIdx = VIEWS.findIndex(v => v.key === activeView);

    return (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {/* View tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                {VIEWS.map((v) => (
                    <button
                        key={v.key}
                        onClick={() => { setActiveView(v.key); setSelectedPin(null); }}
                        style={{
                            flex: 1,
                            padding: '10px 8px',
                            border: 'none',
                            background: activeView === v.key ? '#000' : 'transparent',
                            color: activeView === v.key ? '#fff' : '#6b7280',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            letterSpacing: '0.5px',
                            transition: 'all 0.15s',
                        }}
                    >
                        {v.label}
                        {pins.filter(p => p.view === v.key).length > 0 && (
                            <span style={{
                                marginLeft: '6px', background: '#e80000', color: '#fff',
                                borderRadius: '10px', padding: '1px 6px', fontSize: '0.72rem'
                            }}>
                                {pins.filter(p => p.view === v.key).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Diagram canvas */}
            <div style={{ position: 'relative', padding: '12px', background: '#f8f9fa' }}>
                {!readonly && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginBottom: '8px' }}>
                        Hata konumunu işaretlemek için diyagram üzerine dokunun
                    </div>
                )}
                <div
                    ref={diagramRef}
                    onClick={handleDiagramClick}
                    style={{
                        position: 'relative',
                        cursor: readonly ? 'default' : 'crosshair',
                        userSelect: 'none',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                    }}
                >
                    <BusSVG view={activeView} />

                    {/* Pins */}
                    {viewPins.map((pin) => {
                        const key = pin.id?.toString() || pin.tempId || '';
                        const isSelected = selectedPin === key;
                        return (
                            <div
                                key={key}
                                onClick={(e) => handlePinClick(e, pin)}
                                style={{
                                    position: 'absolute',
                                    left: `${pin.x_percent}%`,
                                    top: `${pin.y_percent}%`,
                                    transform: 'translate(-50%, -100%)',
                                    cursor: 'pointer',
                                    zIndex: 10,
                                }}
                            >
                                <div style={{
                                    background: isSelected ? '#e80000' : '#00677f',
                                    borderRadius: '50% 50% 50% 0',
                                    width: '28px', height: '28px',
                                    transform: 'rotate(-45deg)',
                                    border: '2px solid #fff',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <MapPin size={14} color="#fff" style={{ transform: 'rotate(45deg)' }} />
                                </div>

                                {/* Tooltip */}
                                {isSelected && (
                                    <div
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                            position: 'absolute', bottom: '36px', left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: '#fff', borderRadius: '8px', padding: '10px',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                                            minWidth: '180px', zIndex: 20,
                                            border: '1px solid #e5e7eb',
                                        }}
                                    >
                                        {pin.aciklama && (
                                            <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: '#374151' }}>{pin.aciklama}</p>
                                        )}
                                        {pin.fotograf_yolu && (
                                            <img
                                                src={`http://${window.location.hostname}:8000/static/photos/form/${pin.fotograf_yolu.split('/').pop()}`}
                                                alt="pin photo"
                                                style={{ width: '100%', borderRadius: '4px', marginBottom: '6px' }}
                                            />
                                        )}
                                        {!readonly && (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={() => editPin(pin)}
                                                    style={{ flex: 1, padding: '5px', background: '#00677f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem' }}
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => deletePin(pin)}
                                                    style={{ padding: '5px 8px', background: '#fee2e2', color: '#e80000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Navigation arrows (mobile-friendly) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <button
                        onClick={() => setActiveView(VIEWS[(viewIdx - 1 + VIEWS.length) % VIEWS.length].key)}
                        style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#374151' }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', alignSelf: 'center' }}>
                        {pins.length} pin toplam
                    </span>
                    <button
                        onClick={() => setActiveView(VIEWS[(viewIdx + 1) % VIEWS.length].key)}
                        style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#374151' }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Edit modal */}
            {editingPin && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    zIndex: 1000, display: 'flex', alignItems: 'flex-end',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '16px 16px 0 0', width: '100%',
                        padding: '20px', maxHeight: '80vh', overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>
                                {(editingPin.id || editingPin.tempId) && pins.some(p =>
                                    (p.id && p.id === editingPin.id) || (p.tempId && p.tempId === editingPin.tempId)
                                ) ? 'Pin Düzenle' : 'Yeni Hata Pini'}
                            </h3>
                            <button onClick={() => setEditingPin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} color="#666" />
                            </button>
                        </div>

                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                            Açıklama
                        </label>
                        <textarea
                            value={editingPin.aciklama}
                            onChange={e => setEditingPin({ ...editingPin, aciklama: e.target.value })}
                            rows={3}
                            placeholder="Hata açıklaması giriniz..."
                            style={{
                                width: '100%', padding: '10px', borderRadius: '8px',
                                border: '1px solid #d1d5db', fontSize: '0.9rem',
                                resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                            }}
                        />

                        <div style={{ marginTop: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                                Fotoğraf
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={handlePhotoSelect}
                            />
                            {editingPin.photoFile ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={URL.createObjectURL(editingPin.photoFile)}
                                        alt="preview"
                                        style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                                    />
                                    <button
                                        onClick={() => setEditingPin({ ...editingPin, photoFile: undefined })}
                                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e80000', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <X size={12} color="#fff" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 16px', border: '1.5px dashed #d1d5db',
                                        borderRadius: '8px', background: '#f9fafb', cursor: 'pointer',
                                        color: '#6b7280', fontSize: '0.85rem', fontWeight: 600,
                                    }}
                                >
                                    <Camera size={18} />
                                    Fotoğraf Ekle / Çek
                                </button>
                            )}
                        </div>

                        <button
                            onClick={savePin}
                            style={{
                                marginTop: '16px', width: '100%', padding: '13px',
                                background: '#000', color: '#fff', border: 'none',
                                borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                            }}
                        >
                            Kaydet
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden file input ref */}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoSelect} />
        </div>
    );
}
