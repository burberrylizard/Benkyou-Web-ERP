import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { buildDashboardPath } from '../../utils/session';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { tenantCode: urlTenantCode } = useParams();
  const { isAuthenticated, role, tenantCode: userTenantCode } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={buildDashboardPath(role, userTenantCode)} replace />;
  }

  // Tenant validation (if the route is tenant-prefixed and user is not SuperAdmin)
  if (urlTenantCode && userTenantCode && urlTenantCode !== userTenantCode && role !== 'SuperAdmin') {
    return <Navigate to={buildDashboardPath(role, userTenantCode)} replace />;
  }

  return children;
}
