import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonCheckboxItemComponent } from './split-button-checkbox-item.component';

describe('SplitButtonCheckboxItemComponent', () => {
  let component: SplitButtonCheckboxItemComponent;
  let fixture: ComponentFixture<SplitButtonCheckboxItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitButtonCheckboxItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitButtonCheckboxItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
