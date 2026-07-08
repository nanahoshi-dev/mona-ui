import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PageSizeChangeEvent } from "../../../pager/models/PageSizeChangeEvent";
import { ListService } from "@mirei/mona-ui/internal/list";
import { PagerComponent } from "../../../pager/components/pager/pager.component";
import { ListViewFooterTemplateDirective } from "../../directives/list-view-footer-template.directive";
import { ListViewHeaderTemplateDirective } from "../../directives/list-view-header-template.directive";
import { ListViewItemTemplateDirective } from "../../directives/list-view-item-template.directive";
import { ListViewNavigableDirective } from "../../directives/list-view-navigable.directive";
import { ListViewNoDataTemplateDirective } from "../../directives/list-view-no-data-template.directive";

import { ListViewComponent } from "./list-view.component";

describe("ListViewComponent", () => {
    let component: ListViewComponent;
    let fixture: ComponentFixture<ListViewComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ListViewComponent, PagerComponent]
        });
        fixture = TestBed.createComponent(ListViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should update the page and skip in the list service on page change", () => {
        const listService = (component as any).listService as ListService<unknown>;
        (component as any).onPageChange({ page: 3, skip: 20, take: 10 });
        expect(listService.pageState()).toEqual(expect.objectContaining({ page: 3, skip: 20 }));
    });

    it("should reset the page and skip and apply the new page size on page size change", () => {
        const listService = (component as any).listService as ListService<unknown>;
        listService.pageState.set({ page: 3, skip: 20, take: 10 });
        (component as any).onPageSizeChange(new PageSizeChangeEvent(25, 10));
        expect(listService.pageState()).toEqual({ page: 1, skip: 0, take: 25 });
    });

    it("should not display the item template's directive when no template is provided", () => {
        expect((component as any).itemTemplate()).toBeUndefined();
    });
});

@Component({
    imports: [
        ListViewComponent,
        ListViewHeaderTemplateDirective,
        ListViewFooterTemplateDirective,
        ListViewItemTemplateDirective
    ],
    template: `
        <mona-list-view [items]="items" [height]="'200px'">
            <ng-template monaListViewHeaderTemplate>
                <div class="test-header">header content</div>
            </ng-template>
            <ng-template monaListViewFooterTemplate>
                <div class="test-footer">footer content</div>
            </ng-template>
            <ng-template monaListViewItemTemplate let-item>
                <span class="test-item">{{ item.name }}</span>
            </ng-template>
        </mona-list-view>
    `
})
class ProjectionTestComponent {
    protected readonly items = [{ name: "one" }, { name: "two" }];
}

describe("ListViewComponent projected templates", () => {
    let fixture: ComponentFixture<ProjectionTestComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProjectionTestComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(ProjectionTestComponent);
        fixture.detectChanges();
    });

    it("should render the projected header, footer, and item templates", () => {
        const element: HTMLElement = fixture.nativeElement;
        expect(element.querySelector(".test-header")?.textContent).toContain("header content");
        expect(element.querySelector(".test-footer")?.textContent).toContain("footer content");
        const itemTexts = Array.from(element.querySelectorAll(".test-item")).map(el => el.textContent?.trim());
        expect(itemTexts).toEqual(["one", "two"]);
    });
});

@Component({
    imports: [ListViewComponent, ListViewNoDataTemplateDirective],
    template: `
        <mona-list-view [items]="items">
            <ng-template monaListViewNoDataTemplate>
                <div class="test-no-data">nothing to show</div>
            </ng-template>
        </mona-list-view>
    `
})
class NoDataProjectionTestComponent {
    protected readonly items: unknown[] = [];
}

describe("ListViewComponent no-data template", () => {
    let fixture: ComponentFixture<NoDataProjectionTestComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NoDataProjectionTestComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(NoDataProjectionTestComponent);
        fixture.detectChanges();
    });

    it("should render the projected no-data template when there are no items", () => {
        const element: HTMLElement = fixture.nativeElement;
        expect(element.querySelector(".test-no-data")?.textContent).toContain("nothing to show");
    });
});

