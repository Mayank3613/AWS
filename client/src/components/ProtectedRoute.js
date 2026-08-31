import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div className="loading-spinner">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role) {
        const allowedRoles = Array.isArray(role) ? role : [role];
        if (!allowedRoles.includes(user.role)) {
            // Redirect to appropriate dashboard
            return <Navigate to={user.role === 'admin' || user.role === 'manager' ? '/admin' : '/staff'} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
