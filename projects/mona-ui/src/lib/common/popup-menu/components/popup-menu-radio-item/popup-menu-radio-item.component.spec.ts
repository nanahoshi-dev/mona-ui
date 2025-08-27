import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupMenuRadioItemComponent } from './popup-menu-radio-item.component';

describe('PopupMenuRadioItemComponent', () => {
  let component: PopupMenuRadioItemComponent;
  let fixture: ComponentFixture<PopupMenuRadioItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenuRadioItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupMenuRadioItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
