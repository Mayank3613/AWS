import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';

const CustomerList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const querySearch = new URLSearchParams(location.search).get('search');
    
    const [customers, setCustomers] = useState([]);
    const [reports, setReports] = useState([]);
    const [searchQuery, setSearchQuery] = useState(querySearch || '');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    
    // Filters
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterRisk, setFilterRisk] = useState('All');
    const [filterSegment, setFilterSegment] = useState('All');

    const [showModal, setShowModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '', email: '', contact: '', status: 'Active'
    });

    useEffect(() => {
        if (querySearch) {
            setSearchQuery(querySearch);
        }
    }, [querySearch]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [custRes, repRes] = await Promise.all([
                API.get('/api/customers'),
                API.get('/api/reports')
            ]);
            setCustomers(custRes.data);
            setReports(repRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await API.post('/api/customers', newCustomer);
            setShowModal(false);
            setNewCustomer({ name: '', email: '', contact: '', status: 'Active' });
            fetchData();
        } catch (error) {
            console.error('Failed to create customer', error);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              c.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
        const matchesRisk = filterRisk === 'All' || c.riskScore === filterRisk;
        const matchesSegment = filterSegment === 'All' || c.segment === filterSegment;
        
        return matchesSearch && matchesStatus && matchesRisk && matchesSegment;
    });

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar title="👥 My Customers" />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>View and manage your assigned client portfolio.</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem', display: 'flex' }}>
                            <button onClick={() => setViewMode('grid')} style={{ padding: '0.5rem 1rem', background: viewMode==='grid'?'rgba(99,102,241,0.2)':'transparent', color: viewMode==='grid'?'#818cf8':'var(--text-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: viewMode==='grid'?'bold':'normal' }}>Grid</button>
                            <button onClick={() => setViewMode('table')} style={{ padding: '0.5rem 1rem', background: viewMode==='table'?'rgba(99,102,241,0.2)':'transparent', color: viewMode==='table'?'#818cf8':'var(--text-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: viewMode==='table'?'bold':'normal' }}>Table</button>
                        </div>
                        <button className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 1.5rem', borderRadius: '8px' }} onClick={() => setShowModal(true)}>+ Add Customer</button>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="glass-card" style={{ marginBottom: '2rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input 
                        type="text" 
                        placeholder="Search customers by name, email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 2, minWidth: '250px', padding: '0.8rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                    />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '0.8rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Banned">Banned</option>
                    </select>
                    <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '0.8rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                        <option value="All">All Risks</option>
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                    </select>
                    <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '0.8rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                        <option value="All">All Types</option>
                        <option value="Regular">Regular</option>
                        <option value="VIP">VIP</option>
                    </select>
                </div>

                {filteredCustomers.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '3rem', opacity: '0.5', marginBottom: '1rem' }}>📂</div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>No Customers Found</h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your search or filters.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {filteredCustomers.map((c) => {
                            const custReports = reports.filter(r => r.customerId === c._id);
                            const totalReports = custReports.length;

                            return (
                            <div key={c._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{c.name}</h3>
                                    <span style={{ background: c.segment === 'VIP' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)', color: c.segment === 'VIP' ? '#f59e0b' : '#818cf8', fontWeight: 'bold', padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{c.segment}</span>
                                </div>
                                
                                <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span>📧</span> {c.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span>📞</span> {c.contact}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                                <span className={`status-dot ${c.status.toLowerCase()}`}></span> <strong style={{color:'var(--text-primary)'}}>{c.status}</strong>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Risk Level</div>
                                            <strong style={{ color: c.riskScore === 'High' ? '#ef4444' : c.riskScore === 'Medium' ? '#f59e0b' : '#10b981', fontSize: '0.9rem' }}>{c.riskScore}</strong>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Reports</div>
                                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{totalReports}</strong>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>LTV Revenue</div>
                                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>₹{c.ltv ? c.ltv.toLocaleString('en-IN') : '0'}</strong>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                    <Link to={`/customer/${c._id}`} className="btn btn-sm" style={{ flex: 1, textAlign: 'center', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', textDecoration: 'none', padding: '0.6rem 0', borderRadius: '6px', fontWeight: 'bold' }}>Details</Link>
                                    <Link to={`/staff/add-report`} state={{ customerId: c._id }} className="btn btn-sm" style={{ flex: 1, textAlign: 'center', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', textDecoration: 'none', padding: '0.6rem 0', borderRadius: '6px', fontWeight: 'bold' }}>+ Report</Link>
                                    <a href={`mailto:${c.email}`} className="btn btn-sm" style={{ flex: 1, textAlign: 'center', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', textDecoration: 'none', padding: '0.6rem 0', borderRadius: '6px', fontWeight: 'bold' }}>Follow-up</a>
                                </div>
                            </div>
                        )})}
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>CLIENT INFO</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>STATUS & RISK</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>FINANCIALS</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>TICKETS</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(c => {
                                    const custReports = reports.filter(r => r.customerId === c._id);
                                    return (
                                    <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-row">
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                                            <span style={{ display: 'inline-block', marginTop: '6px', background: c.segment === 'VIP' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)', color: c.segment === 'VIP' ? '#f59e0b' : '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.65rem', textTransform: 'uppercase' }}>{c.segment}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem' }}>
                                                <span className={`status-dot ${c.status.toLowerCase()}`}></span> {c.status}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: c.riskScore === 'High' ? '#ef4444' : c.riskScore === 'Medium' ? '#f59e0b' : '#10b981' }}>
                                                Risk: <strong>{c.riskScore}</strong>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>LTV: <strong style={{color:'var(--text-primary)'}}>₹{c.ltv ? c.ltv.toLocaleString('en-IN') : '0'}</strong></div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CLV: <strong style={{color:'var(--text-primary)'}}>₹{c.clv ? c.clv.toLocaleString('en-IN') : '0'}</strong></div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                                            {custReports.length} Reports
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <Link to={`/customer/${c._id}`} className="btn btn-sm" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }}>Details</Link>
                                                <Link to={`/staff/add-report`} state={{ customerId: c._id }} className="btn btn-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }}>+ Report</Link>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content glass-card">
                            <h2>Add New Customer</h2>
                            <form onSubmit={handleCreateCustomer}>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Contact Info</label>
                                    <input type="text" value={newCustomer.contact} onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={newCustomer.status} onChange={e => setNewCustomer({ ...newCustomer, status: e.target.value })}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Banned">Banned</option>
                                    </select>
                                </div>
                                <div className="action-buttons" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', flex: 1 }}>Save Customer</button>
                                    <button type="button" className="btn" style={{ width: 'auto', flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerList;
