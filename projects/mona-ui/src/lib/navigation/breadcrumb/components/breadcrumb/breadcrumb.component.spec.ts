import { Component, signal } from "@angular/core";
import { describe, beforeEach, it } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BreadcrumbItemComponent } from "../breadcrumb-item/breadcrumb-item.component";

import { BreadcrumbComponent } from "./breadcrumb.component";

@Component({
    template: `
        <mona-breadcrumb>
            @for (item of items(); track $index) {
                <mona-breadcrumb-item [disabled]="item.disabled" (itemClick)="onItemClick(item)">
                    <span [title]="item.title">{{ item.text }}</span>
                </mona-breadcrumb-item>
            }
        </mona-breadcrumb>
    `,
    imports: [BreadcrumbComponent, BreadcrumbItemComponent]
})
class TestHostComponent {
    public readonly items = signal([
        {
            text: "Home",
            title: "Home",
            disabled: false
        },
        {
            text: "Products",
            title: "Products",
            disabled: false
        },
        {
            text: "Product 1",
            title: "First product",
            disabled: false
        }
    ]);
    public readonly clickedItems: unknown[] = [];

    public onItemClick(item: unknown): void {
        this.clickedItems.push(item);
    }
}

describe("BreadcrumbComponent", () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();
        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        const breadcrumb = hostFixture.debugElement.query(By.directive(BreadcrumbComponent));
        expect(breadcrumb).toBeTruthy();
    });

    describe("Rendering", () => {
        it("should render interactive spans for non-last items", () => {
            const items = hostFixture.debugElement.queryAll(By.css("button[monaBreadcrumbItem]"));
            expect(items.length).toBe(2);
        });

        it("should render a plain span for the last item", () => {
            const lastItem = hostFixture.debugElement.query(By.css("span[aria-current='page']"));
            expect(lastItem).toBeTruthy();
        });

        it("should render separators between items but not after the last", () => {
            const separators = hostFixture.debugElement.queryAll(By.css("li[aria-hidden='true']"));
            expect(separators.length).toBe(2);
        });
    });

    describe("Accessibility", () => {
        it("should have role='navigation' on the host element", () => {
            const host = hostFixture.debugElement.query(By.directive(BreadcrumbComponent));
            expect(host.nativeElement.getAttribute("role")).toBe("navigation");
        });

        it("should have aria-label='Breadcrumb' on the host element", () => {
            const host = hostFixture.debugElement.query(By.directive(BreadcrumbComponent));
            expect(host.nativeElement.getAttribute("aria-label")).toBe("Breadcrumb");
        });

        it("should set aria-current='page' on the last item only", () => {
            const interactiveItems = hostFixture.debugElement.queryAll(By.css("button[monaBreadcrumbItem]"));
            for (const item of interactiveItems) {
                expect(item.nativeElement.getAttribute("aria-current")).toBeNull();
            }
            const lastItem = hostFixture.debugElement.query(By.css("span[aria-current='page']"));
            expect(lastItem.nativeElement.getAttribute("aria-current")).toBe("page");
        });

        it("should set the disabled attribute on disabled items", () => {
            hostComponent.items.update(items =>
                items.map((item, index) => (index === 0 ? { ...item, disabled: true } : item))
            );
            hostFixture.detectChanges();
            const items = hostFixture.debugElement.queryAll(By.css("button[monaBreadcrumbItem]"));
            expect(items[0].nativeElement.disabled).toBe(true);
            expect(items[1].nativeElement.disabled).toBe(false);
        });

        it("should hide separator elements from accessibility tree", () => {
            const separators = hostFixture.debugElement.queryAll(By.css("li[aria-hidden='true']"));
            for (const sep of separators) {
                expect(sep.nativeElement.getAttribute("role")).toBe("presentation");
            }
        });

        it("should not have role='link' on any <li> element", () => {
            const listItems = hostFixture.debugElement.queryAll(By.css("li"));
            for (const li of listItems) {
                expect(li.nativeElement.getAttribute("role")).not.toBe("link");
            }
        });
    });

    describe("Keyboard Navigation", () => {
        it("should keep non-disabled interactive items focusable", () => {
            const items = hostFixture.debugElement.queryAll(By.css("button[monaBreadcrumbItem]"));
            for (const item of items) {
                item.nativeElement.focus();
                expect(hostFixture.nativeElement.ownerDocument.activeElement).toBe(item.nativeElement);
            }
        });

        it("should remove disabled items from the tab order", () => {
            hostComponent.items.update(items =>
                items.map((item, index) => (index === 1 ? { ...item, disabled: true } : item))
            );
            hostFixture.detectChanges();
            const items = hostFixture.debugElement.queryAll(By.css("button[monaBreadcrumbItem]"));
            items[1].nativeElement.focus();
            expect(hostFixture.nativeElement.ownerDocument.activeElement).not.toBe(items[1].nativeElement);
        });

    });

    describe("Click Behavior", () => {
        it("should emit itemClick on click", () => {
            const items = hostFixture.debugElement.queryAll(By.css("button[monaBreadcrumbItem]"));
            items[0].nativeElement.click();
            hostFixture.detectChanges();
            expect(hostComponent.clickedItems.length).toBe(1);
        });

        it("should not emit itemClick when clicking a disabled item", () => {
            hostComponent.items.update(items =>
                items.map((item, index) => (index === 0 ? { ...item, disabled: true } : item))
            );
            hostFixture.detectChanges();
            const items = hostFixture.debugElement.queryAll(By.css("button[monaBreadcrumbItem]"));
            items[0].nativeElement.click();
            hostFixture.detectChanges();
            expect(hostComponent.clickedItems.length).toBe(0);
        });

        it("should not emit itemClick when clicking the last item", () => {
            const lastItem = hostFixture.debugElement.query(By.css("span[aria-current='page']"));
            lastItem.nativeElement.click();
            hostFixture.detectChanges();
            expect(hostComponent.clickedItems.length).toBe(0);
        });
    });
});
