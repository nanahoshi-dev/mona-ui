import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfigComponent } from "./config.component";

describe("ConfigComponent", () => {
    let component: ConfigComponent<unknown>;
    let fixture: ComponentFixture<ConfigComponent<unknown>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConfigComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ConfigComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
