export interface ExpenseAnalysisReport {
  type: 0;
  data: {
    summary: object;
    categories: any[];
    alerts: any[];
    recommendations: any[];
  };
  error: string | null;
}

export interface RecurringExpenseAnalysisReport {
  type: 1;
  data: {
    summary: {
      status: 'low|medium|high';
      totalMonthlyRecurring: number;
      recurringPercentage: number;
      mainInsights: string[];
    };
    categories: { name: string; amount: number; percentage: number }[];
    alerts: { message: string; impact: 'low|medium|high' }[];
    recommendations: [{ message: string; impact: 'low|medium|high' }];
  };
  error: string | null;
}

export interface CurrentMonthPredictionReport {
  type: 2;
  data: {
    prediction: {
      total: number;
      byCategory: { name: string; amount: number }[];
    };
    insights: string[];
  };
  error: string | null;
}
