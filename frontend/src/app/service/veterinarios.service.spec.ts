import { TestBed } from '@angular/core/testing';

import { VeterinariosServiceTsService } from './veterinarios.service';

describe('VeterinariosServiceTsService', () => {
  let service: VeterinariosServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VeterinariosServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
