import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { OcorrenciaResponse } from '../../models/ocorrencia.models';
import type { ZardIcon } from '@shared/components/icon/icons';

@Component({
  selector: 'app-hexagon-occurrences-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, NgClass, ZardButtonComponent, ZardIconComponent],
  template: `
    <div class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50" (click)="onBackdropClick()">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Ocorrências do Hexágono</h2>
            <p class="text-sm text-gray-500 mt-1">{{ ocorrencias().length }} ocorrência(s) encontrada(s)</p>
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
              <div class="text-gray-500">Carregando ocorrências...</div>
            </div>
          } @else if (ocorrencias().length === 0) {
            <div class="flex flex-col items-center justify-center py-12">
              <z-icon zType="info" class="text-gray-400 mb-4" zSize="lg"></z-icon>
              <p class="text-gray-500">Nenhuma ocorrência encontrada neste hexágono</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (ocorrencia of ocorrencias(); track ocorrencia.id) {
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <h3 class="font-semibold text-gray-900">{{ formatarTipoProblema(ocorrencia.tipoProblema) }}</h3>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md" [ngClass]="getStatusBadgeClass(ocorrencia.status)">
                          <z-icon [zType]="getStatusIcon(ocorrencia.status)" zSize="sm" class="!w-3 !h-3"></z-icon>
                          {{ ocorrencia.status }}
                        </span>
                      </div>
                      @if (ocorrencia.descricao) {
                        <p class="text-sm text-gray-600 mb-2 line-clamp-2">{{ ocorrencia.descricao }}</p>
                      }
                      <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span class="flex items-center gap-1">
                          <z-icon zType="info" zSize="sm" class="!w-3 !h-3"></z-icon>
                          {{ ocorrencia.bairro }}
                        </span>
                        <span class="flex items-center gap-1">
                          <z-icon zType="circle-alert" zSize="sm" class="!w-3 !h-3"></z-icon>
                          Gravidade: {{ ocorrencia.gravidade }}
                        </span>
                        <span class="flex items-center gap-1">
                          <z-icon zType="calendar" zSize="sm" class="!w-3 !h-3"></z-icon>
                          {{ ocorrencia.dataCriacao | date:'dd/MM/yyyy HH:mm' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 flex justify-end">
          <button z-button zType="default" (click)="onClose()">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class HexagonOccurrencesModalComponent {
  ocorrencias = signal<OcorrenciaResponse[]>([]);
  isLoading = signal<boolean>(false);
  close = output<void>();

  onClose() {
    this.close.emit();
  }

  onBackdropClick() {
    this.onClose();
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'border border-blue-500 text-blue-600 bg-transparent';
      case 'CANCELADO':
        return 'border border-red-500 text-red-600 bg-transparent';
      case 'RESOLVIDO':
        return 'border border-green-500 text-green-600 bg-transparent';
      case 'PROBLEMA_IDENTIFICADO':
        return 'border border-orange-500 text-orange-600 bg-transparent';
      case 'PENDENTE':
        return 'border border-gray-500 text-gray-600 bg-transparent';
      case 'EM_AVALIACAO':
        return 'border border-yellow-500 text-yellow-600 bg-transparent';
      default:
        return 'border border-gray-500 text-gray-600 bg-transparent';
    }
  }

  getStatusIcon(status: string): ZardIcon {
    switch (status) {
      case 'PENDENTE':
      case 'EM_AVALIACAO':
      case 'EM_ANDAMENTO':
        return 'clock';
      case 'PROBLEMA_IDENTIFICADO':
        return 'circle-alert';
      case 'RESOLVIDO':
        return 'circle-check';
      case 'CANCELADO':
        return 'circle-x';
      default:
        return 'circle';
    }
  }
}

