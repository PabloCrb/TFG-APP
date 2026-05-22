import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../card-component/card-component';
import { CardService } from '../../services/card.service';
import { Card } from '../../interfaces/card-interface';
import { ChangeDetectorRef } from '@angular/core';
import { SelectedCardService } from '../../services/shared/selected-card-service';
import { DialogService } from '../../services/shared/dialog-service';
import { FormTemplate } from '../../templates/form-template/form-template';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-card-carrousel',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './card-carrousel.html',
  styleUrl: './card-carrousel.css',
})
export class CardCarrousel {
  _cardService = inject(CardService);
  _selectedCardService = inject(SelectedCardService);
  _dialogService = inject(DialogService);

  @Output() selectedCardEvent: EventEmitter<number> = new EventEmitter();

  showCreateCardFormFlag: boolean = false;
  cards: Card[] = [];
  form: FormGroup = new FormGroup({});

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      this.cards = await this.getUserCards();
      if (this.cards.length === 0) return;
      this.markAsSelected(this.cards[0].card_id);
      this._selectedCardService.setSelectedCard(this.cards[0].card_id);
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error al cargar tarjetas', err);
    }
  }

  markAsSelected(card_id: number) {
    if (this.cards.length === 0) return;

    for (let card of this.cards) {
      if (card.card_id === card_id) {
        card.isActive = true;
        this._selectedCardService.setSelectedCard(card_id);
        this.selectedCardEvent.emit(card_id);
      }
    }
  }

  onSelectCard(cardId: number) {
    this._selectedCardService.setSelectedCard(cardId);

    this.cards = this.cards.map((card) => ({
      ...card,
      isActive: card.card_id === cardId,
    }));

    this.selectedCardEvent.emit(cardId);
  }

  async showCreateCardForm() {
    const result = await this._dialogService.openComponent(FormTemplate, {
      config: [
        {
          type: 'text',
          name: 'name',
          label: 'Nombre',
          validators: ['required'],
          errors: { required: 'El nombre de la tarjeta es obligatorio' },
        },
        {
          type: 'text',
          name: 'type',
          label: 'Tipo de tarjeta',
          validators: ['required'],
          errors: { required: 'El tipo de tarjeta es obligatorio' },
        },
        {
          type: 'text',
          name: 'number',
          label: 'Últimos 8 dígitos',
          validators: ['required'],
          errors: { required: 'El número de tarjeta es obligatorio' },
        },
        {
          type: 'text',
          name: 'balance',
          label: 'Saldo actual',
          validators: ['required'],
          errors: { required: 'El saldo de la tarjeta es obligatorio' },
        },
      ],
      submitButtonText: 'Añadir Cuenta',
      form: this.form,
    });

    if (result) {
      await this.createCard(result);
    }
  }

  async createCard(cardData: any) {
    const response = await this._cardService.createCard(cardData);
    if (!response.ok) alert('Error al crear la tarjeta: ' + response.data);
    const prevSelected = this._selectedCardService.getSelectedCard();
    await this.refreshCards();
    if (prevSelected) this.markAsSelected(prevSelected);
  }

  async getUserCards() {
    const response = await this._cardService.getUserCards();
    if (!response.ok) {
      alert('Error al obtener las tarjetas del usuario:' + response.data);
      return [];
    }
    return response.data.cards;
  }

  async refreshCards() {
    const cards = await this.getUserCards();

    this.cards = [...cards];

    const prevSelected = this._selectedCardService.getSelectedCard();
    if (prevSelected) this.markAsSelected(prevSelected);
  }
}
