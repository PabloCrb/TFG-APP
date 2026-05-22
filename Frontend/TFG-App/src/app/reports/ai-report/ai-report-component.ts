import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ExpensesReport } from '../report-grafics/expenses-report/expenses-report';
import { RecurringReport } from '../report-grafics/recurring-report/recurring-report';
import { CurrentMonthPredictionReport } from '../report-grafics/current-month-prediction-report/current-month-prediction-report';
import { FuturePredictionReport } from '../report-grafics/future-prediction-report/future-prediction-report';
import { BudgetSuggestionsReport } from '../report-grafics/budget-suggestions-report/budget-suggestions-report';

@Component({
  selector: 'app-ai-report',
  imports: [
    CommonModule,
    ExpensesReport,
    RecurringReport,
    CurrentMonthPredictionReport,
    FuturePredictionReport,
    BudgetSuggestionsReport,
  ],
  standalone: true,
  templateUrl: './ai-report-component.html',
  styleUrl: './ai-report-component.css',
})
export class AiReportComponent {
  @Input({ required: true }) report: any;
}
