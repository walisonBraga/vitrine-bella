import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { LogEntry, LogFilter, LogStats } from '../interface/log.interface';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  public logs$ = this.logsSubject.asObservable();

  private logs: LogEntry[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadLogsFromStorage();
  }

  // Adicionar novo log
  addLog(log: Omit<LogEntry, 'id' | 'timestamp'>): void {
    const newLog: LogEntry = {
      ...log,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.logs.unshift(newLog); // Adiciona no início do array
    this.logsSubject.next([...this.logs]);
    this.saveLogsToStorage();
  }

  // Obter todos os logs
  getLogs(): Observable<LogEntry[]> {
    return this.logs$;
  }

  // Filtrar logs
  getFilteredLogs(filter: LogFilter): LogEntry[] {
    return this.logs.filter(log => {
      if (filter.userId && log.userId !== filter.userId) return false;
      if (filter.action && !log.action.toLowerCase().includes(filter.action.toLowerCase())) return false;
      if (filter.entity && log.entity !== filter.entity) return false;
      if (filter.status && log.status !== filter.status) return false;
      if (filter.dateFrom && log.timestamp < filter.dateFrom) return false;
      if (filter.dateTo && log.timestamp > filter.dateTo) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        if (!log.details.toLowerCase().includes(searchLower) &&
          !log.userName.toLowerCase().includes(searchLower) &&
          !log.action.toLowerCase().includes(searchLower)) return false;
      }
      return true;
    });
  }

  // Obter estatísticas
  getLogStats(): LogStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const logsToday = this.logs.filter(log => log.timestamp >= today).length;
    const logsThisWeek = this.logs.filter(log => log.timestamp >= weekAgo).length;
    const logsThisMonth = this.logs.filter(log => log.timestamp >= monthAgo).length;

    // Top ações
    const actionCounts = this.logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top usuários
    const userCounts = this.logs.reduce((acc, log) => {
      acc[log.userName] = (acc[log.userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userCounts)
      .map(([userName, count]) => ({ userName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalLogs: this.logs.length,
      logsToday,
      logsThisWeek,
      logsThisMonth,
      topActions,
      topUsers
    };
  }

  // Limpar logs antigos
  clearOldLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    this.logsSubject.next([...this.logs]);
    this.saveLogsToStorage();
  }

  // Exportar logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Usuário', 'Ação', 'Entidade', 'Detalhes', 'Data/Hora', 'Status'];
      const rows = this.logs.map(log => [
        log.id,
        log.userName,
        log.action,
        log.entity,
        log.details,
        log.timestamp.toLocaleString('pt-BR'),
        log.status
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadLogsFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const stored = localStorage.getItem('admin_logs');
      if (stored) {
        this.logs = JSON.parse(stored).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        this.logsSubject.next([...this.logs]);
      }
    } catch (error) {
      console.error('Erro ao carregar logs do localStorage:', error);
    }
  }

  private saveLogsToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem('admin_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erro ao salvar logs no localStorage:', error);
    }
  }
}
