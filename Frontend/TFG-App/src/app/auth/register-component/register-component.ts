import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormTemplate } from '../../templates/form-template/form-template';
import { FormConfigInterface } from '../../interfaces/form-config-interface';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ShowFormRegister } from '../../interfaces/showFormRegister';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-component',
  imports: [FormTemplate],
  templateUrl: './register-component.html',
  styleUrl: './register-component.css',
})
export class RegisterComponent {
  _authService = inject(AuthService);
  _router = inject(Router);
  fb: FormBuilder = inject(FormBuilder);

  ShowFormRegister = ShowFormRegister;
  showFormRegister?: ShowFormRegister | null;
  form!: FormGroup<any>;

  formConfig: FormConfigInterface[] = [
    {
      type: 'text',
      name: 'username',
      label: 'Nombre de usuario',
      validators: ['required'],
      errors: {
        required: 'El nombre de usuario es obligatorio',
      },
    },
    {
      type: 'email',
      name: 'email',
      label: 'Correo electrónico',
      validators: ['required', 'email'],
      errors: {
        email: 'Formato no válido',
        required: 'El correo electrónico es obligatorio',
      },
    },
    {
      type: 'password',
      name: 'password',
      label: 'Contraseña',
      validators: ['required', 'minLength:8'],
      errors: {
        required: 'La contraseña es obligatoria',
        minlength: 'La contraseña debe tener al menos 8 caracteres',
      },
    },
  ];

  ngOnInit() {
    this.form = this.fb.group({
      username: [''],
      email: [''],
      password: [''],
    });
  }

  showEmailRegisterForm() {
    this.showFormRegister = ShowFormRegister.EMAIL;
  }

  async registerWithEmail(formValue: any) {
    const { username, email, password } = formValue;
    const response = await this._authService.registerWithEmail(username, email, password);
    this.handleSignUpResponse(response);
  }

  private handleSignUpResponse(response: { ok: boolean; data: any }) {
    if (!response.ok) {
      if (response.data.message.includes('usuario')) {
        alert(response.data.message);
      }

      if (response.data.message.includes('email')) {
        alert(response.data.message);
      }
    } else {
      alert('Usuario creado con éxito');
      this.navigateToLogin();
    }
  }

  navigateToLogin() {
    this._router.navigate(['/']);
  }
}
