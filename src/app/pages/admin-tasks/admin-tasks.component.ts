import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminTask } from '../../core/admin.service';

@Component({
  selector: 'app-admin-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tasks.component.html',
  styleUrl: './admin-tasks.component.scss',
})
export class AdminTasksComponent implements OnInit {
  loading = false;
  error = '';
  searchTerm = '';

  tasks: AdminTask[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getAllTasks().subscribe({
      next: (res) => {
        this.tasks = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('ADMIN TASKS ERROR', err);
        this.error = 'Failed to load all users tasks.';
        this.loading = false;
      },
    });
  }

  get filteredTasks(): AdminTask[] {
    const q = this.searchTerm.trim().toLowerCase();

    return this.tasks.filter((t) => {
      if (!q) return true;

      return (
        (t.name || '').toLowerCase().includes(q) ||
        (t.location || '').toLowerCase().includes(q) ||
        (t.crop || '').toLowerCase().includes(q) ||
        (t.userEmail || '').toLowerCase().includes(q) ||
        (t.status || '').toLowerCase().includes(q)
      );
    });
  }

  statusLabel(status?: string): string {
    if (status === 'terminated') return 'Completed';
    if (status === 'ongoing') return 'In Progress';
    return 'Planned';
  }
}