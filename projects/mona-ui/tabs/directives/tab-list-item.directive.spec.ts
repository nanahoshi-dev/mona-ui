import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TabListListItemVariantProps } from "../styles/tabs.styles";
import { TabListItemDirective } from "./tab-list-item.directive";

@Component({
    template: `
        <li
            monaTabListItem
            [active]="active()"
            [disabled]="disabled()"
            [position]="position()"
            [size]="size()"></li>
    `,
    imports: [TabListItemDirective]
})
class HostComponent {
    public readonly active = signal(true);
    public readonly disabled = signal(false);
    public readonly position = signal<TabListListItemVariantProps["position"]>("top");
    public readonly size = signal<TabListListItemVariantProps["size"]>("medium");
}

describe("TabListItemDirective", () => {
    let host: HostComponent;
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    const tabItem = (): HTMLElement => fixture.debugElement.query(By.css("li[monaTabListItem]")).nativeElement;

    it("should create an instance", () => {
        const directive = fixture.debugElement.query(By.directive(TabListItemDirective)).injector.get(TabListItemDirective);
        expect(directive).toBeTruthy();
    });

    it("applies the active indicator classes for an active tab", () => {
        const classes = tabItem().className.split(/\s+/);
        expect(classes).toContain("after:bg-primary");
        expect(classes).toContain("after:absolute");
        expect(classes).toContain("text-foreground");
        expect(classes).toContain("font-semibold");
    });

    it("applies muted styles for an inactive tab", () => {
        host.active.set(false);
        fixture.detectChanges();
        const classes = tabItem().className.split(/\s+/);
        expect(classes).toContain("text-muted-foreground");
        expect(classes).toContain("hover:bg-hover");
        expect(classes).not.toContain("after:bg-primary");
    });

    it("applies bottom-aligned indicator for bottom position", () => {
        host.position.set("bottom");
        fixture.detectChanges();
        const classes = tabItem().className.split(/\s+/);
        expect(classes).toContain("after:inset-x-0");
        expect(classes).toContain("after:top-0");
        expect(classes).toContain("after:h-[2px]");
    });

    it("applies right-side indicator for left position", () => {
        host.position.set("left");
        fixture.detectChanges();
        const classes = tabItem().className.split(/\s+/);
        expect(classes).toContain("after:inset-y-0");
        expect(classes).toContain("after:right-0");
        expect(classes).toContain("after:w-[2px]");
    });

    it("applies left-side indicator for right position", () => {
        host.position.set("right");
        fixture.detectChanges();
        const classes = tabItem().className.split(/\s+/);
        expect(classes).toContain("after:inset-y-0");
        expect(classes).toContain("after:left-0");
        expect(classes).toContain("after:w-[2px]");
    });

    it("applies small size classes", () => {
        host.size.set("small");
        fixture.detectChanges();
        const classes = tabItem().className.split(/\s+/);
        expect(classes).toContain("h-8");
        expect(classes).toContain("px-2");
        expect(classes).toContain("text-xs");
    });

    it("applies large size classes", () => {
        host.size.set("large");
        fixture.detectChanges();
        const classes = tabItem().className.split(/\s+/);
        expect(classes).toContain("h-10");
        expect(classes).toContain("px-4");
    });

    it("hides the indicator and disables interaction for a disabled tab", () => {
        host.disabled.set(true);
        fixture.detectChanges();
        const classes = tabItem().className.split(/\s+/);
        expect(classes).toContain("pointer-events-none");
        expect(classes).toContain("cursor-not-allowed");
        expect(classes).toContain("text-disabled-foreground");
        expect(classes).toContain("after:hidden");
    });
});
