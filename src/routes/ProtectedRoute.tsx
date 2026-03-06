// Stub guard to host future auth/role checks for protected views.
import { ReactNode } from 'react';

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // TODO: Inject auth logic and redirect unauthenticated users when available.
  return <>{children}</>;
};

export default ProtectedRoute;
