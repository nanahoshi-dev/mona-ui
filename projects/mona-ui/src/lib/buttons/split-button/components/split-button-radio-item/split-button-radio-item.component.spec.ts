import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonRadioItemComponent } from './split-button-radio-item.component';

describe('SplitButtonRadioItemComponent', () => {
  let component: SplitButtonRadioItemComponent;
  let fixture: ComponentFixture<SplitButtonRadioItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitButtonRadioItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitButtonRadioItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
