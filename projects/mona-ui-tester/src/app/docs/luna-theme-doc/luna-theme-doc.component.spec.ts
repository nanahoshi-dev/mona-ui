import { TestBed } from "@angular/core/testing";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import axe from "axe-core";
import { LunaThemeDocComponent } from "./luna-theme-doc.component";

describe("LunaThemeDocComponent", () => {
    afterEach(() => TestBed.resetTestingModule());

    it("renders the dedicated neutral glass workspace", () => {
        const themeService = TestBed.inject(ThemeService);
        themeService.setTheme({ name: "luna", variant: "light" });
        const fixture = TestBed.createComponent(LunaThemeDocComponent);
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelector("h1")?.textContent).toBe("Luna");
        expect(element.querySelectorAll("button[monaButton]").length).toBeGreaterThanOrEqual(6);
        expect(element.querySelector("mona-calendar")).not.toBeNull();
        expect(element.querySelector("mona-tabs")).not.toBeNull();
        expect(element.querySelector("mona-menubar")).not.toBeNull();
        expect(element.querySelector("nav[aria-label='Document commands']")).not.toBeNull();
        expect(element.textContent).toContain("A clear surface for the work itself");
        expect(element.textContent).toContain("luna light");
    });

    it.each(["light", "dark"] as const)("has no AXE accessibility violations in Luna %s", async variant => {
        const themeService = TestBed.inject(ThemeService);
        themeService.setTheme({ name: "luna", variant });
        const fixture = TestBed.createComponent(LunaThemeDocComponent);
        fixture.detectChanges();

        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });
        expect(results.violations).toEqual([]);
    });

    it("opens real Luna dialog and window surfaces", async () => {
        TestBed.inject(ThemeService).setTheme({ name: "luna", variant: "light" });
        const fixture = TestBed.createComponent(LunaThemeDocComponent);
        fixture.detectChanges();
        const buttons = Array.from(fixture.nativeElement.querySelectorAll("button")) as HTMLButtonElement[];

        buttons.find(button => button.textContent?.includes("Open dialog"))?.click();
        fixture.detectChanges();
        expect(document.body.querySelector("mona-dialog")).not.toBeNull();

        buttons.find(button => button.textContent?.includes("Open window"))?.click();
        fixture.detectChanges();
        expect(document.body.querySelector("mona-window")).not.toBeNull();
    });
});
