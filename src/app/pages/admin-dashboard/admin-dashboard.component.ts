import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

type Kpi = { title: string; value: string; hint: string };
type UserRow = { name: string; email: string; role: string; status: 'Active' | 'Pending' };
type DayPoint = { d: string; v: number };

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {

  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/login');
  }

  kpis: Kpi[] = [
    { title: 'Total Users', value: '128', hint: '+12 this month' },
    { title: 'Farms', value: '34', hint: '+3 this week' },
    { title: 'Parcels', value: '96', hint: 'Across all farms' },
    { title: 'Irrigation Tasks', value: '412', hint: 'Last 30 days' },
  ];

  weeklyWater: DayPoint[] = [
    { d: 'Mon', v: 42 },
    { d: 'Tue', v: 55 },
    { d: 'Wed', v: 49 },
    { d: 'Thu', v: 62 },
    { d: 'Fri', v: 58 },
    { d: 'Sat', v: 70 },
    { d: 'Sun', v: 64 },
  ];

  recentUsers: UserRow[] = [
    { name: 'Aziz Rtibi', email: 'aziz@email.com', role: 'ADMIN', status: 'Active' },
    { name: 'Amine Ben Ali', email: 'amine@email.com', role: 'FARMER', status: 'Active' },
    { name: 'Sarra Jaziri', email: 'sarra@email.com', role: 'FARMER', status: 'Pending' },
    { name: 'Yassine Khemiri', email: 'yassine@email.com', role: 'FARMER', status: 'Active' },
  ];

  stats = [
    { label: 'Irrigation Success Rate', value: 92 },
    { label: 'Water Saving (avg)', value: 18 },
    { label: 'Tasks Completed', value: 74 },
  ];

  get maxV() {
    return Math.max(...this.weeklyWater.map(x => x.v));
  }

  linePoints(width = 560, height = 160, pad = 16): string {
    const w = width - pad * 2;
    const h = height - pad * 2;

    return this.weeklyWater
      .map((p, i) => {
        const x = pad + (i * w) / (this.weeklyWater.length - 1);
        const y = pad + (1 - p.v / this.maxV) * h;
        return `${x},${y}`;
      })
      .join(' ');
  }
}
