import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import type { GroupableOptions, PagerSettings } from "@nanahoshi/mona-ui/internal/list";
import { PagerComponent, PageSizeChangeEvent } from "@nanahoshi/mona-ui/pager";
import { ListViewComponent } from "../components/list-view/list-view.component";
import { ListViewGroupableDirective } from "../directives/list-view-groupable.directive";
import { ListViewHeaderTemplateDirective } from "../directives/list-view-header-template.directive";
import { ListViewPageableDirective } from "../directives/list-view-pageable.directive";
import { ListViewSelectableDirective } from "../directives/list-view-selectable.directive";

interface Person {
    readonly name: string;
    readonly since: Date;
    readonly team: string;
    readonly unavailable?: boolean;
}

@Component({
    imports: [ListViewComponent, ListViewHeaderTemplateDirective],
    template: `
        <mona-list-view aria-label="Outer" [items]="outer()" [height]="''">
            <ng-template monaListViewHeaderTemplate>
                <mona-list-view aria-label="Inner" [items]="inner()" [height]="''"></mona-list-view>
            </ng-template>
        </mona-list-view>
    `
})
class NestedHostComponent {
    public readonly inner = signal(["x"]);
    public readonly outer = signal(["a", "b", "c"]);
}

@Component({
    imports: [ListViewComponent],
    template: `
        <mona-list-view
            aria-label="Letters"
            [items]="items()"
            [height]="''"
            [disabledBy]="'unavailable'"
            [textField]="'name'"
            (itemActivate)="activated.push($event)"
            (scrollBottom)="bottoms = bottoms + 1"></mona-list-view>
    `
})
class DataHostComponent {
    public readonly activated: Person[] = [];
    public readonly items = signal<Person[]>([]);
    public bottoms = 0;
}

@Component({
    imports: [ListViewComponent, ListViewGroupableDirective],
    template: `
        <mona-list-view
            aria-label="People"
            [items]="items"
            [height]="''"
            [textField]="'name'"
            [monaListViewGroupable]="options()"
            [groupBy]="'since'"></mona-list-view>
    `
})
class GroupedHostComponent {
    public readonly items: Person[] = [
        { name: "Ann", since: new Date(2024, 0, 1), team: "a" },
        { name: "Bob", since: new Date(2024, 0, 2), team: "a" },
        { name: "Cem", since: new Date(2024, 0, 1), team: "b" },
        { name: "Dan", since: new Date(2024, 0, 2), team: "b" }
    ];
    public readonly options = signal<GroupableOptions<Person> | "">("");
}

@Component({
    imports: [ListViewComponent, ListViewPageableDirective, ListViewSelectableDirective],
    template: `
        <mona-list-view
            aria-label="Numbers"
            [items]="items"
            [height]="''"
            [monaListViewPageable]="options()"
            [(page)]="page"
            [(pageSize)]="pageSize"
            (pageSizeSelect)="onPageSizeSelect($event)"></mona-list-view>
    `
})
class PagedHostComponent {
    public readonly items = Array.from({ length: 30 }, (_, index) => index + 1);
    public readonly options = signal<Partial<PagerSettings>>({ pageSize: 10 });
    public readonly page = signal(1);
    public readonly pageSize = signal<number | undefined>(undefined);
    public readonly selected: number[] = [];
    public preventSize = false;

    public onPageSizeSelect(event: PageSizeChangeEvent): void {
        this.selected.push(event.newPageSize);
        if (this.preventSize) {
            event.preventDefault();
        }
    }
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

/** Texts of a list's own items (not those of a list nested in its templates). */
function optionTexts(root: HTMLElement, label: string): string[] {
    const list = root.querySelector(`mona-list ul[aria-label='${label}']`);
    const owner = list?.closest("mona-list");
    return Array.from(list?.querySelectorAll<HTMLElement>("li[data-uid]") ?? [])
        .filter(item => item.closest("mona-list") === owner)
        .map(item => item.textContent?.trim() ?? "");
}

/** Texts of the group headers, read through each group's `aria-labelledby`. */
function groupHeaders(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll("mona-list ul[aria-labelledby]")).map(
        group => document.getElementById(group.getAttribute("aria-labelledby") ?? "")?.textContent?.trim() ?? ""
    );
}

