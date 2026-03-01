import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    TrendingUp,
    AlertCircle,
    BusFront,
    CheckCircle2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const host = window.location.hostname;
const ADMIN_API = `http://${host}:8000/api/admin`;

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${ADMIN_API}/stats`)
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>İstatistikler yükleniyor...</div>;

    const summaryCards = [
        { title: 'Toplam PDI Yapılan Araç', value: stats?.total_vehicles || 0, icon: <BusFront size={24} />, color: '#000' },
        { title: 'Toplam Kayıtlı Hata', value: stats?.total_errors || 0, icon: <AlertCircle size={24} />, color: '#ef4444' },
        { title: 'Ortalama Hata / Araç', value: (stats?.total_errors / stats?.total_vehicles || 0).toFixed(2), icon: <TrendingUp size={24} />, color: '#3b82f6' },
        { title: 'Aktif Durum', value: 'Sistem Aktif', icon: <CheckCircle2 size={24} />, color: '#22c55e' },
    ];

    const pieData = Object.entries(stats?.breakdown || {}).map(([name, value]) => ({ name, value }));
    const COLORS = ['#000', '#333', '#666', '#999'];

    return (
        <div>
            <h1 style={{ marginBottom: '25px', fontWeight: 800 }}>Admin Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {summaryCards.map((card) => (
                    <div key={card.title} style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ color: card.color }}>{card.icon}</div>
                        <div>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{card.title}</p>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{card.value}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' }}>
                {/* CHART 1 */}
                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px' }}>Araç Tipi Dağılımı</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {pieData.map((item, index) => (
                            <div key={item.name as string} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: COLORS[index % COLORS.length], display: 'inline-block' }} />
                                <span>{item.name}: {String(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHART 2 Placeholder */}
                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px' }}>Aylık PDI Trendi (Örnek)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pieData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#000" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
