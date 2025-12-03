import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ocorrencias } from './ocorrencias';

describe('Ocorrencias', () => {
  let component: Ocorrencias;
  let fixture: ComponentFixture<Ocorrencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ocorrencias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ocorrencias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
