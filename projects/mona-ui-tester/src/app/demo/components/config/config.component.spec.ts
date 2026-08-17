import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
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
        fixture.componentRef.setInput("config", {
            code: "",
            component: ConfigComponent,
            inputs: {},
            methods: {},
            outputs: {}
        });
        fixture.componentRef.setInput("metadata", { inputs: {}, methods: {}, outputs: {} });
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
