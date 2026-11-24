import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import type { MockInstance } from "vitest";
import { TileViewComponent } from "../components/tile-view/tile-view.component";
import { TileViewItemTemplateDirective } from "../directives/tile-view-item-template.directive";
import type { TileViewSelectionMode } from "../models/TileViewSelectionMode";

interface Photo {
    readonly id: number;
    readonly name: string;
}

const PHOTOS: Photo[] = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Photo ${i + 1}` }));

@Component({
    imports: [TileViewComponent, TileViewItemTemplateDirective],
    template: `
        <span id="photos-label">Photos</span>
        <mona-tile-view
            aria-labelledby="photos-label"
            itemKey="id"
            textField="name"
            [columns]="4"
            [items]="items()"
            [loading]="loading()"
            [selectionMode]="mode()"
            [(selectedKeys)]="selected">
            <ng-template monaTileViewItemTemplate let-photo>
                <span aria-hidden="true" class="picture"></span>
                <span>{{ photo.name }}</span>
            </ng-template>
        </mona-tile-view>
    `
})
class TileViewA11yHostComponent {
    public readonly items = signal<readonly Photo[]>(PHOTOS);
    public readonly loading = signal(false);
    public readonly mode = signal<TileViewSelectionMode>("multiple");
    public readonly selected = signal<readonly unknown[]>([2, 3]);
}

const AXE_OPTIONS: axe.RunOptions = {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
};

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    for (let pass = 0; pass < 3; pass++) {
        fixture.detectChanges();
        await fixture.whenStable();
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    }
    fixture.detectChanges();
}

async function violations(fixture: ComponentFixture<unknown>): Promise<string[]> {
    const results = await axe.run(fixture.nativeElement as HTMLElement, AXE_OPTIONS);
    // Rules that passed show the run reached the tiles; an empty run would also have no violations.
    expect(results.passes.some(rule => rule.id.startsWith("aria-"))).toBe(true);
    return results.violations.map(
        violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`
    );
}

describe("TileViewComponent accessibility", () => {
    let fixture: ComponentFixture<TileViewA11yHostComponent>;
    let host: TileViewA11yHostComponent;
    let root: HTMLElement;
    let clientHeight: MockInstance<() => number>;

    const listbox = (): HTMLElement => root.querySelector<HTMLElement>("cdk-virtual-scroll-viewport")!;

    beforeEach(async () => {
        clientHeight = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
            return this.tagName === "CDK-VIRTUAL-SCROLL-VIEWPORT" ? 464 : 0;
        });
        await TestBed.configureTestingModule({ imports: [TileViewA11yHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(TileViewA11yHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
    });

    afterEach(() => {
        root.remove();
        clientHeight.mockRestore();
    });

    it("has no violations as a multiple-selection listbox", async () => {
        expect(await violations(fixture)).toEqual([]);
    });

    it("has no violations with the focus on a tile", async () => {
        listbox().focus();
        listbox().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        await settle(fixture);

        expect(listbox().getAttribute("aria-activedescendant")).not.toBeNull();
        expect(await violations(fixture)).toEqual([]);
    });

    it("has no violations as a single-selection listbox", async () => {
        host.mode.set("single");
        host.selected.set([4]);
        await settle(fixture);

        expect(await violations(fixture)).toEqual([]);
    });

    it("has no violations as a plain list", async () => {
        host.mode.set("none");
        await settle(fixture);

        expect(await violations(fixture)).toEqual([]);
    });

    it("has no violations while empty or loading", async () => {
        host.items.set([]);
        await settle(fixture);
        expect(await violations(fixture)).toEqual([]);

        host.loading.set(true);
        await settle(fixture);
        expect(listbox().getAttribute("aria-busy")).toBe("true");
        expect(await violations(fixture)).toEqual([]);
    });
});
