import { Component } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar-component/sidebar-component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-with-sidebar',
  imports: [SidebarComponent, RouterOutlet],
  standalone: true,
  templateUrl: './layout-with-sidebar.html',
  styleUrl: './layout-with-sidebar.css',
})
export class LayoutWithSidebar {}
