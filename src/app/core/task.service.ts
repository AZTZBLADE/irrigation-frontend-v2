import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TaskStatus = 'planned' | 'ongoing' | 'terminated';

export interface Task {
  id?: number;
  name: string;
  location: string;
  duration: number;
  waterAmount: number;
  debit: number;
  startTime: string;
  crop: string;
  userEmail?: string;
  status?: TaskStatus;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/tasks';

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.api}/all`);
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.api}/create`, task);
  }

  updateTask(id: number, task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.api}/${id}`, task);
  }

  deleteTask(id: number): Observable<string> {
    return this.http.delete(`${this.api}/${id}`, {
      responseType: 'text',
    });
  }
}