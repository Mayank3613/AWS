import { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import ExportButtons from '../../components/ExportButtons';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [filters, setFilters] = useState({ status: '', priority: '', startDate: '', endDate: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    
    // Bulk Selection & Modal State
    const [selectedReports, setSelectedReports] = useState([]);
    const [selectedReportForModal, setSelectedReportForModal] = useState(null);

    useEffect(() => {
        fetchReports();
    }, [filters]);

    const fetchReports = async () => {
        const token = localStorage.getItem('token');
        let queryStr = '?';
        if (filters.status) queryStr += `status=${filters.status}&`;
        if (filters.priority) queryStr += `priority=${filters.priority}&`;
        if (filters.startDate) queryStr += `startDate=${filters.startDate}&`;
        if (filters.endDate) queryStr += `endDate=${filters.endDate}&`;

        try {
            const { data } = await API.get(`/api/reports${queryStr}`);
            setReports(data);
        } catch (error) {
            console.error(error);
        }
    };

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const priorityWeights = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    const statusWeights = { 'Open': 1, 'In Progress': 2, 'Resolved': 3 };

    const processedReports = useMemo(() => {
        let sorted = [...reports];
        sorted.sort((a, b) => {
            if (sortConfig.key === 'priority') {
                return sortConfig.direction === 'asc' 
                    ? priorityWeights[a.priority] - priorityWeights[b.priority]
                    : priorityWeights[b.priority] - priorityWeights[a.priority];
            }
            if (sortConfig.key === 'status') {
                return sortConfig.direction === 'asc' 
                    ? statusWeights[a.status] - statusWeights[b.status]
                    : statusWeights[b.status] - statusWeights[a.status];
            }
            // default 'createdAt'
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        });
        return sorted;
    }, [reports, sortConfig]);

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedReports(processedReports.map(r => r._id));
        else setSelectedReports([]);
    };

    const handleSelectRow = (e, id) => {
        e.stopPropagation(); // prevent modal opening
        if (e.target.checked) setSelectedReports([...selectedReports, id]);
        else setSelectedReports(selectedReports.filter(rId => rId !== id));
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        if (!selectedReports.length) return;
        if (!window.confirm(`Update ${selectedReports.length} reports to '${newStatus}'?`)) return;

        const token = localStorage.getItem('token');
        try {
            await Promise.all(selectedReports.map(id => 
                API.put(`/api/reports/${id}`, { status: newStatus })
            ));
            fetchReports();
            setSelectedReports([]);
        } catch (error) {
            console.error("Bulk update failed", error);
        }
    };

    const handleSingleStatusUpdate = async (id, newStatus) => {
        const token = localStorage.getItem('token');
        try {
            await API.put(`/api/reports/${id}`, { status: newStatus });
            fetchReports();
            setSelectedReportForModal(null);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const priorityIcons = { 'Critical': '🔴', 'High': '🟠', 'Medium': '🟡', 'Low': '🟢' };

    const isOverdue = (createdAt, status) => {
        if (status === 'Resolved') return false;
        const diffHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        return diffHours > 48; // 48h SLA
    };

    const exportColumns = [
        { header: 'Date', key: 'date' },
        { header: 'Customer', key: 'customerName' },
        { header: 'Title', key: 'title' },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' }
    ];

    const formatReportsForExport = (dataToExport) => {
        return dataToExport.map(r => ({
            date: new Date(r.createdAt).toLocaleDateString(),
            customerName: r.customerName || (r.customerId?.name) || 'Unknown',
            title: r.title,
            priority: r.priority,
            status: r.status
        }));
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar title="📑 Complaint Reports Tracker" />

                {/* Filters Row */}
                <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', padding: '1.2rem' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Resolution Status</label>
                        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '6px' }}>
                            <option value="">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Priority Level</label>
                        <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '6px' }}>
                            <option value="">All Priorities</option>
                            <option value="Critical">🔴 Critical</option>
                            <option value="High">🟠 High</option>
                            <option value="Medium">🟡 Medium</option>
                            <option value="Low">🟢 Low</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Start Date</label>
                        <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '6px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>End Date</label>
                        <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '6px' }} />
                    </div>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedReports.length > 0 ? (
                    <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        <span style={{ fontWeight: 'bold', color: '#818cf8', fontSize: '1.1rem' }}>{selectedReports.length} Ticket(s) Selected</span>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Update Status:</span>
                            <button onClick={() => handleBulkStatusUpdate('In Progress')} className="btn btn-sm" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Set In Progress</button>
                            <button onClick={() => handleBulkStatusUpdate('Resolved')} className="btn btn-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Set Resolved</button>
                            <ExportButtons data={formatReportsForExport(processedReports.filter(r => selectedReports.includes(r._id)))} columns={exportColumns} filename="bulk_export_reports" />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <ExportButtons data={formatReportsForExport(processedReports)} columns={exportColumns} filename="admin_all_reports" />
                    </div>
                )}

                {/* Reports Data Table */}
                <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                                <th style={{ padding: '1.2rem 1rem', width: '50px' }}>
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedReports.length === processedReports.length && processedReports.length > 0} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                                </th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => requestSort('createdAt')}>
                                    LOGGED DATE {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>CLIENT / REPORTER</th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>ISSUE TITLE</th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => requestSort('priority')}>
                                    PRIORITY {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => requestSort('status')}>
                                    STATE {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedReports.map((r) => {
                                const overdue = isOverdue(r.createdAt, r.status);
                                return (
                                    <tr 
                                        key={r._id} 
                                        onClick={() => setSelectedReportForModal(r)}
                                        style={{ 
                                            borderBottom: '1px solid rgba(255,255,255,0.05)', 
                                            background: selectedReports.includes(r._id) ? 'rgba(99, 102, 241, 0.1)' : overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        className="hover-bg-light"
                                    >
                                        <td style={{ padding: '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedReports.includes(r._id)} onChange={(e) => handleSelectRow(e, r._id)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {new Date(r.createdAt).toLocaleString()}
                                            {overdue && <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px', animation: 'pulse 2s infinite' }}>⚠️ SLA Overdue</div>}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {r.customerName || (r.customerId?.name) || 'Unknown'}
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>ID: {r.customerId ? String(r.customerId._id).substring(0, 8) : 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                                            <div style={{ fontWeight: '500' }}>{r.title}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: r.priority === 'Critical' ? '#ef4444' : r.priority === 'High' ? '#f97316' : 'var(--text-secondary)' }}>
                                                {priorityIcons[r.priority] || ''} {r.priority}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase',
                                                background: r.status === 'Resolved' ? 'rgba(34, 197, 94, 0.2)' : r.status === 'In Progress' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                color: r.status === 'Resolved' ? '#22c55e' : r.status === 'In Progress' ? '#3b82f6' : '#f59e0b'
                                            }}>
                                                {r.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {processedReports.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No reports match the current filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Modal View */}
            {selectedReportForModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedReportForModal(null)}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '0', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{priorityIcons[selectedReportForModal.priority]} {selectedReportForModal.title}</h2>
                            <button onClick={() => setSelectedReportForModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Client</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedReportForModal.customerName}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Logged Date</div>
                                    <div style={{ fontWeight: 'bold' }}>{new Date(selectedReportForModal.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Description Summary</h4>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {selectedReportForModal.description || 'No description provided.'}
                            </p>
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Current Status: <strong style={{ color: 'var(--text-primary)' }}>{selectedReportForModal.status}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {selectedReportForModal.status === 'Open' && (
                                        <button onClick={() => handleSingleStatusUpdate(selectedReportForModal._id, 'In Progress')} className="btn btn-sm" style={{ background: '#f59e0b', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Set In Progress</button>
                                    )}
                                    {selectedReportForModal.status !== 'Resolved' && (
                                        <button onClick={() => handleSingleStatusUpdate(selectedReportForModal._id, 'Resolved')} className="btn btn-sm" style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Mark Resolved ✓</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .hover-bg-light:hover { background: rgba(255,255,255,0.05) !important; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default Reports;
