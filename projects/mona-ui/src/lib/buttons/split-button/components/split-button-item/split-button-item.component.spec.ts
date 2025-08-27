import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonItemComponent } from './split-button-item.component';

describe('SplitButtonItemComponent', () => {
  let component: SplitButtonItemComponent;
  let fixture: ComponentFixture<SplitButtonItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitButtonItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitButtonItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
