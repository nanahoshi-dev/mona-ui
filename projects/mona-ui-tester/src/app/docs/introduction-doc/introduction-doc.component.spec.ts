import { provideHttpClient, withXhr } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import axe from "axe-core";
import { provideMarkdown } from "ngx-markdown";
import { beforeEach, describe, expect, it } from "vitest";
import { PageService } from "../../layout/services/page.service";
import { IntroductionDocComponent } from "./introduction-doc.component";

describe("IntroductionDocComponent", () => {
    let component: IntroductionDocComponent;
    let fixture: ComponentFixture<IntroductionDocComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IntroductionDocComponent],
            providers: [
                PageService,
                provideHttpClient(withXhr()),
                provideMarkdown(),
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(IntroductionDocComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("renders modern tech stack cards with updated versions, security attributes, and accessible labels", () => {
        fixture.detectChanges();
        const element = fixture.nativeElement as HTMLElement;
        const cardLinks = Array.from(element.querySelectorAll("a[target='_blank']")) as HTMLAnchorElement[];

        expect(cardLinks.length).toBe(4);

        const hrefs = cardLinks.map(link => link.getAttribute("href"));
        expect(hrefs).toContain("https://angular.dev");
        expect(hrefs).toContain("https://tailwindcss.com");
        expect(hrefs).toContain("https://www.typescriptlang.org");
        expect(hrefs).toContain("https://phrolovia.github.io/ts-collections/");

        cardLinks.forEach(link => {
            expect(link.getAttribute("rel")).toBe("noopener noreferrer");
            expect(link.getAttribute("aria-label")).toBeTruthy();
        });

        expect(element.textContent).toContain("Angular");
        expect(element.textContent).toContain("v22.0");
        expect(element.textContent).toContain("Tailwind CSS");
        expect(element.textContent).toContain("v4.3");
        expect(element.textContent).toContain("TypeScript");
        expect(element.textContent).toContain("v6.0");
        expect(element.textContent).toContain("ts-collections");
        expect(element.textContent).toContain("v17.5");
    });

    it("has no AXE accessibility violations", async () => {
        fixture.detectChanges();
        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });
        expect(results.violations).toEqual([]);
    });
});
