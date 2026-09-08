import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { debounceTime } from 'rxjs';
import { FarmerFilters, FarmerReadOnlyDTO } from '../../../core/models/farmer.model';
import { Farmer } from '../../../core/services/farmer';

@Component({
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  selector: 'app-farmer-list',
  styleUrl: './farmer-list.scss',
  templateUrl: './farmer-list.html',
})
export class FarmerList implements OnInit {
  private readonly farmers = inject(Farmer);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly columns = ['name', 'username', 'vat', 'registryNumber', 'phone', 'isActive'];
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
