import React, { useState } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, BarChart3, PieChart, BarChart2, Award,
    Settings as SettingsIcon, LogOut, Menu, X, BusFront, PlusCircle, Users, TableProperties,
    ClipboardList, ListChecks, SlidersHorizontal
} from 'lucide-react';

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const navGroups = [
        {
            title: '',
            items: [
                { name: 'ÖZET PANEL', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
            ]
        },
        {
            title: 'RAPORLAR',
            items: [
                { name: 'TRV & TOU RAPOR', path: '/admin/reports', icon: <BarChart3 size={18} /> },
                { name: 'CONECTO RAPOR', path: '/admin/conecto', icon: <PieChart size={18} /> },
                { name: 'TOP 5 ANALİZ', path: '/admin/top5', icon: <BarChart2 size={18} /> },
                { name: 'CONECTO TOP 3', path: '/admin/conecto-top3', icon: <Award size={18} /> },
            ]
        },
        {
            title: 'KAYIT İŞLEMLERİ',
            items: [
                { name: 'KAYIT LİSTESİ', path: '/admin/records', icon: <TableProperties size={18} /> },
                { name: 'YENİ KAYIT', path: '/mechanic', icon: <PlusCircle size={18} /> },
            ]
        },
        {
            title: 'İMALAT TAKİP',
            items: [
                { name: 'İMALAT LİSTESİ', path: '/admin/imalat?tab=list', icon: <ClipboardList size={18} /> },
                { name: 'İMALAT RAPORLARI', path: '/admin/imalat-rapor', icon: <BarChart3 size={18} /> },
            ]
        },
        {
            title: 'PDI FORM',
            items: [
                { name: 'FORM OTURUMLARI', path: '/admin/pdi-sessions', icon: <ListChecks size={18} /> },
                { name: 'DİNAMİK FORM', path: '/admin/dinamik-form', icon: <SlidersHorizontal size={18} /> },
                { name: 'USTA FORMU AÇ', path: '/usta', icon: <PlusCircle size={18} /> },
            ]
        },
        {
            title: 'YÖNETİM',
            items: [
                { name: 'KULLANICILAR', path: '/admin/kullanicilar', icon: <Users size={18} /> },
                { name: 'SİSTEM AYARLARI', path: '/admin/settings', icon: <SettingsIcon size={18} /> },
            ]
        }
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* SIDEBAR (On the left) */}
            <div style={{
                width: isSidebarOpen ? '280px' : '80px',
                backgroundColor: '#111827', // Deeper, more modern dark background
                color: '#fff',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                left: 0,
                height: '100vh',
                zIndex: 100,
                boxShadow: '2px 0 15px rgba(0,0,0,0.15)'
            }}>
                <div style={{ padding: '20px 25px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', borderBottom: '1px solid #1f2937' }}>
                    {isSidebarOpen && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BusFront size={20} color="#9ca3af" />
                            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '1px', color: '#fff' }}>PDI DIGITAL</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav style={{ flex: 1, padding: '15px 15px', overflowY: 'auto' }}>
                    {navGroups.map((group) => (
                        <div key={group.title || group.items[0]?.path} style={{ marginBottom: group.title ? '20px' : '5px' }}>
                            {isSidebarOpen && group.title && (
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: '#6b7280',
                                    marginBottom: '10px',
                                    paddingLeft: '15px',
                                    letterSpacing: '1px'
                                }}>
                                    {group.title}
                                </div>
                            )}

                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    target={item.path === '/mechanic' ? '_blank' : '_self'}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        padding: '10px 15px',
                                        color: isActive && item.path !== '/mechanic' ? '#fff' : '#9ca3af',
                                        textDecoration: 'none',
                                        borderRadius: '6px',
                                        backgroundColor: isActive && item.path !== '/mechanic' ? '#1f2937' : 'transparent',
                                        marginBottom: '2px',
                                        justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                                        transition: 'all 0.2s',
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: '0.85rem'
                                    })}
                                >
                                    {item.icon}
                                    {isSidebarOpen && <span>{item.name}</span>}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #1f2937' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '12px',
                            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                            fontWeight: 600,
                            borderRadius: '6px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <LogOut size={18} />
                        {isSidebarOpen && <span>Çıkış Yap</span>}
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{
                flex: 1,
                marginLeft: isSidebarOpen ? '280px' : '80px',
                transition: 'margin-left 0.3s ease',
            }}>
                {/* Mercedes-Benz Corporate Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#000',
                    padding: '0 30px',
                    height: '56px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}>
                    {/* Left: Mercedes logo + brand name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                            src="/mercedes-logo.svg"
                            alt="Mercedes-Benz"
                            style={{ height: '38px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                        />
                        <div style={{
                            color: '#fff',
                            fontSize: '1.25rem',
                            fontFamily: '"Times New Roman", Times, Georgia, serif',
                            fontWeight: 400,
                            letterSpacing: '0.02em'
                        }}>
                            Mercedes-Benz Türk
                        </div>
                    </div>
                </div>
                {/* Sub-header: org info + date */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    padding: '6px 30px',
                    borderBottom: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.5px' }}>
                        MERKEZ ATÖLYE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', lineHeight: 1.2 }}>MBT Genel Müdürlük</div>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>İSTANBUL, TR</div>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>
                            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                        </div>
                    </div>
                </div>
                <div style={{ padding: '30px' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
