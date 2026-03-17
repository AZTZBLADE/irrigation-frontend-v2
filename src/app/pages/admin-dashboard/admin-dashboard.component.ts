import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AdminTask, AdminUser } from '../../core/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  loading = false;
  error = '';

  users: AdminUser[] = [];
  tasks: AdminTask[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users || [];

        this.adminService.getAllTasks().subscribe({
          next: (tasks) => {
            this.tasks = tasks || [];
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.error = 'Failed to load tasks.';
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load users.';
        this.loading = false;
      },
    });
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get totalTasks(): number {
    return this.tasks.length;
  }

  get plannedTasks(): number {
    return this.tasks.filter((t) => (t.status || 'planned') === 'planned').length;
  }

  get ongoingTasks(): number {
    return this.tasks.filter((t) => (t.status || 'planned') === 'ongoing').length;
  }

  get completedTasks(): number {
    return this.tasks.filter((t) => (t.status || 'planned') === 'terminated').length;
  }

  get recentUsers(): AdminUser[] {
    return this.users.slice(0, 5);
  }

  get recentTasks(): AdminTask[] {
    return this.tasks.slice(0, 5);
  }

  roleLabel(user: AdminUser): string {
    if (typeof user.role === 'string') return user.role;
    return user.role?.name || 'ROLE_USER';
  }

  statusLabel(status?: string): string {
    if (status === 'terminated') return 'Completed';
    if (status === 'ongoing') return 'In Progress';
    return 'Planned';
  }
}