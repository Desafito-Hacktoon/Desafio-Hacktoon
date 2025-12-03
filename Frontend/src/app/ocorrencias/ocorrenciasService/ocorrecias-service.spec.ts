import { TestBed } from '@angular/core/testing';

import { OcorreciasService } from './ocorrecias-service';

describe('OcorreciasService', () => {
  let service: OcorreciasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OcorreciasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
