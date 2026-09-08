// Το API μιλάει LocalDate, δηλαδή ημερολογιακή ημέρα χωρίς ώρα και ζώνη. Ο
// datepicker δίνει Date, που είναι στιγμή στον χρόνο. Η μετατροπή γίνεται με
// τα τοπικά μέρη της ημερομηνίας και όχι με toISOString(), που μετατρέπει σε
// UTC και μπορεί να μετακινήσει την ημέρα κατά μία.

export function toIsoDate(value: Date | null | undefined): string | undefined {
  if (!value) return undefined;

  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toDisplayDate(value: string | Date | null | undefined): string {
  const date = typeof value === 'string' ? fromIsoDate(value) : (value ?? null);
  if (!date) return '';

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');

  return `${day}/${month}/${date.getFullYear()}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}
