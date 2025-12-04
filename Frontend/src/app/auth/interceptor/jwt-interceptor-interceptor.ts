import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  const publicEndpoints = ['/api/auth/login', '/api/auth/register'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (token && !isPublicEndpoint) {
      req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
      });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Interceptor: Erro na requisição', { 
        url: req.url, 
        status: error.status, 
        isPublicEndpoint 
      });
      
      // Se receber 401 (não autorizado), o token pode ter expirado
      // Mas não redireciona se for um endpoint público (login/register)
      if (error.status === 401 && !isPublicEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!router.url.includes('/login')) {
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
