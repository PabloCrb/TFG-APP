import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ViewContainerRef,
  Type,
  ComponentRef,
  Input,
} from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-dialog',
  standalone: true,
  templateUrl: './dialog.html',
  styleUrls: ['./dialog.css'],
  imports: [NgStyle],
})
export class DialogComponent {
  @Input() config: any = {};
  @Output() onClose = new EventEmitter<any>();
  @Output() action = new EventEmitter<any>();

  @ViewChild('contenedor', { read: ViewContainerRef, static: true })
  contenedor!: ViewContainerRef;
  titulo: string = '';

  dialogStyles: any = null;

  ngOnInit() {
    this.dialogStyles = {
      'max-width': this.config?.maxWidth || '400px',
    };
  }

  cargarComponente<T>(component: Type<T>, inputs?: any): ComponentRef<T> {
    this.contenedor.clear();

    const componentRef = this.contenedor.createComponent(component);
    const instance: any = componentRef.instance;

    if (instance.action && instance.action.subscribe) {
      instance.action.subscribe((data: any) => {
        this.add(data);
      });
    }

    if (inputs) {
      Object.assign(componentRef.instance as any, inputs);
    }

    return componentRef;
  }

  add(data?: any) {
    this.action.emit(data);
  }

  cerrar(data?: any) {
    this.onClose.emit(data);
  }

  cancelar() {
    this.onClose.emit(null);
  }
}
