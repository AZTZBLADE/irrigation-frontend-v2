import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  const role = (localStorage.getItem('role') || '').toUpperCase();
  if (role.includes('ADMIN')) return true;

  router.navigateByUrl('/user');
  return false;
};