import { DecimalPipe } from '@angular/common';
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
import { ParcelFilters, ParcelReadOnlyDTO } from '../../../core/models/parcel.model';
import { Parcel } from '../../../core/services/parcel';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  imports: [
    DecimalPipe,
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
  selector: 'app-parcel-list',
  styleUrl: './parcel-list.scss',
  templateUrl: './parcel-list.html',
})
export class ParcelList implements OnInit {
  private readonly parcels = inject(Parcel);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly columns = ['name', 'location', 'areaInStremmas', 'kaek', 'isActive', 'actions'];
  protected readonly rows = signal<ParcelReadOnlyDTO[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    name: [''],
    location: [''],
    active: [''],
  });

  private filters: ParcelFilters = {
    page: 0,
    pageSize: 10,
    sortBy: 'name',
    sortDirection: 'ASC',
  };

  constructor() {
    // Η αναζήτηση με το πάτημα του πλήκτρου, με μικρή καθυστέρηση ώστε να μη
    // φεύγει αίτημα σε κάθε χαρακτήρα.
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => {
        this.filters = {
          ...this.filters,
          page: 0,
          name: value.name || undefined,
          location: value.location || undefined,
          active: value.active === '' ? undefined : value.active === 'true',
        };
        this.load();
      });
  }

  ngOnInit(): void {
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

  protected deactivate(parcel: ParcelReadOnlyDTO): void {
    const data: ConfirmDialogData = {
      title: 'Απενεργοποίηση αγροτεμαχίου',
      message: `Το «${parcel.name}» θα πάψει να εμφανίζεται ως ενεργό. Οι καλλιέργειες και οι εργασίες του παραμένουν καταγεγραμμένες.`,
      confirmLabel: 'Απενεργοποίηση',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.parcels.deactivate(parcel.uuid).subscribe({
          next: () => {
            this.snackBar.open('Το αγροτεμάχιο απενεργοποιήθηκε.', 'Κλείσιμο', { duration: 5000 });
            this.load();
          },
          error: () => this.notifyFailure('Η απενεργοποίηση απέτυχε.'),
        });
      });
  }

  private load(): void {
    this.loading.set(true);
    this.parcels.search(this.filters).subscribe({
      next: (page) => {
        this.rows.set(page.data);
        this.total.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifyFailure('Η φόρτωση των αγροτεμαχίων απέτυχε.');
      },
    });
  }

  private notifyFailure(message: string): void {
    this.snackBar.open(message, 'Κλείσιμο', { duration: 5000 });
  }
}
