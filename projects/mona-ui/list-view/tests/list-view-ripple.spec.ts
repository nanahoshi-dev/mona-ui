import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { NavigableOptions } from "@nanahoshi/mona-ui/internal/list";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ListViewComponent } from "../components/list-view/list-view.component";
import { ListViewItemTemplateDirective } from "../directives/list-view-item-template.directive";
import { ListViewNavigableDirective } from "../directives/list-view-navigable.directive";

interface Task {
    readonly done?: boolean;
    readonly name: string;
}

@Component({
    template: `
        <mona-list-view
            aria-label="Tasks"
            [items]="items"
            [height]="''"
            [textField]="'name'"
            [disabledBy]="'done'"
            [monaListViewNavigable]="navigation()">
            <ng-template monaListViewItemTemplate let-task>
                <span>{{ task.name }}</span>
                <button type="button">Edit</button>
            </ng-template>
        </mona-list-view>
    `,
    imports: [ListViewComponent, ListViewItemTemplateDirective, ListViewNavigableDirective]
})
class ListViewRippleHostComponent {
    public readonly items: Task[] = [{ name: "Write" }, { name: "Review", done: true }];
    public readonly navigation = signal<Partial<NavigableOptions> | "">("");
}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("List item ripple", () => {
    let fixture: ComponentFixture<ListViewRippleHostComponent>;
    const items = (): HTMLLIElement[] => [...fixture.nativeElement.querySelectorAll("li[monaListItem]")];
    const layer = (element: Element): Element | null => element.querySelector(":scope > span[aria-hidden='true']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [ListViewRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(ListViewRippleHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    afterEach(() => {
        if (animateDescriptor) {
            Object.defineProperty(Element.prototype, "animate", animateDescriptor);
        } else {
            Reflect.deleteProperty(Element.prototype, "animate");
        }
    });

    it("should ripple an item that can be focused and activated", () => {
        const [write] = items();
        press(write.querySelector("span") as Element);
        expect(layer(write)).not.toBeNull();
    });

    it("should not ripple an item for a press on a button inside it", () => {
        const [write] = items();
        press(write.querySelector("button") as Element);
        expect(layer(write)).toBeNull();
    });

    it("should not ripple a disabled item", () => {
        const [, review] = items();
        press(review);
        expect(layer(review)).toBeNull();
    });

    it("should not ripple items of a list that can't be navigated or selected", async () => {
        fixture.componentInstance.navigation.set({ enabled: false });
        fixture.detectChanges();
        await fixture.whenStable();
        const [write] = items();
        press(write);
        expect(layer(write)).toBeNull();
    });
});
