
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
})
export class UserDashboardComponent implements OnInit {
  notifications: string[] = [];
  loadingNotifications = false;
  showNotifications = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loadingNotifications = true;

    this.http
      .get<string[]>('http://localhost:8080/api/tasks/notifications/scan')
      .subscribe({
        next: (res) => {
          this.notifications = Array.isArray(res) ? res : [];
          this.loadingNotifications = false;
        },
        error: (err) => {
          console.error('Error loading notifications:', err);
          this.notifications = [];
          this.loadingNotifications = false;
        },
      });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}

