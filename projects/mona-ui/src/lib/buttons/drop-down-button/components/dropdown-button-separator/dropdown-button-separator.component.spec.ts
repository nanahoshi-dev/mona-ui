import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownButtonSeparatorComponent } from './dropdown-button-separator.component';

describe('DropdownButtonSeparatorComponent', () => {
    let component: DropdownButtonSeparatorComponent;
    let fixture: ComponentFixture<DropdownButtonSeparatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DropdownButtonSeparatorComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DropdownButtonSeparatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
