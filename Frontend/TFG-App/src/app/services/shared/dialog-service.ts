import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  Injectable,
  Injector,
  Type,
} from '@angular/core';
import { DialogComponent } from '../../shared/dialog/dialog';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(
    private appRef: ApplicationRef,
    private injector: Injector,
  ) {}

  openComponent<T>(componente: Type<T>, inputs?: any, dialogConfig?: any): Promise<any> {
    return new Promise((resolve) => {
      const componentRef = createComponent(DialogComponent, {
        environmentInjector: this.appRef.injector,
      });

      this.appRef.attachView(componentRef.hostView);
      document.body.appendChild((componentRef.hostView as any).rootNodes[0]);

      const dialog = componentRef.instance;

      if (dialogConfig) {
        dialog.config = dialogConfig;
      }

      const childRef = dialog.cargarComponente(componente, inputs);

      const instance: any = childRef.instance;

      if (instance.formSubmit && instance.formSubmit.subscribe) {
        instance.formSubmit.subscribe((data: any) => {
          dialog.cerrar(data);
        });
      }

      dialog.onClose.subscribe((result: any) => {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        resolve(result);
      });

      dialog.action.subscribe((result: any) => {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        resolve(result);
      });
    });
  }
}
