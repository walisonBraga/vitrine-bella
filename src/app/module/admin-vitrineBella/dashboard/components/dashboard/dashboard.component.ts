import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, ApexDataLabels, ApexStroke, ApexYAxis, ApexLegend, ApexTooltip } from 'ng-apexcharts';
import { ProductService } from '../../../products/service/product.service';
import { SalesService } from '../../../sales/service/sales.service';
import { Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import { Sale } from '../../../sales/interface/sales';
import { Product } from '../../../products/interface/products';

export type ChartOptions = {
  series: ApexAxisChartSeries | number[];
  chart: ApexChart;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis;
  stroke?: ApexStroke;
  dataLabels?: ApexDataLabels;
  title?: ApexTitleSubtitle;
  legend?: ApexLegend;
  tooltip?: ApexTooltip;
  colors?: string[];
  labels?: string[];
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
  colors?: string[];
};

export type PieChartOptions = {
  series: number[];
  chart: ApexChart;
  labels: string[];
  title: ApexTitleSubtitle;
  colors: string[];
  legend: ApexLegend;
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
  totalSales = 0;
  dailySales = 0;
  monthlySales = 0;
  annualProfit = 0;
  topCategory = '';
  categoryPercentage = 0;
  totalCustomers = 0;
  averageOrderValue = 0;
  conversionRate = 0;

  // Growth metrics
  productsGrowth = 0;
  salesGrowth = 0;
  profitGrowth = 0;
  customersGrowth = 0;

  // Period filter
  selectedPeriod: 'today' | 'week' | 'month' | 'year' = 'month';

  isLoading = true;
  errorMessage = '';

  // Alerts and notifications
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    icon: string;
    action?: string;
    actionCallback?: () => void;
  }> = [];

  // Chart components
  @ViewChild('chart') chart!: ChartComponent;
  public salesAmountByMonthChartData: BarChartOptions;
  public quantitySoldByMonthChartData: BarChartOptions;
  public salesOverTimeChartData: ChartOptions;
  public categoryDistributionChartData: PieChartOptions;
  public paymentMethodsChartData: PieChartOptions;

  constructor(
    private productService: ProductService,
    private salesService: SalesService,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize with empty charts
    this.salesAmountByMonthChartData = this.getEmptyBarChartOptions('Total de Vendas por Mês (R$)');
    this.quantitySoldByMonthChartData = this.getEmptyBarChartOptions('Quantidade de Produtos Vendidos por Mês');
    this.salesOverTimeChartData = this.getEmptyChartOptions('line', 'Vendas ao Longo do Tempo (R$)');
    this.categoryDistributionChartData = this.getEmptyPieChartOptions('Distribuição por Categoria');
    this.paymentMethodsChartData = this.getEmptyPieChartOptions('Métodos de Pagamento');
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

    // Combine products and sales data
    combineLatest([
      this.productService.getProducts(),
      this.salesService.getSales()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([products, sales]) => {
          this.processDashboardData(products, sales);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar dados do dashboard:', error);
          this.errorMessage = 'Erro ao carregar dados do dashboard';
          this.isLoading = false;
        }
      });
  }

  private processDashboardData(products: Product[], sales: Sale[]): void {
    // Basic metrics
    this.totalProducts = products.length;
    this.totalSales = sales.length;

    // Calculate sales metrics
    this.calculateSalesMetrics(sales);

    // Calculate category metrics
    this.calculateCategoryMetrics(products, sales);

    // Calculate customer metrics
    this.calculateCustomerMetrics(sales);

    // Process sales data for charts
    this.processSalesData(sales);

    // Calculate growth metrics (simplified for now)
    this.calculateGrowthMetrics();

    // Generate alerts based on data
    this.generateAlerts(products, sales);
  }

  private calculateSalesMetrics(sales: Sale[]): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Filter sales by period
    const todaySales = sales.filter(sale => new Date(sale.createdAt) >= today);
    const monthSales = sales.filter(sale => new Date(sale.createdAt) >= thisMonth);
    const yearSales = sales.filter(sale => new Date(sale.createdAt) >= thisYear);

    // Calculate amounts
    this.dailySales = todaySales.reduce((sum, sale) => sum + sale.finalAmount, 0);
    this.monthlySales = monthSales.reduce((sum, sale) => sum + sale.finalAmount, 0);
    this.annualProfit = yearSales.reduce((sum, sale) => sum + sale.finalAmount, 0);

    // Calculate average order value
    this.averageOrderValue = sales.length > 0
      ? sales.reduce((sum, sale) => sum + sale.finalAmount, 0) / sales.length
      : 0;
  }

  private calculateCategoryMetrics(products: Product[], sales: Sale[]): void {
    // Count products by category
    const categoryCount: { [key: string]: number } = {};
    products.forEach(product => {
      if (product.category) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      }
    });

    // Find top category
    const sortedCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a);

    this.topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'N/A';
    this.categoryPercentage = sortedCategories.length > 0
      ? Math.round((sortedCategories[0][1] / products.length) * 100)
      : 0;
  }

  private calculateCustomerMetrics(sales: Sale[]): void {
    // Count unique customers by CPF
    const uniqueCustomers = new Set(sales.map(sale => sale.customerCpf).filter(cpf => cpf));
    this.totalCustomers = uniqueCustomers.size;

    // Calculate conversion rate (simplified)
    this.conversionRate = this.totalCustomers > 0 ? Math.round((sales.length / this.totalCustomers) * 100) : 0;
  }

  private calculateGrowthMetrics(): void {
    // Simplified growth calculation - in a real app, you'd compare with previous periods
    this.productsGrowth = Math.floor(Math.random() * 20) + 5;
    this.salesGrowth = Math.floor(Math.random() * 25) + 10;
    this.profitGrowth = Math.floor(Math.random() * 30) + 8;
    this.customersGrowth = Math.floor(Math.random() * 15) + 5;
  }

  processSalesData(sales: Sale[]): void {
    if (!sales || sales.length === 0) {
      return;
    }

    // Group sales by month/year
    const salesByMonth: { [key: string]: { amount: number; quantity: number } } = {};
    const categorySales: { [key: string]: number } = {};
    const paymentMethods: { [key: string]: number } = {};

    sales.forEach(sale => {
      if (sale.createdAt) {
        const date = new Date(sale.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!salesByMonth[monthYear]) {
          salesByMonth[monthYear] = { amount: 0, quantity: 0 };
        }

        salesByMonth[monthYear].amount += sale.finalAmount;
        salesByMonth[monthYear].quantity += sale.items.reduce((sum, item) => sum + item.quantity, 0);

        // Count payment methods
        paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + 1;

        // Count category sales (simplified - using first item's category)
        if (sale.items.length > 0) {
          // This would need product data to get actual categories
          // For now, we'll use a simplified approach
        }
      }
    });

    // Prepare chart data
    const months = Object.keys(salesByMonth).sort();
    const salesAmounts = months.map(month => salesByMonth[month].amount);
    const quantities = months.map(month => salesByMonth[month].quantity);

    this.updateCharts(months, salesAmounts, quantities, paymentMethods);
  }

  private updateCharts(months: string[], salesAmounts: number[], quantities: number[], paymentMethods: { [key: string]: number }): void {
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
      xaxis: { categories: months },
      colors: ['#1976d2']
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
      xaxis: { categories: months },
      colors: ['#42a5f5']
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
      stroke: { curve: 'smooth', colors: ['#ff6f00'], width: 3 },
      dataLabels: { enabled: false },
      title: { text: 'Vendas ao Longo do Tempo (R$)', align: 'left' },
      xaxis: { categories: months },
      colors: ['#ff6f00']
    };

    // Payment Methods (Donut)
    const paymentLabels = Object.keys(paymentMethods);
    const paymentData = Object.values(paymentMethods);

    this.paymentMethodsChartData = {
      series: paymentData,
      chart: {
        type: 'donut',
        height: 300
      },
      labels: paymentLabels.map(method => {
        switch (method) {
          case 'cash': return 'Dinheiro';
          case 'credit_card': return 'Cartão de Crédito';
          case 'debit_card': return 'Cartão de Débito';
          case 'pix': return 'PIX';
          default: return method;
        }
      }),
      title: { text: 'Métodos de Pagamento', align: 'left' },
      colors: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0'],
      legend: { position: 'bottom' }
    };

    // Category Distribution (Pie) - Simplified for now
    this.categoryDistributionChartData = {
      series: [30, 25, 20, 15, 10],
      chart: {
        type: 'pie',
        height: 300
      },
      labels: ['Eletrônicos', 'Roupas', 'Casa', 'Esportes', 'Outros'],
      title: { text: 'Distribuição por Categoria', align: 'left' },
      colors: ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'],
      legend: { position: 'bottom' }
    };
  }

  private getEmptyBarChartOptions(title: string): BarChartOptions {
    return {
      series: [],
      chart: {
        type: 'bar',
        height: 300,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      title: { text: title, align: 'left' },
      xaxis: { categories: [] }
    };
  }

  private getEmptyPieChartOptions(title: string): PieChartOptions {
    return {
      series: [],
      chart: {
        type: 'pie',
        height: 300
      },
      labels: [],
      title: { text: title, align: 'left' },
      colors: [],
      legend: { position: 'bottom' }
    };
  }

  private getEmptyChartOptions(type: 'bar' | 'line' | 'pie' | 'donut', title: string): ChartOptions {
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

  // Period filter methods
  onPeriodChange(period: 'today' | 'week' | 'month' | 'year'): void {
    this.selectedPeriod = period;
    this.loadDashboardData();
  }

  // Export functionality
  exportData(): void {
    const data = {
      totalProducts: this.totalProducts,
      totalSales: this.totalSales,
      dailySales: this.dailySales,
      monthlySales: this.monthlySales,
      annualProfit: this.annualProfit,
      totalCustomers: this.totalCustomers,
      averageOrderValue: this.averageOrderValue,
      topCategory: this.topCategory,
      categoryPercentage: this.categoryPercentage,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generateAlerts(products: Product[], sales: Sale[]): void {
    this.alerts = [];

    // Check for low stock products
    const lowStockProducts = products.filter(product => product.stock <= 5);
    if (lowStockProducts.length > 0) {
      this.alerts.push({
        id: 'low-stock',
        type: 'warning',
        title: 'Estoque Baixo',
        message: `${lowStockProducts.length} produto(s) com estoque baixo (≤ 5 unidades)`,
        icon: 'warning',
        action: 'Ver Produtos',
        actionCallback: () => this.router.navigate(['/admin/products'])
      });
    }

    // Check for no sales today
    const today = new Date();
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    });

    if (todaySales.length === 0) {
      this.alerts.push({
        id: 'no-sales-today',
        type: 'info',
        title: 'Nenhuma Venda Hoje',
        message: 'Ainda não houve vendas hoje. Considere ações promocionais.',
        icon: 'info',
        action: 'Ver Produtos',
        actionCallback: () => this.router.navigate(['/admin/products'])
      });
    }

    // Check for high sales performance
    if (todaySales.length >= 10) {
      this.alerts.push({
        id: 'high-sales',
        type: 'success',
        title: 'Excelente Performance!',
        message: `${todaySales.length} vendas realizadas hoje. Parabéns!`,
        icon: 'celebration',
        action: 'Ver Vendas',
        actionCallback: () => this.router.navigate(['/admin/sales'])
      });
    }

    // Check for products without categories
    const uncategorizedProducts = products.filter(product => !product.category);
    if (uncategorizedProducts.length > 0) {
      this.alerts.push({
        id: 'uncategorized-products',
        type: 'warning',
        title: 'Produtos Sem Categoria',
        message: `${uncategorizedProducts.length} produto(s) sem categoria definida`,
        icon: 'category',
        action: 'Categorizar',
        actionCallback: () => this.router.navigate(['/admin/products'])
      });
    }

    // Check for average order value
    if (this.averageOrderValue < 50) {
      this.alerts.push({
        id: 'low-average-order',
        type: 'info',
        title: 'Ticket Médio Baixo',
        message: `Ticket médio atual: R$ ${this.averageOrderValue.toFixed(2)}. Considere estratégias para aumentar o valor médio dos pedidos.`,
        icon: 'attach_money'
      });
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  dismissAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
  }

  logout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(['/signin']);
    }).catch((error: any) => {
      console.error('Erro ao fazer logout:', error);
    });
  }
}
