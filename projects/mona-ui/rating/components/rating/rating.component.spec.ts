import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField, min } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { LucideHeart, LucideStar, type LucideIconInput } from "@lucide/angular";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RatingHoveredItemTemplateDirective } from "../../directives/rating-hovered-item-template.directive";
import { RatingItemTemplateDirective } from "../../directives/rating-item-template.directive";
import { RatingSelectedItemTemplateDirective } from "../../directives/rating-selected-item-template.directive";
import { RatingComponent } from "./rating.component";

const STAR_PATH = "11.525";
const HEART_PATH = "9.591-3.676";

@Component({
    template: `
        <mona-rating
            [aria-describedby]="ariaDescribedBy()"
            [aria-label]="ariaLabel()"
            [aria-labelledby]="ariaLabelledBy()"
            [ariaValueText]="ariaValueText()"
            [class]="userClass()"
            [disabled]="disabled()"
            [icon]="icon()"
            [invalid]="invalid()"
            [itemsCount]="itemsCount()"
            [label]="label()"
            [labelPosition]="labelPosition()"
            [outlineIcon]="outlineIcon()"
            [precision]="precision()"
            [readonly]="readOnly()"
            [selection]="selection()"
            [size]="size()"
            [tabindex]="tabindex()"
            [touched]="touched()"
            [(value)]="value"></mona-rating>
    `,
    imports: [RatingComponent]
})
class HostComponent {
    public readonly ariaDescribedBy = signal<string | null>(null);
    public readonly ariaLabel = signal<string | null>(null);
    public readonly ariaLabelledBy = signal<string | null>(null);
    public readonly ariaValueText = signal<((value: number, maximum: number) => string) | null>(null);
    public readonly disabled = signal(false);
    public readonly icon = signal<LucideIconInput>(LucideStar);
    public readonly invalid = signal(false);
    public readonly itemsCount = signal(5);
    public readonly label = signal<string | null>(null);
    public readonly labelPosition = signal<"before" | "after">("after");
    public readonly outlineIcon = signal<LucideIconInput>(LucideStar);
    public readonly precision = signal<"item" | "half">("item");
    public readonly readOnly = signal(false);
    public readonly selection = signal<"continuous" | "single">("continuous");
    public readonly size = signal<"small" | "medium" | "large">("medium");
    public readonly tabindex = signal<number | string>(0);
    public readonly touched = signal(false);
    public readonly userClass = signal("w-64");
    public readonly value = signal(0);
}

@Component({
    template: `
        <mona-rating aria-label="Review rating" [formField]="form.rating"></mona-rating>
    `,
    imports: [RatingComponent, FormField]
})
class SignalFormHostComponent {
    readonly #model = signal<FormModel>({ rating: 3 });
    public readonly disabled = signal(false);
    public readonly form = form(this.#model, schema => {
        fieldDisabled(schema.rating, { when: () => this.disabled() });
        min(schema.rating, 3);
    });
}

