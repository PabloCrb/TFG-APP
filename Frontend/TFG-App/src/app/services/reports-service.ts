import { Injectable } from '@angular/core';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  async generateAIReport(categoriesIDs: number[], selectedCard: number) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/AI/generateAIReport`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoriesIDs: categoriesIDs, selectedCard: selectedCard }),
    });
    return await response.json();
  }
}
