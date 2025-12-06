import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcorrenciaDetalhe } from './ocorrencia-detalhe';

describe('OcorrenciaDetalhe', () => {
  let component: OcorrenciaDetalhe;
  let fixture: ComponentFixture<OcorrenciaDetalhe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcorrenciaDetalhe]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OcorrenciaDetalhe);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
