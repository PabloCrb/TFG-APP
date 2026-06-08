import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);

@Component({
  selector: 'app-future-prediction-report',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './future-prediction-report.html',
  styleUrl: './future-prediction-report.css',
})
export class FuturePredictionReport {
  @Input() report: any;

  chartData: any;
  total: number = 0;
  insights: string[] = [];

  ngOnChanges(): void {
    console.log('FuturePredictionReport received report:', this.report);

    const prediction = this.report?.data?.prediction;

    if (!prediction) return;

    this.insights = this.report?.data?.insights || [];

    this.prepareChart(prediction);
  }

  prepareChart(prediction: any[]): void {
    if (!prediction || !prediction.length) {
      this.chartData = null;
      return;
    }

    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const currentMonth = new Date().getMonth();
    this.chartData = {
      labels: prediction.map((p) => monthNames[(p.monthNumber + currentMonth) % 12]),
      datasets: [
        {
          type: 'bar',
          label: 'Predicción de gastos (€)',
          data: prediction.map((p) => p.predictedAmount),
          backgroundColor: this.generateColors(prediction.length),
          borderWidth: 1,
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
