import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FormatterService {
  formatDate(date: string | Date | undefined | null): string | null {
    if (date === null || date === undefined) return null;
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date.substring(0, 10);
  }

  formatDateToNumberMonth(date: string | Date | undefined | null): string {
    if (date === null || date === undefined) return '';

    const meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const fecha = new Date(date);
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    return `${dia} ${mes}`;
  }

  formatDateForInput(date: string | Date): string {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async formatTransactionTypeIDtoName(budgetID: string): Promise<string[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:3000/transactions/getTransactionLabels?budgetID=${budgetID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const result = await response.json();
    if (!result.ok) {
      alert('Error al obtener las categorías: ' + result.data);
    }
    return result.data;
  }
}
