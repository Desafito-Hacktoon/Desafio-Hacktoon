import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { OcorrenciaResponse, OcorrenciaRequest, StatusOcorrencia } from '../../models/ocorrencia.models';
import { OcorreciasService } from '../ocorrenciasService/ocorrecias-service';
import type { ZardIcon } from '@shared/components/icon/icons';

@Component({
  selector: 'app-ocorrencia-detalhe-modal',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
  ],
  template: `
    <div class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50" (click)="onBackdropClick()">
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Detalhes da Ocorrência</h2>
            <p class="text-sm text-gray-500 mt-1">ID: {{ ocorrencia()?.id }}</p>
          </div>
          <button 
            z-button 
            zType="ghost" 
            zSize="sm"
            (click)="onClose()"
            class="!p-2">
            <z-icon zType="x" zSize="sm"></z-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          @if (isLoading()) {
            <div class="flex items-center justify-center py-12">
              <div class="text-gray-500">Carregando detalhes...</div>
            </div>
          } @else if (ocorrencia()) {
            <div class="space-y-6">
              <!-- Informações não editáveis -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Problema</label>
                  <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {{ formatarTipoProblema(ocorrencia()!.tipoProblema) }}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {{ ocorrencia()!.bairro }}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {{ ocorrencia()!.endereco || 'Não informado' }}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Gravidade</label>
                  <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {{ ocorrencia()!.gravidade }}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                  <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {{ ocorrencia()!.dataCriacao | date:'dd/MM/yyyy HH:mm' }}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Última Atualização</label>
                  <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {{ ocorrencia()!.dataAtualizacao | date:'dd/MM/yyyy HH:mm' }}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Secretaria de Origem</label>
                  <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {{ ocorrencia()!.secretariaOrigem || 'Não informado' }}
                  </div>
                </div>
              </div>

              <!-- Campos editáveis -->
              <div class="border-t border-gray-200 pt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Editar Informações</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                      z-input
                      [(ngModel)]="descricaoEditada"
                      rows="4"
                      class="w-full"
                      placeholder="Digite a descrição da ocorrência...">
                    </textarea>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <z-select 
                      [zValue]="statusEditado" 
                      zSize="default" 
                      zPlaceholder="Selecione o status"
                      (zSelectionChange)="onStatusChange($event)">
                      @for (status of statusOptions; track status) {
                        <z-select-item [zValue]="status">{{ status }}</z-select-item>
                      }
                    </z-select>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button 
            z-button 
            zType="outline" 
            (click)="onClose()">
            Cancelar
          </button>
          <button 
            z-button 
            zType="default" 
            (click)="onSave()"
            [disabled]="isSaving()"
            class="!bg-[#135ce4] !text-white hover:!bg-[#0f4bc0] !border-0">
            @if (isSaving()) {
              Salvando...
            } @else {
              Salvar
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class OcorrenciaDetalheModalComponent {
  private ocorrenciasService = inject(OcorreciasService);

  ocorrencia = signal<OcorrenciaResponse | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  close = output<void>();
  saved = output<OcorrenciaResponse>();

  // Valores editáveis
  descricaoEditada = '';
  statusEditado: StatusOcorrencia | '' = '';

  // Opções de status
  statusOptions: StatusOcorrencia[] = [
    StatusOcorrencia.PENDENTE,
    StatusOcorrencia.EM_AVALIACAO,
    StatusOcorrencia.EM_ANDAMENTO,
    StatusOcorrencia.PROBLEMA_IDENTIFICADO,
    StatusOcorrencia.RESOLVIDO,
    StatusOcorrencia.CANCELADO,
  ];

  /**
   * Carrega os detalhes da ocorrência
   */
  carregarDetalhes(ocorrenciaId: string) {
    this.isLoading.set(true);
    this.ocorrenciasService.buscarPorId(ocorrenciaId).subscribe({
      next: (ocorrencia) => {
        this.ocorrencia.set(ocorrencia);
        this.descricaoEditada = ocorrencia.descricao || '';
        this.statusEditado = ocorrencia.status;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar detalhes da ocorrência:', error);
        this.isLoading.set(false);
      },
    });
  }

  onStatusChange(value: string | string[]) {
    this.statusEditado = (Array.isArray(value) ? value[0] : value) as StatusOcorrencia;
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick() {
    this.onClose();
  }

  onSave() {
    const ocorrenciaAtual = this.ocorrencia();
    if (!ocorrenciaAtual) return;

    if (!this.statusEditado) {
      alert('Por favor, selecione um status');
      return;
    }

    this.isSaving.set(true);

    // Preparar dados para atualização
    const dadosAtualizacao: OcorrenciaRequest = {
      tipoProblema: ocorrenciaAtual.tipoProblema,
      descricao: this.descricaoEditada || undefined,
      bairro: ocorrenciaAtual.bairro,
      endereco: ocorrenciaAtual.endereco,
      latitude: ocorrenciaAtual.latitude,
      longitude: ocorrenciaAtual.longitude,
      gravidade: ocorrenciaAtual.gravidade,
      gravidadeIA: ocorrenciaAtual.gravidadeIA,
      status: this.statusEditado as StatusOcorrencia,
      secretariaOrigem: ocorrenciaAtual.secretariaOrigem,
      metadata: ocorrenciaAtual.metadata,
    };

    this.ocorrenciasService.atualizar(ocorrenciaAtual.id, dadosAtualizacao).subscribe({
      next: (ocorrenciaAtualizada) => {
        this.isSaving.set(false);
        this.saved.emit(ocorrenciaAtualizada);
        this.onClose();
      },
      error: (error) => {
        console.error('Erro ao salvar ocorrência:', error);
        alert('Erro ao salvar alterações. Tente novamente.');
        this.isSaving.set(false);
      },
    });
  }

  formatarTipoProblema(tipo: string): string {
    if (!tipo) return tipo;
    
    const mapeamento: Record<string, string> = {
      'BOCA_LOBO': 'Boca de lobo',
      'GUIA_SARJETA': 'Guia ou sarjeta',
      'PONTE_VIADUTO': 'Ponte ou viaduto',
      'POSTE_CAIDO': 'Poste caído',
      'LAMPADA_QUEIMADA': 'Lâmpada queimada',
      'LIXO_ACUMULADO': 'Lixo acumulado',
      'COLETA_LIXO': 'Coleta de lixo',
      'PODA_ARVORE': 'Poda de árvore',
      'ARVORE_CAIDA': 'Árvore caída',
      'VAZAMENTO_AGUA': 'Vazamento de água',
      'ANIMAIS_ABANDONADOS': 'Animais abandonados',
      'ANIMAIS_SOLTOS': 'Animais soltos',
      'PARADA_ONIBUS': 'Parada de ônibus',
      'AREA_USO_DROGAS': 'Área de uso de drogas',
      'MOBILIARIO_URBANO': 'Mobiliário urbano',
      'ACADEMIA_AR_LIVRE': 'Academia ao ar livre',
    };

    if (mapeamento[tipo]) {
      return mapeamento[tipo];
    }

    return tipo
      .toLowerCase()
      .split('_')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  }
}

