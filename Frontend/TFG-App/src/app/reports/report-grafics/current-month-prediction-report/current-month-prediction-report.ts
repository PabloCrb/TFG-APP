import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-current-month-prediction-report',
  imports: [CommonModule, BaseChartDirective],
  styleUrl: './current-month-prediction-report.css',
  templateUrl: './current-month-prediction-report.html',
})
export class CurrentMonthPredictionReport implements OnChanges {
  @Input() report: any;

  totalIncome: number = 0;
  totalExpenses: number = 0;
  expensesChartData: any;
  incomeChartData: any;

  totals = {
    income: 0,
    expenses: 0,
    balance: 0,
  };

  insights: string[] = [];

  ngOnChanges(): void {
    console.log('Received report:', this.report);
    const prediction = this.report?.data?.prediction;
    if (!prediction) return;

    this.insights = this.report?.data?.insights || [];

    const income = prediction.currentMonthForecast?.income || [];
    const expenses = prediction.currentMonthForecast?.expenses || [];

    this.totals = {
      income: prediction.totals?.income || 0,
      expenses: prediction.totals?.expenses || 0,
      balance: prediction.totals?.balance || 0,
    };

    this.totalIncome = this.totals.income;
    this.totalExpenses = this.totals.expenses;

    this.prepareExpensesChart(expenses);
    this.prepareIncomeChart(income);
  }

  prepareExpensesChart(categories: any[]): void {
    if (!categories?.length) {
      this.expensesChartData = null;
      return;
    }

    const sorted = [...categories].sort((a, b) => b.forecast - a.forecast);

    this.expensesChartData = {
      labels: sorted.map((c) => c.name),
      datasets: [
        {
          label: 'Actual (€)',
          data: sorted.map((c) => Math.abs(Number(c.current || 0))),
          backgroundColor: '#90caf9',
        },
        {
          label: 'Forecast (€)',
          data: sorted.map((c) => Math.abs(Number(c.forecast || 0))),
          backgroundColor: '#ef5350',
        },
      ],
    };
  }

  prepareIncomeChart(categories: any[]): void {
    if (!categories?.length) {
      this.incomeChartData = null;
      return;
    }

    const sorted = [...categories].sort((a, b) => b.forecast - a.forecast);

    this.incomeChartData = {
      labels: sorted.map((c) => c.name),
      datasets: [
        {
          label: 'Actual (€)',
          data: sorted.map((c) => Number(c.current || 0)),
          backgroundColor: '#81c784',
        },
        {
          label: 'Forecast (€)',
          data: sorted.map((c) => Number(c.forecast || 0)),
          backgroundColor: '#66bb6a',
        },
      ],
    };
  }

  generateColors(n: number): string[] {
    return Array.from({ length: n }, (_, i) => {
      const hue = (i * 360) / n;
      return `hsl(${hue}, 65%, 55%)`;
    });
  }
}
