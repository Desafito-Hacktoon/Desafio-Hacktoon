import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, linkedSignal, output, ViewEncapsulation } from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import type { ClassValue } from 'clsx';

import {
  paginationContentVariants,
  paginationEllipsisVariants,
  paginationItemVariants,
  paginationNextVariants,
  paginationPreviousVariants,
  paginationVariants,
} from './pagination.variants';
import { mergeClasses } from '@shared/utils/merge-classes';
import { ZardButtonComponent } from '../button/button.component';
import { type ZardButtonVariants } from '../button/button.variants';
import { ZardIconComponent } from '../icon/icon.component';

@Component({
  selector: 'z-pagination-content',
  exportAs: 'zPaginationContent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.aria-label]="ariaLabel()" role="navigation" data-slot="pagination-content" [class]="classes()">
      <ng-content></ng-content>
    </div>
  `,
})
export class ZardPaginationContentComponent {
  readonly ariaLabel = input<string>('pagination-content');

  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(paginationContentVariants(), this.class()));
}

@Component({
  selector: 'z-pagination-item',
  exportAs: 'zPaginationItem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div data-slot="pagination-item" [class]="classes()">
      <ng-content></ng-content>
    </div>
  `,
})
export class ZardPaginationItemComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(paginationItemVariants(), this.class()));
}

@Component({
  selector: 'z-pagination-button',
  exportAs: 'zPaginationButton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardButtonComponent],
  template: `
    <button
      z-button
      data-slot="pagination-button"
      [attr.aria-disabled]="zDisabled() || null"
      [attr.data-disabled]="zDisabled() || null"
      [attr.aria-current]="zActive() ? 'page' : undefined"
      [attr.data-active]="zActive() || null"
      [zType]="zType()"
      [zSize]="zSize()"
      [class]="class()"
      (click)="handleClick()"
    >
      <ng-content></ng-content>
    </button>
  `,
})
export class ZardPaginationButtonComponent {
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zActive = input(false, { transform: booleanAttribute });
  readonly zSize = input<ZardButtonVariants['zSize']>();

  readonly class = input<ClassValue>('');
  readonly zClick = output<void>();

  protected readonly zType = computed<ZardButtonVariants['zType']>(() => (this.zActive() ? 'outline' : 'ghost'));

  handleClick() {
    if (!this.zDisabled() && !this.zActive()) {
      this.zClick.emit();
    }
  }
}

@Component({
  selector: 'z-pagination-previous',
  exportAs: 'zPaginationPrevious',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardPaginationButtonComponent, ZardIconComponent],
  template: `
    <z-pagination-button aria-label="Go to previous page" [class]="classes()" [zSize]="'default'">
      <z-icon zType="chevron-left" />
      <span class="hidden sm:block">Previous</span>
    </z-pagination-button>
  `,
})
export class ZardPaginationPreviousComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(paginationPreviousVariants(), this.class()));
}

@Component({
  selector: 'z-pagination-next',
  exportAs: 'zPaginationNext',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardPaginationButtonComponent, ZardIconComponent],
  template: `
    <z-pagination-button aria-label="Go to next page" [class]="classes()" [zSize]="'default'">
      <span class="hidden sm:block">Next</span>
      <z-icon zType="chevron-right" />
    </z-pagination-button>
  `,
})
export class ZardPaginationNextComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(paginationNextVariants(), this.class()));
}

@Component({
  selector: 'z-pagination-ellipsis',
  exportAs: 'zPaginationEllipsis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardIconComponent],
  template: `
    <z-icon zType="ellipsis" aria-hidden="true" role="presentation" />
    <span class="sr-only">More pages</span>
  `,
  host: {
    '[class]': 'classes()',
  },
})
export class ZardPaginationEllipsisComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(paginationEllipsisVariants(), this.class()));
}

@Component({
  selector: 'z-pagination',
  exportAs: 'zPagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardPaginationContentComponent, ZardPaginationItemComponent, ZardPaginationButtonComponent, ZardPaginationEllipsisComponent, ZardIconComponent],
  template: `
    <z-pagination-content>
      <z-pagination-item>
        <z-pagination-button aria-label="Go to previous page" [zSize]="zSize()" [zDisabled]="disabled() || currentPage() === 1" (zClick)="goToPrevious()">
          <z-icon zType="chevron-left" />
        </z-pagination-button>
      </z-pagination-item>

      @for (page of pages(); track page) {
        @if (page === 'ellipsis') {
          <z-pagination-item>
            <z-pagination-ellipsis />
          </z-pagination-item>
        } @else {
          <z-pagination-item>
            <z-pagination-button [zSize]="zSize()" [zActive]="page === currentPage()" [zDisabled]="disabled()" (zClick)="goToPage(page)">
              {{ page }}
            </z-pagination-button>
          </z-pagination-item>
        }
      }

      <z-pagination-item>
        <z-pagination-button aria-label="Go to next page" [zSize]="zSize()" [zDisabled]="disabled() || currentPage() === zTotal()" (zClick)="goToNext()">
          <z-icon zType="chevron-right" />
        </z-pagination-button>
      </z-pagination-item>
    </z-pagination-content>
  `,
  host: {
    '[class]': 'classes()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardPaginationComponent),
      multi: true,
    },
  ],
})
export class ZardPaginationComponent implements ControlValueAccessor {
  readonly zPageIndex = input<number>(1);
  readonly zTotal = input<number>(1);
  readonly zSize = input<ZardButtonVariants['zSize']>();
  readonly zDisabled = input(false, { transform: booleanAttribute });

  readonly class = input<ClassValue>('');

  readonly zPageIndexChange = output<number>();

  protected readonly classes = computed(() => mergeClasses(paginationVariants(), this.class()));

  protected readonly disabled = linkedSignal(() => {
    return this.zDisabled();
  });

  readonly currentPage = linkedSignal(this.zPageIndex);

  readonly pages = computed<(number | 'ellipsis')[]>(() => {
    const total = this.zTotal();
    const current = this.currentPage();
    const maxVisible = 7; // Número máximo de páginas visíveis (incluindo ellipsis)
    
    if (total <= maxVisible) {
      // Se o total de páginas for menor ou igual ao máximo, mostra todas
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    const pages: (number | 'ellipsis')[] = [];
    const sidePages = 2;
    
    pages.push(1);
    
    let start = Math.max(2, current - sidePages);
    let end = Math.min(total - 1, current + sidePages);
    
    // Ajusta o range se estiver muito próximo do início ou fim
    if (current <= sidePages + 2) {
      end = Math.min(total - 1, maxVisible - 2);
    } else if (current >= total - sidePages - 1) {
      start = Math.max(2, total - maxVisible + 3);
    }
    
    // Adiciona ellipsis antes do range central se necessário
    if (start > 2) {
      pages.push('ellipsis');
    }
    
    // Adiciona as páginas do range central
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Adiciona ellipsis depois do range central se necessário
    if (end < total - 1) {
      pages.push('ellipsis');
    }
    
    // Sempre mostra a última página
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  });

  goToPage(page: number): void {
    if (this.disabled()) return;
    if (page !== this.currentPage() && page >= 1 && page <= this.zTotal()) {
      this.currentPage.set(page);
      this.zPageIndexChange.emit(page);
      this.onChange(page);
      this.onTouched();
    }
  }

  goToPrevious() {
    this.goToPage(this.currentPage() - 1);
  }

  goToNext() {
    this.goToPage(this.currentPage() + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: number) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  writeValue(value: number): void {
    this.currentPage.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
