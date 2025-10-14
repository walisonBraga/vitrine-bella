import { Component, ViewChild } from '@angular/core';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, ApexDataLabels, ApexStroke } from 'ng-apexcharts';
import { ProductService } from '../../../products/service/product.service';

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
export class DashboardComponent {
  today = new Date('2025-09-15T16:21:00-05:00');

  totalProducts = 0;
  dailySales = 0;
  annualProfit = 0;
  topCategory = '';
  categoryPercentage = 0;
  productsGrowth = 15;
  salesGrowth = 8;
  profitGrowth = 12;

  @ViewChild('chart') chart!: ChartComponent;
  public salesAmountByMonthChartData: ChartOptions;
  public quantitySoldByMonthChartData: ChartOptions;
  public salesOverTimeChartData: ChartOptions;

  constructor(private productService: ProductService) {
    // Initialize with empty charts
    this.salesAmountByMonthChartData = this.getEmptyChartOptions('bar', 'Total de Vendas por Mês (R$)');
    this.quantitySoldByMonthChartData = this.getEmptyChartOptions('bar', 'Quantidade de Produtos Vendidos por Mês');
    this.salesOverTimeChartData = this.getEmptyChartOptions('line', 'Vendas ao Longo do Tempo (R$)');
  }

  ngOnInit(): void {
    this.today = new Date();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.productService.getProducts().subscribe(products => {
      this.totalProducts = products.length;
      this.dailySales = Math.floor(Math.random() * 50) + 10;
      this.annualProfit = Math.floor(Math.random() * 100000) + 50000;
      this.topCategory = products.length > 0 ? products[0].category : 'N/A';
      this.categoryPercentage = products.length > 0 ? (products.filter(p => p.category === this.topCategory).length / products.length * 100) : 0;

      // Process sales data for charts
      this.processSalesData(products);
    });
  }

  processSalesData(products: any[]): void {
    // Group by month/year
    const salesByMonth: { [key: string]: { amount: number; quantity: number } } = {};
    products.forEach(product => {
      const date = new Date(product.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // e.g., "2025-01"
      if (!salesByMonth[monthYear]) {
        salesByMonth[monthYear] = { amount: 0, quantity: 0 };
      }
      salesByMonth[monthYear].amount += product.price; // Sum price for total sales
      salesByMonth[monthYear].quantity += 1; // Assume 1 product = 1 sale
    });

    // Prepare chart data
    const months = Object.keys(salesByMonth).sort(); // Sort by month/year
    const salesAmounts = months.map(month => salesByMonth[month].amount);
    const quantities = months.map(month => salesByMonth[month].quantity);

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
    console.log('Exporting data...');
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  logout(): void {
    console.log('Logout clicked');
  }
}
