import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectedCardService {
  private selectedCard$ = new BehaviorSubject<number | undefined>(undefined);
  selectedCard$$ = this.selectedCard$.asObservable();

  setSelectedCard(cardId: number): void {
    this.selectedCard$.next(cardId);
  }

  getSelectedCard(): number | undefined {
    return this.selectedCard$.getValue();
  }
}
