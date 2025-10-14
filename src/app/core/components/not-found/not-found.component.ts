import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ROUTE_NAMES } from '../../constants/route.constants';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <mat-card class="not-found-card">
          <mat-card-content class="card-content">
            <div class="error-icon">
              <mat-icon>error_outline</mat-icon>
            </div>

            <h1 class="error-title">404</h1>
            <h2 class="error-subtitle">Página não encontrada</h2>

            <p class="error-description">
              A página que você está procurando não existe ou foi movida.
            </p>

            <div class="error-actions">
              <button mat-raised-button color="primary" (click)="goHome()">
                <mat-icon>home</mat-icon>
                Ir para Home
              </button>

              <button mat-button color="accent" (click)="goBack()">
                <mat-icon>arrow_back</mat-icon>
                Voltar
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 2rem;
    }

    .not-found-content {
      width: 100%;
      max-width: 500px;
    }

    .not-found-card {
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      overflow: hidden;
    }

    .card-content {
      padding: 3rem 2rem;
    }

    .error-icon {
      font-size: 4rem;
      color: #f44336;
      margin-bottom: 1rem;
    }

    .error-title {
      font-size: 4rem;
      font-weight: 700;
      color: #1976d2;
      margin: 0 0 0.5rem 0;
      line-height: 1;
    }

    .error-subtitle {
      font-size: 1.5rem;
      font-weight: 500;
      color: #333;
      margin: 0 0 1rem 0;
    }

    .error-description {
      font-size: 1rem;
      color: #666;
      margin-bottom: 2rem;
      line-height: 1.5;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    button {
      min-width: 140px;
    }

    @media (max-width: 600px) {
      .not-found-container {
        padding: 1rem;
      }

      .card-content {
        padding: 2rem 1rem;
      }

      .error-title {
        font-size: 3rem;
      }

      .error-subtitle {
        font-size: 1.25rem;
      }

      .error-actions {
        flex-direction: column;
        align-items: center;
      }

      button {
        width: 100%;
        max-width: 200px;
      }
    }
  `]
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate([ROUTE_NAMES.HOME]);
  }

  goBack(): void {
    window.history.back();
  }
}
