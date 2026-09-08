import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CropReadOnlyDTO } from '../../../core/models/crop.model';
import { CropTypeReadOnlyDTO } from '../../../core/models/lookup.model';
import { ParcelReadOnlyDTO } from '../../../core/models/parcel.model';
import { Crop } from '../../../core/services/crop';
import { Lookup } from '../../../core/services/lookup';
import { Parcel } from '../../../core/services/parcel';
import { fromIsoDate, toIsoDate } from '../../../core/utils/date';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  selector: 'app-crop-form',
  styleUrl: './crop-form.scss',
  templateUrl: './crop-form.html',
})
export class CropForm implements OnInit {
  private readonly crops = inject(Crop);
  private readonly parcels = inject(Parcel);
  private readonly lookup = inject(Lookup);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    parcelUuid: ['', Validators.required],
    cropTypeId: [null as number | null, Validators.required],
    variety: ['', Validators.maxLength(50)],
    cultivationYear: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(2000), Validators.max(2100)],
    ],
    plantingDate: [null as Date | null],
    expectedHarvestDate: [null as Date | null],
  });

  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly parcelOptions = signal<ParcelReadOnlyDTO[]>([]);
  protected readonly cropTypeOptions = signal<CropTypeReadOnlyDTO[]>([]);

  private existing: CropReadOnlyDTO | null = null;

  protected get editing(): boolean {
    return this.existing !== null;
  }

  ngOnInit(): void {
    this.lookup.getCropTypes().subscribe((types) => this.cropTypeOptions.set(types));

    const uuid = this.route.snapshot.paramMap.get('uuid');

    if (!uuid) {
      this.parcels
        .search({ page: 0, pageSize: 100, active: true, sortBy: 'name' })
        .subscribe((page) => {
          this.parcelOptions.set(page.data);
          // Προεπιλογή από τη λίστα καλλιεργειών, όταν έρχεται φιλτραρισμένη.
          const preselected = this.route.snapshot.queryParamMap.get('parcelUuid');
          if (preselected) this.form.controls.parcelUuid.setValue(preselected);
        });
      return;
    }

    this.loading.set(true);
    this.crops.getOne(uuid).subscribe({
      next: (crop) => {
        this.existing = crop;
        this.parcelOptions.set([crop.parcelReadOnlyDTO]);
        this.form.patchValue({
          parcelUuid: crop.parcelReadOnlyDTO.uuid,
          cropTypeId: crop.cropTypeReadOnlyDTO.id,
          variety: crop.variety ?? '',
          cultivationYear: crop.cultivationYear,
          plantingDate: fromIsoDate(crop.plantingDate),
          expectedHarvestDate: fromIsoDate(crop.expectedHarvestDate),
        });
        // Το CropUpdateDTO δεν δέχεται αγροτεμάχιο: η μεταφορά καλλιέργειας σε
        // άλλο χωράφι θα άλλαζε το νόημα των εργασιών που κρέμονται από αυτήν.
        this.form.controls.parcelUuid.disable();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Η καλλιέργεια δεν βρέθηκε.', 'Κλείσιμο', { duration: 5000 });
        this.router.navigate(['/crops']);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const common = {
      cropTypeId: value.cropTypeId as number,
      variety: value.variety.trim() || undefined,
      cultivationYear: value.cultivationYear,
      plantingDate: toIsoDate(value.plantingDate),
      expectedHarvestDate: toIsoDate(value.expectedHarvestDate),
    };

    const request = this.existing
      ? this.crops.update({ ...common, id: this.existing.id, uuid: this.existing.uuid })
      : this.crops.create({ ...common, parcelUuid: value.parcelUuid });

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.existing ? 'Οι αλλαγές αποθηκεύτηκαν.' : 'Η καλλιέργεια δημιουργήθηκε.',
          'Κλείσιμο',
          { duration: 5000 },
        );
        this.router.navigate(['/crops']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.handleError(error);
      },
    });
  }

  private handleError(error: HttpErrorResponse): void {
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
