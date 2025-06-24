import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonGroupDocComponent } from './button-group-doc.component';

describe('ButtonGroupDocComponent', () => {
  let component: ButtonGroupDocComponent;
  let fixture: ComponentFixture<ButtonGroupDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonGroupDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonGroupDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
