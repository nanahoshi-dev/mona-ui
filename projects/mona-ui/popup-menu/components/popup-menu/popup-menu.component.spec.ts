import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PopupMenuComponent } from "./popup-menu.component";
import { DOCUMENT } from "@angular/core";

describe("PopupMenuComponent", () => {
    let component: PopupMenuComponent;
    let fixture: ComponentFixture<PopupMenuComponent>;
    let document: Document;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PopupMenuComponent],
            providers: []
        }).compileComponents();

        fixture = TestBed.createComponent(PopupMenuComponent);
        component = fixture.componentInstance;
        document = TestBed.inject(DOCUMENT);
        fixture.componentRef.setInput("target", document);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
