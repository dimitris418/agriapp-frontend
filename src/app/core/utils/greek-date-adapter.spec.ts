import { TestBed } from '@angular/core/testing';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { GreekDateAdapter } from './greek-date-adapter';

describe('GreekDateAdapter', () => {
  let adapter: DateAdapter<Date>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNativeDateAdapter(), { provide: DateAdapter, useClass: GreekDateAdapter }],
    });
    adapter = TestBed.inject(DateAdapter);
  });

  it('should read the day before the month', () => {
    const parsed = adapter.parse('01/08/2026', null) as Date;

    expect(parsed.getDate()).toBe(1);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getFullYear()).toBe(2026);
  });

  it('should reject a day that does not exist in the month', () => {
    expect(adapter.parse('31/02/2026', null)).toBeNull();
  });

  it('should reject text that is not a date', () => {
    expect(adapter.parse('αύριο', null)).toBeNull();
  });

  it('should display a date zero padded as dd/mm/yyyy', () => {
    const formatted = adapter.format(new Date(2026, 7, 1), {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    expect(formatted).toBe('01/08/2026');
  });
});
