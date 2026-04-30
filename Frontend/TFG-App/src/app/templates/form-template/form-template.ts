import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-template',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './form-template.html',
  styleUrl: './form-template.css',
})
export class FormTemplate implements OnInit {
  _fb: FormBuilder = inject(FormBuilder);

  @Input() config: any[] = [];
  @Input() submitButtonText?: string;
  @Input() form!: FormGroup;
  @Input() initialData!: any;

  @Output() formSubmit = new EventEmitter<any>();

  passwordVisible: Record<string, boolean> = {};

  ngOnInit() {
    const group: any = {};

    this.config.forEach((field) => {
      const initialValue = field.multiple ? [] : '';

      group[field.name] = [initialValue, this.mapValidators(field.validators)];
    });

    this.form = this._fb.group(group);

    if (this.initialData) {
      this.config.forEach((field) => {
        if (field.multiple && this.initialData[field.name]) {
          const control = this.form.get(field.name);

          control?.setValue([...this.initialData[field.name]]);
        } else {
          this.form.patchValue({
            [field.name]: this.initialData[field.name],
          });
        }
      });
    }
  }

  mapValidators(validators: string[] = []) {
    const result = [];

    if (validators.includes('required')) result.push(Validators.required);
    if (validators.includes('email')) result.push(Validators.email);
    if (validators.includes('minLength:8')) result.push(Validators.minLength(8));

    return result;
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmit.emit(this.form.value);
  }

  togglePasswordVisibility(fieldName: string) {
    this.passwordVisible[fieldName] = !this.passwordVisible[fieldName];
  }

  getControl(name: string): AbstractControl | null {
    return this.form.get(name);
  }

  getErrors(name: string): string[] {
    const control = this.getControl(name);
    if (!control || !control.errors) return [];

    return Object.keys(control.errors);
  }

  isSelected(fieldName: string, value: any): boolean {
    const selected = this.form.get(fieldName)?.value || [];
    return selected.some((v: any) => Number(v) === Number(value));
  }

  toggleSelection(fieldName: string, value: any) {
    const control = this.form.get(fieldName);
    const selected = control?.value || [];

    if (selected.includes(value)) {
      control?.setValue(selected.filter((v: any) => v !== value));
    } else {
      control?.setValue([...selected, value]);
    }

    control?.markAsTouched();
  }
}
