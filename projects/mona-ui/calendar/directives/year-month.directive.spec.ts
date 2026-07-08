import { TestBed } from '@angular/core/testing';
import { YearMonthDirective } from './year-month.directive';

describe('YearMonthDirective', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({});
    const directive = TestBed.runInInjectionContext(() => new YearMonthDirective());
    expect(directive).toBeTruthy();
  });
});
