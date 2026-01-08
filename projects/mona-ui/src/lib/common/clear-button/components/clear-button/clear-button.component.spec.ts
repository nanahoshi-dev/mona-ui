import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClearButtonComponent } from './clear-button.component';

describe('ClearButtonComponent', () => {
  let component: ClearButtonComponent;
  let fixture: ComponentFixture<ClearButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClearButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClearButtonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
