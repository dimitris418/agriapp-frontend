import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { CropFilters, CropReadOnlyDTO } from '../../../core/models/crop.model';
import { CropTypeReadOnlyDTO } from '../../../core/models/lookup.model';
import { ParcelReadOnlyDTO } from '../../../core/models/parcel.model';
import { Crop } from '../../../core/services/crop';
import { Lookup } from '../../../core/services/lookup';
import { Parcel } from '../../../core/services/parcel';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

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
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  selector: 'app-crop-list',
  styleUrl: './crop-list.scss',
  templateUrl: './crop-list.html',
})
export class CropList implements OnInit {
  private readonly crops = inject(Crop);
  private readonly parcels = inject(Parcel);
  private readonly lookup = inject(Lookup);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly columns = [
    'parcel',
    'cropType',
    'variety',
    'cultivationYear',
    'plantingDate',
    'harvestDate',
    'actions',
  ];

  protected readonly rows = signal<CropReadOnlyDTO[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly parcelOptions = signal<ParcelReadOnlyDTO[]>([]);
  protected readonly cropTypeOptions = signal<CropTypeReadOnlyDTO[]>([]);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    parcelUuid: [''],
    cropTypeId: [''],
    cultivationYear: [''],
  });

  private filters: CropFilters = {
    page: 0,
    pageSize: 10,
    sortBy: 'cultivationYear',
    sortDirection: 'DESC',
  };

  constructor() {
    this.filterForm.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((value) => {
      this.filters = {
        ...this.filters,
        page: 0,
        parcelUuid: value.parcelUuid || undefined,
        cropTypeId: value.cropTypeId ? Number(value.cropTypeId) : undefined,
        cultivationYear: value.cultivationYear ? Number(value.cultivationYear) : undefined,
      };
      this.load();
    });
  }

  ngOnInit(): void {
    this.load();
    this.parcels
      .search({ page: 0, pageSize: 100, active: true, sortBy: 'name' })
      .subscribe((page) => this.parcelOptions.set(page.data));
    this.lookup.getCropTypes().subscribe((types) => this.cropTypeOptions.set(types));
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

  protected remove(crop: CropReadOnlyDTO): void {
    const data: ConfirmDialogData = {
      title: 'Διαγραφή καλλιέργειας',
      message: `Η καλλιέργεια «${crop.cropTypeReadOnlyDTO.name}» στο «${crop.parcelReadOnlyDTO.name}» θα διαγραφεί οριστικά.`,
      confirmLabel: 'Διαγραφή',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.crops.delete(crop.uuid).subscribe({
          next: () => {
            this.snackBar.open('Η καλλιέργεια διαγράφηκε.', 'Κλείσιμο', { duration: 5000 });
            this.load();
          },
          // Το back-end αρνείται τη διαγραφή όταν υπάρχουν εγγραφές στο
          // ημερολόγιο. Το μήνυμα πρέπει να το εξηγεί, όχι να λέει «απέτυχε».
          error: (error: HttpErrorResponse) =>
            this.notify(
              error.status === 400
                ? 'Η καλλιέργεια έχει εγγραφές στο ημερολόγιο και δεν διαγράφεται.'
                : 'Η διαγραφή απέτυχε.',
            ),
        });
      });
  }

  private load(): void {
    this.loading.set(true);
    this.crops.search(this.filters).subscribe({
      next: (page) => {
        this.rows.set(page.data);
        this.total.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify('Η φόρτωση των καλλιεργειών απέτυχε.');
      },
    });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Κλείσιμο', { duration: 5000 });
  }
}
