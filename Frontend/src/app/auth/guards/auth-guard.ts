import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from "../service/auth";

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const token = inject(AuthService);

    if (token.isLoggedIn()) { return true; }

    router.navigate(['/login']);
    return false;
};
