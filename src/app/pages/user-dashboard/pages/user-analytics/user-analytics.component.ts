import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AnalyticsService,
  ComparisonDTO,
  CropUsage,
  DailyUsage,
  HourlyIntensity,
  DailyDebit,
  DailySurface,
} from '../../../../core/analytics.service';

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-analytics.component.html',
  styleUrl: './user-analytics.component.scss',
})
export class UserAnalyticsComponent implements OnInit {
  loading = false;
  error = '';

  comparison: ComparisonDTO | null = null;
  cropUsage: CropUsage[] = [];
  weeklyUsage: DailyUsage[] = [];
  hourlyIntensity: HourlyIntensity[] = [];
  dailyDebit: DailyDebit[] = [];
  dailySurface: DailySurface[] = [];

  cropColors = ['#2FA36B', '#4F46C6', '#E5B33B', '#E67E3A', '#2D8FD5', '#9B6CC2'];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = '';

    this.analyticsService.getComparison().subscribe({
      next: (comparison) => {
        this.comparison = comparison;

        this.analyticsService.getCropUsage().subscribe({
          next: (cropUsage) => {
            this.cropUsage = cropUsage || [];

            this.analyticsService.getWeeklyUsage().subscribe({
              next: (weeklyUsage) => {
                this.weeklyUsage = weeklyUsage || [];

                this.analyticsService.getHourlyIntensity().subscribe({
                  next: (hourlyIntensity) => {
                    this.hourlyIntensity = hourlyIntensity || [];

                    this.analyticsService.getDailyDebit().subscribe({
                      next: (dailyDebit) => {
                        this.dailyDebit = dailyDebit || [];

                        this.analyticsService.getDailySurface().subscribe({
                          next: (dailySurface) => {
                            this.dailySurface = dailySurface || [];
                            this.loading = false;
                          },
                          error: (err) => {
                            console.error(err);
                            this.error = 'Failed to load surface analytics.';
                            this.loading = false;
                          },
                        });
                      },
                      error: (err) => {
                        console.error(err);
                        this.error = 'Failed to load debit analytics.';
                        this.loading = false;
                      },
                    });
                  },
                  error: (err) => {
                    console.error(err);
                    this.error = 'Failed to load hourly analytics.';
                    this.loading = false;
                  },
                });
              },
              error: (err) => {
                console.error(err);
                this.error = 'Failed to load weekly analytics.';
                this.loading = false;
              },
            });
          },
          error: (err) => {
            console.error(err);
            this.error = 'Failed to load crop analytics.';
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load comparison analytics.';
        this.loading = false;
      },
    });
  }

  diff(): number {
    if (!this.comparison) return 0;
    return Number((this.comparison.today - this.comparison.yesterday).toFixed(1));
  }

  diffLabel(): string {
    return this.diff() >= 0 ? 'Increase' : 'Decrease';
  }

  maxWeeklyWater(): number {
    return Math.max(...this.weeklyUsage.map((i) => i.totalWater), 1);
  }

  weeklyBarHeight(value: number): number {
    return (value / this.maxWeeklyWater()) * 100;
  }

  maxHourlyWater(): number {
    return Math.max(...this.hourlyIntensity.map((i) => i.totalWater), 1);
  }

  hourlyBarHeight(value: number): number {
    return (value / this.maxHourlyWater()) * 100;
  }

  maxDebit(): number {
    return Math.max(...this.dailyDebit.map((i) => i.averageDebit), 1);
  }

  debitPointBottom(value: number): number {
    return (value / this.maxDebit()) * 100;
  }

  maxSurface(): number {
    return Math.max(...this.dailySurface.map((i) => i.totalSurface), 1);
  }

  surfacePointBottom(value: number): number {
    return (value / this.maxSurface()) * 100;
  }

  cropTotal(): number {
    return this.cropUsage.reduce((sum, item) => sum + item.totalWater, 0);
  }

  cropPercent(value: number): number {
    const total = this.cropTotal();
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  donutBackground(): string {
    if (!this.cropUsage.length) {
      return 'conic-gradient(#e5e7eb 0 100%)';
    }

    const total = this.cropTotal();
    let current = 0;

    const parts = this.cropUsage.map((item, index) => {
      const percent = (item.totalWater / total) * 100;
      const start = current;
      const end = current + percent;
      current = end;
      return `${this.cropColors[index % this.cropColors.length]} ${start}% ${end}%`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  }

  cropColor(index: number): string {
    return this.cropColors[index % this.cropColors.length];
  }

  surfacePoints(): string {
    if (!this.dailySurface.length) return '';

    const max = this.maxSurface();
    const count = this.dailySurface.length;

    return this.dailySurface
      .map((item, index) => {
        const x = count === 1 ? 0 : (index / (count - 1)) * 100;
        const y = 100 - (item.totalSurface / max) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }

  debitPoints(): string {
    if (!this.dailyDebit.length) return '';

    const max = this.maxDebit();
    const count = this.dailyDebit.length;

    return this.dailyDebit
      .map((item, index) => {
        const x = count === 1 ? 0 : (index / (count - 1)) * 100;
        const y = 100 - (item.averageDebit / max) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }
}