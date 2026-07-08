import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AttributeConfig } from "../models/AttributeConfig";
import { AttributeBinderDirective } from "./attribute-binder.directive";

@Component({
    template: ` <div [monaAttributeBinder]="attributes()"></div> `,
    imports: [AttributeBinderDirective]
})
class TestHostComponent {
    public readonly attributes = signal<AttributeConfig>({});
}

describe("AttributeBinderDirective", () => {
    describe("host element behavior", () => {
        let fixture: ComponentFixture<TestHostComponent>;
        let component: TestHostComponent;
        let divElement: HTMLDivElement;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestHostComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            divElement = fixture.nativeElement.querySelector("div") as HTMLDivElement;
        });

        it("should create an instance", () => {
            expect(component).toBeTruthy();
        });

        it("should not set any attribute when attributes is empty", () => {
            expect(divElement.attributes.length).toBe(0);
        });

        it("should set a string attribute value", () => {
            component.attributes.set({ "data-foo": "bar" });
            fixture.detectChanges();
            expect(divElement.getAttribute("data-foo")).toBe("bar");
        });

        it("should set an attribute to 'true' when value is boolean true", () => {
            component.attributes.set({ "aria-hidden": true });
            fixture.detectChanges();
            expect(divElement.getAttribute("aria-hidden")).toBe("true");
        });

        it("should not set the attribute when value is boolean false", () => {
            component.attributes.set({ "aria-hidden": false });
            fixture.detectChanges();
            expect(divElement.hasAttribute("aria-hidden")).toBe(false);
        });

        it("should not set the attribute when value is null", () => {
            component.attributes.set({ "data-foo": null });
            fixture.detectChanges();
            expect(divElement.hasAttribute("data-foo")).toBe(false);
        });

        it("should remove a previously set attribute when its value becomes false", () => {
            component.attributes.set({ "data-foo": "bar" });
            fixture.detectChanges();
            expect(divElement.getAttribute("data-foo")).toBe("bar");

            component.attributes.set({ "data-foo": false });
            fixture.detectChanges();
            expect(divElement.hasAttribute("data-foo")).toBe(false);
        });

        it("should remove a previously set attribute when its value becomes null", () => {
            component.attributes.set({ "data-foo": "bar" });
            fixture.detectChanges();
            expect(divElement.getAttribute("data-foo")).toBe("bar");

            component.attributes.set({ "data-foo": null });
            fixture.detectChanges();
            expect(divElement.hasAttribute("data-foo")).toBe(false);
        });

        it("should set multiple attributes from a single config object", () => {
            component.attributes.set({ "data-foo": "bar", "data-baz": "qux", "aria-hidden": true });
            fixture.detectChanges();
            expect(divElement.getAttribute("data-foo")).toBe("bar");
            expect(divElement.getAttribute("data-baz")).toBe("qux");
            expect(divElement.getAttribute("aria-hidden")).toBe("true");
        });
    });
});
