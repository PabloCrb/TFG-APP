import { Injectable } from '@angular/core';
import { API_URL } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class TransactionTypesService {
  async getTransactionTypes(isIncome: boolean): Promise<string[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/getTransactionTypes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isIncome }),
    });
    const result = await response.json();
    if (!result.ok) {
      alert('Error al obtener las categorías: ' + result.data);
    }
    return result.data;
  }
}
