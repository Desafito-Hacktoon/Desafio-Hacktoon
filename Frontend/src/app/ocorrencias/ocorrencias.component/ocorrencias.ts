import {Component, OnInit} from '@angular/core';
import {OcorreciasService} from '../ocorrenciasService/ocorrecias-service';
import {RouterLink} from '@angular/router';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent,
} from '@shared/components/table/table.component';
import {CommonModule, DatePipe} from '@angular/common';
import {ZardCardComponent} from '@shared/components/card/card.component';
import {ZardPaginationComponent} from '@shared/components/pagination/pagination.component';
import {ZardSelectComponent} from '@shared/components/select/select.component';
import {ZardSelectItemComponent} from '@shared/components/select/select-item.component';
import {OcorrenciaResponse} from '../../models/ocorrencia.models';
import {ZardInputDirective} from '@shared/components/input/input.directive';

@Component({
  selector: 'app-ocorrencias',
  imports: [
    RouterLink,
    CommonModule,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardCardComponent,
    ZardPaginationComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
  ],
  templateUrl: './ocorrencias.html',
  styleUrl: './ocorrencias.css',
})
export class Ocorrencias implements OnInit {
  // dados base e filtrados
  ocorrenciasOriginais: OcorrenciaResponse[] = [];
  ocorrencias: OcorrenciaResponse[] = [];

  // paginação
  currentPage = 1;
  itemsPerPage = 10;
  itemsPerPageOptions = [5, 10, 20, 50];

  // filtros
  filtroBusca = '';
  filtroStatus = '';
  filtroBairro = '';
  filtroTipo = '';

  statusOptions = ['ABERTO', 'EM_ANDAMENTO', 'FECHADO', 'Resolvido', 'Em Andamento'];

  constructor(private ocorrenciasService: OcorreciasService) {}

  ngOnInit() {
    this.ocorrenciasService.getOcorrenciasData().subscribe(data => {
      this.ocorrenciasOriginais = data;
      this.aplicarFiltros();
    });
  }

  get paginatedOcorrencias(): OcorrenciaResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.ocorrencias.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.ocorrencias.length / this.itemsPerPage);
  }

  get paginationInfo() {
    const total = this.ocorrencias.length;
    const start = total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, total);
    return {
      start,
      end,
      total,
      currentPage: this.currentPage,
      totalPages: this.totalPages,
    };
  }

  get bairrosOptions(): string[] {
    const bairros = new Set(this.ocorrenciasOriginais.map(oc => oc.bairro));
    return Array.from(bairros).sort();
  }

  get tiposOptions(): string[] {
    const tipos = new Set(this.ocorrenciasOriginais.map(oc => oc.tipoProblema));
    return Array.from(tipos).sort();
  }

  aplicarFiltros() {
    let filtradas = [...this.ocorrenciasOriginais];

    const busca = this.filtroBusca.toLowerCase().trim();
    if (busca) {
      filtradas = filtradas.filter(oc =>
        oc.tipoProblema.toLowerCase().includes(busca) ||
        (oc.descricao?.toLowerCase() || '').includes(busca) ||
        oc.bairro.toLowerCase().includes(busca) ||
        (oc.endereco?.toLowerCase() || '').includes(busca) ||
        (oc.secretariaOrigem?.toLowerCase() || '').includes(busca),
      );
    }

    if (this.filtroStatus) {
      filtradas = filtradas.filter(oc => oc.status === this.filtroStatus);
    }

    if (this.filtroBairro) {
      filtradas = filtradas.filter(oc => oc.bairro === this.filtroBairro);
    }

    if (this.filtroTipo) {
      filtradas = filtradas.filter(oc => oc.tipoProblema === this.filtroTipo);
    }

    this.ocorrencias = filtradas;
    this.currentPage = 1;
  }

  onStatusChange(value: string | string[]) {
    this.filtroStatus = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
    this.aplicarFiltros();
  }

  onBairroChange(value: string | string[]) {
    this.filtroBairro = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
    this.aplicarFiltros();
  }

  onTipoChange(value: string | string[]) {
    this.filtroTipo = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
    this.aplicarFiltros();
  }

  limparFiltros() {
    this.filtroBusca = '';
    this.filtroStatus = '';
    this.filtroBairro = '';
    this.filtroTipo = '';
    this.aplicarFiltros();
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onItemsPerPageChange(value: string | string[]) {
    const newValue = Array.isArray(value) ? parseInt(value[0], 10) : parseInt(value as string, 10);
    if (!isNaN(newValue) && newValue > 0) {
      this.itemsPerPage = newValue;
      this.currentPage = 1;
    }
  }
}
