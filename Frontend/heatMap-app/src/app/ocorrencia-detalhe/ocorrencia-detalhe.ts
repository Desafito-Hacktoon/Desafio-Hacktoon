import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OcorreciasService} from '../ocorrencias/ocorrenciasService/ocorrecias-service';
import {Ocorrencia} from '../models/Ocorrencia';
import {Ocorrencias} from '../ocorrencias/ocorrencias.component/ocorrencias';

@Component({
  selector: 'app-ocorrencia-detalhe',
  imports: [],
  templateUrl: './ocorrencia-detalhe.html',
  styleUrl: './ocorrencia-detalhe.css',
})
export class OcorrenciaDetalhe implements OnInit {
    ocorrencias?:Ocorrencia;

    constructor(
      private route: ActivatedRoute,
      private ocorrenciasService: OcorreciasService
    ) {}

  ngOnInit() {
      const id = this.route.snapshot.paramMap.get('id');
      this.ocorrenciasService.getOcorrenciasData().subscribe((data:Ocorrencia[]) => {
        this.ocorrencias = data.find((o: Ocorrencia) => o.id == id);
      });
  }

  protected readonly Ocorrencias = Ocorrencias;
}
