import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    if (Date.now() > exp) {
      localStorage.removeItem('token');
      router.navigate(['/login']);
      return false;
    }
    return true;
  } catch (error) {
    localStorage.removeItem('token');
    router.navigate(['/login']);
    return false;
  }
};
