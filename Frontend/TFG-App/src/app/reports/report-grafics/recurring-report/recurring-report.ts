import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-recurring-report',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './recurring-report.html',
  styleUrl: './recurring-report.css',
})
export class RecurringReport {
  @Input() report: any;
  pieChartData: any;

  ngOnChanges(): void {
    if (this.report) {
      this.preparePieChart(this.report);
    }
  }
  generateColors(n: number): string[] {
    return Array.from({ length: n }, (_, i) => {
      const hue = (i * 360) / n;
      return `hsl(${hue}, 65%, 55%)`;
    });
  }

  preparePieChart(report: any): void {
    const categories = report?.data?.categories;

    if (!categories || !categories.length) {
      this.pieChartData = null;
      return;
    }

    this.pieChartData = {
      labels: categories.map((c: any) => c.name),
      datasets: [
        {
          data: categories.map((c: any) => c.amount),
          backgroundColor: this.generateColors(categories.length),
          borderWidth: 1,
        },
      ],
    };
  }
}
