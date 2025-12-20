import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonGroupComponent } from './split-button-group.component';

describe('SplitButtonGroupComponent', () => {
    let component: SplitButtonGroupComponent;
    let fixture: ComponentFixture<SplitButtonGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SplitButtonGroupComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SplitButtonGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
