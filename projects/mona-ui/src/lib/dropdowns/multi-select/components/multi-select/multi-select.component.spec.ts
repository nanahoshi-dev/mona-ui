import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MultiSelectComponent } from "./multi-select.component";

describe("MultiSelectComponent", () => {
    let component: MultiSelectComponent<any>;
    let fixture: ComponentFixture<MultiSelectComponent<any>>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MultiSelectComponent, BrowserAnimationsModule],
            providers: []
        });
        fixture = TestBed.createComponent(MultiSelectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
