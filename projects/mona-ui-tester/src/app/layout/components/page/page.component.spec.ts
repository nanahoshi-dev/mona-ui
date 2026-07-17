import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

import { PageComponent } from "./page.component";

describe("PageComponent", () => {
    let component: PageComponent;
    let fixture: ComponentFixture<PageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PageComponent],
            providers: [provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(PageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("switches between Mona Light and Mona Dark", () => {
        const themeService = TestBed.inject(ThemeService);
        const toggle = fixture.nativeElement.querySelector(
            '[aria-label="Switch to Mona Dark"]'
        ) as HTMLButtonElement | null;

        expect(toggle).not.toBeNull();

        toggle?.click();
        fixture.detectChanges();

        expect(themeService.themeId()).toBe("mona-dark");
        expect(themeService.themeVariant()).toBe("dark");
        expect(toggle?.getAttribute("aria-label")).toBe("Switch to Mona Light");
    });
});
