import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../core/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  loading = false;
  error = '';
  searchTerm = '';

  users: AdminUser[] = [];
  roleOptions: string[] = ['ROLE_USER', 'ROLE_ADMIN'];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getAllUsers().subscribe({
      next: (res) => {
        this.users = (res || []).map((user) => ({
          ...user,
          role: this.roleLabel(user),
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load users.';
        this.loading = false;
      },
    });
  }

  deleteUser(user: AdminUser): void {
    if (!user.id) return;

    const confirmed = confirm(`Delete user "${user.name}" ?`);
    if (!confirmed) return;

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Delete user failed.';
      },
    });
  }

  changeRole(user: AdminUser, event: Event): void {
    if (!user.id) return;

    const select = event.target as HTMLSelectElement;
    const newRole = select.value;
    const oldRole = this.roleLabel(user);

    if (newRole === oldRole) return;

    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        user.role = newRole;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Update role failed.';
        select.value = oldRole;
      },
    });
  }

  get filteredUsers(): AdminUser[] {
    const q = this.searchTerm.trim().toLowerCase();

    return this.users.filter((u) => {
      if (!q) return true;

      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        this.roleLabel(u).toLowerCase().includes(q)
      );
    });
  }

  roleLabel(user: AdminUser): string {
    if (typeof user.role === 'string') return user.role;
    return user.role?.name || 'ROLE_USER';
  }
}