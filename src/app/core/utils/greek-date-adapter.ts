import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

const DATE_PATTERN = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;

/**
 * Ο NativeDateAdapter αναλύει το κείμενο με Date.parse, που διαβάζει το
 * "01/08/2026" ως 8 Ιανουαρίου -- μήνας πρώτα, κατά την αμερικανική σύμβαση.
 * Εδώ η ανάλυση και η εμφάνιση κλειδώνουν σε ηη/μμ/εεεε.
 */
@Injectable()
export class GreekDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value !== 'string') return super.parse(value, null);

    const match = DATE_PATTERN.exec(value.trim());
    if (!match) return null;

    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    // Απορρίπτει ημερομηνίες όπως 31/02/2026, που η Date θα κυλούσε στον
    // επόμενο μήνα αντί να τις θεωρήσει άκυρες.
    return date.getDate() === Number(day) && date.getMonth() === Number(month) - 1 ? date : null;
  }

  override format(date: Date, displayFormat: object): string {
    const options = displayFormat as Intl.DateTimeFormatOptions;

    if (options.day === 'numeric' && options.month === 'numeric' && options.year === 'numeric') {
      const day = `${date.getDate()}`.padStart(2, '0');
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      return `${day}/${month}/${date.getFullYear()}`;
    }

    return super.format(date, displayFormat);
  }
}
