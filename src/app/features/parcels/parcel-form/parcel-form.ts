import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ParcelReadOnlyDTO } from '../../../core/models/parcel.model';
import { Parcel } from '../../../core/services/parcel';

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
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  selector: 'app-parcel-form',
  styleUrl: './parcel-form.scss',
  templateUrl: './parcel-form.html',
})
export class ParcelForm implements OnInit {
  private readonly parcels = inject(Parcel);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    location: ['', Validators.maxLength(100)],
    areaInStremmas: [null as number | null, [Validators.required, Validators.min(0.01)]],
    kaek: ['', Validators.pattern(/^$|^\d{12}$/)],
    isActive: [true],
  });

  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private existing: ParcelReadOnlyDTO | null = null;

  protected get editing(): boolean {
    return this.existing !== null;
  }

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) return;

    this.loading.set(true);
    this.parcels.getOne(uuid).subscribe({
      next: (parcel) => {
        this.existing = parcel;
        this.form.patchValue({
          name: parcel.name,
          location: parcel.location ?? '',
          areaInStremmas: parcel.areaInStremmas,
          kaek: parcel.kaek ?? '',
          isActive: parcel.isActive,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Το αγροτεμάχιο δεν βρέθηκε.', 'Κλείσιμο', { duration: 5000 });
        this.router.navigate(['/parcels']);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const payload = {
      name: value.name.trim(),
      location: value.location.trim() || undefined,
      areaInStremmas: value.areaInStremmas as number,
      kaek: value.kaek.trim() || undefined,
      isActive: value.isActive,
    };

    const request = this.existing
      ? this.parcels.update({ ...payload, id: this.existing.id, uuid: this.existing.uuid })
      : this.parcels.create(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.existing ? 'Οι αλλαγές αποθηκεύτηκαν.' : 'Το αγροτεμάχιο δημιουργήθηκε.',
          'Κλείσιμο',
          { duration: 5000 },
        );
        this.router.navigate(['/parcels']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.handleError(error);
      },
    });
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.errorMessage.set('Υπάρχει ήδη αγροτεμάχιο με αυτό το ΚΑΕΚ.');
      return;
    }

    if (error.status === 400 && error.error && typeof error.error === 'object') {
      let matched = false;
      for (const [field, message] of Object.entries(error.error as Record<string, string>)) {
        const control = this.form.get(field);
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
