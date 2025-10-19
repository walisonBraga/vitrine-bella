export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'error' | 'warning';
}

export interface LogFilter {
  userId?: string;
  action?: string;
  entity?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface LogStats {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  topActions: { action: string; count: number }[];
  topUsers: { userName: string; count: number }[];
}
