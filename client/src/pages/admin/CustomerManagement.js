import { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';

const CustomerManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({
        name: '', email: '', contact: '',
        ltv: '', mrr: '', healthScore: '', segment: 'Standard', riskScore: 'Low', status: 'Active'
    });
    const [editMode, setEditMode] = useState(false);
    const [currentEditId, setCurrentEditId] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    // Filters and Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRisk, setFilterRisk] = useState('');
    const [filterSegment, setFilterSegment] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await API.get('/api/customers');
            setCustomers(data);
        } catch (error) {
            console.error("Failed to fetch customers", error);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Name is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
        if (!/^\+?[\d\s-]{10,}$/.test(formData.contact)) errors.contact = "Invalid phone number";
        if (formData.healthScore !== '' && (formData.healthScore < 0 || formData.healthScore > 100)) errors.healthScore = "0-100 only";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const token = localStorage.getItem('token');
        const payload = {
            ...formData,
            healthScore: Number(formData.healthScore) || 100,
            mrr: Number(formData.mrr) || 0,
            ltv: Number(formData.ltv) || 0,
            clv: Number(formData.mrr) ? Number(formData.mrr) * 24 : 0 // auto-calc CLV approx
        };

        try {
            if (editMode && currentEditId) {
                await API.put(`/api/customers/${currentEditId}`, payload);
                setEditMode(false);
                setCurrentEditId(null);
            } else {
                await API.post('/api/customers', payload);
            }
            fetchCustomers();
            resetForm();
        } catch (error) {
            console.error("Save failed", error);
            alert("Save failed. " + (error.response?.data?.message || ''));
        }
    };

    const handleEditClick = (customer) => {
        setEditMode(true);
        setCurrentEditId(customer._id);
        setFormData({
            name: customer.name,
            email: customer.email,
            contact: customer.contact,
            ltv: customer.ltv || '',
            mrr: customer.mrr || '',
            healthScore: customer.healthScore || 100,
            segment: customer.segment || 'Standard',
            riskScore: customer.riskScore || 'Low',
            status: customer.status || 'Active'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this client? They will no longer be considered 'Active' but history will be preserved.")) return;
        const token = localStorage.getItem('token');
        try {
            await API.put(`/api/customers/${id}`, { status: 'Inactive' });
            fetchCustomers();
        } catch (error) {
            console.error("Deactivation failed", error);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', contact: '', ltv: '', mrr: '', healthScore: '', segment: 'Standard', riskScore: 'Low', status: 'Active' });
        setFormErrors({});
        setEditMode(false);
        setCurrentEditId(null);
    };

    const formatINR = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getHealthLabel = (score) => {
        if (score >= 80) return { label: 'Good', color: '#22c55e' };
        if (score >= 50) return { label: 'Moderate', color: '#f59e0b' };
        return { label: 'Poor', color: '#ef4444' };
    };

    const processedCustomers = useMemo(() => {
        let result = customers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus ? c.status === filterStatus : true;
            const matchesRisk = filterRisk ? c.riskScore === filterRisk : true;
            const matchesSegment = filterSegment ? c.segment === filterSegment : true;
            return matchesSearch && matchesStatus && matchesRisk && matchesSegment;
        });

        result.sort((a, b) => {
            let valA = a[sortConfig.key] || 0;
            let valB = b[sortConfig.key] || 0;
            
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [customers, searchTerm, filterStatus, filterRisk, filterSegment, sortConfig]);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar title="👥 Customer Directory" />

                {/* Form Registration Block */}
                <div className="glass-card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>
                            {editMode ? '⚙️ Edit Client Profile' : '➕ Add New Client Profile'}
                            {editMode && <span style={{ marginLeft: '15px', background: '#f59e0b', color: '#000', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '4px', verticalAlign: 'middle' }}>EDIT MODE ACTIVE</span>}
                        </h3>
                        {editMode && <button onClick={resetForm} className="btn btn-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>Discard Changes</button>}
                    </div>

                    <form onSubmit={handleCreateOrUpdate} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                        gap: '1.5rem', 
                        alignItems: 'start',
                        border: editMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                        padding: editMode ? '1.5rem' : '0',
                        borderRadius: '12px',
                        background: editMode ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                        transition: 'all 0.3s ease'
                    }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Client Name *</label>
                            <input
                                placeholder="e.g. Acme Corp"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{ borderColor: formErrors.name ? '#ef4444' : '' }}
                            />
                            {formErrors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email Address *</label>
                            <input
                                placeholder="billing@acme.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{ borderColor: formErrors.email ? '#ef4444' : '' }}
                            />
                            {formErrors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.email}</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Contact Number *</label>
                            <input
                                placeholder="+91 9876543210"
                                value={formData.contact}
                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                style={{ borderColor: formErrors.contact ? '#ef4444' : '' }}
                            />
                            {formErrors.contact && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.contact}</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Monthly Recurring (MRR)</label>
                            <input
                                type="number"
                                placeholder="Amount in ₹"
                                value={formData.mrr}
                                onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Historical Value (LTV)</label>
                            <input
                                type="number"
                                placeholder="Amount in ₹"
                                value={formData.ltv}
                                onChange={(e) => setFormData({ ...formData, ltv: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Health Score (0-100)</label>
                            <input
                                type="number"
                                placeholder="e.g. 85"
                                value={formData.healthScore}
                                onChange={(e) => setFormData({ ...formData, healthScore: e.target.value })}
                                style={{ borderColor: formErrors.healthScore ? '#ef4444' : '' }}
                            />
                            {formErrors.healthScore && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.healthScore}</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Client Segment</label>
                            <select value={formData.segment} onChange={(e) => setFormData({ ...formData, segment: e.target.value })}>
                                <option value="Standard">Standard</option>
                                <option value="Premium">Premium</option>
                                <option value="VIP">VIP</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Risk Assessment</label>
                            <select value={formData.riskScore} onChange={(e) => setFormData({ ...formData, riskScore: e.target.value })}>
                                <option value="Low">Low Risk</option>
                                <option value="Medium">Medium Risk</option>
                                <option value="High">High Risk</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Account Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.8rem 2rem' }}>
                                {editMode ? '💾 Save Changes' : '+ Register Client'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Filters Row */}
                <div className="glass-card" style={{ marginBottom: '1rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input 
                            type="text" 
                            placeholder="Search by Name or Email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ margin: 0, minWidth: '150px' }}>
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                    <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ margin: 0, minWidth: '150px' }}>
                        <option value="">All Risks</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                    <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)} style={{ margin: 0, minWidth: '150px' }}>
                        <option value="">All Segments</option>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="VIP">VIP</option>
                    </select>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginLeft: 'auto' }}>
                        {processedCustomers.length} result(s)
                    </span>
                </div>

                {/* Data Table */}
                <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => requestSort('name')}>
                                    CLIENT {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>STATUS</th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => requestSort('healthScore')}>
                                    SYSTEM HEALTH {sortConfig.key === 'healthScore' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => requestSort('mrr')}>
                                    FINANCIALS {sortConfig.key === 'mrr' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedCustomers.map((c) => {
                                const health = getHealthLabel(c.healthScore || 100);
                                return (
                                    <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: currentEditId === c._id ? 'rgba(99, 102, 241, 0.1)' : 'transparent', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                                                {c.name} <span className={`badge ${c.segment?.toLowerCase()}-priority`} style={{marginLeft: '10px'}}>{c.segment}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.3rem 0' }}>{c.email} • {c.contact}</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: c.riskScore === 'High' ? 'var(--danger)' : c.riskScore === 'Medium' ? 'var(--warning)' : 'var(--success)' }}>
                                                Risk Assessment: {c.riskScore}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase',
                                                background: c.status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : c.status === 'On Hold' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: c.status === 'Active' ? '#22c55e' : c.status === 'On Hold' ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {c.status || 'Active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold', color: health.color }}>{health.label}</span>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.healthScore || 100}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${c.healthScore || 100}%`, height: '100%', background: health.color, transition: 'width 0.3s' }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>MRR: {formatINR(c.mrr || 0)}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LTV: {formatINR(c.ltv || 0)}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>CLV: {formatINR(c.clv || 0)}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <Link to={`/customer/${c._id}`} className="btn btn-sm" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem' }}>View Details</Link>
                                                <button onClick={() => handleEditClick(c)} className="btn btn-sm" style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>Edit</button>
                                                {c.status !== 'Inactive' && (
                                                    <button onClick={() => handleDeactivate(c._id)} className="btn btn-sm" style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>Deactivate</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {processedCustomers.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No client profiles match your filter criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerManagement;
