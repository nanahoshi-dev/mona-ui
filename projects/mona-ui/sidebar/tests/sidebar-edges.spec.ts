import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { injectSidebar } from "../utils/inject-sidebar";

@Component({
    template: `
        <mona-sidebar class="plain" aria-labelledby="heading"></mona-sidebar>
        <mona-sidebar class="landmark" role="navigation" aria-labelledby="heading"></mona-sidebar>
    `,
    imports: [SidebarComponent]
})
class NamedHostComponent {}

@Component({ selector: "mona-test-optional-reader", template: `` })
class OptionalReaderComponent {
    public readonly controller = injectSidebar({ for: "elsewhere", optional: true });
}

@Component({ selector: "mona-test-required-reader", template: `` })
class RequiredReaderComponent {
    public readonly controller = injectSidebar({ for: "elsewhere" });
    public readonly unused = input("");
}

@Component({
    template: `<mona-sidebar><mona-test-optional-reader /></mona-sidebar>`,
    imports: [OptionalReaderComponent, SidebarComponent]
})
class OptionalHostComponent {}

@Component({
    template: `<mona-sidebar><mona-test-required-reader /></mona-sidebar>`,
    imports: [RequiredReaderComponent, SidebarComponent]
})
class RequiredHostComponent {}

describe("mona-sidebar edges", () => {
    it("only takes aria-labelledby where there's a role to name", async () => {
        const fixture = TestBed.createComponent(NamedHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement;

        expect(root.querySelector(".plain")?.getAttribute("aria-labelledby")).toBeNull();
        expect(root.querySelector(".landmark")?.getAttribute("aria-labelledby")).toBe("heading");
    });

    it("doesn't answer for another sidebar when there's no layout to find it in", async () => {
        const fixture = TestBed.createComponent(OptionalHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const reader = fixture.debugElement.query(element => element.name === "mona-test-optional-reader");

        expect(reader.componentInstance.controller).toBeNull();
    });

    it("throws rather than answering for the enclosing sidebar when it isn't optional", () => {
        expect(() => TestBed.createComponent(RequiredHostComponent).detectChanges()).toThrow(/"elsewhere"/);
    });
});
