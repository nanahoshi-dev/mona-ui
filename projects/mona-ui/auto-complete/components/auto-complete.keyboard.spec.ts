import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import {
    DropdownFilterableDirective,
    DropdownFooterTemplateDirective,
    DropdownGroupableDirective,
    DropdownGroupHeaderTemplateDirective,
    DropdownHeaderTemplateDirective,
    DropdownItemTemplateDirective,
    DropdownNoDataTemplateDirective,
    DropdownPrefixTemplateDirective,
    DropdownSuffixTemplateDirective
} from "@nanahoshi/mona-ui/dropdowns";
import type { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AutoCompleteComponent } from "./auto-complete.component";

interface Food {
    readonly kind: string;
    readonly text: string;
}

const FOODS: readonly Food[] = [
    { kind: "Fruit", text: "Apple" },
    { kind: "Fruit", text: "Apricot" },
    { kind: "Fruit", text: "Banana" },
    { kind: "Fruit", text: "Blueberry" },
    { kind: "Vegetable", text: "Carrot" }
];

@Component({
    template: `
        <mona-auto-complete
            aria-label="Food"
            monaDropDownFilterable
            showClearButton
            textField="text"
            [data]="data"
            [highlightFirst]="highlightFirst()"
            [(value)]="value"
            (filterChange)="onFilterChange($event)"
            (touch)="touches = touches + 1"></mona-auto-complete>
    `,
    imports: [AutoCompleteComponent, DropdownFilterableDirective]
})
class FilterHostComponent {
    public readonly data = FOODS;
    public readonly filters: string[] = [];
    public readonly highlightFirst = signal(true);
    public readonly preventFilter = signal(false);
    public readonly value = signal<string | null>(null);
    public touches = 0;

    public onFilterChange(event: FilterChangeEvent): void {
        this.filters.push(event.filter);
        if (this.preventFilter()) {
            event.preventDefault();
        }
    }
}

/** Suggestions the app looks up for itself as text is typed, as an address bar's are, with no "No data". */
@Component({
    template: `
        <mona-auto-complete
            aria-label="Food"
            monaDropDownFilterable
            textField="text"
            [data]="suggestions()"
            [highlightFirst]="false"
            [showNoData]="false"
            (filterChange)="suggest($event)"></mona-auto-complete>
    `,
    imports: [AutoCompleteComponent, DropdownFilterableDirective]
})
class SuggestionHostComponent {
    public readonly asked: string[] = [];
    public readonly suggestions = signal<readonly Food[]>([]);

    public suggest(event: FilterChangeEvent): void {
        event.preventDefault();
        this.asked.push(event.filter);
    }
}

