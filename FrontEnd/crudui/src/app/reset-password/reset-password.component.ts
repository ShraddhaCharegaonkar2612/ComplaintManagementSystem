import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  email: string = '';
  otp: string = '';
  newPassword: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService.resetPassword(this.email, this.otp, this.newPassword).subscribe(
      response => {
        Swal.fire('Success', 'Password has been reset successfully.', 'success').then(() => {
          this.router.navigate(['/login']);
        });
      },
      error => {
        Swal.fire('Error', 'Failed to reset password. Please try again.', 'error');
      }
    );
  }
}
