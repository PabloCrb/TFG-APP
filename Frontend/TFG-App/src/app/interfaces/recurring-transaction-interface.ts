export interface RecurringTransaction {
  rt_id?: number;
  user_id?: number;
  card_id?: number;
  amount: number;
  description: string;
  transaction_type_id: number;
  frequency_id: number;
  start_date: string;
  end_date?: string;
  last_executed?: Date;
  active?: boolean;
}
