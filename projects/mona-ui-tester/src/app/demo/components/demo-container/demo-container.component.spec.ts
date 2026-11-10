import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { DemoContainerComponent } from "./demo-container.component";

describe("DemoContainerComponent", () => {
    let component: DemoContainerComponent<unknown>;
    let fixture: ComponentFixture<DemoContainerComponent<unknown>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DemoContainerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DemoContainerComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("config", {
            code: "",
            component: DemoContainerComponent,
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
