import { Injectable } from '@angular/core';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  async getSummary(cardID: number): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/dashboard/getSummary`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardID }),
    });
    const data = await response.json();
    if (data.ok) return data.data;
    else {
      alert('Error fetching dashboard summary: ' + data.data);
      return null;
    }
  }
}
