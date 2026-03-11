import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";

import { DialogContentComponent } from "./dialog-content.component";

describe("DialogContentComponent", () => {
    let component: DialogContentComponent;
    let fixture: ComponentFixture<DialogContentComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DialogContentComponent],
            providers: [provideAnimations()]
        });
        fixture = TestBed.createComponent(DialogContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
