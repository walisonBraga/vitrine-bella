import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { LogEntry, LogFilter } from '../../../interface/log.interface';
import { LogService } from '../../../service/log.service';

@Component({
    selector: 'app-log-table',
    templateUrl: './log-table.component.html',
    styleUrls: ['./log-table.component.scss']
})
export class LogTableComponent implements OnInit, OnDestroy {
    displayedColumns: string[] = ['timestamp', 'userName', 'action', 'entity', 'details', 'status'];

    filteredLogs: LogEntry[] = [];
    allLogs: LogEntry[] = [];

    // Paginação
    pageSize = 25;
    pageIndex = 0;
    totalItems = 0;

    // Filtros
    filter: LogFilter = {};
    searchTerm = '';

    // Estados
    loading = false;
    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();
    constructor(private logService: LogService) { }

    ngOnInit(): void {
        this.loadLogs();
        this.setupSearch();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadLogs(): void {
        this.loading = true;
        this.logService.getLogs()
            .pipe(takeUntil(this.destroy$))
            .subscribe((logs: LogEntry[]) => {
                this.allLogs = logs;
                this.applyFilters();
                this.loading = false;
            });
    }

    private setupSearch(): void {
        this.searchSubject
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                takeUntil(this.destroy$)
            )
            .subscribe(searchTerm => {
                this.filter.search = searchTerm;
                this.applyFilters();
            });
    }

    onSearchChange(searchTerm: string): void {
        this.searchSubject.next(searchTerm);
    }

    onFilterChange(): void {
        this.pageIndex = 0;
        this.applyFilters();
    }

    private applyFilters(): void {
        this.filteredLogs = this.logService.getFilteredLogs(this.filter);
        this.totalItems = this.filteredLogs.length;
        this.updatePaginatedLogs();
    }

    private updatePaginatedLogs(): void {
        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.filteredLogs = this.filteredLogs.slice(startIndex, endIndex);
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.applyFilters();
    }

    onSortChange(sort: Sort): void {
        // Implementar ordenação se necessário
    }

    clearFilters(): void {
        this.filter = {};
        this.searchTerm = '';
        this.pageIndex = 0;
        this.applyFilters();
    }

    exportLogs(format: 'json' | 'csv'): void {
        const data = this.logService.exportLogs(format);
        const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    getStatusChipClass(status: string): string {
        switch (status) {
            case 'success': return 'status-success';
            case 'error': return 'status-error';
            case 'warning': return 'status-warning';
            default: return 'status-info';
        }
    }

    getActionChipClass(action: string): string {
        switch (action.toLowerCase()) {
            case 'create': return 'action-create';
            case 'update': return 'action-update';
            case 'delete': return 'action-delete';
            case 'login': return 'action-login';
            case 'logout': return 'action-logout';
            case 'grant': return 'action-grant';
            case 'remove': return 'action-remove';
            default: return 'action-default';
        }
    }

    getActionIcon(action: string): string {
        switch (action.toLowerCase()) {
            case 'create': return 'add_circle';
            case 'update': return 'edit';
            case 'delete': return 'delete';
            case 'login': return 'login';
            case 'logout': return 'logout';
            case 'grant': return 'check_circle';
            case 'remove': return 'remove_circle';
            default: return 'info';
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'success': return 'primary';
            case 'error': return 'warn';
            case 'warning': return 'accent';
            default: return 'primary';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    }

    getEntityIcon(entity: string): string {
        switch (entity.toLowerCase()) {
            case 'product': return 'inventory';
            case 'category': return 'category';
            case 'user': return 'person';
            case 'coupon': return 'local_offer';
            case 'slide': return 'slideshow';
            case 'goal': return 'trending_up';
            case 'permission': return 'security';
            case 'system': return 'settings';
            default: return 'help';
        }
    }

    formatTimestamp(timestamp: Date): string {
        return new Date(timestamp).toLocaleString('pt-BR');
    }
}
