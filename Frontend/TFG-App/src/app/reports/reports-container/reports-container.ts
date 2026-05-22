import { Component, inject } from '@angular/core';
import { ReportOption } from '../../interfaces/report-option-interface';
import { ReportsService } from '../../services/reports-service';
import { CardCarrousel } from '../../cards/card-carrousel/card-carrousel';
import { SelectedCardService } from '../../services/shared/selected-card-service';
import { SpinnerService } from '../../services/shared/spinner-service';
import { AiReportComponent } from '../ai-report/ai-report-component';

@Component({
  selector: 'app-reports-container',
  standalone: true,
  imports: [CardCarrousel, AiReportComponent],
  templateUrl: './reports-container.html',
  styleUrl: './reports-container.css',
})
export class ReportsContainer {
  _reportsService: ReportsService = inject(ReportsService);
  _selectedCardService: SelectedCardService = inject(SelectedCardService);
  _spinnerService: SpinnerService = inject(SpinnerService);

  activeIndex = 0;
  ai_report: any[] = [];
  errorText: string = ' ';
  hasInteracted = false;
  options: ReportOption[] = [
    {
      id: 0,
      title: 'Análisis de gastos',
      description: 'Obtenga un análisis de sus gastos puntuales',
      icon: 'analytics',
      requiredData: 'expenses',
      selected: false,
    },
    {
      id: 1,
      title: 'Control de suscripciones',
      description: 'Detecte servicios recurrentes y gastos innecesarios',
      icon: 'subscriptions',
      requiredData: 'recurringTransactions',
      selected: false,
    },
    {
      id: 2,
      title: 'Predicción mes actual',
      description: 'Obtenga una predicción de sus gastos para este mes basada en sus hábitos',
      icon: 'calendar_today',
      requiredData: 'transactions',
      selected: false,
    },
    {
      id: 3,
      title: 'Predicción gastos futuros',
      description: 'Reciba predicciones de gastos futuros basados en sus hábitos',
      icon: 'trending_up',
      requiredData: 'transactions',
      selected: false,
    },
    {
      id: 4,
      title: 'Ajustes en presupuestos',
      description: 'Obtenga una recomendación de ajustes en sus presupuestos',
      icon: 'attach_money',
      requiredData: 'budgets',
      selected: false,
    },
  ];

  countSelectedOptions(): number {
    return this.options.filter((o) => o.selected).length;
  }

  isValid(): boolean {
    const selectedCount = this.countSelectedOptions();

    if (!this.hasInteracted) return false;

    if (selectedCount === 0) {
      this.errorText = '*Debe seleccionar al menos una categoría';
      return false;
    }

    if (selectedCount > 3) {
      this.errorText = '*Debe seleccionar como máximo 3 categorías';
      return false;
    }

    this.errorText = '';
    return true;
  }

  toggleOption(option: ReportOption) {
    this.hasInteracted = true;
    const selectedCount = this.countSelectedOptions();

    if (!option.selected && selectedCount >= 3) {
      this.errorText = '*Debe seleccionar como máximo 3 categorías';
      return;
    }

    if (option.selected && selectedCount === 1) {
      option.selected = !option.selected;
      this.errorText = '*Debe seleccionar al menos una categoría';
      return;
    }

    option.selected = !option.selected;
    this.errorText = '';
  }

  async generateAIReport(): Promise<void> {
    this._spinnerService.show();
    this.ai_report = [];

    try {
      const categoriesData = this.options.filter((c) => c.selected).map((c) => c.id);

      const selectedCard = this._selectedCardService.getSelectedCard();
      if (!selectedCard) {
        console.warn('No card selected');
        return;
      }

      const response = await this._reportsService.generateAIReport(categoriesData, selectedCard);

      if (!response.ok) {
        alert('Error al generar los reportes: ' + response.data);
        return;
      }

      const validReports: any[] = [];
      const errors: string[] = [];
      response.data.forEach((r: any) => {
        if (r.error) {
          errors.push(r.error);
        } else {
          validReports.push(r);
        }
      });
      this.ai_report = validReports;

      if (errors.length) {
        alert('Errores en algunos reportes:\n\n' + errors.join('\n'));
      }
      this.activeIndex = 0;
    } catch (error) {
      console.error(error);
      this._spinnerService.hide();
    } finally {
      this._spinnerService.hide();
    }
  }
}
