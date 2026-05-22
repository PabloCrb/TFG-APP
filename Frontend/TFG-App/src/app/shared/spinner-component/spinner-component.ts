import { Component, inject } from '@angular/core';
import { SpinnerService } from '../../services/shared/spinner-service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-spinner-component',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './spinner-component.html',
  styleUrl: './spinner-component.css',
})
export class SpinnerComponent {
  _spinnerService: SpinnerService = inject(SpinnerService);

  loading$ = this._spinnerService.loading$;
}
