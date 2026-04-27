import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { CardCarrousel } from '../../cards/card-carrousel/card-carrousel';
import { TransactionsComponent } from '../transactions-component/transactions-component';
import { SelectedCardService } from '../../services/shared/selected-card-service';
import { SidebarComponent } from '../../shared/sidebar-component/sidebar-component';

@Component({
  selector: 'app-container-transactions',
  imports: [CardCarrousel, TransactionsComponent, SidebarComponent],
  templateUrl: './container-transactions.html',
  styleUrl: './container-transactions.css',
})
export class ContainerTransactions implements AfterViewInit {
  @ViewChild(TransactionsComponent) transactionComponent!: TransactionsComponent;
  @ViewChild(CardCarrousel) cardCarousel!: CardCarrousel;

  _selectedCardService = inject(SelectedCardService);

  ngAfterViewInit() {
    const selectedCard = this._selectedCardService.getSelectedCard();
    if (selectedCard) {
      this.transactionComponent.getTransactions(selectedCard);
    }
  }

  onCardSelected(cardID: number) {
    this.transactionComponent?.getTransactions(cardID);
  }

  onBalanceUpdate() {
    this.cardCarousel.refreshCards();
  }
}
