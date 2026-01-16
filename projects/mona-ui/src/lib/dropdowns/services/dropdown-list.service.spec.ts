import { TestBed } from '@angular/core/testing';

import { DropdownListService } from './dropdown-list.service';

describe('DropdownListService', () => {
  let service: DropdownListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropdownListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