@Component({
    template: `
        <mona-rating aria-label="Review rating" precision="half" [formField]="form.rating"></mona-rating>
    `,
    imports: [RatingComponent, FormField]
})
class HalfSignalFormHostComponent {
    readonly #model = signal<FormModel>({ rating: 0 });
    public readonly form = form(this.#model);
}

@Component({
    template: `
        <mona-rating aria-label="Satisfaction" precision="half" [(value)]="value">
            <ng-template
                monaRatingItemTemplate
                let-index="index"
                let-itemValue="itemValue"
                let-fill="fill"
                let-selected="selected"
                let-hovered="hovered">
                <span class="tmpl-default">{{ index }}-{{ itemValue }}-{{ fill }}-{{ selected }}-{{ hovered }}</span>
            </ng-template>
        </mona-rating>
    `,
    imports: [RatingComponent, RatingItemTemplateDirective]
})
class DefaultTemplateHostComponent {
    public readonly value = signal(0);
}

@Component({
    template: `
        <mona-rating aria-label="Satisfaction" precision="half" [(value)]="value">
            <ng-template monaRatingSelectedItemTemplate let-index="index" let-fill="fill" let-selected="selected">
                <span class="tmpl-selected">{{ index }}-{{ fill }}-{{ selected }}</span>
            </ng-template>
        </mona-rating>
    `,
    imports: [RatingComponent, RatingSelectedItemTemplateDirective]
})
class SelectedTemplateHostComponent {
    public readonly value = signal(0);
}

@Component({
    template: `
        <mona-rating aria-label="Satisfaction" precision="half" [(value)]="value">
            <ng-template monaRatingHoveredItemTemplate let-index="index" let-hovered="hovered">
                <span class="tmpl-hovered">{{ index }}-{{ hovered }}</span>
            </ng-template>
        </mona-rating>
    `,
    imports: [RatingComponent, RatingHoveredItemTemplateDirective]
})
class HoveredTemplateHostComponent {
    public readonly value = signal(0);
}

@Component({
    template: `
        <mona-rating aria-label="Satisfaction" [(value)]="value">
            <ng-template monaRatingItemTemplate let-index="index">
                <span class="tmpl-default">{{ index }}</span>
            </ng-template>
            <ng-template monaRatingSelectedItemTemplate let-index="index">
                <span class="tmpl-selected">{{ index }}</span>
            </ng-template>
            <ng-template monaRatingHoveredItemTemplate let-index="index">
                <span class="tmpl-hovered">{{ index }}</span>
            </ng-template>
        </mona-rating>
    `,
    imports: [
        RatingComponent,
        RatingItemTemplateDirective,
        RatingSelectedItemTemplateDirective,
        RatingHoveredItemTemplateDirective
    ]
})
class AllTemplatesHostComponent {
    public readonly value = signal(3);
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getRatingComponent(fixture: ComponentFixture<unknown>): RatingComponent {
    return fixture.debugElement.query(By.directive(RatingComponent)).componentInstance as RatingComponent;
}

function getHostElement(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.directive(RatingComponent)).nativeElement as HTMLElement;
}

function getContainer(fixture: ComponentFixture<unknown>): HTMLElement {
    return getHostElement(fixture).firstElementChild as HTMLElement;
}

function getControl(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector('[role="slider"]') as HTMLElement;
}

function getItems(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll("[data-rating-value]")) as HTMLElement[];
}

function getItemChildren(item: HTMLElement): HTMLElement[] {
    return Array.from(item.children).filter(
        (element): element is HTMLElement => element.tagName === "SPAN"
    );
}

function getBaseLayer(item: HTMLElement): HTMLElement | null {
    return getItemChildren(item)[0] ?? null;
}

function getOverlayClip(item: HTMLElement): HTMLElement | null {
    return getItemChildren(item)[1] ?? null;
}

function getOverlayContent(item: HTMLElement): HTMLElement | null {
    return getOverlayClip(item)?.querySelector(":scope > span") ?? null;
}

function createRect(left: number, width: number, top = 0, height = 28): DOMRect {
    return {
        bottom: top + height,
        height,
        left,
        right: left + width,
        top,
        width,
        x: left,
        y: top,
        toJSON: () => ({})
    } as DOMRect;
}

function mockItemRects(fixture: ComponentFixture<unknown>, width = 28): void {
    getItems(fixture).forEach((item, index) => {
        vi.spyOn(item, "getBoundingClientRect").mockReturnValue(createRect(index * width, width));
    });
}

function movePointerToItem(fixture: ComponentFixture<unknown>, itemIndex: number, clientX: number): void {
    const item = getItems(fixture)[itemIndex] as HTMLElement;
    item.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX }));
    fixture.detectChanges();
}

function clickItem(fixture: ComponentFixture<unknown>, itemIndex: number, clientX: number): void {
    const item = getItems(fixture)[itemIndex] as HTMLElement;
    item.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX }));
    fixture.detectChanges();
}

function pressKey(fixture: ComponentFixture<unknown>, key: string): KeyboardEvent {
    const control = getControl(fixture);
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
    control.dispatchEvent(event);
    fixture.detectChanges();
    return event;
}

