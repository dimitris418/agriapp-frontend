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
import { debounceTime } from 'rxjs';
import { FarmerFilters, FarmerReadOnlyDTO } from '../../../core/models/farmer.model';
import { Farmer } from '../../../core/services/farmer';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  imports: [
    ReactiveFormsModule,
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
  selector: 'app-farmer-list',
  styleUrl: './farmer-list.scss',
  templateUrl: './farmer-list.html',
})
export class FarmerList implements OnInit {
  private readonly farmers = inject(Farmer);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly columns = [
    'name',
    'username',
    'vat',
    'registryNumber',
    'phone',
    'isActive',
    'actions',
  ];
  protected readonly rows = signal<FarmerReadOnlyDTO[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    lastname: [''],
    username: [''],
    active: [''],
  });

  private filters: FarmerFilters = {
    page: 0,
    pageSize: 10,
    sortBy: 'user.lastname',
    sortDirection: 'ASC',
  };

  constructor() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => {
        this.filters = {
          ...this.filters,
          page: 0,
          lastname: value.lastname || undefined,
          username: value.username || undefined,
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

  protected toggleStatus(farmer: FarmerReadOnlyDTO): void {
    const deactivating = farmer.isActive;
    const name = `${farmer.userReadOnlyDTO.lastname} ${farmer.userReadOnlyDTO.firstname}`;

    const data: ConfirmDialogData = deactivating
      ? {
          title: 'Απενεργοποίηση λογαριασμού',
          message: `Ο λογαριασμός του «${name}» θα πάψει να δέχεται σύνδεση. Τα αγροτεμάχια, οι καλλιέργειες και οι εργασίες του παραμένουν καταγεγραμμένα.`,
          confirmLabel: 'Απενεργοποίηση',
        }
      : {
          title: 'Επαναφορά λογαριασμού',
          message: `Ο λογαριασμός του «${name}» θα μπορεί ξανά να συνδεθεί.`,
          confirmLabel: 'Επαναφορά',
        };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.farmers.setStatus(farmer.uuid, !farmer.isActive).subscribe({
          next: () => {
            this.snackBar.open(
              deactivating ? 'Ο λογαριασμός απενεργοποιήθηκε.' : 'Ο λογαριασμός επανήλθε.',
              'Κλείσιμο',
              { duration: 5000 },
            );
            this.load();
          },
          error: () =>
            this.snackBar.open('Η αλλαγή κατάστασης απέτυχε.', 'Κλείσιμο', { duration: 5000 }),
        });
      });
  }

  private load(): void {
    this.loading.set(true);
    this.farmers.search(this.filters).subscribe({
      next: (page) => {
        this.rows.set(page.data);
        this.total.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Η φόρτωση των αγροτών απέτυχε.', 'Κλείσιμο', { duration: 5000 });
      },
    });
  }
}
