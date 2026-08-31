import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api';
import Sidebar from '../components/Sidebar';

const CustomerProfile = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [reports, setReports] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    
    // New interaction state
    const [newLog, setNewLog] = useState({ type: 'Note', notes: '', rating: 5 });

    useEffect(() => {
        fetchCustomerData();
    }, [id]);

    const fetchCustomerData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [custRes, repRes, intRes] = await Promise.all([
                API.get(`/api/customers/${id}`),
                API.get(`/api/reports?customerId=${id}`),
                API.get(`/api/interactions/${id}`)
            ]);

            setCustomer(custRes.data);
            setReports(repRes.data);
            setInteractions(intRes.data);

            // Attempt to fetch audit logs securely
            try {
                const auditRes = await API.get('/api/audit');
                // Filter audit logs mapping to this customer (since details contain names)
                const relevantAudits = auditRes.data.filter(log => log.details.includes(custRes.data.name));
                setAuditLogs(relevantAudits);
            } catch (auditErr) {
                console.log("No audit access or no audit logs found for this user context.");
            }

        } catch (error) {
            console.error("Failed to fetch customer profile data", error);
        }
    };

    const handleAddInteraction = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await API.post(`/api/interactions/${id}`, newLog);
            setNewLog({ type: 'Note', notes: '', rating: 5 });
            fetchCustomerData(); // refresh logs
        } catch (error) {
            console.error("Failed to add interaction", error);
        }
    };

    if (!customer) return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content"><h2>Loading Profile...</h2></div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>{customer.name}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{customer.email} • {customer.contact}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${customer.segment.toLowerCase()}-priority`}>{customer.segment}</span>
                        <span className={`badge ${customer.riskScore.toLowerCase()}-priority`} style={{ marginLeft: '10px' }}>Risk: {customer.riskScore}</span>
                    </div>
                </header>

                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="glass-card">
                        <h3>Health Score</h3>
                        <p className="big-number" style={{ color: customer.healthScore > 70 ? 'var(--success)' : 'var(--danger)' }}>{customer.healthScore}</p>
                    </div>
                    <div className="glass-card">
                        <h3>Customer Lifetime Value</h3>
                        <p className="big-number">₹{customer.clv}</p>
                    </div>
                    <div className="glass-card">
                        <h3>Pending Payments</h3>
                        <p className="big-number" style={{ color: customer.pendingPayments > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>₹{customer.pendingPayments}</p>
                    </div>
                </div>

                <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                    {/* Left Column: Interaction Logs & Audit Trail */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>💬</span> Interaction History
                            </h3>
                            
                            <form onSubmit={handleAddInteraction} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Log New Interaction</h4>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <select value={newLog.type} onChange={e => setNewLog({ ...newLog, type: e.target.value })} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(15,23,42,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}>
                                        <option>Call</option>
                                        <option>Email</option>
                                        <option>Complaint</option>
                                        <option>Meeting</option>
                                        <option>Note</option>
                                    </select>
                                    <input type="number" min="1" max="5" value={newLog.rating} onChange={e => setNewLog({ ...newLog, rating: e.target.value })} placeholder="Rating 1-5" style={{ width: '100px', padding: '0.8rem', borderRadius: '8px', background: 'rgba(15,23,42,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
                                </div>
                                <textarea value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} placeholder="Type your observation or discussion points here..." style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'rgba(15,23,42,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem', minHeight: '100px', resize: 'vertical', outline: 'none' }} required />
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 'bold', width: '100%' }}>Save Interaction Log</button>
                            </form>

                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                                {interactions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No interactions logged yet. Be the first to add a note!</p>
                                    </div>
                                ) : interactions.map(log => (
                                    <div key={log._id} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                            <strong style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{log.type}</strong>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', lineHeight: '1.5' }}>{log.notes}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#fbbf24', letterSpacing: '2px' }}>{'★'.repeat(log.rating)}{'☆'.repeat(5 - log.rating)}</span> 
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>By: {log.userId?.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>🛡️</span> Customer Audit Trail
                            </h3>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {auditLogs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No administrative actions recorded for this customer.</p>
                                    </div>
                                ) : auditLogs.map(log => (
                                    <div key={log._id} style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                            <strong style={{ color: '#e0e7ff', fontSize: '0.9rem' }}>{log.action}</strong>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{log.details}</p>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Authorized by: {log.userId?.name || 'System'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Reports */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>📋</span> Ticket & Report History
                        </h3>
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                            {reports.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginTop: '1rem' }}>
                                    <div style={{ fontSize: '3rem', opacity: '0.5', marginBottom: '1rem' }}>📥</div>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Perfect Record</h4>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No reports or complaints have been filed for this client.</p>
                                </div>
                            ) : reports.map(r => (
                                <div key={r._id} style={{ padding: '1.2rem', marginBottom: '1rem', background: 'rgba(15,23,42,0.5)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{r.title}</strong>
                                        <span className={`badge ${r.status.toLowerCase().replace(' ', '-')}`}>{r.status}</span>
                                    </div>
                                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{r.description}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Priority: <strong style={{color: r.priority==='Critical'?'#ef4444':r.priority==='High'?'#f59e0b':'inherit'}}>{r.priority}</strong></span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: {r._id.toString().substring(18)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;
