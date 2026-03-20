import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

import {
  AnalyticsService,
  ComparisonDTO,
  CropUsage,
  DailyUsage,
  HourlyIntensity,
  DailyDebit,
  DailySurface
} from '../../../../core/analytics.service';

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './user-analytics.component.html',
  styleUrls: ['./user-analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  loading = true;
  error = '';
  comparison: ComparisonDTO | null = null;

  doughnutData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#38b27f',
          '#5b46d6',
          '#e0aa2b',
          '#ef7d57',
          '#2f80ed',
          '#8b5cf6'
        ],
        borderWidth: 0
      }
    ]
  };

  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
          color: '#374151',
          font: {
            size: 13
          }
        }
      }
    }
  };

  weeklyBarData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Water usage',
        data: [],
        backgroundColor: '#2f80ed',
        borderRadius: 8,
        maxBarThickness: 38
      }
    ]
  };

  weeklyBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#4b5563',
          font: { size: 12 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280',
          font: { size: 12 }
        }
      }
    }
  };

  hourlyBarData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Hourly intensity',
        data: [],
        backgroundColor: '#38b27f',
        borderRadius: 6,
        maxBarThickness: 18
      }
    ]
  };

  hourlyBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#4b5563',
          font: { size: 11 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280',
          font: { size: 12 }
        }
      }
    }
  };

  debitLineData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Average debit',
        data: [],
        borderColor: '#e0aa2b',
        backgroundColor: '#e0aa2b',
        pointBackgroundColor: '#e0aa2b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
        tension: 0.35,
        fill: false
      }
    ]
  };

  debitLineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#4b5563',
          font: { size: 12 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280',
          font: { size: 12 }
        }
      }
    }
  };

  surfaceLineData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Surface',
        data: [],
        borderColor: '#5b46d6',
        backgroundColor: 'rgba(91, 70, 214, 0.12)',
        pointBackgroundColor: '#5b46d6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
        tension: 0.35,
        fill: true
      }
    ]
  };

  surfaceLineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#4b5563',
          font: { size: 12 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280',
          font: { size: 12 }
        }
      }
    }
  };

  ngOnInit(): void {
    this.loadAllAnalytics();
  }

  loadAllAnalytics(): void {
    this.loading = true;
    this.error = '';

    let requestsCompleted = 0;
    const totalRequests = 6;

    const completeOne = () => {
      requestsCompleted++;
      if (requestsCompleted === totalRequests) {
        this.loading = false;
      }
    };

    this.analyticsService.getComparison().subscribe({
      next: (data: ComparisonDTO) => {
        this.comparison = data;
        completeOne();
      },
      error: () => {
        this.error = 'Failed to load comparison data';
        completeOne();
      }
    });

    this.analyticsService.getCropUsage().subscribe({
      next: (data: CropUsage[]) => {
        this.setCropChart(data);
        completeOne();
      },
      error: () => {
        this.error = 'Failed to load crop usage';
        completeOne();
      }
    });

    this.analyticsService.getWeeklyUsage().subscribe({
      next: (data: DailyUsage[]) => {
        this.setWeeklyChart(data);
        completeOne();
      },
      error: () => {
        this.error = 'Failed to load weekly usage';
        completeOne();
      }
    });

    this.analyticsService.getHourlyIntensity().subscribe({
      next: (data: HourlyIntensity[]) => {
        this.setHourlyChart(data);
        completeOne();
      },
      error: () => {
        this.error = 'Failed to load hourly intensity';
        completeOne();
      }
    });

    this.analyticsService.getDailyDebit().subscribe({
      next: (data: DailyDebit[]) => {
        this.setDebitChart(data);
        completeOne();
      },
      error: () => {
        this.error = 'Failed to load daily debit';
        completeOne();
      }
    });

    this.analyticsService.getDailySurface().subscribe({
      next: (data: DailySurface[]) => {
        this.setSurfaceChart(data);
        completeOne();
      },
      error: () => {
        this.error = 'Failed to load surface data';
        completeOne();
      }
    });
  }

  setCropChart(data: CropUsage[]): void {
    this.doughnutData = {
      labels: data.map((item) => item.crop),
      datasets: [
        {
          data: data.map((item) => item.totalWater),
          backgroundColor: [
            '#38b27f',
            '#5b46d6',
            '#e0aa2b',
            '#ef7d57',
            '#2f80ed',
            '#8b5cf6'
          ],
          borderWidth: 0
        }
      ]
    };
  }

  setWeeklyChart(data: DailyUsage[]): void {
    this.weeklyBarData = {
      labels: data.map((item) => item.day),
      datasets: [
        {
          label: 'Water usage',
          data: data.map((item) => item.totalWater),
          backgroundColor: '#2f80ed',
          borderRadius: 8,
          maxBarThickness: 38
        }
      ]
    };
  }

  setHourlyChart(data: HourlyIntensity[]): void {
    this.hourlyBarData = {
      labels: data.map((item) => item.hour.toString()),
      datasets: [
        {
          label: 'Hourly intensity',
          data: data.map((item) => item.totalWater),
          backgroundColor: '#38b27f',
          borderRadius: 6,
          maxBarThickness: 18
        }
      ]
    };
  }

  setDebitChart(data: DailyDebit[]): void {
    this.debitLineData = {
      labels: data.map((item) => item.day),
      datasets: [
        {
          label: 'Average debit',
          data: data.map((item) => item.averageDebit),
          borderColor: '#e0aa2b',
          backgroundColor: '#e0aa2b',
          pointBackgroundColor: '#e0aa2b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.35,
          fill: false
        }
      ]
    };
  }

  setSurfaceChart(data: DailySurface[]): void {
    this.surfaceLineData = {
      labels: data.map((item) => item.date),
      datasets: [
        {
          label: 'Surface',
          data: data.map((item) => item.totalSurface),
          borderColor: '#5b46d6',
          backgroundColor: 'rgba(91, 70, 214, 0.12)',
          pointBackgroundColor: '#5b46d6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.35,
          fill: true
        }
      ]
    };
  }

  diff(): number {
    if (!this.comparison) return 0;
    return +(this.comparison.today - this.comparison.yesterday).toFixed(1);
  }

  diffLabel(): string {
    const value = this.diff();
    if (value > 0) return 'Increase';
    if (value < 0) return 'Decrease';
    return 'No Change';
  }
}