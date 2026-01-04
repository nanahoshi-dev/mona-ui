import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelectDocComponent } from './multi-select-doc.component';

describe('MultiSelectDocComponent', () => {
  let component: MultiSelectDocComponent;
  let fixture: ComponentFixture<MultiSelectDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelectDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiSelectDocComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
