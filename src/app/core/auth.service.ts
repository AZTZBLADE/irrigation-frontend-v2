import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  id?: number;
  token: string;
  role?: string;
  name?: string;
  email?: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private api = 'http://localhost:8080/api/users';

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, payload).pipe(
      tap((res) => {
        if (!res?.token) return;

        this.setItem('token', res.token);

        if (res.id !== undefined && res.id !== null) {
          this.setItem('userId', String(res.id));
        }

        if (res.role) this.setItem('role', res.role);
        if (res.name) this.setItem('name', res.name);
        if (res.email) this.setItem('email', res.email);
      })
    );
  }

  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.api}/register`, payload);
  }

  private setItem(key: string, value: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(key, value);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('token');
  }

  getRole(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return localStorage.getItem('role') || '';
  }

  getUserId(): number | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const value = localStorage.getItem('userId');
    if (!value) return null;

    const id = Number(value);
    return Number.isNaN(id) ? null : id;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
  }
}