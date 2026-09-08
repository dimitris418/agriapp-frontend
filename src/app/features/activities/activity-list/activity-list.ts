import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { CropReadOnlyDTO } from '../../../core/models/crop.model';
import {
  ACTIVITY_TYPE_LABELS,
  SEVERITY_LABELS,
  UNIT_LABELS,
} from '../../../core/models/enum-labels';
import { ActivityType } from '../../../core/models/enums';
import {
  FieldActivityFilters,
  FieldActivityReadOnlyDTO,
} from '../../../core/models/field-activity.model';
import { Crop } from '../../../core/services/crop';
import { FieldActivity } from '../../../core/services/field-activity';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';
import { toIsoDate } from '../../../core/utils/date';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  selector: 'app-activity-list',
  styleUrl: './activity-list.scss',
  templateUrl: './activity-list.html',
})
export class ActivityList implements OnInit {
  private readonly activities = inject(FieldActivity);
  private readonly crops = inject(Crop);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly typeLabels = ACTIVITY_TYPE_LABELS;
  protected readonly unitLabels = UNIT_LABELS;
  protected readonly severityLabels = SEVERITY_LABELS;
  protected readonly types = Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[];

  protected readonly columns = ['activityDate', 'type', 'crop', 'details', 'notes', 'actions'];
  protected readonly rows = signal<FieldActivityReadOnlyDTO[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly cropOptions = signal<CropReadOnlyDTO[]>([]);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    cropUuid: [''],
    type: [''],
    dateFrom: [null as Date | null],
    dateTo: [null as Date | null],
  });

  private filters: FieldActivityFilters = {
    page: 0,
    pageSize: 10,
    sortBy: 'activityDate',
    sortDirection: 'DESC',
  };

  constructor() {
    this.filterForm.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((value) => {
      this.filters = {
        ...this.filters,
        page: 0,
        cropUuid: value.cropUuid || undefined,
        type: (value.type as ActivityType) || undefined,
        dateFrom: toIsoDate(value.dateFrom),
        dateTo: toIsoDate(value.dateTo),
      };
      this.load();
    });
  }

  ngOnInit(): void {
    this.crops
      .search({ page: 0, pageSize: 100, sortBy: 'cultivationYear', sortDirection: 'DESC' })
      .subscribe((page) => this.cropOptions.set(page.data));

    // Ο σύνδεσμος από τη λίστα καλλιεργειών φέρνει το ημερολόγιο ήδη
    // φιλτραρισμένο στη συγκεκριμένη καλλιέργεια.
    const cropUuid = this.route.snapshot.queryParamMap.get('cropUuid');
    if (cropUuid) {
      this.filterForm.controls.cropUuid.setValue(cropUuid);
      return;
    }

    this.load();
  }

  protected onPage(event: PageEvent): void {
    this.filters = { ...this.filters, page: event.pageIndex, pageSize: event.pageSize };
    this.load();
  }

  protected onSort(sort: Sort): void {
    this.filters = {
      ...this.filters,
      page: 0,
      sortBy: sort.active,
      sortDirection: sort.direction === 'desc' ? 'DESC' : 'ASC',
    };
    this.load();
  }

  protected typeLabel(activity: FieldActivityReadOnlyDTO): string {
    return this.typeLabels[activity.type];
  }

  protected describe(activity: FieldActivityReadOnlyDTO): string {
    const parts: string[] = [];

    if (activity.productReadOnlyDTO) parts.push(activity.productReadOnlyDTO.name);
    if (activity.pestReadOnlyDTO) parts.push(activity.pestReadOnlyDTO.name);
    if (activity.severity) parts.push(`ένταση ${this.severityLabels[activity.severity]}`);
    if (activity.quantity !== null && activity.unit) {
      parts.push(`${activity.quantity} ${this.unitLabels[activity.unit]}`);
    }

    return parts.length ? parts.join(' · ') : '—';
  }

  protected remove(activity: FieldActivityReadOnlyDTO): void {
    const data: ConfirmDialogData = {
      title: 'Διαγραφή εργασίας',
      message: `Η εργασία «${this.typeLabels[activity.type]}» της ${activity.activityDate} θα διαγραφεί από το ημερολόγιο.`,
      confirmLabel: 'Διαγραφή',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.activities.delete(activity.uuid).subscribe({
          next: () => {
            this.snackBar.open('Η εργασία διαγράφηκε.', 'Κλείσιμο', { duration: 5000 });
            this.load();
          },
          error: () => this.notify('Η διαγραφή απέτυχε.'),
        });
      });
  }

  private load(): void {
    this.loading.set(true);
    this.activities.search(this.filters).subscribe({
      next: (page) => {
        this.rows.set(page.data);
        this.total.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify('Η φόρτωση του ημερολογίου απέτυχε.');
      },
    });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Κλείσιμο', { duration: 5000 });
  }
}
