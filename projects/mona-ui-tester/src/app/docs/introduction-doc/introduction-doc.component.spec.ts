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
            providers: [PageService, provideHttpClient(withXhr()), provideMarkdown(), provideRouter([])]
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

        const hrefs = cardLinks.map(link => link.getAttribute("href"));
        expect(hrefs).toEqual(["https://angular.dev", "https://tailwindcss.com", "https://www.typescriptlang.org"]);

        cardLinks.forEach(link => {
            expect(link.getAttribute("rel")).toBe("noopener noreferrer");
            expect(link.getAttribute("aria-label")).toBeTruthy();
        });
        expect(cardLinks[0].getAttribute("aria-label")).toBe("Angular v22.0 documentation (opens in a new tab)");

        const logos = cardLinks.map(link => link.querySelector("img"));
        expect(logos.map(logo => logo?.getAttribute("src"))).toEqual([
            "https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/angular/angular-original.svg",
            "https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/tailwindcss/tailwindcss-original.svg",
            "https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/typescript/typescript-original.svg"
        ]);
        logos.forEach(logo => expect(logo?.getAttribute("alt")).toBe(""));

        expect(element.textContent).toContain("Angular");
        expect(element.textContent).toContain("v22.0");
        expect(element.textContent).toContain("Tailwind CSS");
        expect(element.textContent).toContain("v4.3");
        expect(element.textContent).toContain("TypeScript");
        expect(element.textContent).toContain("v6.0");
    });

    it("has no AXE accessibility violations", async () => {
        fixture.detectChanges();
        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });
        expect(results.violations).toEqual([]);
    });
});
