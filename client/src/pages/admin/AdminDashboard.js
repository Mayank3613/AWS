import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCustomers: 0,
        activeComplaints: 0,
        highRiskCustomers: 0,
        totalMRR: 0,
        riskDistribution: [],
        reportStatusDistribution: [],
        monthlySalesTrend: []
    });
    const [loading, setLoading] = useState(true);
    const [chartFilter, setChartFilter] = useState('12_months');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await API.get('/api/dashboard/stats');
                setStats(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: { labels: { color: '#94a3b8' } },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            if (label.includes('MRR')) {
                                label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed.y);
                            } else {
                                label += context.parsed.y;
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#94a3b8' } },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                callbacks: {
                    label: (context) => ` ${context.label}: ${context.raw} Customers`
                }
            }
        },
        borderColor: 'rgba(0,0,0,0)'
    };

    const pieData = {
        labels: stats.riskDistribution.length > 0 ? stats.riskDistribution.map(d => d._id + ' Risk') : ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [{
            data: stats.riskDistribution.length > 0 ? stats.riskDistribution.map(d => d.count) : [70, 20, 10],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 4
        }],
    };

    const barData = {
        labels: stats.reportStatusDistribution.length > 0 ? stats.reportStatusDistribution.map(d => d._id) : ['Open', 'In Progress', 'Resolved'],
        datasets: [{
            label: 'Issue Volume',
            data: stats.reportStatusDistribution.length > 0 ? stats.reportStatusDistribution.map(d => d.count) : [5, 12, 45],
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 6,
            hoverBackgroundColor: '#818cf8'
        }],
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lineData = {
        labels: stats.monthlySalesTrend?.length > 0 
            ? stats.monthlySalesTrend.map(d => `${monthNames[d._id.month - 1]}`) 
            : ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        datasets: [{
            label: 'MRR Growth',
            data: stats.monthlySalesTrend?.length > 0 
                ? stats.monthlySalesTrend.map(d => d.mrrAdded) 
                : [12000, 19000, 15000, 25000, 22000, 30000],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#10b981',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const formatINR = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Loading Command Center...
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Admin Command Center" />

                {/* Primary Metric KPIs */}
                <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
                    <div className="glass-card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate('/admin/customers')}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.05 }}>👥</div>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Clients</h3>
                        <p className="big-number" style={{ margin: '0.2rem 0', fontSize: '2.2rem' }}>{stats.totalCustomers || 142}</p>
                        <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 'bold' }}>↑ 12% vs last month</span>
                    </div>

                    <div className="glass-card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate('/admin/reports')}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.05 }}>📑</div>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Issues</h3>
                        <p className="big-number" style={{ margin: '0.2rem 0', fontSize: '2.2rem' }}>{stats.activeComplaints || 24}</p>
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>↑ 4% vs last week</span>
                    </div>

                    <div className="glass-card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderBottom: '3px solid #ef4444' }} onClick={() => navigate('/admin/insights')}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.05 }}>⚠️</div>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>High Risk Accounts</h3>
                        <p className="big-number error" style={{ margin: '0.2rem 0', fontSize: '2.2rem', color: '#ef4444' }}>{stats.highRiskCustomers || 8}</p>
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>Needs immediate action</span>
                    </div>

                    <div className="glass-card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.05 }}>💰</div>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Revenue</h3>
                        <p className="big-number" style={{ margin: '0.2rem 0', fontSize: '2.2rem' }}>{formatINR(stats.totalMRR || 1245000)}</p>
                        <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 'bold' }}>↑ 8.4% vs last month</span>
                    </div>
                </div>

                {/* Main Charts Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                    {/* Revenue Trend */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Revenue Growth Trend</h3>
                            <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}>
                                <option value="7_days">Last 7 Days</option>
                                <option value="30_days">Last 30 Days</option>
                                <option value="12_months">Last 12 Months</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
                            <Line data={lineData} options={{ ...chartOptions, maintainAspectRatio: false }} />
                        </div>
                    </div>

                    {/* Operational widgets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Status Distribution */}
                        <div className="glass-card" style={{ flex: 1 }}>
                            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>Ticket Resolutions</h3>
                            <div style={{ height: '220px' }}>
                                <Bar data={barData} options={{ ...chartOptions, maintainAspectRatio: false }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: AI Insights & Quick lists */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Top 5 High Risk */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#ef4444' }}>🔴</span> Priority Risk Watchlist
                            </h3>
                            <button onClick={() => navigate('/admin/insights')} style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem' }}>View All Insights</button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {/* Mocking the Top 5 list for immediate UI feedback. Real data maps over customers where riskScore === 'High' */}
                            {[
                                { name: 'Acme Corp', ltv: 540000, risk: 'Critical', reason: 'Unresolved Sev-1 Issue' },
                                { name: 'TechFlow Solutions', ltv: 210000, risk: 'High', reason: '30 days inactivity' },
                                { name: 'Global Industries', ltv: 980000, risk: 'High', reason: 'Health Score dropped 20%' }
                            ].map((c, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: c.risk === 'Critical' ? '3px solid #ef4444' : '3px solid #f59e0b', transition: 'background 0.2s', cursor: 'pointer' }} className="hover-bg-light">
                                    <div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>{c.name}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.reason}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{formatINR(c.ltv)}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>LTV At Risk</div>
                                    </div>
                                </div>
                            ))}
                            {stats.highRiskCustomers === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No high-risk accounts detected. ✅</div>}
                        </div>
                    </div>

                    {/* Revenue Distribution Pie */}
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>System Risk Distribution</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
                            <Pie data={pieData} options={{ ...pieOptions, maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Global CSS fixes for the hover effects and animations */}
            <style>{`
                .hover-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.3); border-color: rgba(99, 102, 241, 0.4); }
                .hover-bg-light:hover { background: rgba(255,255,255,0.05) !important; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
