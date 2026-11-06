import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { CardFooterComponent } from "../components/card-footer/card-footer.component";
import { CardHeaderComponent } from "../components/card-header/card-header.component";
import { CardComponent } from "../components/card/card.component";
import { CardActionDirective } from "../directives/card-action.directive";
import { CardContentDirective } from "../directives/card-content.directive";
import { CardDescriptionDirective } from "../directives/card-description.directive";
import { CardTitleDirective } from "../directives/card-title.directive";
import { cardHeaderThemeVariants } from "../styles/card.styles";

const IMPORTS = [
    CardActionDirective,
    CardComponent,
    CardContentDirective,
    CardDescriptionDirective,
    CardFooterComponent,
    CardHeaderComponent,
    CardTitleDirective
];

/** The plain way to write a card, with nothing bound to the template's id. */
@Component({
    template: `
        <mona-card [role]="role()">
            <mona-card-header>
                <h3 *monaCardTitle>Title</h3>
                @if (showDescription()) {
                    <p *monaCardDescription>Description</p>
                }
                <button *monaCardAction type="button">Action</button>
            </mona-card-header>
            <div *monaCardContent>Body</div>
            <mona-card-footer>Footer</mona-card-footer>
        </mona-card>
    `,
    imports: IMPORTS
})
class PlainHostComponent {
    public readonly role = signal<"article" | "group" | "region">("group");
    public readonly showDescription = signal(true);
}

/** The older way, with the template's id on the consumer's own element. */
@Component({
    template: `
        <mona-card>
            <mona-card-header>
                <h3 *monaCardTitle="let id" [id]="id">Title</h3>
                <p *monaCardDescription="let id" [id]="id">Description</p>
            </mona-card-header>
        </mona-card>
    `,
    imports: IMPORTS
})
class BoundIdHostComponent {}

@Component({
    template: `
        <mona-card>
            <div *monaCardContent>Body</div>
        </mona-card>
    `,
    imports: IMPORTS
})
class NoHeaderHostComponent {}

@Component({
    template: `
        <mona-card>
            <mona-card-header>
                <p *monaCardDescription>Description</p>
            </mona-card-header>
        </mona-card>
    `,
    imports: IMPORTS
})
class DescriptionOnlyHostComponent {}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

describe("mona-card behavior", () => {
    let fixture: ComponentFixture<PlainHostComponent>;

    const card = (): HTMLElement => fixture.nativeElement.querySelector("mona-card");

    beforeEach(() => TestBed.configureTestingModule({}));

    describe("first pass", () => {
        it("renders the header and footer in plain change detection, as on the server", () => {
            fixture = TestBed.createComponent(PlainHostComponent);
            // Change detection alone: after-render callbacks don't run on the server.
            fixture.changeDetectorRef.detectChanges();
            const text = card().textContent ?? "";
            expect(text).toContain("Title");
            expect(text).toContain("Description");
            expect(text).toContain("Action");
            expect(text).toContain("Body");
            expect(text).toContain("Footer");
        });

        it("has its name in the same pass", () => {
            fixture = TestBed.createComponent(PlainHostComponent);
            fixture.changeDetectorRef.detectChanges();
            expect(card().getAttribute("role")).toBe("group");
            expect(card().getAttribute("aria-labelledby")).toBeTruthy();
        });
    });

    describe("name", () => {
        beforeEach(async () => {
            fixture = TestBed.createComponent(PlainHostComponent);
            await settle(fixture);
        });

        it("takes a role, which is what makes the name count", () => {
            expect(card().getAttribute("role")).toBe("group");
        });

        it("points at elements that exist, with nothing bound by the consumer", () => {
            const title = document.getElementById(card().getAttribute("aria-labelledby")!);
            const description = document.getElementById(card().getAttribute("aria-describedby")!);
            expect(title?.textContent).toContain("Title");
            expect(description?.textContent).toContain("Description");
        });

        it("takes another role when asked", async () => {
            fixture.componentInstance.role.set("article");
            await settle(fixture);
            expect(card().getAttribute("role")).toBe("article");
        });

        it("drops the description reference when there's no description", async () => {
            fixture.componentInstance.showDescription.set(false);
            await settle(fixture);
            expect(card().hasAttribute("aria-describedby")).toBe(false);
            expect(card().getAttribute("aria-labelledby")).toBeTruthy();
        });

        it("passes axe with nothing incomplete", async () => {
            const result = await axe.run(fixture.nativeElement);
            expect(result.violations).toEqual([]);
            expect(result.incomplete.filter(item => item.id !== "color-contrast")).toEqual([]);
        });
    });

    describe("a consumer's own [id]", () => {
        it("doesn't make a duplicate id", async () => {
            const bound = TestBed.createComponent(BoundIdHostComponent);
            await settle(bound);
            const element = bound.nativeElement as HTMLElement;
            const ids = Array.from(element.querySelectorAll("[id]")).map(item => item.id);
            expect(new Set(ids).size).toBe(ids.length);
            expect(element.querySelector("h3")?.id).toMatch(/^mona-/);
            expect((await axe.run(element)).violations).toEqual([]);
        });
    });

    describe("without a title", () => {
        it("has no role or references", async () => {
            const plain = TestBed.createComponent(NoHeaderHostComponent);
            await settle(plain);
            const element = plain.nativeElement.querySelector("mona-card") as HTMLElement;
            expect(element.hasAttribute("role")).toBe(false);
            expect(element.hasAttribute("aria-labelledby")).toBe(false);
            expect(element.hasAttribute("aria-describedby")).toBe(false);
            expect(
                (await axe.run(plain.nativeElement)).incomplete.filter(item => item.id !== "color-contrast")
            ).toEqual([]);
        });
    });

    describe("with a description and no title", () => {
        it("has no role to give the description to", async () => {
            const plain = TestBed.createComponent(DescriptionOnlyHostComponent);
            await settle(plain);
            const element = plain.nativeElement.querySelector("mona-card") as HTMLElement;
            expect(element.textContent).toContain("Description");
            expect(element.hasAttribute("role")).toBe(false);
            expect(element.hasAttribute("aria-describedby")).toBe(false);
        });
    });

    describe("selectors", () => {
        it("only match templates, so a stray attribute doesn't crash", async () => {
            @Component({
                template: `
                    <mona-card>
                        <mona-card-header><h3 monaCardTitle>Title</h3></mona-card-header>
                        <div monaCardContent>Body</div>
                    </mona-card>
                `,
                imports: IMPORTS
            })
            class StrayHostComponent {}
            const stray = TestBed.createComponent(StrayHostComponent);
            await expect(settle(stray)).resolves.toBeUndefined();
        });
    });

    describe("styles", () => {
        it("doesn't hold a row open for a missing description", () => {
            const classes = cardHeaderThemeVariants({ rounded: "medium" });
            expect(classes).toContain("grid-rows-[auto_auto]");
            expect(classes).not.toContain("grid-rows-2");
        });
    });
});
