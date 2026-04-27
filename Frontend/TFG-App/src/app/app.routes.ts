import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login-component/login-component';
import { RegisterComponent } from './auth/register-component/register-component';
import { ContainerTransactions } from './transactions/container-transactions/container-transactions';
import { authGuard } from '../auth-guard';
import { BudgetContainerComponent } from './budgets/budget-container-component/budget-container-component';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'transactions',
    component: ContainerTransactions,
    canActivate: [authGuard],
  },
  {
    path: 'budgets',
    component: BudgetContainerComponent,
    canActivate: [authGuard],
  },
];
