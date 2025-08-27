import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownButtonCheckboxItemComponent } from './dropdown-button-checkbox-item.component';

describe('DropdownButtonCheckboxItemComponent', () => {
  let component: DropdownButtonCheckboxItemComponent;
  let fixture: ComponentFixture<DropdownButtonCheckboxItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownButtonCheckboxItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropdownButtonCheckboxItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
