import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'rn-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  error = signal('');
  success = signal('');
  isSubmitting = signal(false);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    currentPassword: new FormControl(''),
    newPassword: new FormControl('')
  });

  constructor(public authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.form.patchValue({ email: user.email });
      return;
    }

    this.authService.loadSession().subscribe({
      next: (loaded) => {
        if (loaded) {
          this.form.patchValue({ email: loaded.email });
        }
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.error.set('Please enter a valid email.');
      this.success.set('');
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('You must be logged in to update your profile.');
      return;
    }

    const payload: { email?: string; currentPassword?: string; newPassword?: string } = {};
    const formValue = this.form.value as { email: string; currentPassword?: string; newPassword?: string };

    if (formValue.email && formValue.email !== currentUser.email) {
      payload.email = formValue.email;
    }

    if (formValue.newPassword) {
      payload.currentPassword = formValue.currentPassword || undefined;
      payload.newPassword = formValue.newPassword;
    }

    if (!payload.email && !payload.newPassword) {
      this.error.set('No changes to save.');
      this.success.set('');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');
    this.success.set('');

    this.authService.updateProfile(payload).subscribe({
      next: (response) => {
        this.success.set(response.message || 'Profile updated.');
        this.error.set('');
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to update profile.');
        this.success.set('');
        this.isSubmitting.set(false);
      }
    });
  }
}
