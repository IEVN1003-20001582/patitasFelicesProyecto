import { TestBed } from '@angular/core/testing';

import { CitasServiceTsService } from './citas.service';

describe('CitasServiceTsService', () => {
  let service: CitasServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CitasServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
