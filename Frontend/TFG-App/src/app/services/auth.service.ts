import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  async login(usernameOrEmail: string, password: string): Promise<{ ok: boolean; data: any }> {
    const response = await fetch('http://localhost:3000/auth/login', {
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
    const response = await fetch('http://localhost:3000/auth/registerWithEmail', {
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
