import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AutoCompleteComponent } from "./auto-complete.component";

describe("AutoCompleteComponent", () => {
    let component: AutoCompleteComponent<any>;
    let fixture: ComponentFixture<AutoCompleteComponent<any>>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AutoCompleteComponent, BrowserAnimationsModule],
            providers: []
        });
        fixture = TestBed.createComponent(AutoCompleteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
