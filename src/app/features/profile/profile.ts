import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { FarmerReadOnlyDTO } from '../../core/models/farmer.model';
import { Auth } from '../../core/services/auth';
import { Farmer } from '../../core/services/farmer';

const PASSWORD_PATTERN = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)(?=.*?[@#$!%&*]).{8,}$/;

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  selector: 'app-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly farmers = inject(Farmer);
  private readonly auth = inject(Auth);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    firstname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    vat: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    registryNumber: ['', Validators.pattern(/^\d{0,20}$/)],
    phone: ['', Validators.pattern(/^$|^\d{10}$/)],
    password: ['', Validators.pattern(PASSWORD_PATTERN)],
  });

  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly username = signal('');

  private existing: FarmerReadOnlyDTO | null = null;

  ngOnInit(): void {
    this.loading.set(true);
    this.farmers.getMe().subscribe({
      next: (farmer) => {
        this.existing = farmer;
        this.username.set(farmer.userReadOnlyDTO.username);
        this.form.patchValue({
          firstname: farmer.userReadOnlyDTO.firstname,
          lastname: farmer.userReadOnlyDTO.lastname,
          vat: farmer.userReadOnlyDTO.vat,
          registryNumber: farmer.registryNumber ?? '',
          phone: farmer.phone ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Η φόρτωση του προφίλ απέτυχε.');
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting() || !this.existing) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const farmer = this.existing;

    this.farmers
      .updateMe({
        id: farmer.id,
        uuid: farmer.uuid,
        registryNumber: value.registryNumber.trim() || undefined,
        phone: value.phone.trim() || undefined,
        isActive: farmer.isActive,
        userUpdateDTO: {
          id: farmer.userReadOnlyDTO.id,
          firstname: value.firstname.trim(),
          lastname: value.lastname.trim(),
          // Το username είναι το αναγνωριστικό σύνδεσης και ταυτίζεται με το
          // subject του token, οπότε δεν αλλάζει από εδώ.
          username: farmer.userReadOnlyDTO.username,
          vat: value.vat.trim(),
          password: value.password.trim() || null,
        },
      })
      .subscribe({
        next: (updated) => {
          this.existing = updated;
          this.submitting.set(false);
          this.form.patchValue({ password: '' });
          this.auth.updateName(
            updated.userReadOnlyDTO.firstname,
            updated.userReadOnlyDTO.lastname,
          );
          this.snackBar.open('Το προφίλ ενημερώθηκε.', 'Κλείσιμο', { duration: 5000 });
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          this.handleError(error);
        },
      });
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.errorMessage.set('Το ΑΦΜ χρησιμοποιείται ήδη από άλλον λογαριασμό.');
      return;
    }

    if (error.status === 400 && error.error && typeof error.error === 'object') {
      let matched = false;
      for (const [field, message] of Object.entries(error.error as Record<string, string>)) {
        const control = this.form.get(field.replace('userUpdateDTO.', ''));
        if (control) {
          control.setErrors({ server: message });
          matched = true;
        }
      }
      if (matched) return;
    }

    this.errorMessage.set('Η αποθήκευση απέτυχε. Δοκιμάστε ξανά.');
  }
}
