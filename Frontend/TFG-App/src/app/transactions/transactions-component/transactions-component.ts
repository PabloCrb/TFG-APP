import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../services/shared/dialog-service';
import { FormTemplate } from '../../templates/form-template/form-template';
import { FormGroup } from '@angular/forms';
import { TransactionsService } from '../../services/transactions.service';
import { SelectedCardService } from '../../services/shared/selected-card-service';
import { FormConfigInterface } from '../../interfaces/form-config-interface';
import { Transaction } from '../../interfaces/transaction-interface';
import { TableTemplateComponent } from '../../shared/table-dialog.component/table-template.component';
import { FormatterService } from '../../services/shared/formatter-service';
import { RecurringTransaction } from '../../interfaces/recurring-transaction-interface';
import { TransactionTypesService } from '../../services/shared/transaction-types-service';

@Component({
  selector: 'app-transactions-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions-component.html',
  styleUrls: ['./transactions-component.css'],
})
export class TransactionsComponent {
  _dialogService = inject(DialogService);
  _transactionsService = inject(TransactionsService);
  _selectedCardService = inject(SelectedCardService);
  _formatterService = inject(FormatterService);
  _transactionTypesService = inject(TransactionTypesService);

  @Output() balanceUpdated = new EventEmitter<void>();

  movements: Transaction[] | null = [];
  formattedDates: Map<number, string> = new Map();
  form: FormGroup = new FormGroup({});

  constructor(private cdr: ChangeDetectorRef) {}

  async loadTransactionTypes(isIncome: boolean) {
    const response = await this._transactionTypesService.getTransactionTypes(isIncome);
    return response.map((type: any) => ({ value: type.transaction_type_id, label: type.label }));
  }

  async openAddTransactionDialog(isIncome: boolean) {
    let buttonText = 'Añadir ';
    isIncome ? (buttonText += 'Ingreso') : (buttonText += 'Gasto');
    const types = await this.loadTransactionTypes(isIncome);

    const result = await this._dialogService.openComponent(FormTemplate, {
      config: [
        {
          type: 'number',
          name: 'amount',
          label: 'Cantidad',
          validators: ['required'],
          errors: { required: 'La cantidad es obligatoria' },
        },
        {
          type: 'date',
          name: 'transaction_date',
          label: 'Fecha',
          validators: ['required'],
          errors: { required: 'La fecha es obligatoria' },
        },
        {
          type: 'text',
          name: 'description',
          label: 'Descripción',
          validators: ['required'],
          errors: { required: 'La descripción es obligatoria' },
        },
        {
          type: 'select',
          name: 'transaction_type_id',
          label: 'Categoría',
          options: types,
          validators: ['required'],
          errors: { required: 'La categoría es obligatoria' },
        },
      ] as FormConfigInterface[],
      initialData: {
        transaction_date: this._formatterService.formatDateForInput(new Date().toString()),
      },
      submitButtonText: buttonText,
      form: this.form,
    });

    if (result) {
      if (!isIncome) result.amount *= -1;
      await this.addTransaction(result);
    }
  }

  registerTransaction(isIncome: boolean) {
    this.openAddTransactionDialog(isIncome);
  }

  async getTransactions(cardID: number | null) {
    const response = await this._transactionsService.getTransactions(cardID);
    if (response.ok) {
      this.movements = response.data;
      this.cdr.detectChanges();
      return;
    } else {
      alert('Error al obtener las transacciones' + response.data);
      return null;
    }
  }

  async addTransaction(transaction: Transaction) {
    const cardID = this._selectedCardService.getSelectedCard();
    if (!cardID) {
      alert('Error al añadir una transacción. Recargue la página y vuelva a intentarlo.');
    } else {
      const response = await this._transactionsService.addTransaction(cardID, transaction);
      if (response.ok) {
        this.updateBalance(transaction.amount, cardID);
      }
      this.getTransactions(cardID);
    }
  }

  async onDelete(transaction: Transaction) {
    const conf = confirm('¿Está seguro de que quiere eliminar esta transacción?');
    if (!conf) return;
    const response = await this._transactionsService.deleteTransacion(transaction);
    if (!response.ok) alert('Error al eliminar la transacción: ' + response.data);
    else {
      this.updateBalance(this.changeSign(transaction.amount), transaction.card_id);
    }
  }

