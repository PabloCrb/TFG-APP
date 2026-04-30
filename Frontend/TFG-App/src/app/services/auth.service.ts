import { Injectable } from '@angular/core';
import {API_URL} from '../constants';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  async login(usernameOrEmail: string, password: string): Promise<{ ok: boolean; data: any }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    const data = await response.json();

    return {
      ok: response.ok,
      data,
    };
  }

  logout(): void {}

  isAuthenticated(): boolean {
    return false;
  }

  async registerWithEmail(
    username: string,
    email: string,
    password: string,
  ): Promise<{ ok: boolean; data: any }> {
    const response = await fetch(`${API_URL}/auth/registerWithEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    return {
      ok: response.ok,
      data,
    };
  }
}
