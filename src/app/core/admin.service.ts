import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  id?: number;
  name: string;
  email: string;
  role?: string | { id?: number; name?: string };
}

export interface AdminTask {
  id?: number;
  name: string;
  location: string;
  surface?: number;
  duration: number;
  waterAmount: number;
  debit: number;
  startTime: string;
  crop: string;
  userEmail?: string;
  status?: 'planned' | 'ongoing' | 'terminated';
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);

  private allUsersApi = 'http://localhost:8080/api/users/admin';
  private usersApi = 'http://localhost:8080/api/users/admin/users';
  private tasksApi = 'http://localhost:8080/api/users/admin/tasks';

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.allUsersApi}/all`);
  }

  deleteUser(id: number): Observable<string> {
    return this.http.delete(`${this.usersApi}/${id}`, {
      responseType: 'text',
    });
  }

  getAllTasks(): Observable<AdminTask[]> {
    return this.http.get<AdminTask[]>(`${this.tasksApi}/all`);
  }

  updateUserRole(id: number, role: string): Observable<string> {
    return this.http.put(
      `${this.usersApi}/${id}/role`,
      { role },
      { responseType: 'text' }
    );
  }
}