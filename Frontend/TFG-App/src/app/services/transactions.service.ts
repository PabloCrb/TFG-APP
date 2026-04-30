import { Injectable } from '@angular/core';
import { Transaction } from '../interfaces/transaction-interface';
import { RecurringTransaction } from '../interfaces/recurring-transaction-interface';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class TransactionsService {
  async addTransaction(
    selectedCardID: number | null,
    transaction: Transaction,
  ): Promise<{ ok: boolean; data: any }> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/addTransaction`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedCardID, transaction }),
    });
    const data = await response.json();

    return { ok: response.ok, data };
  }

  async getTransactions(selectedCardID: number | null): Promise<{ ok: boolean; data: any[] }> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/getTransactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedCardID }),
    });
    return await response.json();
  }

  async deleteTransacion(transaction: Transaction) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/deleteTransaction`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction }),
    });
    return await response.json();
  }

  async updateBalance(amount: number, cardID: number) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/updateBalance`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, cardID }),
    });
    return await response.json();
  }

  async editTransaction(transaction: Transaction) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/editTransaction`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: transaction }),
    });
    return await response.json();
  }

  async getRecurringUserTransactions(cardID: number) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/transactions/getRecurringUserTransactions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardID }),
      },
    );
    return await response.json();
  }

  async addRecurringTransaction(rt: RecurringTransaction) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/addRecurringTransaction`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: rt }),
    });
    return await response.json();
  }

  async editRecurringTransaction(rt: RecurringTransaction) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/editRecurringTransaction`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: rt }),
    });
    return await response.json();
  }

  async deleteRecurringTransaction(rt: RecurringTransaction) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/deleteRecurringTransaction`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: rt }),
    });
    return await response.json();
  }

  async createTransactionType(data: any) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/transactions/createTransactionType`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    return await response.json();
  }
}
