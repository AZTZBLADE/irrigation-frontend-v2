import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

import { AdminLayoutComponent } from './pages/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminTasksComponent } from './pages/admin-tasks/admin-tasks.component';

import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { UserTasksComponent } from './pages/user-dashboard/pages/user-tasks/user-tasks.component';
import { UserAiAdviceComponent } from './pages/user-dashboard/pages/user-ai-advice/user-ai-advice.component';
import { UserWeatherComponent } from './pages/user-dashboard/pages/user-weather/user-weather.component';
import { UserProfileComponent } from './pages/user-dashboard/pages/user-profile/user-profile.component';

import { authGuard } from './core/auth.guard';
import { UserAnalyticsComponent } from './pages/user-dashboard/pages/user-analytics/user-analytics.component';

export const routes: Routes = [
  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Admin Layout + Pages
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'tasks', component: AdminTasksComponent },
    ],
  },

  // User Dashboard
  {
    path: 'user',
    component: UserDashboardComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },
      { path: 'analytics', component: UserAnalyticsComponent },
      { path: 'tasks', component: UserTasksComponent },
      { path: 'ai-advice', component: UserAiAdviceComponent },
      { path: 'weather', component: UserWeatherComponent },
      { path: 'profile', component: UserProfileComponent },
    ],
  },

  // Default
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 404
  { path: '**', redirectTo: 'login' },
];