import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import {
  ACTIVITY_TYPE_LABELS,
  SEVERITY_LABELS,
  UNIT_LABELS,
} from '../../../core/models/enum-labels';
import { ActivityType, ProductCategory, SeverityLevel, UnitOfMeasure } from '../../../core/models/enums';
import { FieldActivityReadOnlyDTO } from '../../../core/models/field-activity.model';
import { PestReadOnlyDTO, ProductReadOnlyDTO } from '../../../core/models/lookup.model';
import { Crop } from '../../../core/services/crop';
import { FieldActivity } from '../../../core/services/field-activity';
import { Lookup } from '../../../core/services/lookup';
import { addDays, fromIsoDate, toDisplayDate, toIsoDate } from '../../../core/utils/date';

// Καθρεφτίζει το assertFieldsRequiredByType του back-end. Μία πηγή αλήθειας
// για το ποια πεδία ζητά κάθε τύπος, ώστε φόρμα και σέρβερ να συμφωνούν.
const PLANT_PROTECTION: ProductCategory[] = ['HERBICIDE', 'FUNGICIDE', 'INSECTICIDE'];

const RULES: Record<
  ActivityType,
  { productCategories: ProductCategory[] | null; quantity: boolean; observation: boolean }
> = {
  SPRAYING: { productCategories: PLANT_PROTECTION, quantity: true, observation: false },
  FERTILIZATION: { productCategories: ['FERTILIZER'], quantity: true, observation: false },
  IRRIGATION: { productCategories: null, quantity: true, observation: false },
  HARVEST: { productCategories: null, quantity: true, observation: false },
  OBSERVATION: { productCategories: null, quantity: false, observation: true },
};

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
  selector: 'app-activity-form',
  styleUrl: './activity-form.scss',
  templateUrl: './activity-form.html',
})
export class ActivityForm implements OnInit {
  private readonly activities = inject(FieldActivity);
  private readonly crops = inject(Crop);
  private readonly lookup = inject(Lookup);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly typeLabels = ACTIVITY_TYPE_LABELS;
  protected readonly unitLabels = UNIT_LABELS;
  protected readonly severityLabels = SEVERITY_LABELS;
  protected readonly types = Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[];
  protected readonly units = Object.keys(UNIT_LABELS) as UnitOfMeasure[];
  protected readonly severities = Object.keys(SEVERITY_LABELS) as SeverityLevel[];

  readonly form = this.formBuilder.nonNullable.group({
    cropUuid: ['', Validators.required],
    activityDate: [null as Date | null, Validators.required],
    type: ['' as ActivityType | '', Validators.required],
    productId: [null as number | null],
    quantity: [null as number | null],
    unit: ['' as UnitOfMeasure | ''],
    pestId: [null as number | null],
    severity: ['' as SeverityLevel | ''],
    notes: ['', Validators.maxLength(500)],
  });

  // Το back-end απορρίπτει μελλοντικές ημερομηνίες με @PastOrPresent· ο
  // datepicker δεν τις προσφέρει καν.
  protected readonly today = new Date();

  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly cropOptions = signal<CropReadOnlyDTO[]>([]);
  protected readonly allProducts = signal<ProductReadOnlyDTO[]>([]);
  protected readonly pestOptions = signal<PestReadOnlyDTO[]>([]);
  private readonly value = signal(this.form.getRawValue());

  protected readonly rule = computed(() => {
    const type = this.value().type;
    return type ? RULES[type] : null;
  });

  protected readonly productOptions = computed(() => {
    const categories = this.rule()?.productCategories;
    if (!categories) return [];
    return this.allProducts().filter((p) => categories.includes(p.category as ProductCategory));
  });

  protected readonly selectedProduct = computed(() =>
    this.productOptions().find((p) => p.id === this.value().productId),
  );

  private readonly selectedCrop = computed(() => {
    if (this.existing) return this.existing.cropReadOnlyDTO;
    return this.cropOptions().find((c) => c.uuid === this.value().cropUuid) ?? null;
  });

  /**
   * Προειδοποίηση, όχι φραγή. Ο κανόνας του back-end δεσμεύει την πραγματική
   * συγκομιδή, που δεν έχει καταχωρηθεί ακόμα· εδώ απλώς επισημαίνεται ότι η
   * αναμενόμενη πέφτει μέσα στον χρόνο αναμονής, ώστε ο παραγωγός να το ξέρει
   * τώρα και όχι όταν πάει να συγκομίσει.
   */
  protected readonly harvestWarning = computed(() => {
    const phi = this.selectedProduct()?.preHarvestIntervalDays;
    const activityDate = this.value().activityDate;
    const expected = fromIsoDate(this.selectedCrop()?.expectedHarvestDate);

    if (!phi || !activityDate || !expected) return null;

    const earliest = addDays(activityDate, phi);
    if (earliest <= expected) return null;

    return `Η αναμενόμενη συγκομιδή είναι στις ${toDisplayDate(expected)}, αλλά με αυτό το σκεύασμα δεν επιτρέπεται συγκομιδή πριν τις ${toDisplayDate(earliest)}.`;
  });