describe("list view data", () => {
    describe("its list service", () => {
        it("keeps a nested list view's data apart from its own", async () => {
            const fixture = TestBed.createComponent(NestedHostComponent);
            await settle(fixture);
            const root = fixture.nativeElement as HTMLElement;

            expect(optionTexts(root, "Outer")).toEqual(["a", "b", "c"]);
            expect(optionTexts(root, "Inner")).toEqual(["x"]);

            fixture.componentInstance.inner.set(["y", "z"]);
            await settle(fixture);
            expect(optionTexts(root, "Outer")).toEqual(["a", "b", "c"]);
            expect(optionTexts(root, "Inner")).toEqual(["y", "z"]);
        });
    });

    describe("items", () => {
        let fixture: ComponentFixture<DataHostComponent>;
        let host: DataHostComponent;

        beforeEach(async () => {
            fixture = TestBed.createComponent(DataHostComponent);
            host = fixture.componentInstance;
            await settle(fixture);
        });

        it("shows equal items more than once", async () => {
            const ann: Person = { name: "Ann", since: new Date(2024, 0, 1), team: "a" };
            host.items.set([ann, ann, { ...ann, name: "Bob" }]);
            await settle(fixture);

            expect(optionTexts(fixture.nativeElement as HTMLElement, "Letters")).toEqual(["Ann", "Ann", "Bob"]);
        });

        it("marks disabled items and only activates enabled ones", async () => {
            host.items.set([
                { name: "Ann", since: new Date(), team: "a" },
                { name: "Bob", since: new Date(), team: "a", unavailable: true }
            ]);
            await settle(fixture);
            const options = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>("li[data-uid]");

            expect(options[0].getAttribute("data-disabled")).toBe("false");
            expect(options[1].getAttribute("data-disabled")).toBe("true");

            options[1].click();
            options[0].click();
            options[0].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
            expect(host.activated.map(person => person.name)).toEqual(["Ann", "Ann"]);
        });

        it("reports reaching the bottom once per arrival, for items that arrive after the first render", async () => {
            host.items.set(
                Array.from({ length: 5 }, (_, index) => ({ name: `P${index}`, since: new Date(), team: "a" }))
            );
            await settle(fixture);
            const list = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>("mona-list > ul");
            expect(list).not.toBeNull();
            if (!list) {
                return;
            }
            Object.defineProperties(list, {
                clientHeight: { configurable: true, value: 100 },
                scrollHeight: { configurable: true, value: 300 }
            });
            const scrollTo = (top: number): void => {
                list.scrollTop = top;
                list.dispatchEvent(new Event("scroll"));
            };

            scrollTo(200);
            scrollTo(199);
            expect(host.bottoms).toBe(1);

            scrollTo(100);
            scrollTo(200);
            expect(host.bottoms).toBe(2);
        });
    });

    describe("grouping", () => {
        it("puts equal dates in one group with a localized header", async () => {
            const fixture = TestBed.createComponent(GroupedHostComponent);
            await settle(fixture);
            const headers = groupHeaders(fixture.nativeElement as HTMLElement);
            const format = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

            expect(headers).toEqual([format.format(new Date(2024, 0, 1)), format.format(new Date(2024, 0, 2))]);
            expect(optionTexts(fixture.nativeElement as HTMLElement, "People")).toEqual(["Ann", "Cem", "Bob", "Dan"]);
        });

        it("orders date groups by time and takes header text from the options", async () => {
            const fixture = TestBed.createComponent(GroupedHostComponent);
            fixture.componentInstance.options.set({
                headerOrder: "desc",
                headerText: value => `Since ${(value as Date).getDate()}`
            });
            await settle(fixture);
            const headers = groupHeaders(fixture.nativeElement as HTMLElement);

            expect(headers).toEqual(["Since 2", "Since 1"]);
        });
    });

    describe("paging", () => {
        let fixture: ComponentFixture<PagedHostComponent>;
        let host: PagedHostComponent;
        let pager: PagerComponent;

        beforeEach(async () => {
            fixture = TestBed.createComponent(PagedHostComponent);
            host = fixture.componentInstance;
            await settle(fixture);
            pager = fixture.debugElement.query(By.directive(PagerComponent)).componentInstance as PagerComponent;
        });

        it("passes the pager type", async () => {
            host.options.set({ pageSize: 10, type: "input" });
            await settle(fixture);

            expect(pager.type()).toBe("input");
        });

        it("applies a bound page size and keeps the first item in view", async () => {
            host.page.set(3);
            await settle(fixture);
            host.pageSize.set(25);
            await settle(fixture);

            expect(host.page()).toBe(1);
            expect(pager.pageSize()).toBe(25);
            expect(optionTexts(fixture.nativeElement as HTMLElement, "Numbers")[0]).toBe("1");
        });

        it("reports the page size the user picks, and lets the pick be canceled", async () => {
            const select = new PageSizeChangeEvent(20, 10);
            pager.pageSizeSelect.emit(select);
            pager.pageChange.emit({ page: 1, skip: 0, take: 20 });
            await settle(fixture);

            expect(host.selected).toEqual([20]);
            expect(host.pageSize()).toBe(20);

            host.preventSize = true;
            const canceled = new PageSizeChangeEvent(5, 20);
            pager.pageSizeSelect.emit(canceled);
            expect(canceled.isDefaultPrevented()).toBe(true);
        });
    });
});
