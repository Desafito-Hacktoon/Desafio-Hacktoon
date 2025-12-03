import {Component, OnInit} from '@angular/core';
import {TableModule} from 'primeng/table';
import {ChartModule} from 'primeng/chart';
import {CardModule} from 'primeng/card';
import {DatePipe, NgClass} from '@angular/common';
import {DashboardService} from '../dashboardService/dashboard-service';
import {Ocorrencia} from '../../models/Ocorrencia';
import colors = require('tailwindcss/colors');
import {Piechart} from '../../models/piechart';

@Component({
  selector: 'app-dashboard',
  imports: [TableModule, ChartModule, CardModule, DatePipe, NgClass],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {

  ocorrencias: Ocorrencia[] = [];
  pieData!: Piechart;
  pieOptions: any;

  pieData2!: Piechart;
  pieOptions2: any;

  pieData3!: Piechart;
  pieOptions3: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.getDashboardData().subscribe(data => {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      this.ocorrencias = data.filter((oc: Ocorrencia) => {
        const dataCriacao = new Date(oc.dataCriacao);
        return dataCriacao.getMonth() === mesAtual && dataCriacao.getFullYear() === anoAtual;
      });
      this.atualizarGraficos();
    });
  }

  get ocorrenciasDoMes(): Ocorrencia[] {
    return this.ocorrencias;
  }

  atualizarGraficos() {
    // Gráfico por tipo de problema
    const tipos = this.ocorrencias.reduce((acc, oc) => {
      acc[oc.tipoProblema] = (acc[oc.tipoProblema] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData = this.gerarPieData(tipos, ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF']);
    this.pieOptions = this.gerarPieOptions();

    // Gráfico por bairro
    const bairros = this.ocorrencias.reduce((acc, oc) => {
      acc[oc.bairro] = (acc[oc.bairro] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData2 = this.gerarPieData(bairros,['#9C27B0', '#FF9800', '#03A9F4', '#8BC34A']);
    this.pieOptions2 = this.gerarPieOptions();

    // Gráfico por status
    const status = this.ocorrencias.reduce((acc, oc) => {
      acc[oc.status] = (acc[oc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData3 = this.gerarPieData(status, ['#009688', '#f44335', '#ffc107']);
    this.pieOptions3 = this.gerarPieOptions();
  }

    private gerarPieData(obj: Record<string, number>, color:string[]):Piechart{
      return {
        labels: Object.keys(obj),
        datasets: [
          {
            data: Object.values(obj),
            backgroundColor: color
          }
        ]
      };
    }

  private gerarPieOptions() {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom', // posição da legenda: top, left, right, bottom
        },
      }
    };
  }
}


