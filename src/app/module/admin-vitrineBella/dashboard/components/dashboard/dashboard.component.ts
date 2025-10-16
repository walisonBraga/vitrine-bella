import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, ApexDataLabels, ApexStroke } from 'ng-apexcharts';
import { ProductService } from '../../../products/service/product.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke?: ApexStroke;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Dashboard data
  totalProducts = 0;
  dailySales = 0;
  annualProfit = 0;
  topCategory = '';
  categoryPercentage = 0;
  productsGrowth = 15;
  salesGrowth = 8;
  profitGrowth = 12;
  isLoading = true;
  errorMessage = '';

  // Chart components
  @ViewChild('chart') chart!: ChartComponent;
  public salesAmountByMonthChartData: ChartOptions;
  public quantitySoldByMonthChartData: ChartOptions;
  public salesOverTimeChartData: ChartOptions;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize with empty charts
    this.salesAmountByMonthChartData = this.getEmptyChartOptions('bar', 'Total de Vendas por Mês (R$)');
    this.quantitySoldByMonthChartData = this.getEmptyChartOptions('bar', 'Quantidade de Produtos Vendidos por Mês');
    this.salesOverTimeChartData = this.getEmptyChartOptions('line', 'Vendas ao Longo do Tempo (R$)');
  }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthentication(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        if (!user) {
          this.router.navigate(['/signin']);
          return;
        }
        this.loadDashboardData();
      });
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.processDashboardData(products);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar dados do dashboard:', error);
          this.errorMessage = 'Erro ao carregar dados do dashboard';
          this.isLoading = false;
        }
      });
  }

  private processDashboardData(products: any[]): void {
    this.totalProducts = products.length;
    this.dailySales = Math.floor(Math.random() * 50) + 10;
    this.annualProfit = Math.floor(Math.random() * 100000) + 50000;

    // Calculate top category
    const categoryCount: { [key: string]: number } = {};
    products.forEach(product => {
      if (product.category) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      }
    });

    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a);

    this.topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'N/A';
    this.categoryPercentage = sortedCategories.length > 0
      ? Math.round((sortedCategories[0][1] / products.length) * 100)
      : 0;

    // Process sales data for charts
    this.processSalesData(products);
  }

  processSalesData(products: any[]): void {
    if (!products || products.length === 0) {
      return;
    }

    // Group by month/year
    const salesByMonth: { [key: string]: { amount: number; quantity: number } } = {};

    products.forEach(product => {
      if (product.createdAt) {
        const date = new Date(product.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!salesByMonth[monthYear]) {
          salesByMonth[monthYear] = { amount: 0, quantity: 0 };
        }

        salesByMonth[monthYear].amount += product.price || 0;
        salesByMonth[monthYear].quantity += 1;
      }
    });

    // Prepare chart data
    const months = Object.keys(salesByMonth).sort();
    const salesAmounts = months.map(month => salesByMonth[month].amount);
    const quantities = months.map(month => salesByMonth[month].quantity);

    this.updateCharts(months, salesAmounts, quantities);
  }

  private updateCharts(months: string[], salesAmounts: number[], quantities: number[]): void {
    // Sales Amount by Month (Bar)
    this.salesAmountByMonthChartData = {
      series: [{ name: 'Vendas (R$)', data: salesAmounts }],
      chart: {
        type: 'bar',
        height: 300,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      title: { text: 'Total de Vendas por Mês (R$)', align: 'left' },
      xaxis: { categories: months }
    };

    // Quantity Sold by Month (Bar)
    this.quantitySoldByMonthChartData = {
      series: [{ name: 'Quantidade Vendida', data: quantities }],
      chart: {
        type: 'bar',
        height: 300,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      title: { text: 'Quantidade de Produtos Vendidos por Mês', align: 'left' },
      xaxis: { categories: months }
    };

    // Sales Over Time (Line)
    this.salesOverTimeChartData = {
      series: [{ name: 'Vendas (R$)', data: salesAmounts }],
      chart: {
        type: 'line',
        height: 300,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      stroke: { curve: 'smooth', colors: ['#ff6f00'], width: 2 },
      dataLabels: { enabled: false },
      title: { text: 'Vendas ao Longo do Tempo (R$)', align: 'left' },
      xaxis: { categories: months }
    };
  }

  private getEmptyChartOptions(type: 'bar' | 'line', title: string): ChartOptions {
    return {
      series: [],
      chart: {
        type,
        height: 300,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      title: { text: title, align: 'left' },
      xaxis: { categories: [] }
    };
  }

  exportData(): void {
    // TODO: Implement data export functionality
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  logout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(['/signin']);
    }).catch((error: any) => {
      console.error('Erro ao fazer logout:', error);
    });
  }
}
