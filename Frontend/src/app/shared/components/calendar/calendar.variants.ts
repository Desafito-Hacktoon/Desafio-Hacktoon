import { cva, type VariantProps } from 'class-variance-authority';

export const calendarVariants = cva('bg-background p-3 w-fit rounded-lg border');

export const calendarMonthVariants = cva('flex flex-col w-fit gap-4');

export const calendarNavVariants = cva('flex items-center justify-between gap-2 w-fit mb-4');

export const calendarNavButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
);

export const calendarWeekdaysVariants = cva('flex');

export const calendarWeekdayVariants = cva('text-muted-foreground font-normal text-center text-[0.8rem] w-8');

export const calendarWeekVariants = cva('flex w-full mt-2');

export const calendarDayVariants = cva('p-0 relative focus-within:relative focus-within:z-20 flex mt-1 h-8 w-8 text-sm');

export const calendarDayButtonVariants = cva(
  'p-0 font-normal flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground w-full h-full text-sm',
  {
    variants: {
      selected: {
        true: 'bg-[#135ce4] text-white hover:bg-[#135ce4] hover:text-white focus:bg-[#135ce4] focus:text-white',
        false: '',
      },
      today: {
        true: 'bg-accent text-accent-foreground',
        false: '',
      },
      outside: {
        true: 'text-muted-foreground opacity-50',
        false: '',
      },
      disabled: {
        true: 'text-muted-foreground opacity-50 cursor-not-allowed',
        false: '',
      },
      rangeStart: {
        true: 'rounded-r-none bg-[#135ce4] text-white hover:bg-[#135ce4]',
        false: '',
      },
      rangeEnd: {
        true: 'rounded-l-none bg-[#135ce4] text-white hover:bg-[#135ce4]',
        false: '',
      },
      inRange: {
        true: 'rounded-none bg-[#135ce4]/20 hover:bg-[#135ce4]/30',
        false: '',
      },
    },
    compoundVariants: [
      {
        today: true,
        selected: false,
        rangeStart: false,
        rangeEnd: false,
        inRange: false,
        className: 'bg-accent text-accent-foreground',
      },
      {
        today: true,
        selected: true,
        className: 'bg-primary text-primary-foreground',
      },
      {
        rangeStart: true,
        rangeEnd: true,
        className: 'rounded-md bg-primary text-primary-foreground',
      },
    ],
    defaultVariants: {
      selected: false,
      today: false,
      outside: false,
      disabled: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
    },
  },
);

export type ZardCalendarVariants = VariantProps<typeof calendarVariants>;
export type ZardCalendarWeekdayVariants = VariantProps<typeof calendarWeekdayVariants>;
export type ZardCalendarDayVariants = VariantProps<typeof calendarDayVariants>;
export type ZardCalendarDayButtonVariants = VariantProps<typeof calendarDayButtonVariants>;
