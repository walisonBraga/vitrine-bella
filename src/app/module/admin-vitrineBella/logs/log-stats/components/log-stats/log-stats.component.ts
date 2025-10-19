import { Component, OnInit } from '@angular/core';
import { LogService } from '../../../service/log.service';
import { LogStats } from '../../../interface/log.interface';

@Component({
  selector: 'app-log-stats',
  template: `
    <div class="log-stats-container">
      <h2>Estatísticas de Logs</h2>
      
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-number">{{ stats.totalLogs }}</div>
            <div class="stat-label">Total de Logs</div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-number">{{ stats.logsToday }}</div>
            <div class="stat-label">Logs Hoje</div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-number">{{ stats.logsThisWeek }}</div>
            <div class="stat-label">Esta Semana</div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-number">{{ stats.logsThisMonth }}</div>
            <div class="stat-label">Este Mês</div>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="top-actions">
        <h3>Top Ações</h3>
        <mat-list>
          <mat-list-item *ngFor="let action of stats.topActions">
            <mat-icon matListItemIcon>trending_up</mat-icon>
            <div matListItemTitle>{{ action.action }}</div>
            <div matListItemLine>{{ action.count }} vezes</div>
          </mat-list-item>
        </mat-list>
      </div>
    </div>
  `,
  styles: [`
    .log-stats-container {
      padding: 24px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      text-align: center;
    }
    
    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #3f51b5;
    }
    
    .stat-label {
      color: #666;
      margin-top: 8px;
    }
    
    .top-actions {
      margin-top: 24px;
    }
  `]
})
export class LogStatsComponent implements OnInit {
  stats: LogStats = {
    totalLogs: 0,
    logsToday: 0,
    logsThisWeek: 0,
    logsThisMonth: 0,
    topActions: [],
    topUsers: []
  };

  constructor(private logService: LogService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.stats = this.logService.getLogStats();
  }
}
