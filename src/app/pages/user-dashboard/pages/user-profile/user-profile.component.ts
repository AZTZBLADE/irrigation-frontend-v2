import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
})
export class UserProfileComponent {
  name = localStorage.getItem('name') || 'User';
  email = localStorage.getItem('email') || '-';
  role = localStorage.getItem('role') || 'ROLE_USER';
}