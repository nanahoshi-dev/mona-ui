import { TestBed } from '@angular/core/testing';
import { DecadeYearDirective } from './decade-year.directive';

describe('DecadeYearDirective', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({});
    const directive = TestBed.runInInjectionContext(() => new DecadeYearDirective());
    expect(directive).toBeTruthy();
  });
});
