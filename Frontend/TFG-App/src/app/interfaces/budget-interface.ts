import { Period } from '../enumerates/period-enumerate';

export interface Budget {
  budget_id: string;
  card_id?: number;
  amount: number;
  period_type: Period;
  start_date: string | Date;
  label: string;
  spent: number;
  transaction_ids: number[];
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallStatus: string;
}
