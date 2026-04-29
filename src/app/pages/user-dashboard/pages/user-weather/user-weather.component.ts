import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../../../../core/weather.service';

@Component({
  selector: 'app-user-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-weather.component.html',
  styleUrl: './user-weather.component.scss',
})
export class UserWeatherComponent implements OnInit {
  weatherData: any[] = [];
  loading = false;
  error = '';

  constructor(private weatherService: WeatherService) {}

  ngOnInit(): void {
    this.loadWeather();
  }

  loadWeather(): void {
    this.loading = true;
    this.error = '';

    this.weatherService.getAllWeather().subscribe({
      next: (res) => {
        this.weatherData = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load weather';
        this.loading = false;
      },
    });
  }
}