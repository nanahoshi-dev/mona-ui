import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabListComponent } from './tab-list.component';

describe('TabListComponent', () => {
    let component: TabListComponent;
    let fixture: ComponentFixture<TabListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TabListComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TabListComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("rounded", "medium");
        fixture.componentRef.setInput("tabList", []);
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
