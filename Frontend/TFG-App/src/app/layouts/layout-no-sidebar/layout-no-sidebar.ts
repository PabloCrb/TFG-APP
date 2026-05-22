import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-no-sidebar',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './layout-no-sidebar.html',
  styleUrl: './layout-no-sidebar.css',
})
export class LayoutNoSidebar {}
