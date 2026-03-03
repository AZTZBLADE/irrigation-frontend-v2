import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
})
export class UserDashboardComponent {

  name: string = '';
  email: string = '';
  role: string = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    // نجيبو المعلومات من localStorage
    this.name = localStorage.getItem('name') || 'User';
    this.email = localStorage.getItem('email') || '-';
    this.role = localStorage.getItem('role') || 'ROLE_USER';
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  // Buttons (تنجم تبدلهم بعد بroutes حقيقية)
  goProfile() {
    alert('Profile page later');
  }

  goIrrigation() {
    alert('Irrigation page later');
  }

  goSensors() {
    alert('Sensors page later');
  }
}