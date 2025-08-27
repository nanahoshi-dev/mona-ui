import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownButtonItemComponent } from './dropdown-button-item.component';

describe('DropdownButtonItemComponent', () => {
  let component: DropdownButtonItemComponent;
  let fixture: ComponentFixture<DropdownButtonItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownButtonItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropdownButtonItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
