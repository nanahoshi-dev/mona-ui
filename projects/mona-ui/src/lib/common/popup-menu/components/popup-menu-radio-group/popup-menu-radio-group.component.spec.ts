import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupMenuRadioGroupComponent } from './popup-menu-radio-group.component';

describe('PopupMenuRadioGroupComponent', () => {
  let component: PopupMenuRadioGroupComponent;
  let fixture: ComponentFixture<PopupMenuRadioGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenuRadioGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupMenuRadioGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
