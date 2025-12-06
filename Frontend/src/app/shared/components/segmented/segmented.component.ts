import { Component, computed, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ClassValue } from 'clsx';
import { mergeClasses } from '@shared/utils/merge-classes';
import { segmentedVariants } from './segmented.variants';

@Component({
  selector: 'z-segmented',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="classes()" role="group" [attr.aria-label]="zAriaLabel()">
      @for (option of zOptions(); track option.value) {
        <button
          type="button"
          [class]="getButtonClasses(option.value)"
          [attr.aria-pressed]="zValue() === option.value"
          (click)="selectOption(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class ZardSegmentedComponent {
  readonly zValue = model<string>('');
  readonly zOptions = input<Array<{ value: string; label: string }>>([]);
  readonly zSize = input<'sm' | 'default' | 'lg'>('default');
  readonly zAriaLabel = input<string>('');
  readonly class = input<ClassValue>('');

  readonly zSelectionChange = output<string>();

  protected readonly classes = computed(() =>
    mergeClasses(segmentedVariants({ zSize: this.zSize() }), this.class())
  );

  getButtonClasses(value: string): string {
    const isSelected = this.zValue() === value;
    return mergeClasses(
      'px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-md',
      isSelected
        ? 'bg-white text-gray-900 border border-gray-300 hover:bg-white'
        : 'bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent'
    );
  }

  selectOption(value: string): void {
    if (this.zValue() !== value) {
      this.zValue.set(value);
      this.zSelectionChange.emit(value);
    }
  }
}

