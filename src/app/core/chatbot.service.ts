import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private baseUrl = 'http://localhost:8080/api/bot';

  constructor(private http: HttpClient) {}

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

  chat(message: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/chat`,
      message,
      {
        headers: this.getAuthHeaders('text/plain'),
        responseType: 'text',
      }
    );
  }

  analyzeImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/analyze`, formData, {
      headers: this.getAuthHeaders(),
    });
  }
}