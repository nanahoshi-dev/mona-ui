import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupMenuGroupComponent } from './popup-menu-group.component';

describe('PopupMenuGroupComponent', () => {
    let component: PopupMenuGroupComponent;
    let fixture: ComponentFixture<PopupMenuGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PopupMenuGroupComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PopupMenuGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
