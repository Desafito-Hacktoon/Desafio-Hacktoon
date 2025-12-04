import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-singup',
    imports: [
    FormsModule,
    CommonModule
    ],
  templateUrl: './singup.html',
  styleUrl: './singup.css',
})
export class Singup {
  username = '';
    email = '';
    password = '';
    confirmPassword = '';
  nomeCompleto = '';
  isLoading = false;
  errorMessage = '';

    constructor(
    private authService: AuthService
    ) {}

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({
      username: this.username,
            email: this.email,
      password: this.password,
      nomeCompleto: this.nomeCompleto || undefined
        }).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Erro ao cadastrar. Tente novamente.';
        console.error('Erro no registro:', error);
      }
    });
  }

  private validateForm(): boolean {
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      return false;
    }

    if (this.username.length < 3) {
      this.errorMessage = 'Username deve ter no mínimo 3 caracteres.';
      return false;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Por favor, insira um email válido.';
      return false;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Senha deve ter no mínimo 8 caracteres.';
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'As senhas não coincidem.';
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
    }
}
