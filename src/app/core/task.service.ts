import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TaskStatus = 'planned' | 'ongoing' | 'terminated';

export interface Task {
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
  status?: TaskStatus;
}

export interface WeatherTaskInsight {
  taskId: number;
  taskName: string;
  crop: string;
  location: string;
  surface: number;
  duration: number;
  waterAmount: number;
  startTime: string;
  weather: {
    cityName: string;
    temperature: number;
    humidity: number;
    rainProbability: number;
    description: string;
  };
  aiAdvice: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private http = inject(HttpClient);

  private tasksApi = 'http://localhost:8080/api/tasks';
  private weatherApi = 'http://localhost:8080/api/weather';

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.tasksApi}/all`);
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.tasksApi}/create`, task);
  }

  updateTask(id: number, task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.tasksApi}/${id}`, task);
  }

  deleteTask(id: number): Observable<string> {
    return this.http.delete(`${this.tasksApi}/${id}`, {
      responseType: 'text',
    });
  }

  getTaskWeatherInsight(taskId: number): Observable<WeatherTaskInsight> {
    return this.http.get<WeatherTaskInsight>(`${this.weatherApi}/task/${taskId}`);
  }

  getAutomatedInsights(): Observable<any> {
    return this.http.get<any>(`${this.weatherApi}/automated-insights`);
  }
}