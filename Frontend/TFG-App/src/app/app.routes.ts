import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login-component/login-component';
import { RegisterComponent } from './auth/register-component/register-component';
import { ContainerTransactions } from './transactions/container-transactions/container-transactions';
import { authGuard } from '../auth-guard';
import { BudgetContainerComponent } from './budgets/budget-container-component/budget-container-component';
import { ReportsContainer } from './reports/reports-container/reports-container';
import { LayoutWithSidebar } from './layouts/layout-with-sidebar/layout-with-sidebar';
import { LayoutNoSidebar } from './layouts/layout-no-sidebar/layout-no-sidebar';
import { DashboardContainer } from './dashboard/dashboard-container/dashboard-container';

export const routes: Routes = [
  {
    path: '',
    component: LayoutNoSidebar,
    children: [
      { path: '', component: LoginComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ],
  },

  {
    path: '',
    component: LayoutWithSidebar,
    canActivate: [authGuard],
    children: [
      { path: 'transactions', component: ContainerTransactions },
      { path: 'budgets', component: BudgetContainerComponent },
      { path: 'reports', component: ReportsContainer },
      { path: 'dashboard', component: DashboardContainer },
    ],
  },
];
