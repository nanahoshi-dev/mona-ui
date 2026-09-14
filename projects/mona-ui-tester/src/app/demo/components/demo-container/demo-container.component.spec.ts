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

    it("includes all official locales including Italian (it-IT) and Turkish (tr-TR) in localeOptions", () => {
        const options = (
            component as unknown as { localeOptions: readonly { label: string; locale: { id: string } }[] }
        ).localeOptions;
        expect(options).toContainEqual(
            expect.objectContaining({
                label: "Italiano (Italia)",
                locale: expect.objectContaining({ id: "it-IT" })
            })
        );
        expect(options).toContainEqual(
            expect.objectContaining({
                label: "Türkçe (Türkiye)",
                locale: expect.objectContaining({ id: "tr-TR" })
            })
        );
        const ids = options.map(option => option.locale.id);
        expect(new Set(ids).size).toBe(ids.length);

        const labels = options.map(option => option.label);
        expect(new Set(labels).size).toBe(labels.length);
    });
});
