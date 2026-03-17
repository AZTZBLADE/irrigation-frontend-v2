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

  private usersApi = 'http://localhost:8080/api/users';
  private tasksApi = 'http://localhost:8080/api/tasks';

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.usersApi}/all`);
  }

  deleteUser(id: number): Observable<string> {
    return this.http.delete(`${this.usersApi}/${id}`, {
      responseType: 'text',
    });
  }

getAllTasks(): Observable<AdminTask[]> {
  return this.http.get<AdminTask[]>(`http://localhost:8080/api/tasks/all`);
}
}