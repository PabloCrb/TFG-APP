import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Budget } from '../../interfaces/budget-interface';
import { FormatterService } from '../../services/shared/formatter-service';
import { Period } from '../../enumerates/period-enumerate';
import { DialogService } from '../../services/shared/dialog-service';
import { TableTemplateComponent } from '../../shared/table-dialog.component/table-template.component';
import { BudgetService } from '../../services/budget-service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-budget-card-component',
  imports: [DecimalPipe],
  templateUrl: './budget-card-component.html',
  styleUrl: './budget-card-component.css',
})
export class BudgetCardComponent {
  @Input() budget!: Budget;

  @Output() action: EventEmitter<any> = new EventEmitter<any>();

  _formatterService: FormatterService = inject(FormatterService);
  _dialogService: DialogService = inject(DialogService);
  _budgetService: BudgetService = inject(BudgetService);
  _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  transaction_type_labels: string[] = [];
  loadingTypes: boolean = true;

  async ngOnInit() {
    await this.formatTransactionTypeIDtoName();
    this._cdr.detectChanges();
  }

  get progressPercentage(): number {
    if (!this.budget.amount) return 0;
    const percentage = (this.budget.spent / this.budget.amount) * 100;
    return Math.min(percentage, 100);
  }

  get remaining(): number {
    return this.budget.amount - this.budget.spent;
  }

  get progressBarColor(): string {
    const percentage = this.progressPercentage;
    if (percentage >= 100) return 'red';
    if (percentage > 80) return 'orange';
    return 'green';
  }

  async formatTransactionTypeIDtoName() {
    if (!this.budget.transaction_ids) return;

    const response = await this._formatterService.formatTransactionTypeIDtoName(
      this.budget.budget_id,
    );

    this.transaction_type_labels = response.map((item: any) => item.label);
  }

  calculateEndDate(startDate: string | Date, period: Period): string {
    const start = new Date(startDate);
    const end = new Date(start);

    switch (period) {
      case Period.DIARIO:
        end.setDate(end.getDate() + 1);
        break;

      case Period.SEMANAL:
        end.setDate(end.getDate() + 7);
        break;

      case Period.QUINCENAL:
        end.setDate(end.getDate() + 15);
        break;

      case Period.MENSUAL:
        end.setMonth(end.getMonth() + 1);
        break;

      case Period.ANUAL:
        end.setFullYear(end.getFullYear() + 1);
        break;

      default:
        console.warn('Tipo de periodo no soportado:', period);
    }

    return end.toISOString().split('T')[0];
  }

  editBudget(event: Event) {
    event.stopPropagation();
    this.action.emit({ action: 'edit', budget: this.budget });
  }

  deleteBudget(event: Event) {
    event.stopPropagation();
    this.action.emit({ action: 'delete', budget: this.budget });
  }

  async viewBudgetTransactions() {
    if (this.budget.transaction_ids === undefined || this.budget.transaction_ids === null) return;

    const response = await this._budgetService.getTransactionsForBudget(
      this.budget.transaction_ids,
    );
    if (!response.ok) {
      alert('Error al obtener las transacciones del presupuesto: ' + response.data);
      return;
    }

    for (let transaction of response.data) {
      transaction.transaction_date = this._formatterService.formatDateToNumberMonth(
        transaction.transaction_date,
      );
    }

    this._dialogService.openComponent(
      TableTemplateComponent,
      {
        titleLabel: 'Transacciones del Presupuesto  "' + this.budget.label + '"',
        hasAddButton: false,
        columns: [
          { key: 'transaction_date', label: 'Fecha', type: 'bold' },
          { key: 'description', label: 'Descripción', type: 'text' },
          { key: 'type_label', label: 'Categoría', type: 'badge' },
          { key: 'amount', label: 'Cantidad', type: 'currency' },
        ],
        data: response.data,
      },
      { maxWidth: '1000px' },
    );
  }
}