  async onEdit(transaction: Transaction) {
    const transaction_types_raw = await this._transactionTypesService.getTransactionTypes(
      transaction.amount > 0,
    );

    const transaction_types = transaction_types_raw.map((t: any) => ({
      value: t.transaction_type_id,
      label: t.label,
    }));

    const editedTransaction = await this._dialogService.openComponent(FormTemplate, {
      config: [
        {
          type: 'number',
          name: 'amount',
          label: 'Cantidad',
          validators: ['required'],
          errors: { required: 'La cantidad es obligatoria' },
        },
        {
          type: 'date',
          name: 'transaction_date',
          label: 'Fecha',
          validators: ['required'],
          errors: { required: 'La fecha es obligatoria' },
        },
        {
          type: 'text',
          name: 'description',
          label: 'Descripción',
          validators: ['required'],
          errors: { required: 'La descripción es obligatoria' },
        },
        {
          type: 'select',
          name: 'transaction_type_id',
          label: 'Categoría',
          options: transaction_types,
          validators: ['required'],
          errors: { required: 'La categoría es obligatoria' },
        },
      ],
      submitButtonText: 'Aceptar',
      initialData: {
        amount: transaction.amount,
        description: transaction.description,
        transaction_date: this._formatterService.formatDateForInput(transaction.transaction_date),
        transaction_type_id: transaction.transaction_type_id,
      },
      form: this.form,
    });

    if (editedTransaction) {
      let amountDifference = editedTransaction.amount - transaction.amount;

      editedTransaction.transaction_id = transaction.transaction_id;
      editedTransaction.card_id = transaction.card_id;
      this.editTransaction(editedTransaction, amountDifference);
    }
  }

  async editTransaction(transaction: Transaction, amountDifference: number) {
    const response = await this._transactionsService.editTransaction(transaction);
    if (!response.ok) {
      alert('Error al editar la transacción: ' + response.data);
    } else {
      await this.updateBalance(amountDifference, transaction.card_id);
      this.getTransactions(transaction.card_id);
    }
  }

  async updateBalance(amount: number, cardID: number) {
    if (amount === 0) return;
    if (cardID) await this._transactionsService.updateBalance(amount, cardID);
    this.balanceUpdated.emit();
  }

  changeSign(number: number) {
    number *= -1;
    return number;
  }

  async getRecurringUserTransactions() {
    const selectedCard = this._selectedCardService.getSelectedCard();
    if (!selectedCard) return;
    return await this._transactionsService.getRecurringUserTransactions(selectedCard);
  }

  async manageRecurringTransactions() {
    const response = await this.getRecurringUserTransactions();
    if (!response.ok)
      alert('Error al obtener las transacciones recurrentes del usuario: ' + response.data);

    const result = await this._dialogService.openComponent(
      TableTemplateComponent,
      {
        columns: [
          { key: 'description', label: 'Descripción', type: 'bold' },
          { key: 'card_name', label: 'Tarjeta' },
          { key: 'amount', label: 'Cantidad', type: 'currency' },
          { key: 'transaction_type_label', label: 'Categoría', type: 'badge' },
          { key: 'frequency_label', label: 'Frecuencia' },
          { key: 'start_date', label: 'Inicio', type: 'date' },
          {
            key: 'end_date',
            label: 'Fin',
            type: 'nullable',
            nullText: 'Sin fecha de fin',
          },
        ],
        data: response.data,
      },
      { maxWidth: '1000px' },
    );

    switch (result.action) {
      case 'add':
        this.addRecurringTransaction(result.isIncome);
        return;
      case 'edit':
        this.editRecurringTransaction(result.row);
        return;
      case 'delete':
        this.deleteRecurringTransaction(result.row);
        return;
    }
  }

