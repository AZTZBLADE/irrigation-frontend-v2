import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GeoJsonGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties?: Record<string, any>;
}

export interface Farm {
  id?: number;
  name: string;
  crop: string;
  location: string;
  surface: number;
  soilProfile: string;
  parcelJson?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FarmService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/farms';

  getFarms(): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${this.api}/all`);
  }

  getFarmById(id: number): Observable<Farm> {
    return this.http.get<Farm>(`${this.api}/${id}`);
  }

  createFarm(farm: Farm): Observable<Farm> {
    return this.http.post<Farm>(`${this.api}/create`, farm);
  }

  updateFarm(id: number, farm: Farm): Observable<Farm> {
    return this.http.put<Farm>(`${this.api}/${id}`, farm);
  }

  deleteFarm(id: number): Observable<string> {
    return this.http.delete(`${this.api}/${id}`, {
      responseType: 'text',
    });
  }

  irrigateFarm(
    id: number,
    body: { waterAmount: number; duration: number; debit: number }
  ): Observable<string> {
    return this.http.post(`${this.api}/${id}/irrigate`, body, {
      responseType: 'text',
    });
  }
}