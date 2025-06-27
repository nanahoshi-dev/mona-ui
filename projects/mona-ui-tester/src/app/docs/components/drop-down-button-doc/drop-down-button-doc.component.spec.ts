import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropDownButtonDocComponent } from './drop-down-button-doc.component';

describe('DropDownButtonDocComponent', () => {
  let component: DropDownButtonDocComponent;
  let fixture: ComponentFixture<DropDownButtonDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropDownButtonDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropDownButtonDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
