import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import AccessDeniedScreen from './AccessDeniedScreen';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  role,
  children,
}) => {
  const isOwner = useAuthStore((s) => s.isOwner);
  const userPermissions = useAuthStore((s) => s.permissions);
  const userRole = (useAuthStore((s) => s.role) || '').toLowerCase();

  // Owners have full system bypass
  if (isOwner) {
    return <>{children}</>;
  }

  // Portal users (Student / Parent) cannot access staff-protected secondary screens
  const isPortalUser =
    userRole.includes('student') ||
    userRole.includes('parent') ||
    ['طالب', 'طالبة', 'ولي أمر', 'ولي_أمر'].includes(userRole);

  if (isPortalUser && (permission || (permissions && permissions.length > 0))) {
    return <AccessDeniedScreen />;
  }

  // Check single permission requirement
  if (permission && !userPermissions.includes(permission)) {
    return <AccessDeniedScreen />;
  }

  // Check multiple permissions (any match)
  if (permissions && permissions.length > 0) {
    const hasAny = permissions.some((p) => userPermissions.includes(p));
    if (!hasAny) {
      return <AccessDeniedScreen />;
    }
  }

  // Check role requirement
  if (role && userRole && userRole !== role.toLowerCase()) {
    return <AccessDeniedScreen />;
  }

  return <>{children}</>;
};

export default PermissionGuard;
