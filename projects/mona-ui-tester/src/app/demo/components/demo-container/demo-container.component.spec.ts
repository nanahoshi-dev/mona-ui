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

    it("includes official locale options with unique ids and labels", () => {
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
        expect(options).toContainEqual(
            expect.objectContaining({
                label: "Bahasa Indonesia (Indonesia)",
                locale: expect.objectContaining({ id: "id-ID" })
            })
        );
        expect(options).toContainEqual(
            expect.objectContaining({
                label: "Русский (Россия)",
                locale: expect.objectContaining({ id: "ru-RU" })
            })
        );
        const ids = options.map(option => option.locale.id);
        expect(new Set(ids).size).toBe(ids.length);

        const labels = options.map(option => option.label);
        expect(new Set(labels).size).toBe(labels.length);
    });
});
