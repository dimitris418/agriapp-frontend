import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ParcelReadOnlyDTO } from '../../../core/models/parcel.model';
import { RegionalUnitReadOnlyDTO } from '../../../core/models/lookup.model';
import { Lookup } from '../../../core/services/lookup';
import { Parcel } from '../../../core/services/parcel';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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
  private readonly lookup = inject(Lookup);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    regionalUnitId: [null as number | null],
    areaInStremmas: [null as number | null, [Validators.required, Validators.min(0.01)]],
    kaek: ['', Validators.pattern(/^$|^\d{12}$/)],
    isActive: [true],
  });

  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly regionalUnits = signal<RegionalUnitReadOnlyDTO[]>([]);

  // Ομαδοποίηση ανά περιφέρεια: εβδομήντα τέσσερις ενότητες σε επίπεδη λίστα
  // δεν διαβάζονται.
  protected readonly groupedUnits = computed(() => {
    const groups = new Map<string, RegionalUnitReadOnlyDTO[]>();
    for (const unit of this.regionalUnits()) {
      const region = unit.regionReadOnlyDTO.name;
      groups.set(region, [...(groups.get(region) ?? []), unit]);
    }
    return [...groups.entries()].map(([region, units]) => ({ region, units }));
  });

  private existing: ParcelReadOnlyDTO | null = null;

  protected get editing(): boolean {
    return this.existing !== null;
  }

  ngOnInit(): void {
    this.lookup.getRegionalUnits().subscribe((units) => this.regionalUnits.set(units));

    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) return;

    this.loading.set(true);
    this.parcels.getOne(uuid).subscribe({
      next: (parcel) => {
        this.existing = parcel;
        this.form.patchValue({
          name: parcel.name,
          regionalUnitId: parcel.regionalUnitReadOnlyDTO?.id ?? null,
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
      regionalUnitId: value.regionalUnitId ?? undefined,
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
