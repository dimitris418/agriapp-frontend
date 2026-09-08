import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FarmerList } from './farmer-list';

const page = {
  data: [
    {
      id: 1,
      uuid: 'f1',
      registryNumber: '123456',
      phone: '6912345678',
      isActive: true,
      userReadOnlyDTO: {
        id: 11,
        firstname: 'Δημήτρης',
        lastname: 'Παπαδάκης',
        username: 'owner@example.com',
        vat: '123456789',
        role: 'FARMER',
      },
    },
    {
      id: 2,
      uuid: 'f2',
      registryNumber: null,
      phone: null,
      isActive: false,
      userReadOnlyDTO: {
        id: 12,
        firstname: 'Ελένη',
        lastname: 'Μανωλάκη',
        username: 'other@example.com',
        vat: '987654321',
        role: 'FARMER',
      },
    },
  ],
  currentPage: 0,
  pageSize: 10,
  totalPages: 1,
  numberOfElements: 2,
  totalElements: 2,
};

describe('FarmerList', () => {
  let fixture: ComponentFixture<FarmerList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerList);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should render a row per farmer', async () => {
    httpMock.expectOne((req) => req.url.endsWith('/farmers')).flush(page);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Παπαδάκης Δημήτρης');
    expect(fixture.nativeElement.textContent).toContain('Ανενεργός');
    httpMock.verify();
  });

  it('should sort by the last name of the user by default', () => {
    const request = httpMock.expectOne((req) => req.url.endsWith('/farmers'));

    expect(request.request.params.get('sortBy')).toBe('user.lastname');
    expect(request.request.params.get('lastname')).toBeNull();
    request.flush(page);
    httpMock.verify();
  });
});
