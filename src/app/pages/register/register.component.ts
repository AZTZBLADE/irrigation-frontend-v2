import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  loading = false;
  error = '';

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit() {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    // ✅ backend يستنى: name/email/password
    const payload = {
      name: this.form.value.fullName!,
      email: this.form.value.email!,
      password: this.form.value.password!,
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/login');
      },
      error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.error =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : '') ||
          'Register failed';
      },
    });
  }
}