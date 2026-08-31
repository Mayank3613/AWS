import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    
    // Collapsible state
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sidebar_collapsed');
        if (stored === 'true') setCollapsed(true);
    }, []);

    const toggleSidebar = () => {
        const newVal = !collapsed;
        setCollapsed(newVal);
        localStorage.setItem('sidebar_collapsed', newVal);
    };

    const sidebarWidth = collapsed ? '80px' : '240px';

    const getLinkStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0.75rem' : '0.75rem 1rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? '0' : '10px',
        color: location.pathname === path || location.pathname.startsWith(path + '/') 
            ? 'var(--accent-primary)' 
            : 'var(--text-secondary)',
        background: location.pathname === path || location.pathname.startsWith(path + '/')
            ? 'rgba(99, 102, 241, 0.1)'
            : 'transparent',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: location.pathname === path || location.pathname.startsWith(path + '/')
            ? '1px solid rgba(99, 102, 241, 0.3)'
            : '1px solid transparent',
        fontWeight: location.pathname === path || location.pathname.startsWith(path + '/') ? 'bold' : 'normal'
    });

    return (
        <>
            <style>{`
                .main-content { 
                    margin-left: ${collapsed ? '120px' : '280px'} !important; 
                    transition: margin-left 0.3s ease; 
                }
            `}</style>
            <div className="sidebar glass-panel" style={{
                width: sidebarWidth,
                height: '92vh',
                position: 'fixed',
                left: '20px',
                top: '20px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                transition: 'width 0.3s ease'
            }}>
            <div className="sidebar-header" style={{ padding: collapsed ? '1.5rem 0' : '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: collapsed ? 'center' : 'left', position: 'relative' }}>
                <h2 style={{ color: 'var(--accent-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>💠</span> {!collapsed && "MMS"}
                </h2>
                {!collapsed && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {user?.name?.split(' ')[0]} <span style={{ opacity: 0.5 }}>| {user?.role}</span>
                    </p>
                )}

                <button onClick={toggleSidebar} style={{
                    position: 'absolute',
                    right: collapsed ? '50%' : '-15px',
                    transform: collapsed ? 'translateX(50%)' : 'none',
                    bottom: collapsed ? '-15px' : 'auto',
                    top: collapsed ? 'auto' : '50%',
                    marginTop: collapsed ? '0' : '-15px',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 101,
                    transition: 'all 0.2s'
                }}>
                    {collapsed ? '▶' : '◀'}
                </button>
            </div>

            <ul className="sidebar-menu" style={{ listStyle: 'none', padding: collapsed ? '1rem 0.5rem' : '1rem', flex: 1, margin: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                {(user?.role === 'admin' || user?.role === 'manager') ? (
                    <>
                        <li style={{ marginBottom: '0.5rem' }}><Link title="Dashboard" to="/admin" style={getLinkStyle('/admin')}><span>📊</span> {!collapsed && "Dashboard"}</Link></li>
                        <li style={{ marginBottom: '0.5rem' }}><Link title="Customers" to="/admin/customers" style={getLinkStyle('/admin/customers')}><span>👥</span> {!collapsed && "Customers"}</Link></li>
                        <li style={{ marginBottom: '0.5rem' }}><Link title="Reports" to="/admin/reports" style={getLinkStyle('/admin/reports')}><span>📑</span> {!collapsed && <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><span>Reports</span><span className="badge" style={{background:'#ef4444', color:'white', padding:'0.1rem 0.5rem', borderRadius:'10px', fontSize:'0.7rem', fontWeight:'bold'}}>12</span></div>}</Link></li>
                        <li style={{ marginBottom: '0.5rem' }}><Link title="AI Insights" to="/admin/insights" style={getLinkStyle('/admin/insights')}><span>✨</span> {!collapsed && <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><span>AI Insights</span><span className="badge" style={{background:'#f59e0b', color:'white', padding:'0.1rem 0.5rem', borderRadius:'10px', fontSize:'0.7rem', fontWeight:'bold'}}>4</span></div>}</Link></li>
                        {user.role === 'admin' && (
                            <li style={{ marginBottom: '0.5rem' }}><Link title="Audit Logs" to="/admin/audit" style={getLinkStyle('/admin/audit')}><span>🛡️</span> {!collapsed && "Audit Logs"}</Link></li>
                        )}
                    </>
                ) : (
                    <>
                        <li style={{ marginBottom: '0.5rem' }}><Link title="Dashboard" to="/staff" style={getLinkStyle('/staff')}><span>📊</span> {!collapsed && "Dashboard"}</Link></li>
                        <li style={{ marginBottom: '0.5rem' }}><Link title="My Customers" to="/staff/customers" style={getLinkStyle('/staff/customers')}><span>👥</span> {!collapsed && "My Customers"}</Link></li>
                        <li style={{ marginBottom: '0.5rem' }}><Link title="Reports" to="/staff/reports" style={getLinkStyle('/staff/reports')}><span>📑</span> {!collapsed && "Reports"}</Link></li>

                    </>
                )}
            </ul>

            <div style={{ padding: collapsed ? '1rem 0.5rem' : '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <li style={{ listStyle: 'none', marginBottom: '0.5rem' }}>
                    <Link title="Profile" to="/profile" style={getLinkStyle('/profile')}>
                        <span>👤</span> {!collapsed && "Account Settings"}
                    </Link>
                </li>
                <button title="Logout" onClick={logout} className="btn-logout" style={{
                    width: '100%',
                    padding: collapsed ? '0.75rem 0' : '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: collapsed ? '0' : '0.5rem',
                    transition: 'all 0.2s'
                }}>
                    <span>🚪</span> {!collapsed && "Logout"}
                </button>
            </div>
        </div>
        </>
    );
};

export default Sidebar;
