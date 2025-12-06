import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, type TemplateRef, viewChild, ViewEncapsulation } from '@angular/core';

import { mergeClasses } from '@shared/utils/merge-classes';
import { ZardButtonComponent } from '../button/button.component';
import { ZardCalendarComponent } from '../calendar/calendar.component';
import { ZardIconComponent } from '../icon/icon.component';
import { ZardPopoverComponent, ZardPopoverDirective } from '../popover/popover.component';
import { datePickerVariants, type ZardDatePickerVariants } from './date-picker.variants';

import type { ClassValue } from 'clsx';

const HEIGHT_BY_SIZE: Record<NonNullable<ZardDatePickerVariants['zSize']>, string> = {
  sm: 'h-8',
  default: 'h-10',
  lg: 'h-12',
};

@Component({
  selector: 'z-date-picker, [z-date-picker]',
  exportAs: 'zDatePicker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ZardButtonComponent, ZardCalendarComponent, ZardPopoverComponent, ZardPopoverDirective, ZardIconComponent],
  host: {},
  template: `
    <button
      z-button
      [zType]="zType()"
      [zSize]="zSize()"
      [disabled]="disabled()"
      [class]="buttonClasses()"
      zPopover
      #popoverDirective="zPopover"
      [zContent]="calendarTemplate"
      zTrigger="click"
      (zVisibleChange)="onPopoverVisibilityChange($event)"
      [attr.aria-expanded]="false"
      [attr.aria-haspopup]="true"
      aria-label="Choose date"
    >
      <z-icon zType="calendar" class="mr-2" />
      <span [class]="textClasses()">
        {{ displayText() }}
      </span>
    </button>

    <ng-template #calendarTemplate>
      <z-popover [class]="popoverClasses()" class="!bg-white">
        <z-calendar #calendar [value]="value()" [zMode]="zMode()" [minDate]="minDate()" [maxDate]="maxDate()" [disabled]="disabled()" (dateChange)="onDateChange($event)" />
      </z-popover>
    </ng-template>
  `,
  providers: [DatePipe],
})
export class ZardDatePickerComponent {
  private readonly datePipe = inject(DatePipe);

  readonly calendarTemplate = viewChild.required<TemplateRef<unknown>>('calendarTemplate');
  readonly popoverDirective = viewChild.required<ZardPopoverDirective>('popoverDirective');
  readonly calendar = viewChild.required<ZardCalendarComponent>('calendar');

  readonly class = input<ClassValue>('');
  readonly zType = input<ZardDatePickerVariants['zType']>('outline');
  readonly zSize = input<ZardDatePickerVariants['zSize']>('default');
  readonly value = input<Date | Date[] | null>(null);
  readonly placeholder = input<string>('Pick a date');
  readonly zFormat = input<string>('MMMM d, yyyy');
  readonly zMode = input<'single' | 'range'>('single');
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly disabled = input<boolean>(false);

  readonly dateChange = output<Date | Date[] | null>();

  protected readonly classes = computed(() =>
    mergeClasses(
      datePickerVariants({
        zSize: this.zSize(),
      }),
      this.class(),
    ),
  );

  protected readonly buttonClasses = computed(() => {
    const hasValue = !!this.value();
    const size: NonNullable<ZardDatePickerVariants['zSize']> = this.zSize() ?? 'default';
    const height = HEIGHT_BY_SIZE[size];
    return mergeClasses(
      'justify-start text-left font-normal', 
      !hasValue ? 'bg-gray-100 text-muted-foreground' : '!bg-white',
      height, 
      this.zMode() === 'range' ? 'min-w-[280px]' : 'min-w-[240px]',
      'w-full'
    );
  });

  protected readonly textClasses = computed(() => {
    const hasValue = !!this.value();
    return mergeClasses(!hasValue && 'text-muted-foreground');
  });

  protected readonly popoverClasses = computed(() => mergeClasses('w-auto p-0 !bg-white !z-[10000] shadow-lg'));

  protected readonly displayText = computed(() => {
    const value = this.value();
    if (!value) {
      return this.placeholder();
    }
    
    if (this.zMode() === 'range') {
      const dates = Array.isArray(value) ? value : [value];
      if (dates.length === 0) {
        return this.placeholder();
      }
      if (dates.length === 1) {
        return this.formatDate(dates[0], this.zFormat());
      }
      if (dates.length === 2) {
        const start = this.formatDate(dates[0], 'dd/MM/yyyy');
        const end = this.formatDate(dates[1], 'dd/MM/yyyy');
        return `${start} - ${end}`;
      }
    }
    
    const date = Array.isArray(value) ? value[0] : value;
    return this.formatDate(date, this.zFormat());
  });

  protected onDateChange(date: Date | Date[]): void {
    if (this.zMode() === 'range') {
      // Para range, só fecha quando tiver duas datas selecionadas
      const dates = Array.isArray(date) ? date : [date];
      if (dates.length === 2) {
        this.dateChange.emit(dates);
        this.popoverDirective().hide();
      } else {
        this.dateChange.emit(dates.length > 0 ? dates : null);
      }
    } else {
      // Para single mode
      const singleDate = Array.isArray(date) ? (date[0] ?? null) : date;
      this.dateChange.emit(singleDate);
      this.popoverDirective().hide();
    }
  }

  protected onPopoverVisibilityChange(visible: boolean): void {
    if (visible) {
      setTimeout(() => {
        if (this.calendar()) {
          this.calendar().resetNavigation();
        }
      });
    }
  }

  private formatDate(date: Date, format: string): string {
    return this.datePipe.transform(date, format) ?? '';
  }
}

