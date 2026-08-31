import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';

const AddReport = () => {
    const location = useLocation();
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({
        customerId: location.state?.customerId || '',
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Open'
    });
    const navigate = useNavigate();

    const reportTemplates = [
        { name: "Billing Issue", title: "Incorrect Charge / Billing Discrepancy", desc: "Customer reported an unexpected charge on their last invoice. Needs immediate review.", priority: "High" },
        { name: "Technical Support", title: "Platform Log-in Failure", desc: "Customer is unable to log into the dashboard. Tried resetting password but error persists.", priority: "High" },
        { name: "Account Inquiry", title: "Upgrade Plan Inquiry", desc: "Customer interested in upgrading to the Enterprise tier. Wants to know pricing differences.", priority: "Medium" },
        { name: "Complaint", title: "Service Downtime Complaint", desc: "Customer experienced significant latency/downtime yesterday resulting in lost work.", priority: "Critical" }
    ];

    const applyTemplate = (e) => {
        const t = reportTemplates.find(temp => temp.name === e.target.value);
        if (t) {
            setFormData(prev => ({ ...prev, title: t.title, description: t.desc, priority: t.priority }));
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const token = localStorage.getItem('token');
        const { data } = await API.get('/api/customers');
        setCustomers(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const selectedCustomer = customers.find(c => c._id === formData.customerId);

        await API.post('/api/reports', {
            ...formData,
            customerName: selectedCustomer.name
        });

        alert("Report submitted successfully!");
        navigate('/staff');
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Topbar title="📝 Create New Report" />
                
                <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
                    <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Submit a Ticket</h2>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <label style={{ color: '#818cf8', fontWeight: 'bold' }}>⚡ Use Predefined Template (Optional)</label>
                        <select onChange={applyTemplate} style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                            <option value="">-- Select Template --</option>
                            {reportTemplates.map(t => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleSubmit} className="form-card" style={{ padding: 0, background: 'transparent', boxShadow: 'none', border: 'none' }}>
                    <div className="form-group">
                        <label>Select Customer</label>
                        <select
                            value={formData.customerId}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                            required
                        >
                            <option value="">-- Select Customer --</option>
                            {customers.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Report Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            rows="4"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Priority</label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', fontSize: '1.1rem', marginTop: '1rem' }}>Submit Report</button>
                </form>
                </div>
            </div>
        </div>
    );
};

export default AddReport;
