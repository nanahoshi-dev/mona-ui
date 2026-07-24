import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CardActionDirective } from "../../directives/card-action.directive";
import { CardContentDirective } from "../../directives/card-content.directive";
import { CardDescriptionDirective } from "../../directives/card-description.directive";
import { CardTitleDirective } from "../../directives/card-title.directive";
import type { CardVariantProps } from "../../styles/card.styles";
import { CardFooterComponent } from "../card-footer/card-footer.component";
import { CardHeaderComponent } from "../card-header/card-header.component";
import { CardComponent } from "./card.component";

@Component({
    imports: [
        CardComponent,
        CardHeaderComponent,
        CardFooterComponent,
        CardTitleDirective,
        CardDescriptionDirective,
        CardActionDirective,
        CardContentDirective
    ],
    template: `
        <mona-card [rounded]="rounded()">
            @if (showHeader()) {
                <mona-card-header>
                    <h3 *monaCardTitle="let id" [id]="id">Title</h3>
                    <p *monaCardDescription="let id" [id]="id">Description</p>
                    <button *monaCardAction type="button">Action</button>
                </mona-card-header>
            }
            <div *monaCardContent>Content</div>
            <mona-card-footer>
                <button type="button">Footer action</button>
            </mona-card-footer>
        </mona-card>
    `
})
class TestHostComponent {
    public readonly card = viewChild.required(CardComponent);
    public readonly rounded = signal<CardVariantProps["rounded"]>("medium");
    public readonly showHeader = signal(true);
}

describe("CardComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(host.card()).toBeTruthy();
    });

    it("reflects the rounded input in the host class", () => {
        const element: HTMLElement = fixture.nativeElement.querySelector("mona-card");
        expect(element.className).toContain("rounded-md");

        host.rounded.set("large");
        fixture.detectChanges();

        expect(element.className).toContain("rounded-lg");
    });

    it("uses semantic card colors, raised elevation, and raised backdrop effects", () => {
        const element: HTMLElement = fixture.nativeElement.querySelector("mona-card");

        expect(element.className).toContain("bg-(--color-card)");
        expect(element.className).toContain("text-(--color-card-foreground)");
        expect(element.className).toContain("shadow-(--shadow-raised)");
        expect(element.className).toContain("[backdrop-filter:var(--mona-effect-raised-backdrop-filter,none)]");
        expect(element.className).toContain("[-webkit-backdrop-filter:var(--mona-effect-raised-backdrop-filter,none)]");
        expect(element.className).not.toContain("bg-card");
        expect(element.className).not.toContain("shadow-md");
    });

    it("labels and describes the host via aria-labelledby/aria-describedby when a title/description are projected", () => {
        const element: HTMLElement = fixture.nativeElement.querySelector("mona-card");
        const titleElement: HTMLElement = fixture.nativeElement.querySelector("h3");
        const descriptionElement: HTMLElement = fixture.nativeElement.querySelector("p");

        expect(element.getAttribute("aria-labelledby")).toBe(titleElement.id);
        expect(element.getAttribute("aria-describedby")).toBe(descriptionElement.id);
    });

    it("omits aria-labelledby/aria-describedby when there is no header", async () => {
        host.showHeader.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const element: HTMLElement = fixture.nativeElement.querySelector("mona-card");
        expect(element.hasAttribute("aria-labelledby")).toBe(false);
        expect(element.hasAttribute("aria-describedby")).toBe(false);
    });

    it("groups header actions with role=group and an aria-label", () => {
        const group: HTMLElement = fixture.nativeElement.querySelector('[role="group"]');
        expect(group).toBeTruthy();
        expect(group.getAttribute("aria-label")).toBe("Card actions");
    });
});
