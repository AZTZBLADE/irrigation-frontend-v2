import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';

import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { UserTasksComponent } from './pages/user-dashboard/pages/user-tasks/user-tasks.component';
import { UserAiAdviceComponent } from './pages/user-dashboard/pages/user-ai-advice/user-ai-advice.component';
import { UserWeatherComponent } from './pages/user-dashboard/pages/user-weather/user-weather.component';
import { UserProfileComponent } from './pages/user-dashboard/pages/user-profile/user-profile.component';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Admin
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
  },

  // User Dashboard (Layout + children)
  {
    path: 'user',
    component: UserDashboardComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard], // ✅ مهم لحماية /user/* routes
    children: [
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },
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