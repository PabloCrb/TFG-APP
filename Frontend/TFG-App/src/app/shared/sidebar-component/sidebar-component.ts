import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, Router } from '@angular/router';
import { NotificationsService } from '../../services/notifications-service';
import { NotificationComponent } from '../notification-component/notification-component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  templateUrl: './sidebar-component.html',
  styleUrls: ['./sidebar-component.css'],
})
export class SidebarComponent {
  _router: Router = inject(Router);
  _notificationsService = inject(NotificationsService);

  open: boolean = false;
  notifications: any[] = [];
  unreadCount: number = 0;

  menuItems = [
    { value: 'transactions', label: 'Transacciones', active: true },
    { value: 'budgets', label: 'Presupuestos', active: false },
    { value: 'dashboard', label: 'Dashboard', active: false },
    { value: 'reports', label: 'Informes', active: false },
    { value: 'settings', label: 'Ajustes', active: false },
  ];

  async ngOnInit() {
    await this.getNotifications();
    const currentPath = this._router.url.replace('/', '');
    this.menuItems.forEach((item) => {
      item.active = item.value === currentPath;
    });
  }

  async getNotifications() {
    this.notifications = await this._notificationsService.getNotifications();
    this.unreadCount = this.notifications.filter((n) => !n.read).length;
  }

  seleccionarItem(itemSeleccionado: any) {
    this.menuItems.forEach((item) => (item.active = false));
    itemSeleccionado.active = true;
    this._router.navigate([`/${itemSeleccionado.value}`]);
  }

  navigateToLogin() {
    this._router.navigate([``]);
  }

  async onMarkAsRead(notificationId: string) {
    await this._notificationsService.markAsRead(notificationId);
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.unreadCount = this.notifications.filter((n) => !n.read).length;
  }
}
