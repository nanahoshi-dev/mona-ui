import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitterResizerHandleComponent } from './splitter-resizer-handle.component';

describe('SplitterResizerHandleComponent', () => {
  let component: SplitterResizerHandleComponent;
  let fixture: ComponentFixture<SplitterResizerHandleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitterResizerHandleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitterResizerHandleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
