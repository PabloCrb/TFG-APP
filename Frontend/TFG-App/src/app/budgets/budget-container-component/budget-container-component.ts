import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { BudgetCardComponent } from '../budget-card-component/budget-card-component';
import { BudgetDashboardComponent } from '../budget-dashboard-component/budget-dashboard-component';
import { BudgetService } from '../../services/budget-service';
import { Budget } from '../../interfaces/budget-interface';
import { CardCarrousel } from '../../cards/card-carrousel/card-carrousel';
import { SelectedCardService } from '../../services/shared/selected-card-service';
import { DialogService } from '../../services/shared/dialog-service';
import { FormTemplate } from '../../templates/form-template/form-template';
import { FormConfigInterface } from '../../interfaces/form-config-interface';
import { FormGroup } from '@angular/forms';
import { TransactionTypesService } from '../../services/shared/transaction-types-service';
import { FormatterService } from '../../services/shared/formatter-service';

@Component({
  selector: 'app-budget-container-component',
  imports: [BudgetCardComponent, BudgetDashboardComponent, CardCarrousel],
  templateUrl: './budget-container-component.html',
  styleUrl: './budget-container-component.css',
})
export class BudgetContainerComponent {
  _budgetsService: BudgetService = inject(BudgetService);
  _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  _selectedCardService = inject(SelectedCardService);
  _dialogService = inject(DialogService);
  _transactionTypesService: TransactionTypesService = inject(TransactionTypesService);
  _formatterService: FormatterService = inject(FormatterService);

  budgets: Budget[] = [];
  totalBudget!: number;
  totalSpent: number = 0;
  overallStatus: string = '';
  isLoading = true;
  form: FormGroup = new FormGroup({});

  async loadBudgets(cardID: number) {
    this.isLoading = true;

    this.totalBudget = 0;
    this.totalSpent = 0;
    let othersBudget: Budget | null = null;

    this.budgets = await this._budgetsService.getUserBudgets(cardID);

    for (const budget of this.budgets) {
      if (budget.budget_id === null) {
        othersBudget = budget;
        continue;
      }
      this.totalBudget += budget.amount;
      this.totalSpent += budget.spent;
    }

    if (othersBudget) this.setOthersBudget(othersBudget);

    this.setOverallStatus();
    this.isLoading = false;
    this._cdr.detectChanges();
  }

  setOthersBudget(othersBudget: Budget) {
    othersBudget.amount = this.totalBudget - this.totalSpent;
  }

  setOverallStatus() {
    if (this.totalSpent >= this.totalBudget) {
      this.overallStatus = 'Excedido';
    } else if (this.totalSpent >= this.totalBudget * 0.8) {
      this.overallStatus = 'Cerca del límite';
    } else {
      this.overallStatus = 'Con margen';
    }
  }

  async onCardSelected(cardID: number) {
    await this.loadBudgets(cardID);
  }

  onBudgetAction($event: any) {
    switch ($event.action) {
      case 'edit':
        this.editBudget($event.budget);
        break;
      case 'delete':
        this.deleteBudget($event.budget);
        break;
    }
  }

  async createBudget() {
    const types = await this._transactionTypesService.getTransactionTypes(false);

    const result = await this._dialogService.openComponent(FormTemplate, {
      config: [
        {
          type: 'text',
          name: 'label',
          label: 'Nombre',
          validators: ['required'],
          errors: { required: 'El nombre del presupuesto es obligatorio' },
        },
        {
          type: 'number',
          name: 'amount',
          label: 'Límite de gasto',
          validators: ['required'],
          errors: { required: 'El límite de gasto es obligatorio' },
        },
        {
          type: 'select',
          name: 'period_type',
          label: 'Periodo',
          validators: ['required'],
          options: [
            { value: 'diario', label: 'Diario' },
            { value: 'semanal', label: 'Semanal' },
            { value: 'quincenal', label: 'Quincenal' },
            { value: 'mensual', label: 'Mensual' },
            { value: 'anual', label: 'Anual' },
          ],
          errors: { required: 'El periodo es obligatorio' },
        },
        {
          type: 'date',
          name: 'start_date',
          label: 'Fecha de inicio',
          validators: ['required'],
          errors: { required: 'La fecha de inicio es obligatoria' },
        },
        {
          type: 'select',
          name: 'transaction_ids',
          multiple: true,
          label: 'Categorías',
          options: types.map((type: any) => ({
            value: type.transaction_type_id,
            label: type.label,
          })),
          validators: ['required'],
          errors: { required: 'La categoría es obligatoria' },
        },
      ] as FormConfigInterface[],
      submitButtonText: 'Crear Presupuesto',
      form: this.form,
    });

    if (!result) return;
    const selectedCardID = this._selectedCardService.getSelectedCard();
    if (!selectedCardID || selectedCardID === undefined) {
      alert('Error al obtener la cuenta seleccionada');
      return;
    }
    result.card_id = selectedCardID;
    await this._budgetsService.createBudget(result);
    await this.loadBudgets(selectedCardID);
  }

