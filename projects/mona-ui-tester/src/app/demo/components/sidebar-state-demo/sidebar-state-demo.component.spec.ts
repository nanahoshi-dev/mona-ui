import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { SidebarComponent } from "@nanahoshi/mona-ui/sidebar";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { SidebarStateDemoComponent } from "./sidebar-state-demo.component";

describe("SidebarStateDemoComponent", () => {
    let fixture: ComponentFixture<SidebarStateDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarStateDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarStateDemoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;
    const code = (): string => (container() as unknown as { generatedCode: () => string }).generatedCode();
    const sidebars = (): SidebarComponent[] =>
        fixture.debugElement.queryAll(By.directive(SidebarComponent)).map(debug => debug.componentInstance);
    const settle = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };

    it("renders two sidebars with a panel for the layout and each sidebar", () => {
        expect(sidebars().length).toBe(2);
        const panels = container()
            .parts()
            .filter(part => part.panel !== false);
        expect(panels.map(part => part.id)).toEqual(["layout", "nav", "inspector"]);
        for (const part of panels) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes the sidebars around the inset, with the triggers naming them", () => {
        const sample = code();
        expect(sample).toContain(`[modalScope]="'layout'"`);
        expect(sample.indexOf('id="nav"')).toBeLessThan(sample.indexOf("monaSidebarInset"));
        expect(sample.indexOf("monaSidebarInset")).toBeLessThan(sample.indexOf('id="inspector"'));
        expect(sample).toContain('monaSidebarTrigger for="inspector"');
        expect(sample).toContain('[expanded]="false"');
    });

    it("keeps the panel's expanded in step with a trigger, and logs the change", async () => {
        const trigger: HTMLButtonElement = fixture.nativeElement.querySelector("button[for='inspector']");
        trigger.click();
        await settle();
        expect(sidebars()[1].expanded()).toBe(true);
        expect(container().values()["inspector"]["expanded"]).toBe(true);
        expect(container().eventLog()?.entries()[0]?.name).toBe("inspector expandedChange");
        expect(fixture.nativeElement.textContent).toContain("toggle()");
    });
});
