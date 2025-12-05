import { Component, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { Piechart } from '../../../models/piechart';

@Component({
  selector: 'z-pie-chart',
  standalone: true,
  imports: [ChartModule],
  template: `
    <p-chart 
      type="pie" 
      [data]="chartData()" 
      [options]="chartOptions()" 
      class="h-[400px]">
    </p-chart>
  `,
})
export class ZardPieChartComponent {
  readonly chartData = input.required<Piechart>();
  readonly chartOptions = input<any>();
}