  async addRecurringTransaction(isIncome: boolean) {
    const transaction_types_raw = await this._transactionTypesService.getTransactionTypes(isIncome);

    const transaction_types = transaction_types_raw.map((t: any) => ({
      value: t.transaction_type_id,
      label: t.label,
    }));

    const result = await this._dialogService.openComponent(FormTemplate, {
      config: [
        {
          type: 'number',
          name: 'amount',
          label: 'Cantidad',
          validators: ['required'],
          errors: { required: 'La cantidad es obligatoria' },
        },
        {
          type: 'text',
          name: 'description',
          label: 'Descripción',
          validators: ['required'],
          errors: { required: 'La descripción es obligatoria' },
        },
        {
          type: 'date',
          name: 'start_date',
          label: 'Fecha de inicio',
          validators: ['required'],
          errors: { required: 'La fecha de inicio es obligatoria' },
        },
        {
          type: 'date',
          name: 'end_date',
          label: 'Fecha de fin (Opcional)',
        },
        {
          type: 'select',
          name: 'frequency_id',
          label: 'Frecuencia',
          options: [
            { value: 1, label: 'Diaria' },
            { value: 2, label: 'Semanal' },
            { value: 3, label: 'Mensual' },
            { value: 4, label: 'Anual' },
          ],
          validators: ['required'],
          errors: { required: 'La frecuencia es obligatoria' },
        },
        {
          type: 'select',
          name: 'transaction_type_id',
          label: 'Categoría',
          options: transaction_types,
          validators: ['required'],
          errors: { required: 'La categoría es obligatoria' },
        },
      ],
      submitButtonText: 'Añadir Mov. Recurrente',
      form: this.form,
    });

    if (result) {
      result.card_id = this._selectedCardService.getSelectedCard();
      if (!isIncome) result.amount = this.changeSign(result.amount);
      this._transactionsService.addRecurringTransaction(result);
    }
  }

  async editRecurringTransaction(rt: RecurringTransaction) {
    let amount = rt.amount;
    if (rt.amount && rt.amount < 0) amount *= -1;

    const result = await this._dialogService.openComponent(FormTemplate, {
      config: [
        {
          type: 'select',
          name: 'type',
          label: 'Tipo',
          options: [
            { value: 1, label: 'Ingreso' },
            { value: 2, label: 'Gasto' },
          ],
          validators: ['required'],
          errors: { required: 'El tipo es obligatorio' },
        },
        {
          type: 'number',
          name: 'amount',
          label: 'Cantidad',
          validators: ['required'],
          errors: { required: 'La cantidad es obligatoria' },
        },
        {
          type: 'text',
          name: 'description',
          label: 'Descripción',
          validators: ['required'],
          errors: { required: 'La descripción es obligatoria' },
        },
        {
          type: 'date',
          name: 'start_date',
          label: 'Fecha de inicio',
          validators: ['required'],
          errors: { required: 'La fecha de inicio es obligatoria' },
        },
        {
          type: 'date',
          name: 'end_date',
          label: 'Fecha de fin (Opcional)',
        },
        {
          type: 'select',
          name: 'frequency_id',
          label: 'Frecuencia',
          options: [
            { value: 1, label: 'Diaria' },
            { value: 2, label: 'Semanal' },
            { value: 3, label: 'Mensual' },
            { value: 4, label: 'Anual' },
          ],
          validators: ['required'],
          errors: { required: 'La frecuencia es obligatoria' },
        },
        {
          type: 'select',
          name: 'transaction_type_id',
          label: 'Categoría',
          options: await this._transactionTypesService.getTransactionTypes(amount > 0),
          validators: ['required'],
          errors: { required: 'La categoría es obligatoria' },
        },
      ],
      initialData: {
        type: rt.transaction_type_id,
        amount: amount,
        description: rt.description,
        start_date: this._formatterService.formatDate(rt.start_date),
        end_date: this._formatterService.formatDate(rt.end_date),
        frequency_id: rt.frequency_id,
        transaction_type_id: 1,
      },
      submitButtonText: 'Editar Mov. Recurrente',
      form: this.form,
    });

    if (result) {
      result.rt_id = rt.rt_id;
      result.card_id = rt.card_id;
      this._transactionsService.editRecurringTransaction(result);
    }
  }

  async deleteRecurringTransaction(rt: RecurringTransaction) {
    const conf = confirm('¿Está seguro de que quiere eliminar esta transacción permanente?');
    if (!conf) return;
    else {
      this._transactionsService.deleteRecurringTransaction(rt);
    }
  }

  async createTransactionType() {
    const result = await this._dialogService.openComponent(FormTemplate, {
      config: [
        {
          type: 'select',
          name: 'type',
          label: 'Tipo',
          options: [
            { value: 1, label: 'Ingreso' },
            { value: 0, label: 'Gasto' },
          ],
          validators: ['required'],
          errors: { required: 'El tipo es obligatorio' },
        },
        {
          type: 'text',
          name: 'label',
          label: 'Nombre',
          validators: ['required'],
          errors: { required: 'El nombre es obligatorio' },
        },
      ],
      submitButtonText: 'Crear',
      form: this.form,
    });

    if (result) {
      const response = await this._transactionsService.createTransactionType(result);
      if (!response.ok) alert('Error al crear el tipo de transacción: ' + response.data);
      else alert('Tipo de transacción creado correctamente');
    }
  }
}
