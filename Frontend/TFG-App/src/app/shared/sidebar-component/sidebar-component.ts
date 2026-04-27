import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-component.html',
  styleUrls: ['./sidebar-component.css'],
})
export class SidebarComponent {
  _router: Router = inject(Router);

  menuItems = [
    { value: 'transactions', label: 'Transacciones', active: true },
    { value: 'budgets', label: 'Presupuestos', active: false },
    { value: 'dashboard', label: 'Dashboard', active: false },
    { value: 'reports', label: 'Informes', active: false },
    { value: 'settings', label: 'Ajustes', active: false },
  ];

  ngOnInit() {
    const currentPath = this._router.url.replace('/', '');
    this.menuItems.forEach((item) => {
      item.active = item.value === currentPath;
    });
  }

  seleccionarItem(itemSeleccionado: any) {
    this.menuItems.forEach((item) => (item.active = false));
    itemSeleccionado.active = true;
    this._router.navigate([`/${itemSeleccionado.value}`]);
  }
}
