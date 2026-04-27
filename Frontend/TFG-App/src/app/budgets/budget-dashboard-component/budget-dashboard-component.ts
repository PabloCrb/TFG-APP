import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DialogService } from '../../services/shared/dialog-service';
import { FormGroup } from '@angular/forms';
import { FormTemplate } from '../../templates/form-template/form-template';
import { FormConfigInterface } from '../../interfaces/form-config-interface';
import { FormatterService } from '../../services/shared/formatter-service';
import { DecimalPipe } from '@angular/common';
import { TransactionTypesService } from '../../services/shared/transaction-types-service';
import { BudgetService } from '../../services/budget-service';
import { SelectedCardService } from '../../services/shared/selected-card-service';

@Component({
  selector: 'app-budget-dashboard-component',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './budget-dashboard-component.html',
  styleUrl: './budget-dashboard-component.css',
})
export class BudgetDashboardComponent {
  _dialogService = inject(DialogService);
  _formatterService = inject(FormatterService);
  _transactionTypesService = inject(TransactionTypesService);
  _budgetService: BudgetService = inject(BudgetService);
  _selectedCardService: SelectedCardService = inject(SelectedCardService);

  @Input() totalBudget!: number;
  @Input() totalSpent!: number;
  @Input() remainingBudget!: number;
  @Input() overallStatus!: string;

  @Output() onCreateBudget: EventEmitter<any> = new EventEmitter<any>();

  form: FormGroup = new FormGroup({});
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  get statusColor(): string {
    if (this.overallStatus === 'Excedido') return 'red';
    if (this.overallStatus === 'Aviso') return 'orange';
    if (this.overallStatus === 'Normal') return 'green';
    return 'black';
  }

  addNewBudget() {
    this.onCreateBudget.emit();
  }
}
