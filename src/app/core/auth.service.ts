import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

export type LoginPayload = { email: string; password: string };

export type LoginResponse = {
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

  // ========================= LOGIN =========================
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, payload).pipe(
      tap((res) => {
        if (!res?.token) return;

        // ✅ localStorage only in browser
        if (!isPlatformBrowser(this.platformId)) return;

        localStorage.setItem('token', res.token);

        if (res.role) localStorage.setItem('role', res.role);
        if (res.name) localStorage.setItem('name', res.name);
        if (res.email) localStorage.setItem('email', res.email);
      })
    );
  }

  // ========================= REGISTER =========================
  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.api}/register`, payload);
  }

  // ========================= HELPERS =========================
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('token');
  }

  getRole(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return localStorage.getItem('role') || '';
  }

  getName(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return localStorage.getItem('name') || '';
  }

  getEmail(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return localStorage.getItem('email') || '';
  }

  isLoggedIn(): boolean {
    const t = this.getToken();
    return !!t && t.length > 10;
  }

  logout() {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
  }
}