import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ComparisonDTO {
  today: number;
  yesterday: number;
}

export interface CropUsage {
  crop: string;
  totalWater: number;
}

export interface DailyUsage {
  day: string;
  totalWater: number;
}

export interface HourlyIntensity {
  hour: number;
  totalWater: number;
}

export interface DailyDebit {
  day: string;
  averageDebit: number;
}

export interface DailySurface {
  date: string;
  totalSurface: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/analytics';

  getComparison(): Observable<ComparisonDTO> {
    return this.http.get<ComparisonDTO>(`${this.api}/compare`);
  }

  getCropUsage(): Observable<CropUsage[]> {
    return this.http.get<CropUsage[]>(`${this.api}/crop`);
  }

  getWeeklyUsage(): Observable<DailyUsage[]> {
    return this.http.get<DailyUsage[]>(`${this.api}/weekly`);
  }

  getHourlyIntensity(): Observable<HourlyIntensity[]> {
    return this.http.get<HourlyIntensity[]>(`${this.api}/hourly`);
  }

  getDailyDebit(): Observable<DailyDebit[]> {
    return this.http.get<DailyDebit[]>(`${this.api}/debit`);
  }

  getDailySurface(): Observable<DailySurface[]> {
    return this.http.get<DailySurface[]>(`${this.api}/surface`);
  }
}