import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonSeparatorComponent } from './split-button-separator.component';

describe('SplitButtonSeparatorComponent', () => {
    let component: SplitButtonSeparatorComponent;
    let fixture: ComponentFixture<SplitButtonSeparatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SplitButtonSeparatorComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SplitButtonSeparatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
