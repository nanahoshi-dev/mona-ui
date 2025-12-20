import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCheckboxItemComponent } from './menu-checkbox-item.component';

describe('MenuCheckboxItemComponent', () => {
    let component: MenuCheckboxItemComponent;
    let fixture: ComponentFixture<MenuCheckboxItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenuCheckboxItemComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(MenuCheckboxItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
