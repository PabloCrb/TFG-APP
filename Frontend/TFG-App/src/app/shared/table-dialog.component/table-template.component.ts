import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TableColumnConfig } from '../../interfaces/table-column-config-interface';

@Component({
  selector: 'app-table-template',
  templateUrl: './table-template.component.html',
  styleUrls: ['./table-template.component.css'],
})
export class TableTemplateComponent {
  @Input() columns: TableColumnConfig[] = [];
  @Input() data: any[] = [];
  @Input() hasAddButton: boolean = true;
  @Input() titleLabel: string = '';

  @Output() action = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  onAddRecurringTransaction(isIncome: boolean) {
    this.action.emit({ action: 'add', isIncome: isIncome });
  }
}
