import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormTemplate } from '../../templates/form-template/form-template';
import { FormConfigInterface } from '../../interfaces/form-config-interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-component',
  imports: [FormTemplate],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  _router: Router = inject(Router);
  _authService = inject(AuthService);

  formConfig: FormConfigInterface[] = [
    {
      type: 'text',
      name: 'usernameOrEmail',
      label: 'Nombre de usuario o correo electrónico',
      validators: ['required'],
      errors: {
        required: 'El nombre de usuario o correo electrónico es obligatorio',
      },
    },
    {
      type: 'password',
      name: 'password',
      label: 'Contraseña',
      validators: ['required', 'passwordStrength'],
      errors: {
        required: 'La contraseña es obligatoria',
        passwordStrength: 'La contraseña debe tener al menos 8 caracteres',
      },
    },
  ];

  async login(formValue: any): Promise<void> {
    const { usernameOrEmail, password } = formValue;
    const response = await this._authService.login(usernameOrEmail, password);

    if (response.ok) {
      localStorage.setItem('token', response.data.token);
      this._router.navigate(['/transactions']);
    } else {
      alert(`Error: ${response.data.message}`);
    }
  }
}
