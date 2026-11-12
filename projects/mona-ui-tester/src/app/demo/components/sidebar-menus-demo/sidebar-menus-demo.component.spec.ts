import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { SidebarMenuButtonDirective, SidebarMenuSkeletonComponent } from "@nanahoshi/mona-ui/sidebar";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { SidebarMenusDemoComponent } from "./sidebar-menus-demo.component";

describe("SidebarMenusDemoComponent", () => {
    let fixture: ComponentFixture<SidebarMenusDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarMenusDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarMenusDemoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;
    const code = (): string => (container() as unknown as { generatedCode: () => string }).generatedCode();
    const inbox = (): HTMLAnchorElement => fixture.nativeElement.querySelector("a[href='/mail/inbox']");

    it("renders the rows with a panel for the layout, sidebar, row and loading row", () => {
        expect(fixture.debugElement.queryAll(By.directive(SidebarMenuButtonDirective)).length).toBeGreaterThan(2);
        expect(fixture.debugElement.query(By.directive(SidebarMenuSkeletonComponent))).toBeTruthy();
        const panels = container()
            .parts()
            .filter(part => part.panel !== false);
        expect(panels.map(part => part.id)).toEqual(["layout", "sidebar", "item", "button", "skeleton"]);
        for (const part of panels) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes every row in one list, and the loading row in a busy list of its own", () => {
        const sample = code();
        expect(sample.match(/<nav monaSidebarContent/g)?.length).toBe(1);
        expect(sample).toMatch(
            /<li monaSidebarMenuItem \[active\]="true">\s+<a monaSidebarMenuButton href="\/mail\/inbox"/
        );
        expect(sample).toContain(`[tooltip]="'Inbox'"`);
        expect(sample).toContain("<span monaSidebarMenuBadge>12</span>");
        expect(sample).toContain('<ul monaSidebarMenu aria-busy="true">');
        expect(sample.indexOf("monaSidebarMenuSub")).toBeLessThan(sample.indexOf("mona-sidebar-menu-skeleton"));
    });

    it("disables the row, and leaves its click unhandled", async () => {
        const row = inbox();
        container().values.update(values => ({ ...values, button: { ...values["button"], disabled: true } }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(row.getAttribute("aria-disabled")).toBe("true");
        expect(row.hasAttribute("href")).toBe(false);
        row.click();
        expect(container().eventLog()?.entries().length).toBe(0);
        expect(code()).toContain('[disabled]="true"');
    });
});
