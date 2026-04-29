import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/weather';

  getAllWeather(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/all-status`);
  }
}