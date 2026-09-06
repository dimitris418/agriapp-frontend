import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

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
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      firstname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
      vat: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      registryNumber: ['', Validators.pattern(/^\d{0,20}$/)],
      phone: ['', Validators.pattern(/^$|^\d{10}$/)],
    },
    { validators: passwordsMatch },
  );

  protected readonly submitting = signal(false);
  protected readonly hidePassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();

    this.auth
      .register({
        registryNumber: value.registryNumber || undefined,
        phone: value.phone || undefined,
        userInsertDTO: {
          firstname: value.firstname,
          lastname: value.lastname,
          username: value.username,
          password: value.password,
          vat: value.vat,
        },
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Ο λογαριασμός δημιουργήθηκε. Συνδεθείτε.', 'Κλείσιμο', {
            duration: 6000,
          });
          this.router.navigate(['/login']);
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          this.handleError(error);
        },
      });
  }

  // Το back-end επιστρέφει τα σφάλματα επικύρωσης ως χάρτη πεδίο -> μήνυμα, με
  // τα ένθετα πεδία προθεματισμένα (userInsertDTO.username). Τα επιστρέφουμε
  // στα αντίστοιχα controls ώστε να εμφανιστούν εκεί που τα περιμένει ο χρήστης.
  private handleError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.errorMessage.set('Υπάρχει ήδη λογαριασμός με αυτό το email ή το ΑΦΜ.');
      return;
    }

    if (error.status === 400 && error.error && typeof error.error === 'object') {
      let matched = false;
      for (const [field, message] of Object.entries(error.error as Record<string, string>)) {
        const control = this.form.get(field.split('.').pop() ?? field);
        if (control) {
          control.setErrors({ server: message });
          matched = true;
        }
      }
      if (matched) return;
    }

    this.errorMessage.set(
      error.status === 0
        ? 'Ο διακομιστής δεν αποκρίνεται. Ελέγξτε ότι τρέχει το back-end.'
        : 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.',
    );
  }
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  return password && confirmation && password !== confirmation ? { passwordsMismatch: true } : null;
}
