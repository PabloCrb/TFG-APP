export interface TableColumnConfig {
  key: string;
  label: string;
  type?: 'bold' | 'currency' | 'badge' | 'nullable' | 'date';
  nullText?: string;
}
