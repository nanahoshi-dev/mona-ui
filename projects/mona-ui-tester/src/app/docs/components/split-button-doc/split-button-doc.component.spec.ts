import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonDocComponent } from './split-button-doc.component';

describe('SplitButtonDocComponent', () => {
  let component: SplitButtonDocComponent;
  let fixture: ComponentFixture<SplitButtonDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitButtonDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitButtonDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
