export interface Transaction {
  transaction_id: number;
  card_id: number;
  transaction_type_id?: number;
  type_label?: string;
  amount: number;
  description: string;
  transaction_date: string;
  recurring_id?: number;
}
