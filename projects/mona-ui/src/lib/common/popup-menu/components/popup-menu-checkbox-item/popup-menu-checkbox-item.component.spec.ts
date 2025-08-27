import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupMenuCheckboxItemComponent } from './popup-menu-checkbox-item.component';

describe('PopupMenuCheckboxItemComponent', () => {
  let component: PopupMenuCheckboxItemComponent;
  let fixture: ComponentFixture<PopupMenuCheckboxItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenuCheckboxItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupMenuCheckboxItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
