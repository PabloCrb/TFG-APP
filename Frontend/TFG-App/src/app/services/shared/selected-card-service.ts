import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SelectedCardService {
  selectedCard?: number;

  setSelectedCard(cardID: number) {
    this.selectedCard = cardID;
  }

  getSelectedCard() {
    return this.selectedCard;
  }
}
