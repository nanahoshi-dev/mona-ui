import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupMenuListComponent } from './popup-menu-list.component';

describe('PopupMenuListComponent', () => {
  let component: PopupMenuListComponent;
  let fixture: ComponentFixture<PopupMenuListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenuListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupMenuListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
