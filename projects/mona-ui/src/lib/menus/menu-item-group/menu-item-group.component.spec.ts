import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';

import { MenuItemGroupComponent } from './menu-item-group.component';

describe('MenuItemGroupComponent', () => {
  let component: MenuItemGroupComponent;
  let fixture: ComponentFixture<MenuItemGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItemGroupComponent],
      providers: [provideAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuItemGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
