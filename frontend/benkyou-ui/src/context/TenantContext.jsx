import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const TenantContext = createContext({
  tenantCode: null,
  tenantPath: (path) => path
});

export const useTenant = () => useContext(TenantContext);

const PUBLIC_SEGMENTS = new Set([
  "",
  "login",
  "register",
  "superadmin-login",
  "verify-email",
  "verify-otp",
  "superadmin",
  "admin",
  "instructor",
  "student",
]);

function getTenantFromPath(pathname) {
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  return PUBLIC_SEGMENTS.has(firstSegment) ? null : firstSegment;
}

export const TenantProvider = ({ children }) => {
  const location = useLocation();
  const paramTenant = useMemo(() => getTenantFromPath(location.pathname), [location.pathname]);
  const [tenantCode, setTenantCode] = useState(paramTenant || localStorage.getItem('tenantCode'));

  useEffect(() => {
    if (paramTenant) {
      setTenantCode(paramTenant);
      localStorage.setItem('tenantCode', paramTenant);
    } 
    // If we are on superadmin routes, we don't use tenantCode prefix
    else if (location.pathname.startsWith('/superadmin')) {
      setTenantCode(null);
    }
    // Fallback to local storage if available
    else {
      const stored = localStorage.getItem('tenantCode');
      if (stored) setTenantCode(stored);
    }
  }, [paramTenant, location.pathname]);

  // Helper to prefix paths with the tenant code
  const tenantPath = (path) => {
    if (path.startsWith('/superadmin')) return path;
    
    if (tenantCode) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      if (cleanPath.startsWith(`/${tenantCode}/`)) return cleanPath;
      return `/${tenantCode}${cleanPath}`;
    }
    
    return path;
  };

  return (
    <TenantContext.Provider value={{ tenantCode, tenantPath }}>
      {children}
    </TenantContext.Provider>
  );
};
