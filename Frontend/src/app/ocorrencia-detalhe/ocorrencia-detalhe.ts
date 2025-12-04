import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OcorreciasService} from '../ocorrencias/ocorrenciasService/ocorrecias-service';
import {OcorrenciaResponse} from '../models/ocorrencia.models';
import {Ocorrencias} from '../ocorrencias/ocorrencias.component/ocorrencias';

@Component({
  selector: 'app-ocorrencia-detalhe',
  imports: [],
  templateUrl: './ocorrencia-detalhe.html',
  styleUrl: './ocorrencia-detalhe.css',
})
export class OcorrenciaDetalhe implements OnInit {
    ocorrencias?:OcorrenciaResponse;

    constructor(
      private route: ActivatedRoute,
      private ocorrenciasService: OcorreciasService
    ) {}

  ngOnInit() {
      const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ocorrenciasService.buscarPorId(id).subscribe({
        next: (ocorrencia) => {
          this.ocorrencias = ocorrencia;
        },
        error: (error) => {
          console.error('Erro ao buscar ocorrência:', error);
          // Fallback para método antigo se necessário
          this.ocorrenciasService.getOcorrenciasData().subscribe((data: OcorrenciaResponse[]) => {
            this.ocorrencias = data.find((o: OcorrenciaResponse) => o.id === id);
      });
        }
      });
    }
  }

  protected readonly Ocorrencias = Ocorrencias;
}
