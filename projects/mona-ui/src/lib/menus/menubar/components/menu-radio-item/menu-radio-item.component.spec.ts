import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuRadioItemComponent } from './menu-radio-item.component';

describe('MenuRadioItemComponent', () => {
    let component: MenuRadioItemComponent;
    let fixture: ComponentFixture<MenuRadioItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenuRadioItemComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(MenuRadioItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
