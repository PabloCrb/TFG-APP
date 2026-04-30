import { Injectable } from '@angular/core';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  constructor() {}

  async createCard(cardData: any): Promise<{ ok: boolean; data: any }> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/createCard`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardData),
    });
    const data = await response.json();

    return {
      ok: response.ok,
      data,
    };
  }

  async getUserCards(): Promise<{ ok: boolean; data: any }> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/getUserCards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();

    return {
      ok: response.ok,
      data,
    };
  }
}
