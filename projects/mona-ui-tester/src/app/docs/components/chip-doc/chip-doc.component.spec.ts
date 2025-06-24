import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipDocComponent } from './chip-doc.component';

describe('ChipDocComponent', () => {
  let component: ChipDocComponent;
  let fixture: ComponentFixture<ChipDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChipDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