@Component({
    template: `
        <mona-auto-complete
            aria-label="Food"
            groupBy="kind"
            monaDropDownFilterable
            monaDropDownGroupable
            textField="text"
            [data]="data">
            <ng-template monaDropdownPrefixTemplate><span class="prefix-mark">Eat</span></ng-template>
            <ng-template monaDropdownSuffixTemplate><span class="suffix-mark">now</span></ng-template>
            <ng-template monaAutoCompleteHeaderTemplate><span class="header-mark">Pick one</span></ng-template>
            <ng-template monaAutoCompleteFooterTemplate><span class="footer-mark">5 foods</span></ng-template>
            <ng-template monaAutoCompleteGroupHeaderTemplate let-group>
                <span class="group-mark">{{ group }}</span>
            </ng-template>
            <ng-template monaAutoCompleteItemTemplate let-food>
                <span class="item-mark">{{ food.text }}!</span>
            </ng-template>
            <ng-template monaAutoCompleteNoDataTemplate><span class="no-data-mark">No food</span></ng-template>
        </mona-auto-complete>
    `,
    imports: [
        AutoCompleteComponent,
        DropdownFilterableDirective,
        DropdownFooterTemplateDirective,
        DropdownGroupableDirective,
        DropdownGroupHeaderTemplateDirective,
        DropdownHeaderTemplateDirective,
        DropdownItemTemplateDirective,
        DropdownNoDataTemplateDirective,
        DropdownPrefixTemplateDirective,
        DropdownSuffixTemplateDirective
    ]
})
class TemplateHostComponent {
    public readonly data = FOODS;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function input(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-auto-complete input") as HTMLInputElement;
}

async function typeText(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    const element = input(fixture);
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(fixture);
}

async function press(
    fixture: ComponentFixture<unknown>,
    key: string,
    init: KeyboardEventInit = {}
): Promise<KeyboardEvent> {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    input(fixture).dispatchEvent(event);
    await settle(fixture);
    return event;
}

function options(): HTMLElement[] {
    return Array.from(document.body.querySelectorAll<HTMLElement>("li[role='option']"));
}

function optionTexts(): string[] {
    return options().map(option => option.textContent?.trim() ?? "");
}

function highlightedText(fixture: ComponentFixture<unknown>): string | null {
    const id = input(fixture).getAttribute("aria-activedescendant");
    return id ? (document.getElementById(id)?.textContent?.trim() ?? null) : null;
}

function popupOpen(fixture: ComponentFixture<unknown>): boolean {
    return input(fixture).getAttribute("aria-expanded") === "true";
}

function clearOverlays(): void {
    document.querySelectorAll(".cdk-overlay-container").forEach(node => node.replaceChildren());
}

describe("AutoCompleteComponent keyboard and filtering", () => {
    let fixture: ComponentFixture<FilterHostComponent>;
    let host: FilterHostComponent;

    beforeEach(async () => {
        clearOverlays();
        TestBed.configureTestingModule({ imports: [FilterHostComponent] });
        fixture = TestBed.createComponent(FilterHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement as HTMLElement);
        await settle(fixture);
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        clearOverlays();
    });

    it("narrows the options to the typed text and highlights the first match", async () => {
        await typeText(fixture, "ap");

        expect(popupOpen(fixture)).toBe(true);
        expect(optionTexts()).toEqual(["Apple", "Apricot"]);
        expect(highlightedText(fixture)).toBe("Apple");
        expect(host.filters).toEqual(["ap"]);
    });

    it("moves the highlight with ArrowDown and ArrowUp while the popup is open", async () => {
        await typeText(fixture, "a");
        expect(highlightedText(fixture)).toBe("Apple");

        await press(fixture, "ArrowDown");
        expect(highlightedText(fixture)).toBe("Apricot");

        await press(fixture, "ArrowUp");
        expect(highlightedText(fixture)).toBe("Apple");
        expect(host.value()).toBeNull();
    });

    it("picks the highlighted option on Enter", async () => {
        await typeText(fixture, "ban");

        await press(fixture, "Enter");
        expect(host.value()).toBe("Banana");
        expect(input(fixture).value).toBe("Banana");
        expect(popupOpen(fixture)).toBe(false);
    });

    it("keeps the typed text on Enter when nothing is highlighted", async () => {
        host.highlightFirst.set(false);
        await settle(fixture);
        await typeText(fixture, "Kiwi");
        expect(highlightedText(fixture)).toBeNull();

        await press(fixture, "Enter");
        expect(host.value()).toBe("Kiwi");
        expect(popupOpen(fixture)).toBe(false);
    });

    it("closes the popup on Escape and keeps the text", async () => {
        await typeText(fixture, "ap");

        await press(fixture, "Escape");
        expect(popupOpen(fixture)).toBe(false);
        expect(input(fixture).value).toBe("ap");
        expect(host.value()).toBeNull();
    });

    it("leaves the options alone when the filter change is prevented", async () => {
        await typeText(fixture, "b");
        expect(optionTexts()).toEqual(["Banana", "Blueberry"]);

        host.preventFilter.set(true);
        await typeText(fixture, "ba");
        expect(host.filters).toEqual(["b", "ba"]);
        expect(optionTexts()).toEqual(["Banana", "Blueberry"]);
    });

    it("opens with the options as given when the app filters them itself", async () => {
        host.preventFilter.set(true);

        await typeText(fixture, "ap");

        expect(popupOpen(fixture)).toBe(true);
        expect(optionTexts()).toEqual(["Apple", "Apricot", "Banana", "Blueberry", "Carrot"]);
        expect(highlightedText(fixture)).toBe("Apple");
    });

    it("lets Space type a space", async () => {
        await typeText(fixture, "ap");

        const space = await press(fixture, " ");
        expect(space.defaultPrevented).toBe(false);
    });

    it("keeps focus in the input when the popup is pressed", async () => {
        await typeText(fixture, "ap");
        const event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
        options()[0].dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
    });

    it("doesn't report a touch while focus moves into the popup", async () => {
        await typeText(fixture, "ap");

        input(fixture).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: options()[0] }));
        expect(host.touches).toBe(0);
    });

    it("clears the value from its clear indicator with Enter, not with other keys", async () => {
        host.value.set("Carrot");
        await settle(fixture);
        const clear = (fixture.nativeElement as HTMLElement).querySelector(
            "mona-indicator-icon[preset='clear']"
        ) as HTMLElement;

        clear.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "a" }));
        await settle(fixture);
        expect(host.value()).toBe("Carrot");

        clear.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
        await settle(fixture);
        expect(host.value()).toBeNull();
        expect(input(fixture).value).toBe("");
    });
});

