import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-report.component.html',
  styleUrl: './user-report.component.scss'
})
export class UserReportComponent {

  loading = false;

  constructor(private http: HttpClient) {}

  downloadReport(): void {
    this.loading = true;

    const token = localStorage.getItem('token');

    this.http.get('http://localhost:8080/report-service/api/reports/download', {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (res: Blob) => {
        const blob = new Blob([res], { type: 'application/pdf' });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'report.pdf';
        a.click();

        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (err) => {
        console.error('Download error:', err);
        this.loading = false;
      }
    });
  }
}