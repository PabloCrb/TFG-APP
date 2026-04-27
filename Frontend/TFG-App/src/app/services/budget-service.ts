import { Injectable } from '@angular/core';
import { Budget } from '../interfaces/budget-interface';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  async getUserBudgets(cardID: number): Promise<Budget[]> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/budgets/getUserBudgets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardID }),
    });
    const data = await response.json();
    if (!data.ok) alert('Error al obtener los presupuestos: ' + data.data);

    return data.data.map((b: any) => ({
      ...b,
      amount: parseFloat(b.amount),
      spent: Number(b.spent),
      transaction_ids: JSON.parse(b.transaction_ids),
    }));
  }

  async createBudget(budgetData: Budget): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/budgets/createBudget', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(budgetData),
    });
    const data = await response.json();

    if (!data.ok) {
      alert('Error al crear el presupuesto: ' + data.data);
      return null;
    } else return data.data;
  }

  async editBudget(budget: Budget): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/budgets/editBudget', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ budget }),
    });
    return await response.json();
  }

  async deleteBudget(budget: Budget) {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/budgets/deleteBudget', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ budgetID: budget.budget_id }),
    });
    return await response.json();
  }

  async getTransactionsForBudget(transaction_ids: number[]): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/budgets/getTransactionsForBudget', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction_ids }),
    });
    return await response.json();
  }
}
