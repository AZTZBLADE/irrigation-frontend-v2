import { Routes } from '@angular/router';

// Public
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { WelcomePageComponent } from './pages/welcome-page/welcome-page.component';

// Admin
import { AdminLayoutComponent } from './pages/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminTasksComponent } from './pages/admin-tasks/admin-tasks.component';

// User
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { UserTasksComponent } from './pages/user-dashboard/pages/user-tasks/user-tasks.component';
import { UserAiAdviceComponent } from './pages/user-dashboard/pages/user-ai-advice/user-ai-advice.component';
import { UserWeatherComponent } from './pages/user-dashboard/pages/user-weather/user-weather.component';
import { UserProfileComponent } from './pages/user-dashboard/pages/user-profile/user-profile.component';
import { AnalyticsComponent } from './pages/user-dashboard/pages/user-analytics/user-analytics.component';
import { UserReportComponent } from './pages/user-dashboard/pages/user-report/user-report.component';

// Guard
import { authGuard } from './core/auth.guard';

export const routes: Routes = [

  // ================= PUBLIC =================
  { path: '', component: WelcomePageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ================= ADMIN =================
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

  // ================= USER =================
  {
    path: 'user',
    component: UserDashboardComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },

      { path: 'tasks', component: UserTasksComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'ai-advice', component: UserAiAdviceComponent },
      { path: 'weather', component: UserWeatherComponent },
      { path: 'profile', component: UserProfileComponent },
      { path: 'report', component: UserReportComponent }, // 🔥 report page
    ],
  },

  // ================= FALLBACK =================
  { path: '**', redirectTo: '' },
];