import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-budget-suggestions-report',
  imports: [CommonModule],
  styleUrl: './budget-suggestions-report.css',
  templateUrl: './budget-suggestions-report.html',
})
export class BudgetSuggestionsReport implements OnChanges {
  @Input() report: any;

  suggestions: any[] = [];
  insights: string[] = [];

  ngOnChanges(): void {
    if (!this.report?.data) return;

    this.suggestions = this.report.data.suggestions || [];
    this.insights = this.report.data.insights || [];
  }
}
