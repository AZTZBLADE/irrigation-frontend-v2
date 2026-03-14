import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/users';

  getProfile(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.api}/${id}`);
  }

  updateProfile(id: number, payload: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.api}/${id}`, payload);
  }

  deleteProfile(id: number): Observable<string> {
    return this.http.delete(`${this.api}/${id}`, {
      responseType: 'text',
    });
  }
}