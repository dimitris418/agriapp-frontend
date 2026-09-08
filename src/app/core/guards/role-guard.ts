import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/**
 * Ο έλεγχος εδώ αφορά μόνο τη δρομολόγηση. Η εξουσιοδότηση επιβάλλεται στο
 * back-end με βάση τα capabilities του ρόλου -- ένα token δεν γίνεται να
 * ξεκλειδώσει endpoint επειδή το front-end τον άφησε να δει την οθόνη.
 */
export function roleGuard(role: string): CanActivateFn {
  return (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    return auth.role() === role ? true : router.createUrlTree(['/']);
  };
}
