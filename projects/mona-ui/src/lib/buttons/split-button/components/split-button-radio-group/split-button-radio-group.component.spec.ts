import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonRadioGroupComponent } from './split-button-radio-group.component';

describe('SplitButtonRadioGroupComponent', () => {
  let component: SplitButtonRadioGroupComponent;
  let fixture: ComponentFixture<SplitButtonRadioGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitButtonRadioGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitButtonRadioGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
