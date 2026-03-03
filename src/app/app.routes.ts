import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';

import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  // Auth pages
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // User Dashboard (أي واحد logged in)
  {
    path: 'user',
    component: UserDashboardComponent,
    canActivate: [authGuard],
  },

  // Admin Dashboard (admin فقط)
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [adminGuard],
  },

  // Default
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 404
  { path: '**', redirectTo: 'login' },
];