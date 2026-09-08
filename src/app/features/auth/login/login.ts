import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

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
  ],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly hidePassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(describe(error));
      },
    });
  }

  // Το guard βάζει το returnUrl όταν διακόπτει μια πλοήγηση, ώστε ο χρήστης
  // να συνεχίζει εκεί που πήγαινε αντί να προσγειώνεται στην αρχική.
  private returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
  }
}

function describe(error: HttpErrorResponse): string {
  // Ενιαίο μήνυμα για λάθος στοιχεία και για απενεργοποιημένο λογαριασμό: ο
  // έλεγχος isEnabled() του Spring Security τρέχει πριν από τον έλεγχο του
  // συνθηματικού, οπότε χωριστό μήνυμα θα αποκάλυπτε την κατάσταση ενός
  // λογαριασμού σε όποιον γνωρίζει μόνο το email.
  if (error.status === 401) {
    return 'Δεν ήταν δυνατή η σύνδεση. Ελέγξτε τα στοιχεία σας ή επικοινωνήστε με τον διαχειριστή.';
  }
  if (error.status === 0) return 'Ο διακομιστής δεν αποκρίνεται. Ελέγξτε ότι τρέχει το back-end.';
  return 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.';
}
