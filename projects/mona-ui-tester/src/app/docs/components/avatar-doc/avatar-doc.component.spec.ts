import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarDocComponent } from './avatar-doc.component';

describe('AvatarDocComponent', () => {
  let component: AvatarDocComponent;
  let fixture: ComponentFixture<AvatarDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
