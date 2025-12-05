import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/service/auth';
import { ZardIconComponent } from '../icon/icon.component';
import { ZardPopoverComponent, ZardPopoverDirective } from '../popover/popover.component';

@Component({
  selector: 'z-user-menu',
  standalone: true,
  imports: [
    CommonModule,
    ZardIconComponent,
    ZardPopoverComponent,
    ZardPopoverDirective
  ],
  template: `
    <div class="relative w-full">
      <button
        zPopover
        [zContent]="userMenuTemplate"
        zTrigger="click"
        zPlacement="top"
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {{ userInitials() }}
        </div>
        <div class="flex flex-col items-start flex-1 min-w-0">
          <span class="text-sm font-medium text-gray-900 truncate w-full">{{ userName() }}</span>
          <span class="text-xs text-gray-500 truncate w-full">{{ userEmail() }}</span>
        </div>
        <z-icon zType="chevron-down" class="text-gray-500 flex-shrink-0"></z-icon>
      </button>

      <ng-template #userMenuTemplate>
        <z-popover class="w-64 p-1 shadow-lg border border-gray-200 rounded-lg">
          <div class="px-3 py-2 border-b border-gray-200">
            <p class="text-sm font-medium text-gray-900">{{ userName() }}</p>
            <p class="text-xs text-gray-500 truncate">{{ userEmail() }}</p>
            @if (userRole()) {
              <span class="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {{ userRole() }}
              </span>
            }
          </div>
          
          <div class="py-1">
            <button
              (click)="handleLogout()"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <z-icon zType="log-out" class="w-4 h-4"></z-icon>
              <span>Sair</span>
            </button>
          </div>
        </z-popover>
      </ng-template>
    </div>
  `,
})
export class UserMenuComponent {
  private readonly authService = inject(AuthService);

  protected readonly user = computed(() => this.authService.getUser());
  protected readonly userName = computed(() => {
    const user = this.user();
    return user?.nomeCompleto || user?.username || 'Usuário';
  });
  protected readonly userEmail = computed(() => {
    const user = this.user();
    return user?.email || '';
  });
  protected readonly userRole = computed(() => {
    const user = this.user();
    if (!user?.role) return null;
    // Remove o prefixo ROLE_ se existir
    return user.role.replace('ROLE_', '');
  });
  protected readonly userInitials = computed(() => {
    const name = this.userName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  handleLogout(): void {
    this.authService.logout();
  }
}


