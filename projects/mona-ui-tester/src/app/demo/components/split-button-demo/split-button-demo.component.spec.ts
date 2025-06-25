import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonDemoComponent } from './split-button-demo.component';

describe('SplitButtonDemoComponent', () => {
  let component: SplitButtonDemoComponent;
  let fixture: ComponentFixture<SplitButtonDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitButtonDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitButtonDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
