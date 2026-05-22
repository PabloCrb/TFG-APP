import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { ChartConfiguration } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-expenses-report',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './expenses-report.html',
  styleUrl: './expenses-report.css',
})
export class ExpensesReport implements OnChanges {
  @Input() report: any;

  barChartData: any;
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };
  ngOnChanges(): void {
    if (this.report) {
      this.prepareBarChart(this.report);
    }
  }
  generateColors(n: number): string[] {
    return Array.from({ length: n }, (_, i) => {
      const hue = (i * 360) / n;
      return `hsl(${hue}, 65%, 55%)`;
    });
  }

  prepareBarChart(report: any): void {
    const categories = report?.data?.categories;

    if (!categories || !categories.length) {
      this.barChartData = null;
      return;
    }
    this.barChartData = {
      labels: this.report.data.categories.map((c: any) => c.name),
      datasets: [
        {
          data: this.report.data.categories.map((c: any) => c.amount),
          label: 'Gastos (€)',
        },
      ],
    };
  }
}