@Component({
    imports: [ListViewComponent],
    providers: [ListService],
    template: ` <mona-list-view [items]="items" textField="name" [height]="'100px'"></mona-list-view> `
})
class ScrollBottomTestComponent {
    protected readonly items = Array.from({ length: 50 }, (_, i) => ({ name: `item-${i}` }));
}

describe("ListViewComponent scrollBottom", () => {
    let fixture: ComponentFixture<ScrollBottomTestComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ScrollBottomTestComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(ScrollBottomTestComponent);
        fixture.detectChanges();
    });

    function getListElement(): HTMLElement {
        const element: HTMLElement = fixture.nativeElement.querySelector("mona-list > ul");
        Object.defineProperty(element, "scrollHeight", { value: 1000, configurable: true });
        Object.defineProperty(element, "clientHeight", { value: 100, configurable: true });
        Object.defineProperty(element, "scrollTop", { value: 900, configurable: true, writable: true });
        return element;
    }

    it("should emit scrollBottom exactly once per scroll-to-bottom event", () => {
        const listViewDebugElement = fixture.debugElement.children[0];
        const listViewComponent: ListViewComponent = listViewDebugElement.componentInstance;
        const emitted: Event[] = [];
        listViewComponent.scrollBottom.subscribe(event => emitted.push(event));

        const element = getListElement();
        element.dispatchEvent(new Event("scroll"));
        fixture.detectChanges();

        expect(emitted.length).toBe(1);
    });

    it("should not accumulate duplicate scroll listeners when virtualScrollOptions changes", () => {
        const listViewDebugElement = fixture.debugElement.children[0];
        const listViewComponent: ListViewComponent = listViewDebugElement.componentInstance;
        const listService = (listViewComponent as any).listService as ListService<unknown>;
        const emitted: Event[] = [];
        listViewComponent.scrollBottom.subscribe(event => emitted.push(event));

        listService.setVirtualScrollOptions({ enabled: false });
        fixture.detectChanges();
        listService.setVirtualScrollOptions({ enabled: false });
        fixture.detectChanges();

        const element = getListElement();
        element.dispatchEvent(new Event("scroll"));
        fixture.detectChanges();

        expect(emitted.length).toBe(1);
    });
});

@Component({
    imports: [ListViewComponent, ListViewNavigableDirective],
    providers: [ListService],
    template: `
        <mona-list-view
            [items]="data"
            textField="name"
            [monaListViewNavigable]="{ mode: 'highlight' }"></mona-list-view>
    `
})
class NavigableTestComponent {
    protected readonly data = [{ name: "one" }, { name: "two" }, { name: "three" }];
}

describe("ListViewComponent keyboard navigation", () => {
    let fixture: ComponentFixture<NavigableTestComponent>;
    let listService: ListService<unknown>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NavigableTestComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(NavigableTestComponent);
        listService = fixture.debugElement.children[0].injector.get(ListService);
        fixture.detectChanges();
    });

    it("should keep the list as a single Tab stop via roving tabindex, not the container plus every option", () => {
        const element: HTMLElement = fixture.nativeElement;
        const listHost = element.querySelector("mona-list") as HTMLElement;
        const options = Array.from(element.querySelectorAll("li[monaListItem]"));

        // The container defers to the roving-tabindex item once one exists.
        expect(listHost.getAttribute("tabindex")).toBe("-1");

        const tabbableOptions = options.filter(option => option.getAttribute("tabindex") === "0");
        expect(tabbableOptions.length).toBe(1);
        options
            .filter(option => option !== tabbableOptions[0])
            .forEach(option => expect(option.getAttribute("tabindex")).toBe("-1"));
    });

    it("should move the highlighted item with arrow key navigation", () => {
        const listHost: HTMLElement = fixture.nativeElement.querySelector("mona-list");
        listHost.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        fixture.detectChanges();

        expect(listService.highlightedItem()?.data).toEqual({ name: "two" });
    });
});
