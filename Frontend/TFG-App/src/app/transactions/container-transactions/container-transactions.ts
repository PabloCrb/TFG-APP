import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { CardCarrousel } from '../../cards/card-carrousel/card-carrousel';
import { TransactionsComponent } from '../transactions-component/transactions-component';
import { SelectedCardService } from '../../services/shared/selected-card-service';

@Component({
  selector: 'app-container-transactions',
  imports: [CardCarrousel, TransactionsComponent],
  templateUrl: './container-transactions.html',
  styleUrl: './container-transactions.css',
})
export class ContainerTransactions {
  @ViewChild(TransactionsComponent) transactionComponent!: TransactionsComponent;
  @ViewChild(CardCarrousel) cardCarousel!: CardCarrousel;

  _selectedCardService = inject(SelectedCardService);

  onCardSelected(cardID: number) {
    this.transactionComponent?.getTransactions(cardID);
  }

  onBalanceUpdate() {
    this.cardCarousel.refreshCards();
  }
}
