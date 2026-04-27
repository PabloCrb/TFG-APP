import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Card } from '../../interfaces/card-interface';

@Component({
  selector: 'app-card-component',
  templateUrl: './card-component.html',
  styleUrls: ['./card-component.css'],
})
export class CardComponent {
  @Input() cardId!: number;
  @Input() cardName!: string;
  @Input() cardType!: string;
  @Input() cardNumber!: string;
  @Input() cardBalance!: string;

  @Input() isActive: boolean = false;

  @Output() selectCardEvent = new EventEmitter<number>();

  emitSelectCardEvent() {
    this.selectCardEvent.emit(this.cardId);
  }
}
