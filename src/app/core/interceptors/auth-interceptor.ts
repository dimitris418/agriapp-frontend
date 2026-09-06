import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.token();

  const request =
    token && req.url.startsWith(environment.apiUrl)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 με ενεργή συνεδρία σημαίνει ότι το token απορρίφθηκε ή έληξε. Η
      // τοπική συνεδρία καθαρίζει εδώ, αντί να το χειρίζεται κάθε σελίδα.
      if (error.status === 401 && auth.isLoggedIn()) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
