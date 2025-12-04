import { Component, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }[];
}

@Component({
  selector: 'z-line-chart',
  standalone: true,
  imports: [ChartModule],
  template: `
    <p-chart 
      type="line" 
      [data]="chartData()" 
      [options]="chartOptions()" 
      class="h-[400px]">
    </p-chart>
  `,
})
export class ZardLineChartComponent {
  readonly chartData = input.required<LineChartData>();
  readonly chartOptions = input<any>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Data',
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Quantidade de Ocorrências',
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  });
}
