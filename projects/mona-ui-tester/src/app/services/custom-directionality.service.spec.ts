import { TestBed } from '@angular/core/testing';

import { CustomDirectionalityService } from './custom-directionality.service';

describe('CustomDirectionalityService', () => {
  let service: CustomDirectionalityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomDirectionalityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
