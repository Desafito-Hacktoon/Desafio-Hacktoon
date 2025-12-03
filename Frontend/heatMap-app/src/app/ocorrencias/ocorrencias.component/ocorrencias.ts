import {Component, OnInit} from '@angular/core';
import {OcorreciasService} from '../ocorrenciasService/ocorrecias-service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-ocorrencias',
  imports: [
    RouterLink
  ],
  templateUrl: './ocorrencias.html',
  styleUrl: './ocorrencias.css',
})
export class Ocorrencias implements OnInit {

  ocorrencias: any[] = [];

  constructor(private ocorrenciasService: OcorreciasService) {}

  ngOnInit() {
    this.ocorrenciasService.getOcorrenciasData().subscribe(data => {
      this.ocorrencias = data;
    });
  }
}
