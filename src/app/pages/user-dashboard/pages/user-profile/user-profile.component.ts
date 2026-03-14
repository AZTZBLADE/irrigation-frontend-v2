import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, UserProfile } from '../../../../core/profile.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  loading = false;
  saving = false;
  error = '';
  success = '';

  profile: UserProfile | null = null;
  userId: number | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
  });

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();

    if (!this.userId) {
      this.error = 'User ID not found. Please login again.';
      return;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    if (!this.userId) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.profileService.getProfile(this.userId).subscribe({
      next: (res) => {
        this.profile = res;

        this.form.patchValue({
          name: res.name || '',
          email: res.email || '',
          password: '',
        });

        this.loading = false;
      },
      error: (err) => {
        console.error('PROFILE LOAD ERROR', err);
        this.error = 'Failed to load profile.';
        this.loading = false;
      },
    });
  }

  saveProfile(): void {
    this.error = '';
    this.success = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.userId) return;

    const raw = this.form.getRawValue();

    const payload: UserProfile = {
      name: raw.name || '',
      email: raw.email || '',
    };

    if (raw.password && raw.password.trim()) {
      payload.password = raw.password;
    }

    this.saving = true;

    this.profileService.updateProfile(this.userId, payload).subscribe({
      next: (res) => {
        this.profile = res;
        this.success = 'Profile updated successfully.';
        this.saving = false;

        this.form.patchValue({
          password: '',
        });
      },
      error: (err) => {
        console.error('PROFILE UPDATE ERROR', err);
        this.error = 'Update failed.';
        this.saving = false;
      },
    });
  }

  deleteAccount(): void {
    this.error = '';
    this.success = '';

    if (!this.userId) return;

    const confirmed = confirm(
      'Are you sure you want to delete your account?'
    );

    if (!confirmed) return;

    this.profileService.deleteProfile(this.userId).subscribe({
      next: () => {
        this.authService.logout();
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        console.error('DELETE ACCOUNT ERROR', err);
        this.error = 'Delete account failed.';
      },
    });
  }

  get userInitial(): string {
    return this.form.get('name')?.value?.charAt(0)?.toUpperCase() || 'U';
  }
}