  async editBudget(budget: Budget) {
    const types = await this._transactionTypesService.getTransactionTypes(false);
    const transactionLabels = await this._formatterService.formatTransactionTypeIDtoName(
      budget.budget_id,
    );

    const transactionIds = transactionLabels.map((tr: any) => tr.transaction_type_id);

    const result: Budget = await this._dialogService.openComponent(FormTemplate, {
      config: [
        {
          type: 'text',
          name: 'label',
          label: 'Nombre',
          validators: ['required'],
          errors: { required: 'El nombre es obligatorio' },
        },
        {
          type: 'number',
          name: 'amount',
          label: 'Límite de gasto',
          validators: ['required'],
          errors: { required: 'El límite de gasto es obligatorio' },
        },
        {
          type: 'select',
          name: 'period_type',
          label: 'Periodo',
          validators: ['required'],
          options: [
            { value: 'diario', label: 'Diario' },
            { value: 'semanal', label: 'Semanal' },
            { value: 'quincenal', label: 'Quincenal' },
            { value: 'mensual', label: 'Mensual' },
            { value: 'anual', label: 'Anual' },
          ],
          errors: { required: 'El periodo es obligatorio' },
        },
        {
          type: 'date',
          name: 'start_date',
          label: 'Fecha de inicio',
          validators: ['required'],
          errors: { required: 'La fecha de inicio es obligatoria' },
        },
        {
          type: 'select',
          name: 'transaction_ids',
          multiple: true,
          label: 'Categorías',
          options: types.map((type: any) => ({
            value: type.transaction_type_id,
            label: type.label,
          })),
          validators: ['required'],
          errors: { required: 'La categoría es obligatoria' },
        },
      ] as FormConfigInterface[],
      initialData: {
        label: budget.label,
        amount: budget.amount,
        period_type: budget.period_type,
        start_date: this._formatterService.formatDateForInput(budget.start_date),
        transaction_ids: transactionIds,
      },
      submitButtonText: 'Editar Presupuesto',
      form: this.form,
    });

    if (!result) return;
    const editedBudget: Budget = budget;
    editedBudget.label = result.label;
    editedBudget.amount = result.amount;
    editedBudget.period_type = result.period_type;
    editedBudget.start_date = result.start_date;
    editedBudget.card_id = this._selectedCardService.getSelectedCard();
    editedBudget.transaction_ids = result.transaction_ids;

    await this._budgetsService.editBudget(editedBudget);
    this._cdr.detectChanges();
  }

  async deleteBudget(budget: Budget) {
    const confirmDelete = confirm(
      `¿Está seguro de que desea eliminar el presupuesto "${budget.label}"?`,
    );
    if (!confirmDelete) return;

    const response = await this._budgetsService.deleteBudget(budget);
    if (!response.ok) {
      alert('Error al eliminar el presupuesto: ' + response.data);
      return;
    }

    this.budgets = this.budgets.filter((b) => b.budget_id !== budget.budget_id);

    this.totalBudget -= budget.amount;
    this.totalSpent -= budget.spent;
    this.setOverallStatus();

    this._cdr.detectChanges();
  }
}