describe("RatingComponent", () => {
    describe("rendering", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("renders five items by default", () => {
            expect(getItems(fixture).length).toBe(5);
        });

        it("renders one focusable slider control only", () => {
            const sliders = fixture.nativeElement.querySelectorAll('[role="slider"]');
            expect(sliders.length).toBe(1);
        });

        it("updates the rendered item count", () => {
            component.itemsCount.set(3);
            fixture.detectChanges();
            expect(getItems(fixture).length).toBe(3);
        });

        it("normalizes invalid item counts safely", () => {
            component.itemsCount.set(0);
            fixture.detectChanges();
            expect(getItems(fixture).length).toBe(1);

            component.itemsCount.set(-3);
            fixture.detectChanges();
            expect(getItems(fixture).length).toBe(1);

            component.itemsCount.set(5.9);
            fixture.detectChanges();
            expect(getItems(fixture).length).toBe(5);

            component.itemsCount.set(NaN);
            fixture.detectChanges();
            expect(getItems(fixture).length).toBe(5);
        });

        it("exposes stable one-based item values", () => {
            const values = getItems(fixture).map(item => item.getAttribute("data-rating-value"));
            expect(values).toEqual(["1", "2", "3", "4", "5"]);
        });

        it("renders the default outline star icon under every item", () => {
            getItems(fixture).forEach(item => {
                const svg = getBaseLayer(item)?.querySelector("svg");
                expect(svg?.outerHTML).toContain(STAR_PATH);
            });
        });

        it("renders the custom outline icon underneath", () => {
            component.outlineIcon.set(LucideHeart);
            component.value.set(2);
            fixture.detectChanges();

            const baseSvg = getBaseLayer(getItems(fixture)[0] as HTMLElement)?.querySelector("svg");
            expect(baseSvg?.outerHTML).toContain(HEART_PATH);
            expect(baseSvg?.outerHTML).not.toContain(STAR_PATH);
        });

        it("renders the custom icon in the selected overlay", () => {
            component.icon.set(LucideHeart);
            component.value.set(3);
            fixture.detectChanges();

            const overlaySvg = getOverlayContent(getItems(fixture)[0] as HTMLElement)?.querySelector("svg");
            expect(overlaySvg?.outerHTML).toContain(HEART_PATH);
            expect(overlaySvg?.outerHTML).not.toContain(STAR_PATH);
        });

        it("renders no selected overlay when the value is zero", () => {
            getItems(fixture).forEach(item => {
                expect(getOverlayClip(item)).toBeNull();
            });
        });

        it("applies size variants to the control and items", () => {
            component.size.set("small");
            fixture.detectChanges();
            expect(getControl(fixture).classList.contains("gap-1")).toBe(true);
            expect(getItems(fixture)[0]?.classList.contains("h-6")).toBe(true);

            component.size.set("large");
            fixture.detectChanges();
            expect(getControl(fixture).classList.contains("gap-1.5")).toBe(true);
            expect(getItems(fixture)[0]?.classList.contains("h-8")).toBe(true);
        });

        it("merges consumer host classes onto the container", () => {
            expect(getContainer(fixture).classList.contains("w-64")).toBe(true);
        });

        it("lets consumer classes override conflicting utilities through twMerge", () => {
            component.userClass.set("gap-10");
            fixture.detectChanges();

            const container = getContainer(fixture);
            expect(container.classList.contains("gap-10")).toBe(true);
            expect(container.classList.contains("gap-2.5")).toBe(false);
        });

        it("does not make individual items tabbable", () => {
            getItems(fixture).forEach(item => {
                expect(item.getAttribute("tabindex")).toBeNull();
            });
        });
    });

    describe("value", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("defaults to zero", () => {
            expect(component.value()).toBe(0);
        });

        it("fills items according to the external value", () => {
            component.value.set(3);
            fixture.detectChanges();

            const items = getItems(fixture);
            expect(getOverlayClip(items[0] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[2] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[3] as HTMLElement)).toBeNull();
        });

        it("does not rewrite an out-of-range external value", () => {
            component.value.set(7);
            fixture.detectChanges();
            expect(component.value()).toBe(7);
        });

        it("clamps out-of-range values visually", () => {
            component.value.set(7);
            fixture.detectChanges();

            const items = getItems(fixture);
            expect(getOverlayClip(items[4] as HTMLElement)).not.toBeNull();
        });

        it("does not rewrite the model when itemsCount changes", () => {
            component.value.set(4);
            component.itemsCount.set(3);
            fixture.detectChanges();

            expect(component.value()).toBe(4);
        });

        it("does not rewrite the model when precision changes", () => {
            component.value.set(2.6);
            component.precision.set("item");
            fixture.detectChanges();
            expect(component.value()).toBe(2.6);

            component.precision.set("half");
            fixture.detectChanges();
            expect(component.value()).toBe(2.6);
        });

        it("writes normalized values through user interaction", () => {
            mockItemRects(fixture);
            clickItem(fixture, 2, 70);
            expect(component.value()).toBe(3);
        });

        it("does not emit a redundant value change when selecting the current value", () => {
            component.value.set(2);
            fixture.detectChanges();
            mockItemRects(fixture);

            const componentInstance = getRatingComponent(fixture);
            let emitted = -1;
            const subscription = componentInstance.value.subscribe(value => {
                emitted = value;
            });

            clickItem(fixture, 1, 42);
            subscription.unsubscribe();

            expect(emitted).toBe(-1);
            expect(component.value()).toBe(2);
        });

        it("emits touch even when the selected value does not change", () => {
            component.value.set(2);
            fixture.detectChanges();
            mockItemRects(fixture);

            const componentInstance = getRatingComponent(fixture);
            let touches = 0;
            const subscription = componentInstance.touch.subscribe(() => {
                touches++;
            });

            clickItem(fixture, 1, 42);
            subscription.unsubscribe();

            expect(touches).toBe(1);
        });

        it("does not clear the value when clicking the selected item again", () => {
            component.value.set(3);
            fixture.detectChanges();
            mockItemRects(fixture);

            clickItem(fixture, 2, 70);
            expect(component.value()).toBe(3);
        });
    });

    describe("pointer interaction", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
            mockItemRects(fixture);
        });

        it("previews pointer movement without committing", () => {
            movePointerToItem(fixture, 2, 70);

            expect(component.value()).toBe(0);
            const items = getItems(fixture);
            expect(getOverlayClip(items[0] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[2] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[3] as HTMLElement)).toBeNull();
        });

        it("restores the committed state on pointer leave", () => {
            movePointerToItem(fixture, 2, 70);

            getControl(fixture).dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
            fixture.detectChanges();

            getItems(fixture).forEach(item => {
                expect(getOverlayClip(item)).toBeNull();
            });
        });

        it("commits a whole-item value on click", () => {
            clickItem(fixture, 3, 95);
            expect(component.value()).toBe(4);
        });

        it("commits a half-item value on click", () => {
            component.precision.set("half");
            fixture.detectChanges();

            clickItem(fixture, 0, 10);
            expect(component.value()).toBe(0.5);

            clickItem(fixture, 0, 20);
            expect(component.value()).toBe(1);
        });

        it("previews preceding items in continuous mode", () => {
            movePointerToItem(fixture, 2, 70);

            const items = getItems(fixture);
            expect(getOverlayClip(items[0] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[1] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[2] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[3] as HTMLElement)).toBeNull();
        });

        it("previews only the active item in single mode", () => {
            component.selection.set("single");
            fixture.detectChanges();
            movePointerToItem(fixture, 2, 70);

            const items = getItems(fixture);
            expect(getOverlayClip(items[0] as HTMLElement)).toBeNull();
            expect(getOverlayClip(items[1] as HTMLElement)).toBeNull();
            expect(getOverlayClip(items[2] as HTMLElement)).not.toBeNull();
        });

        it("keeps the preview after a click until pointer leave", () => {
            movePointerToItem(fixture, 2, 70);
            clickItem(fixture, 2, 70);

            expect(getOverlayContent(getItems(fixture)[2] as HTMLElement)?.getAttribute("data-state")).toBe(
                "hovered"
            );

            getControl(fixture).dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
            fixture.detectChanges();
            expect(getOverlayContent(getItems(fixture)[2] as HTMLElement)?.getAttribute("data-state")).toBe(
                "selected"
            );
        });

        it("maps RTL half selection correctly", () => {
            component.precision.set("half");
            fixture.detectChanges();
            getControl(fixture).style.direction = "rtl";

            clickItem(fixture, 0, 20);
            expect(component.value()).toBe(0.5);

            clickItem(fixture, 0, 10);
            expect(component.value()).toBe(1);
        });

        it("ignores pointer movement and clicks while disabled", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            movePointerToItem(fixture, 2, 70);
            clickItem(fixture, 2, 70);

            expect(component.value()).toBe(0);
            getItems(fixture).forEach(item => {
                expect(getOverlayClip(item)).toBeNull();
            });
        });

        it("ignores pointer movement and clicks while read-only", () => {
            component.readOnly.set(true);
            fixture.detectChanges();

            movePointerToItem(fixture, 2, 70);
            clickItem(fixture, 2, 70);

            expect(component.value()).toBe(0);
            getItems(fixture).forEach(item => {
                expect(getOverlayClip(item)).toBeNull();
            });
        });

        it("does not create additional global listeners", () => {
            const addEventListener = vi.spyOn(document, "addEventListener");

            movePointerToItem(fixture, 2, 70);
            getControl(fixture).dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
            fixture.detectChanges();

            expect(addEventListener).not.toHaveBeenCalled();
        });
    });

    describe("keyboard interaction", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("increments with ArrowRight and ArrowUp", () => {
            pressKey(fixture, "ArrowRight");
            expect(component.value()).toBe(1);

            pressKey(fixture, "ArrowUp");
            expect(component.value()).toBe(2);
        });

        it("decrements with ArrowLeft and ArrowDown", () => {
            component.value.set(3);
            fixture.detectChanges();

            pressKey(fixture, "ArrowLeft");
            expect(component.value()).toBe(2);

            pressKey(fixture, "ArrowDown");
            expect(component.value()).toBe(1);
        });

        it("sets the minimum with Home and the maximum with End", () => {
            component.value.set(3);
            fixture.detectChanges();

            pressKey(fixture, "Home");
            expect(component.value()).toBe(0);

            pressKey(fixture, "End");
            expect(component.value()).toBe(5);
        });

        it("uses step 1 with item precision", () => {
            pressKey(fixture, "ArrowRight");
            pressKey(fixture, "ArrowRight");
            expect(component.value()).toBe(2);
        });

        it("uses step 0.5 with half precision", () => {
            component.precision.set("half");
            fixture.detectChanges();

            pressKey(fixture, "ArrowRight");
            expect(component.value()).toBe(0.5);

            pressKey(fixture, "ArrowRight");
            expect(component.value()).toBe(1);
        });

        it("clamps at both boundaries", () => {
            pressKey(fixture, "ArrowLeft");
            expect(component.value()).toBe(0);

            component.value.set(5);
            fixture.detectChanges();
            pressKey(fixture, "ArrowRight");
            expect(component.value()).toBe(5);
        });

        it("calls preventDefault for handled keys", () => {
            const event = pressKey(fixture, "ArrowRight");
            expect(event.defaultPrevented).toBe(true);
        });

        it("does not call preventDefault for unhandled keys", () => {
            const event = pressKey(fixture, "Space");
            expect(event.defaultPrevented).toBe(false);
            expect(component.value()).toBe(0);
        });

        it("ignores keys while disabled", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            pressKey(fixture, "ArrowRight");
            pressKey(fixture, "End");
            expect(component.value()).toBe(0);
        });

        it("ignores keys while read-only", () => {
            component.readOnly.set(true);
            fixture.detectChanges();

            pressKey(fixture, "ArrowRight");
            pressKey(fixture, "End");
            expect(component.value()).toBe(0);
        });

        it("clears the pointer preview on keyboard interaction", () => {
            mockItemRects(fixture);
            movePointerToItem(fixture, 2, 70);

            pressKey(fixture, "ArrowRight");

            expect(getOverlayContent(getItems(fixture)[0] as HTMLElement)?.getAttribute("data-state")).toBe(
                "selected"
            );
        });

        it("emits one model change per key press", () => {
            const componentInstance = getRatingComponent(fixture);
            let emissions = 0;
            const subscription = componentInstance.value.subscribe(() => {
                emissions++;
            });

            pressKey(fixture, "ArrowRight");
            subscription.unsubscribe();

            expect(emissions).toBe(1);
        });

        it("emits touch on keyboard interaction", () => {
            const componentInstance = getRatingComponent(fixture);
            let touches = 0;
            const subscription = componentInstance.touch.subscribe(() => {
                touches++;
            });

            pressKey(fixture, "ArrowRight");
            subscription.unsubscribe();

            expect(touches).toBe(1);
        });

        it("keeps arrow meaning consistent under RTL", () => {
            getControl(fixture).style.direction = "rtl";

            pressKey(fixture, "ArrowRight");
            expect(component.value()).toBe(1);

            pressKey(fixture, "ArrowLeft");
            expect(component.value()).toBe(0);
        });
    });

    describe("focus", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("sets tabindex 0 by default", () => {
            expect(getControl(fixture).getAttribute("tabindex")).toBe("0");
        });

        it("forwards a custom tab index", () => {
            component.tabindex.set(5);
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("tabindex")).toBe("5");
        });

        it("converts a numeric-string tab index", () => {
            component.tabindex.set("3");
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("tabindex")).toBe("3");
        });

        it("forces tabindex -1 while disabled", () => {
            component.disabled.set(true);
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("tabindex")).toBe("-1");
        });

        it("remains focusable while read-only", () => {
            component.readOnly.set(true);
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("tabindex")).toBe("0");
        });

        it("focuses the inner control through focus()", () => {
            getRatingComponent(fixture).focus();
            expect(document.activeElement).toBe(getControl(fixture));
        });

        it("does nothing when focus() is called while disabled", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            getRatingComponent(fixture).focus();
            expect(document.activeElement).not.toBe(getControl(fixture));
        });

        it("blurs the inner control through blur()", () => {
            getRatingComponent(fixture).focus();
            getRatingComponent(fixture).blur();
            expect(document.activeElement).not.toBe(getControl(fixture));
        });

        it("emits touch on blur", () => {
            const componentInstance = getRatingComponent(fixture);
            let touches = 0;
            const subscription = componentInstance.touch.subscribe(() => {
                touches++;
            });

            getControl(fixture).dispatchEvent(new FocusEvent("blur"));
            fixture.detectChanges();
            subscription.unsubscribe();

            expect(touches).toBe(1);
        });

        it("clears the preview on blur", () => {
            mockItemRects(fixture);
            movePointerToItem(fixture, 2, 70);

            getControl(fixture).dispatchEvent(new FocusEvent("blur"));
            fixture.detectChanges();

            getItems(fixture).forEach(item => {
                expect(getOverlayClip(item)).toBeNull();
            });
        });
    });

    describe("disabled and read-only semantics", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("exposes disabled ARIA and data attributes", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("aria-disabled")).toBe("true");
            expect(control.getAttribute("data-disabled")).toBe("true");
        });

        it("exposes read-only ARIA and data attributes without disabled styling", () => {
            component.readOnly.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("aria-readonly")).toBe("true");
            expect(control.getAttribute("data-readonly")).toBe("true");
            expect(control.getAttribute("aria-disabled")).toBeNull();
            expect(control.getAttribute("data-disabled")).toBeNull();
        });

        it("does not show an interactive cursor while read-only", () => {
            component.readOnly.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.classList.contains('data-[readonly="true"]:cursor-default')).toBe(true);
            expect(control.getAttribute("data-disabled")).toBeNull();
        });

        it("shows an unavailable cursor while disabled", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("data-disabled")).toBe("true");
            expect(control.classList.contains('data-[disabled="true"]:cursor-not-allowed')).toBe(true);
        });

        it("lets disabled behavior win when both states are active", () => {
            component.disabled.set(true);
            component.readOnly.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("aria-disabled")).toBe("true");
            expect(control.getAttribute("tabindex")).toBe("-1");
        });

        it("keeps the read-only control visually emphasized", () => {
            component.value.set(3);
            component.readOnly.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("data-disabled")).toBeNull();
            expect(getOverlayContent(getItems(fixture)[0] as HTMLElement)).not.toBeNull();
        });
    });

    describe("form-control state", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("does not expose invalid styling before touch", () => {
            component.invalid.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("aria-invalid")).toBeNull();
            expect(control.getAttribute("data-invalid")).toBeNull();
        });

        it("exposes invalid styling when touched and invalid", () => {
            component.touched.set(true);
            component.invalid.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("aria-invalid")).toBe("true");
            expect(control.getAttribute("data-invalid")).toBe("true");
        });

        it("emits touch on pointer commit", () => {
            mockItemRects(fixture);
            const componentInstance = getRatingComponent(fixture);
            let touches = 0;
            const subscription = componentInstance.touch.subscribe(() => {
                touches++;
            });

            clickItem(fixture, 2, 70);
            subscription.unsubscribe();

            expect(touches).toBe(1);
        });

        it("emits touch on keyboard commit", () => {
            const componentInstance = getRatingComponent(fixture);
            let touches = 0;
            const subscription = componentInstance.touch.subscribe(() => {
                touches++;
            });

            pressKey(fixture, "ArrowRight");
            subscription.unsubscribe();

            expect(touches).toBe(1);
        });
    });

    describe("signal forms integration", () => {
        let fixture: ComponentFixture<SignalFormHostComponent>;
        let component: SignalFormHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [SignalFormHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(SignalFormHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("renders the initial field value", () => {
            const items = getItems(fixture);
            expect(getOverlayClip(items[0] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[2] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[3] as HTMLElement)).toBeNull();
        });

        it("updates the field value on pointer interaction", () => {
            mockItemRects(fixture);
            clickItem(fixture, 3, 95);
            expect(component.form.rating().value()).toBe(4);
        });

        it("updates the field value on keyboard interaction", () => {
            pressKey(fixture, "ArrowRight");
            expect(component.form.rating().value()).toBe(4);
        });

        it("renders programmatic field updates", () => {
            component.form.rating().value.set(2);
            fixture.detectChanges();

            const items = getItems(fixture);
            expect(getOverlayClip(items[0] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[1] as HTMLElement)).not.toBeNull();
            expect(getOverlayClip(items[2] as HTMLElement)).toBeNull();
        });

        it("respects the signal-form disabled state", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("aria-disabled")).toBe("true");
            expect(control.getAttribute("tabindex")).toBe("-1");
        });

        it("marks the field as touched on pointer interaction", () => {
            mockItemRects(fixture);
            clickItem(fixture, 2, 70);
            expect(component.form.rating().touched()).toBe(true);
        });

        it("marks the field as touched on blur", () => {
            getControl(fixture).dispatchEvent(new FocusEvent("blur"));
            fixture.detectChanges();
            expect(component.form.rating().touched()).toBe(true);
        });

        it("reaches an invalid field state", () => {
            component.form.rating().value.set(1);
            fixture.detectChanges();
            expect(component.form.rating().invalid()).toBe(true);
        });

        it("waits for touch before exposing invalid styling", () => {
            component.form.rating().value.set(1);
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("aria-invalid")).toBeNull();

            clickItem(fixture, 0, 10);
            expect(getControl(fixture).getAttribute("aria-invalid")).toBe("true");
        });

        it("keeps half values numeric in the field", async () => {
            await TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [HalfSignalFormHostComponent]
            }).compileComponents();

            const halfFixture = TestBed.createComponent(HalfSignalFormHostComponent);
            await waitForStable(halfFixture);
            mockItemRects(halfFixture);
            clickItem(halfFixture, 0, 10);

            const value = halfFixture.componentInstance.form.rating().value();
            expect(value).toBe(0.5);
            expect(typeof value).toBe("number");
        });
    });

    describe("accessibility", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("exposes slider semantics on the inner control", () => {
            const control = getControl(fixture);
            expect(control.getAttribute("role")).toBe("slider");
            expect(control.getAttribute("aria-valuemin")).toBe("0");
            expect(control.getAttribute("aria-valuemax")).toBe("5");
        });

        it("exposes the normalized value as aria-valuenow", () => {
            component.value.set(3);
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("aria-valuenow")).toBe("3");
        });

        it("clamps out-of-range values in aria-valuenow", () => {
            component.value.set(7);
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("aria-valuenow")).toBe("5");
        });

        it("generates the default aria-valuetext", () => {
            expect(getControl(fixture).getAttribute("aria-valuetext")).toBe("Not rated");

            component.value.set(3);
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("aria-valuetext")).toBe("3 out of 5");

            component.value.set(3.5);
            component.precision.set("half");
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("aria-valuetext")).toBe("3.5 out of 5");
        });

        it("respects a custom ariaValueText", () => {
            component.ariaValueText.set((value, maximum) => `${value}/${maximum}`);
            component.value.set(3);
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("aria-valuetext")).toBe("3/5");
        });

        it("forwards aria-label, aria-labelledby, and aria-describedby", () => {
            component.ariaLabel.set("Product rating");
            component.ariaLabelledBy.set("ext-label");
            component.ariaDescribedBy.set("ext-description");
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("aria-label")).toBe("Product rating");
            expect(control.getAttribute("aria-labelledby")).toBe("ext-label");
            expect(control.getAttribute("aria-describedby")).toBe("ext-description");
        });

        it("uses the visible label for accessible naming when no explicit name exists", () => {
            component.label.set("Product rating");
            fixture.detectChanges();

            const control = getControl(fixture);
            const labelId = control.getAttribute("aria-labelledby");
            const labelElement = labelId ? fixture.nativeElement.querySelector(`[id="${labelId}"]`) : null;
            expect(labelElement?.textContent?.trim()).toBe("Product rating");
        });

        it("gives explicit aria-labelledby priority over the visible label", () => {
            component.label.set("Visible label");
            component.ariaLabelledBy.set("external-id");
            fixture.detectChanges();
            expect(getControl(fixture).getAttribute("aria-labelledby")).toBe("external-id");
        });

        it("gives explicit aria-label priority over the visible label", () => {
            component.label.set("Visible label");
            component.ariaLabel.set("Explicit name");
            fixture.detectChanges();

            const control = getControl(fixture);
            expect(control.getAttribute("aria-label")).toBe("Explicit name");
            expect(control.getAttribute("aria-labelledby")).toBeNull();
        });

        it("hides icons and templates from the accessibility tree", () => {
            component.value.set(3);
            fixture.detectChanges();

            getItems(fixture).forEach(item => {
                expect(item.getAttribute("aria-hidden")).toBe("true");
            });
        });

        it("renders the label before or after the item group", () => {
            component.label.set("Rating");
            component.labelPosition.set("before");
            fixture.detectChanges();

            const host = getHostElement(fixture);
            const spans = Array.from(host.querySelectorAll(":scope > div > span"));
            expect(spans[0]?.textContent?.trim()).toBe("Rating");

            component.labelPosition.set("after");
            fixture.detectChanges();
            const afterSpans = Array.from(getHostElement(fixture).querySelectorAll(":scope > div > span"));
            expect(afterSpans[afterSpans.length - 1]?.textContent?.trim()).toBe("Rating");
        });

        it("exposes a focus indicator treatment", () => {
            const control = getControl(fixture);
            expect(control.classList.contains("focus-visible:ring-2")).toBe(true);
            expect(control.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        });

        it("has no AXE violations in a labeled default state", async () => {
            component.ariaLabel.set("Product rating");
            fixture.detectChanges();

            const results = await axe.run(fixture.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });
            expect(results.violations).toEqual([]);
        });

        it("has no AXE violations when disabled", async () => {
            component.ariaLabel.set("Product rating");
            component.disabled.set(true);
            fixture.detectChanges();

            const results = await axe.run(fixture.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });
            expect(results.violations).toEqual([]);
        });

        it("has no AXE violations when read-only and focused", async () => {
            component.ariaLabel.set("Product rating");
            component.readOnly.set(true);
            fixture.detectChanges();
            getControl(fixture).focus();

            const results = await axe.run(fixture.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });
            expect(results.violations).toEqual([]);
        });
    });

    describe("templates", () => {
        it("uses the default template for the base layer only", async () => {
            await TestBed.configureTestingModule({
                imports: [DefaultTemplateHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(DefaultTemplateHostComponent);
            fixture.componentInstance.value.set(3);
            await waitForStable(fixture);

            const items = getItems(fixture);
            expect(getBaseLayer(items[0] as HTMLElement)?.textContent?.trim()).toBe("0-1-1-true-false");
            expect(getBaseLayer(items[2] as HTMLElement)?.textContent?.trim()).toBe("2-3-1-true-false");
            expect(getOverlayContent(items[0] as HTMLElement)?.querySelector("svg")).not.toBeNull();
        });

        it("uses the selected template with the correct context", async () => {
            await TestBed.configureTestingModule({
                imports: [SelectedTemplateHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(SelectedTemplateHostComponent);
            fixture.componentInstance.value.set(3.5);
            await waitForStable(fixture);

            const items = getItems(fixture);
            expect(getOverlayContent(items[0] as HTMLElement)?.textContent?.trim()).toBe("0-1-true");
            expect(getOverlayContent(items[3] as HTMLElement)?.textContent?.trim()).toBe("3-0.5-true");
            expect(getOverlayContent(items[4] as HTMLElement)).toBeNull();
        });

        it("uses the hovered template only during pointer preview", async () => {
            await TestBed.configureTestingModule({
                imports: [HoveredTemplateHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(HoveredTemplateHostComponent);
            fixture.componentInstance.value.set(2);
            await waitForStable(fixture);
            mockItemRects(fixture);

            const items = getItems(fixture);
            expect(getOverlayContent(items[0] as HTMLElement)?.querySelector(".tmpl-hovered")).toBeNull();

            movePointerToItem(fixture, 3, 95);
            expect(getOverlayContent(items[0] as HTMLElement)?.textContent?.trim()).toBe("0-true");
            expect(getOverlayContent(items[3] as HTMLElement)?.textContent?.trim()).toBe("3-true");
        });

        it("renders all three templates with independent fallback", async () => {
            await TestBed.configureTestingModule({
                imports: [AllTemplatesHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(AllTemplatesHostComponent);
            await waitForStable(fixture);
            mockItemRects(fixture);

            const items = getItems(fixture);
            expect(getBaseLayer(items[0] as HTMLElement)?.querySelector(".tmpl-default")).not.toBeNull();
            expect(getOverlayContent(items[0] as HTMLElement)?.querySelector(".tmpl-selected")).not.toBeNull();

            movePointerToItem(fixture, 1, 42);
            expect(getOverlayContent(items[0] as HTMLElement)?.querySelector(".tmpl-hovered")).not.toBeNull();
            expect(getOverlayContent(items[0] as HTMLElement)?.querySelector(".tmpl-selected")).toBeNull();
        });

        it("keeps half-value clipping component-controlled", async () => {
            await TestBed.configureTestingModule({
                imports: [SelectedTemplateHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(SelectedTemplateHostComponent);
            fixture.componentInstance.value.set(3.5);
            await waitForStable(fixture);

            const clip = getOverlayClip(getItems(fixture)[3] as HTMLElement);
            expect(clip?.style.inlineSize).toBe("50%");
        });

        it("does not alter the accessible value through templates", async () => {
            await TestBed.configureTestingModule({
                imports: [SelectedTemplateHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(SelectedTemplateHostComponent);
            fixture.componentInstance.value.set(3.5);
            await waitForStable(fixture);

            const control = getControl(fixture);
            expect(control.getAttribute("aria-valuenow")).toBe("3.5");
            expect(control.getAttribute("aria-valuetext")).toBe("3.5 out of 5");
        });

        it("has no AXE violations with custom templates", async () => {
            await TestBed.configureTestingModule({
                imports: [AllTemplatesHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(AllTemplatesHostComponent);
            await waitForStable(fixture);

            const results = await axe.run(fixture.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });
            expect(results.violations).toEqual([]);
        });
    });
});

interface FormModel {
    rating: number;
}
