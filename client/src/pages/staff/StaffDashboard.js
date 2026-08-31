import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const StaffDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        customers: [],
        reports: [],
        audit: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [customersRes, reportsRes] = await Promise.all([
                    API.get('/api/customers'),
                    API.get('/api/reports')
                ]);

                setData({
                    customers: customersRes.data,
                    reports: reportsRes.data,
                    audit: reportsRes.data.slice(0, 5).map(r => ({
                        _id: r._id,
                        action: r.status === 'Resolved' ? 'Resolved Report' : 'Report Filed',
                        details: `${r.title} — ${r.customerName || 'Unknown'}`,
                        createdAt: r.createdAt
                    }))
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching staff dashboard data", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <h2>Loading Analytics Dashboard...</h2>
            </div>
        </div>
    );

    const { customers, reports, audit } = data;

    // Metrics
    const today = new Date().toDateString();
    const reportsToday = reports.filter(r => new Date(r.createdAt || r.date).toDateString() === today).length;
    const overdueCustomers = customers.filter(c => c.riskScore === 'High' || c.status === 'Inactive').length; // Mock overdue logic based on high risk

    // Calculate Avg Resolution Time (mock assuming updated properties, normally uses resolvedAt - createdAt)
    const resolvedReports = reports.filter(r => r.status === 'Resolved');
    const avgResolutionTime = resolvedReports.length > 0 ? "2.4 Days" : "N/A"; 

    // Charts Logic: Last 7 days reports
    const dates = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    const reportCountsByDate = dates.map(dateStr => {
        return reports.filter(r => new Date(r.createdAt || r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === dateStr).length;
    });

    const lineChartData = {
        labels: dates,
        datasets: [{
            label: 'Reports Filed',
            data: reportCountsByDate,
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.2)',
            fill: true,
            tension: 0.3
        }]
    };

    const lineChartOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#e2e8f0' } },
            title: { display: true, text: 'Reports Last 7 Days', color: '#e2e8f0' }
        },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    };

    // Customer Status Pie
    const activeC = customers.filter(c => c.status === 'Active').length;
    const inactiveC = customers.filter(c => c.status === 'Inactive').length;
    const bannedC = customers.filter(c => c.status === 'Banned').length;

    const pieChartData = {
        labels: ['Active', 'Inactive', 'Critical/Banned'],
        datasets: [{
            data: [activeC, inactiveC, bannedC],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    };

    // Priority Alerts
    const criticalReports = reports.filter(r => r.priority === 'Critical' && r.status !== 'Resolved');
    const highRiskCustomers = customers.filter(c => c.riskScore === 'High');

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar title="📊 Analytics Dashboard" />

                {/* Metric Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <Link to="/staff/reports" className="glass-card" style={{ textDecoration: 'none', display: 'block', transition: 'all 0.2s', borderLeft: '4px solid #818cf8' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Reports Today</h3>
                        <p className="big-number" style={{ color: 'var(--text-primary)' }}>{reportsToday}</p>
                        <span style={{ color: '#818cf8', fontSize: '0.85rem' }}>View latest tickets ➔</span>
                    </Link>

                    <Link to="/staff/customers" className="glass-card" style={{ textDecoration: 'none', display: 'block', transition: 'all 0.2s', borderLeft: '4px solid #ef4444' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Overdue Customers</h3>
                        <p className="big-number" style={{ color: '#ef4444' }}>{overdueCustomers}</p>
                        <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Requires immediate follow-up ➔</span>
                    </Link>

                    <Link to="/staff/reports" className="glass-card" style={{ textDecoration: 'none', display: 'block', transition: 'all 0.2s', borderLeft: '4px solid #10b981' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Avg Resolution Time</h3>
                        <p className="big-number" style={{ color: '#10b981', fontSize: '2rem' }}>{avgResolutionTime}</p>
                        <span style={{ color: '#10b981', fontSize: '0.85rem' }}>View metrics ➔</span>
                    </Link>
                </div>

                {/* Charts Area */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', height: '350px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1 }}>
                            <Line data={lineChartData} options={lineChartOptions} height={null} width={null} />
                        </div>
                    </div>
                    
                    <div className="glass-card" style={{ padding: '1.5rem', height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', alignSelf: 'flex-start' }}>Customer Distribution</h3>
                        <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                            <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0' } } } }} />
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Feed and Alerts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {/* Activity Feed */}
                    <div className="glass-card">
                        <h3 style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>⚡</span> Recent Activity Feed
                        </h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingTop: '1rem' }}>
                            {audit.length === 0 ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No recent activity to display.</p> : audit.slice(0, 5).map(log => (
                                <div key={log._id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ color: '#818cf8', fontSize: '0.9rem' }}>{log.action}</strong>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* High Priority Alerts */}
                    <div className="glass-card">
                        <h3 style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#ef4444' }}>🚨</span> High Priority Alerts
                        </h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingTop: '1rem' }}>
                            {criticalReports.length === 0 && highRiskCustomers.length === 0 ? (
                                <p style={{ color: '#10b981', textAlign: 'center', padding: '2rem 0' }}>All clear! No critical alerts currently.</p>
                            ) : (
                                <>
                                    {criticalReports.map(r => (
                                        <div key={r._id} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #ef4444' }}>
                                            <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.3rem' }}>Critical Report: {r.title}</strong>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{r.description}</span>
                                        </div>
                                    ))}
                                    {highRiskCustomers.map(c => (
                                        <div key={c._id} style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #f59e0b' }}>
                                            <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '0.3rem' }}>High Risk Customer: {c.name}</strong>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Significant churn risk. Immediate follow-up recommended.</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StaffDashboard;
