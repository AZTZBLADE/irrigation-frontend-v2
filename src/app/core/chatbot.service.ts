import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private baseUrl = 'http://localhost:8080/api/bot';

  constructor(private http: HttpClient) {}

  // ===== Headers (JWT) =====
  private getAuthHeaders(contentType?: string): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    if (contentType) {
      headers = headers.set('Content-Type', contentType);
    }

    return headers;
  }

  // ===== CHAT TEXT =====
  chat(message: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/chat`, message, {
      headers: this.getAuthHeaders('text/plain'),
      responseType: 'text',
    });
  }

  // ===== IMAGE ANALYSIS =====
  analyzeImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/analyze`, formData, {
      headers: this.getAuthHeaders(), // ❌ ما نحطوش content-type هنا
      responseType: 'text', // 🔥 أهم fix
    });
  }

  // ===== OPTIONAL: TEST CONNECTION =====
  ping(): Observable<string> {
    return this.http.get(`${this.baseUrl}/ping`, {
      responseType: 'text',
    });
  }
}