  private existing: FieldActivityReadOnlyDTO | null = null;

  protected get editing(): boolean {
    return this.existing !== null;
  }

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.value.set(this.form.getRawValue()));

    this.form.controls.type.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((type) => this.applyRule(type));
  }

  ngOnInit(): void {
    this.lookup.getProducts().subscribe((products) => this.allProducts.set(products));
    this.lookup.getPests().subscribe((pests) => this.pestOptions.set(pests));

    const uuid = this.route.snapshot.paramMap.get('uuid');

    if (!uuid) {
      this.crops
        .search({ page: 0, pageSize: 100, sortBy: 'cultivationYear', sortDirection: 'DESC' })
        .subscribe((page) => {
          this.cropOptions.set(page.data);
          const preselected = this.route.snapshot.queryParamMap.get('cropUuid');
          if (preselected) this.form.controls.cropUuid.setValue(preselected);
        });
      return;
    }

    this.loading.set(true);
    this.activities.getOne(uuid).subscribe({
      next: (activity) => {
        this.existing = activity;
        this.cropOptions.set([activity.cropReadOnlyDTO]);
        this.form.patchValue({
          cropUuid: activity.cropReadOnlyDTO.uuid,
          activityDate: fromIsoDate(activity.activityDate),
          type: activity.type,
          productId: activity.productReadOnlyDTO?.id ?? null,
          quantity: activity.quantity,
          unit: activity.unit ?? '',
          pestId: activity.pestReadOnlyDTO?.id ?? null,
          severity: activity.severity ?? '',
          notes: activity.notes ?? '',
        });
        // Το FieldActivityUpdateDTO δεν δέχεται καλλιέργεια.
        this.form.controls.cropUuid.disable();
        this.value.set(this.form.getRawValue());
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Η εργασία δεν βρέθηκε.', 'Κλείσιμο', { duration: 5000 });
        this.router.navigate(['/activities']);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const common = {
      activityDate: toIsoDate(value.activityDate) as string,
      type: value.type as ActivityType,
      productId: value.productId ?? undefined,
      quantity: value.quantity ?? undefined,
      unit: (value.unit as UnitOfMeasure) || undefined,
      pestId: value.pestId ?? undefined,
      severity: (value.severity as SeverityLevel) || undefined,
      notes: value.notes.trim() || undefined,
    };

    const request = this.existing
      ? this.activities.update({ ...common, id: this.existing.id, uuid: this.existing.uuid })
      : this.activities.create({ ...common, cropUuid: value.cropUuid });

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.existing ? 'Οι αλλαγές αποθηκεύτηκαν.' : 'Η εργασία καταχωρήθηκε.',
          'Κλείσιμο',
          { duration: 5000 },
        );
        this.router.navigate(['/activities']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.handleError(error);
      },
    });
  }

  private applyRule(type: ActivityType | ''): void {
    const { productId, quantity, unit, pestId, severity } = this.form.controls;
    const rule = type ? RULES[type] : null;

    for (const control of [productId, quantity, unit, pestId, severity]) {
      control.clearValidators();
    }

    if (rule?.productCategories) productId.setValidators(Validators.required);
    else productId.setValue(null, { emitEvent: false });

    if (rule?.quantity) {
      quantity.setValidators([Validators.required, Validators.min(0)]);
      unit.setValidators(Validators.required);
    } else {
      quantity.setValue(null, { emitEvent: false });
      unit.setValue('', { emitEvent: false });
    }

    if (rule?.observation) {
      pestId.setValidators(Validators.required);
      severity.setValidators(Validators.required);
    } else {
      pestId.setValue(null, { emitEvent: false });
      severity.setValue('', { emitEvent: false });
    }

    for (const control of [productId, quantity, unit, pestId, severity]) {
      control.updateValueAndValidity({ emitEvent: false });
    }

    this.value.set(this.form.getRawValue());
  }

  private handleError(error: HttpErrorResponse): void {
    const body = error.error;

    // Οι κανόνες του ημερολογίου -- χρόνος αναμονής, εργασία μετά τη
    // συγκομιδή -- επιστρέφονται ως ResponseMessageDTO με κωδικό και
    // περιγραφή. Η περιγραφή είναι ήδη ολοκληρωμένη ελληνική πρόταση με τα
    // συγκεκριμένα (σκεύασμα, ημερομηνίες) που δεν έχουμε εδώ.
    if (error.status === 400 && body?.code === 'ActivityInvalidArgument') {
      this.errorMessage.set(body.description);
      return;
    }

    if (error.status === 400 && body && typeof body === 'object') {
      let matched = false;
      for (const [field, message] of Object.entries(body as Record<string, string>)) {
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