describe("AutoCompleteComponent with suggestions the app looks up", () => {
    let fixture: ComponentFixture<SuggestionHostComponent>;
    let host: SuggestionHostComponent;

    beforeEach(async () => {
        clearOverlays();
        TestBed.configureTestingModule({ imports: [SuggestionHostComponent] });
        fixture = TestBed.createComponent(SuggestionHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement as HTMLElement);
        await settle(fixture);
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        clearOverlays();
    });

    it("stays closed while there's nothing to suggest, and opens as suggestions arrive", async () => {
        await typeText(fixture, "ap");
        expect(host.asked).toEqual(["ap"]);
        expect(popupOpen(fixture)).toBe(false);
        expect(options()).toEqual([]);

        host.suggestions.set([FOODS[0], FOODS[4]]);
        await settle(fixture);

        expect(popupOpen(fixture)).toBe(true);
        expect(optionTexts()).toEqual(["Apple", "Carrot"]);
        expect(highlightedText(fixture)).toBeNull();
    });

    it("closes when the suggestions run out, and opens again when more come", async () => {
        await typeText(fixture, "ap");
        host.suggestions.set([FOODS[0]]);
        await settle(fixture);

        host.suggestions.set([]);
        await settle(fixture);
        expect(popupOpen(fixture)).toBe(false);
        expect(input(fixture).value).toBe("ap");

        host.suggestions.set([FOODS[1]]);
        await settle(fixture);
        expect(popupOpen(fixture)).toBe(true);
        expect(optionTexts()).toEqual(["Apricot"]);
    });

    it("opens with suggestions there already, and keeps them for the next text until new ones come", async () => {
        host.suggestions.set([FOODS[0], FOODS[1]]);
        await settle(fixture);
        expect(popupOpen(fixture)).toBe(false);

        await typeText(fixture, "a");
        expect(popupOpen(fixture)).toBe(true);

        await typeText(fixture, "apr");
        expect(host.asked).toEqual(["a", "apr"]);
        expect(optionTexts()).toEqual(["Apple", "Apricot"]);
    });

    it("doesn't open for suggestions that come after Escape, until the next typing", async () => {
        await typeText(fixture, "ap");
        host.suggestions.set([FOODS[0]]);
        await settle(fixture);

        await press(fixture, "Escape");
        host.suggestions.set([FOODS[0], FOODS[1]]);
        await settle(fixture);
        expect(popupOpen(fixture)).toBe(false);

        await typeText(fixture, "apr");
        expect(popupOpen(fixture)).toBe(true);
    });

    it("doesn't open for suggestions that come after Enter", async () => {
        await typeText(fixture, "Kiwi");

        await press(fixture, "Enter");
        host.suggestions.set([FOODS[0]]);
        await settle(fixture);

        expect(popupOpen(fixture)).toBe(false);
        expect(input(fixture).value).toBe("Kiwi");
    });

    it("doesn't open for suggestions that come after focus has left", async () => {
        await typeText(fixture, "ap");
        input(fixture).blur();
        input(fixture).dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        await settle(fixture);

        host.suggestions.set([FOODS[0]]);
        await settle(fixture);

        expect(popupOpen(fixture)).toBe(false);
    });
});

describe("AutoCompleteComponent templates", () => {
    let fixture: ComponentFixture<TemplateHostComponent>;

    beforeEach(async () => {
        clearOverlays();
        TestBed.configureTestingModule({ imports: [TemplateHostComponent] });
        fixture = TestBed.createComponent(TemplateHostComponent);
        document.body.appendChild(fixture.nativeElement as HTMLElement);
        await settle(fixture);
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        clearOverlays();
    });

    function marks(selector: string): string[] {
        return Array.from(document.body.querySelectorAll(selector)).map(mark => mark.textContent?.trim() ?? "");
    }

    it("shows its prefix and suffix around the input", () => {
        expect(marks(".prefix-mark")).toEqual(["Eat"]);
        expect(marks(".suffix-mark")).toEqual(["now"]);
    });

    it("shows its header, footer, group headers and items in the popup", async () => {
        await typeText(fixture, "r");

        expect(marks(".header-mark")).toEqual(["Pick one"]);
        expect(marks(".footer-mark")).toEqual(["5 foods"]);
        expect(marks(".group-mark")).toEqual(["Fruit", "Vegetable"]);
        expect(marks(".item-mark")).toEqual(["Apricot!", "Blueberry!", "Carrot!"]);
    });

    it("shows its no data template when nothing matches", async () => {
        await typeText(fixture, "zzz");

        expect(marks(".no-data-mark")).toEqual(["No food"]);
        expect(options()).toEqual([]);
    });
});
