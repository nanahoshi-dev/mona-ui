import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";

import { ContextMenuComponent } from "./context-menu.component";
import { DOCUMENT } from "@angular/core";

describe("ContextMenuComponent", () => {
    let component: ContextMenuComponent;
    let fixture: ComponentFixture<ContextMenuComponent>;
    let document: Document;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuComponent],
            providers: [provideAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuComponent);
        component = fixture.componentInstance;
        document = TestBed.inject(DOCUMENT);
        fixture.componentRef.setInput("target", document);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
