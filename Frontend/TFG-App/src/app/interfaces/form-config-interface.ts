export interface FormConfigInterface {
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select';
  options?: any;
  name: string;
  label: string;
  validators: string[];
  multiple?: boolean;
  errors: any;
}
