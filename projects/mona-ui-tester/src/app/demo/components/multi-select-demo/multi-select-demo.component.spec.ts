import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelectDemoComponent } from './multi-select-demo.component';

describe('MultiSelectDemoComponent', () => {
  let component: MultiSelectDemoComponent;
  let fixture: ComponentFixture<MultiSelectDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelectDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiSelectDemoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
