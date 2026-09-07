import React from 'react';
import { VicePrincipalDashboard } from './VicePrincipalDashboard';

interface ManagerDashboardProps {
  dashboardData?: any;
  liveTasks?: any[];
  liveSchedule?: any[];
  onRefresh?: () => void;
  onToggleTask?: (taskId: string | number) => void;
  onOpenNewTask?: () => void;
  onOpenMessage?: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = (props) => {
  return <VicePrincipalDashboard {...props} />;
};

export default ManagerDashboard;
