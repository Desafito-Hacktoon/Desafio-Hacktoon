import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
    imports: [
    FormsModule,
    CommonModule
    ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  emailOrUsername = '';
    password = '';
  isLoading = false;
  errorMessage = '';

    constructor(
        private authService: AuthService,
    ) {}

  onSubmit(): void {
    if (!this.emailOrUsername || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({
      emailOrUsername: this.emailOrUsername.trim(),
            password: this.password
        }).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro completo no login:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'Erro de conexão. Verifique se o backend está rodando em http://localhost:8080';
        } else if (error.status === 401) {
          this.errorMessage = error?.error?.message || 'Credenciais inválidas. Verifique seu email/username e senha.';
        } else if (error.status === 400) {
          this.errorMessage = error?.error?.message || 'Dados inválidos. Verifique os campos preenchidos.';
        } else if (error.status === 404) {
          this.errorMessage = 'Endpoint não encontrado. Verifique a URL da API.';
        } else if (error.status === 500) {
          this.errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        } else {
          this.errorMessage = error?.error?.message || `Erro ao fazer login (${error.status}). Tente novamente.`;
        }
      }
    });
    }
}
