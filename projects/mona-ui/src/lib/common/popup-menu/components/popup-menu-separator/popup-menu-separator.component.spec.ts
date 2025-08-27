import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupMenuSeparatorComponent } from './popup-menu-separator.component';

describe('PopupMenuSeparatorComponent', () => {
  let component: PopupMenuSeparatorComponent;
  let fixture: ComponentFixture<PopupMenuSeparatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenuSeparatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupMenuSeparatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
