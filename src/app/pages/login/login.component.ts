import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {}

  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit() {

    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.auth.login(this.form.value as any).subscribe({
      next: (res) => {

        this.loading = false;

        const role = (res?.role || this.auth.getRole() || '').toUpperCase();

        if (role.includes('ADMIN')) {
          this.router.navigateByUrl('/admin');
        } else {
          this.router.navigateByUrl('/user');
        }
      },
      error: (err: any) => {

        this.loading = false;

        this.error =
          err?.error?.message ||
          'Invalid email or password.';
      },
    });
  }
}