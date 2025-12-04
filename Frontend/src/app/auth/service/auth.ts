import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, AuthResponse, UserInfo } from '../../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const loginUrl = `${this.apiUrl}/login`;
    
    return this.http.post<AuthResponse>(loginUrl, credentials).pipe(
      tap({
        next: (response: AuthResponse) => {
          this.setAuthData(response);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Erro no AuthService.login:', error);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response: AuthResponse) => {
        this.setAuthData(response);
        this.router.navigate(['/dashboard']);
      })
    );
    }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
    return !!this.getToken();
    }

    getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): UserInfo | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setAuthData(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    }
}
