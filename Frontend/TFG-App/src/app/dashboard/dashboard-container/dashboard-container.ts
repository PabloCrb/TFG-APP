import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { CardCarrousel } from '../../cards/card-carrousel/card-carrousel';

@Component({
  selector: 'app-dashboard-container',
  imports: [CommonModule, BaseChartDirective, CardCarrousel],
  templateUrl: './dashboard-container.html',
  styleUrl: './dashboard-container.css',
})
export class DashboardContainer {
  _dashboardService = inject(DashboardService);
  _cdr = inject(ChangeDetectorRef);

  userSummary!: any;
  activeFilter = 'month';
  today: number = new Date().getDate();
  filters = [{ value: '', label: '' }];
  totalIncome!: number;
  totalExpenses!: number;

  chartData: any;
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748b',
          font: { family: "'DM Mono', monospace", size: 12 },
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 17,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderColor: 'rgba(15, 23, 42, 0.1)',
        borderWidth: 1,
        titleColor: '#0f172a',
        bodyColor: '#64748b',
        titleFont: { family: "'DM Mono', monospace", weight: 'bold' },
        bodyFont: { family: "'DM Mono', monospace" },
        padding: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.parsed.y;
            const formatted = new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'EUR',
            }).format(value);
            return ` ${ctx.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(15, 23, 42, 0.05)' },
        ticks: {
          color: '#94a3b8',
          font: { family: "'DM Mono', monospace", size: 11 },
        },
        border: { color: 'rgba(15, 23, 42, 0.08)' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(15, 23, 42, 0.05)' },
        ticks: {
          color: '#94a3b8',
          font: { family: "'DM Mono', monospace", size: 11 },
          callback: (val: number) =>
            new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(val),
        },
        border: { color: 'rgba(15, 23, 42, 0.08)' },
      },
    },
  };

  async ngOnInit(): Promise<void> {
    this.userSummary = await this._dashboardService.getSummary();
    if (!this.userSummary?.length) return;
    this.calculateTotals();
    this.buildChart();
  }

  calculateTotals(): void {
    this.totalIncome = this.userSummary.reduce(
      (sum: number, m: any) => sum + parseFloat(m.total_income),
      0,
    );
    this.totalExpenses = this.userSummary.reduce(
      (sum: number, m: any) => sum + parseFloat(m.total_expenses),
      0,
    );
  }

  buildChart(): void {
    const labels = this.userSummary.map((d: any) => d.month);
    const incomeData = this.userSummary.map((d: any) => d.total_income);
    const expensesData = this.userSummary.map((d: any) => d.total_expenses);
    const balanceData = this.userSummary.map((d: any) => d.balance);
    const budgetLine = this.userSummary.map(() => 1500);

    this.chartData = {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Ingresos',
          data: incomeData,
          backgroundColor: 'rgba(5, 150, 105, 0.7)',
          borderColor: 'rgba(5, 150, 105, 1)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          order: 2,
        },
        {
          type: 'bar',
          label: 'Gastos',
          data: expensesData,
          backgroundColor: 'rgba(225, 29, 72, 0.7)',
          borderColor: 'rgba(225, 29, 72, 1)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          order: 2,
        },
        {
          type: 'line',
          label: 'Balance',
          data: balanceData,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.07)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          order: 1,
        },
        {
          type: 'line',
          label: 'Presupuesto',
          data: budgetLine,
          borderColor: 'rgba(217, 119, 6, 0.7)',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
          order: 1,
        },
      ],
    };
    this._cdr.detectChanges();
  }

  setRange(range: string) {
    this.activeFilter = range;
    // TODO: filter/reload data by range
  }

  formatCurrency(val: number): number {
    return parseFloat(
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val),
    );
  }
}
