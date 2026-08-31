import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import ExportButtons from '../../components/ExportButtons';

const StaffReports = () => {
    const [reports, setReports] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        startDate: '',
        endDate: ''
    });
    const [sortBy, setSortBy] = useState('Date');
    const [selectedReports, setSelectedReports] = useState([]);

    useEffect(() => {
        fetchReports();
    }, [filters]);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            let queryStr = '?';
            if (filters.status) queryStr += `status=${filters.status}&`;
            if (filters.priority) queryStr += `priority=${filters.priority}&`;
            if (filters.startDate) queryStr += `startDate=${filters.startDate}&`;
            if (filters.endDate) queryStr += `endDate=${filters.endDate}&`;

            const { data } = await API.get(`/api/reports${queryStr}`);
            setReports(data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        }
    };

    const handleSelect = (id) => {
        if (selectedReports.includes(id)) {
            setSelectedReports(selectedReports.filter(rId => rId !== id));
        } else {
            setSelectedReports([...selectedReports, id]);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedReports(processedReports.map(r => r._id));
        } else {
            setSelectedReports([]);
        }
    };

    const handleBulkResolve = async () => {
        if (selectedReports.length === 0) return;
        if (!window.confirm(`Are you sure you want to mark ${selectedReports.length} reports as Resolved?`)) return;
        
        try {
            const token = localStorage.getItem('token');
            // Assuming the backend has a way to update sequentially or we map promises
            await Promise.all(selectedReports.map(id => 
                API.put(`/api/reports/${id}`, { status: 'Resolved' })
            ));
            setSelectedReports([]);
            fetchReports();
        } catch (error) {
            console.error("Bulk resolve failed", error);
        }
    };

    // Sorting Logic
    const priorityWeights = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    const statusWeights = { 'Open': 3, 'In Progress': 2, 'Resolved': 1 };

    const processedReports = [...reports].sort((a, b) => {
        if (sortBy === 'Priority') {
            return priorityWeights[b.priority] - priorityWeights[a.priority];
        } else if (sortBy === 'Status') {
            return statusWeights[b.status] - statusWeights[a.status];
        } else {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    const exportColumns = [
        { header: 'Date', key: 'date' },
        { header: 'Customer', key: 'customerName' },
        { header: 'Title', key: 'title' },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' }
    ];

    const formatReportsForExport = (dataToExport) => {
        return dataToExport.map(r => ({
            date: new Date(r.createdAt || r.date).toLocaleDateString(),
            customerName: r.customerName || (r.customerId && r.customerId.name) || 'Unknown',
            title: r.title,
            priority: r.priority,
            status: r.status
        }));
    };

    // Kanban Board Columns
    const openReports = processedReports.filter(r => r.status === 'Open');
    const inProgressReports = processedReports.filter(r => r.status === 'In Progress');
    const resolvedReports = processedReports.filter(r => r.status === 'Resolved');

    const renderCard = (r) => (
        <div key={r._id} className="glass-card" style={{ marginBottom: '1rem', padding: '1.2rem', transition: 'all 0.2s', borderLeft: r.priority === 'Critical' ? '4px solid #ef4444' : r.priority==='High'?'4px solid #f59e0b':'none', position: 'relative' }}>
            {viewMode === 'list' && (
                <input 
                    type="checkbox" 
                    checked={selectedReports.includes(r._id)} 
                    onChange={() => handleSelect(r._id)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', cursor: 'pointer', transform: 'scale(1.2)' }}
                />
            )}
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap', paddingRight: '2rem' }}>
                <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                    backgroundColor: r.priority === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : 
                                    r.priority === 'High' ? 'rgba(245, 158, 11, 0.2)' :
                                    r.priority === 'Medium' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: r.priority === 'Critical' ? '#ef4444' : 
                            r.priority === 'High' ? '#f59e0b' :
                            r.priority === 'Medium' ? '#3b82f6' : '#10b981'
                }}>{r.priority}</span>
                <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                    backgroundColor: r.status === 'Resolved' ? 'rgba(16, 185, 129, 0.2)' : 
                                    r.status === 'In Progress' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: r.status === 'Resolved' ? '#10b981' : 
                            r.status === 'In Progress' ? '#3b82f6' : '#f59e0b'
                }}>{r.status}</span>
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{r.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>{r.description.length > 80 ? r.description.substring(0, 80) + '...' : r.description}</p>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span><strong>Customer:</strong> {r.customerName || (r.customerId && r.customerId.name) || 'Unknown'}</span>
                    <span>🕒 {new Date(r.createdAt || r.date).toLocaleDateString()}</span>
                </div>
                {r.assignedTo && <div style={{ marginTop: '0.3rem' }}><strong>Assigned:</strong> {r.assignedTo}</div>}
                {r.status === 'Resolved' && <div style={{ color: '#10b981', marginTop: '0.3rem' }}>✓ Resolved</div>}
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar title="📊 Reports Portfolio" />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Track and resolve customer tickets.</p>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem', display: 'flex' }}>
                            <button onClick={() => setViewMode('list')} style={{ padding: '0.5rem 1rem', background: viewMode==='list'?'rgba(99,102,241,0.2)':'transparent', color: viewMode==='list'?'#818cf8':'var(--text-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: viewMode==='list'?'bold':'normal' }}>List View</button>
                            <button onClick={() => setViewMode('kanban')} style={{ padding: '0.5rem 1rem', background: viewMode==='kanban'?'rgba(99,102,241,0.2)':'transparent', color: viewMode==='kanban'?'#818cf8':'var(--text-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: viewMode==='kanban'?'bold':'normal' }}>Kanban</button>
                        </div>
                        <Link to="/staff/add-report" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', textDecoration: 'none' }}>+ Add New</Link>
                    </div>
                </div>

                <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
                    <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ minWidth: '130px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', flex: 1 }}>
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                    </select>

                    <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})} style={{ minWidth: '130px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', flex: 1 }}>
                        <option value="">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 2 }}>
                        <span style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>Sort By:</span>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px' }}>
                            <option value="Date">Newest First</option>
                            <option value="Priority">Highest Priority</option>
                            <option value="Status">Resolution Status</option>
                        </select>
                    </div>
                </div>

                {viewMode === 'list' && selectedReports.length > 0 && (
                    <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        <span style={{ fontWeight: 'bold', color: '#818cf8' }}>{selectedReports.length} Reports Selected</span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={handleBulkResolve} className="btn" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>✓ Mark Resolved</button>
                            <ExportButtons data={formatReportsForExport(processedReports.filter(r => selectedReports.includes(r._id)))} columns={exportColumns} filename="selected_reports" />
                        </div>
                    </div>
                )}

                {viewMode === 'list' && (
                    <div style={{ marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', width: 'fit-content' }}>
                            <input type="checkbox" onChange={handleSelectAll} checked={selectedReports.length === processedReports.length && processedReports.length > 0} />
                            Select All
                        </label>
                    </div>
                )}

                {viewMode === 'kanban' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                        {/* Open Column */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                OPEN <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{openReports.length}</span>
                            </h2>
                            <div>{openReports.map(renderCard)}</div>
                        </div>
                        {/* In Progress Column */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                IN PROGRESS <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{inProgressReports.length}</span>
                            </h2>
                            <div>{inProgressReports.map(renderCard)}</div>
                        </div>
                        {/* Resolved Column */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                RESOLVED <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{resolvedReports.length}</span>
                            </h2>
                            <div>{resolvedReports.map(renderCard)}</div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {processedReports.map(renderCard)}
                        {processedReports.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '3rem', opacity: '0.5', marginBottom: '1rem' }}>📋</div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Reports Found</h3>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your filters or create a new report.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffReports;
