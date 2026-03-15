import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BreadcrumbItemComponent } from "../breadcrumb-item/breadcrumb-item.component";

import { BreadcrumbComponent } from "./breadcrumb.component";

@Component({
    template: `
        <mona-breadcrumb>
            @for (item of items(); track $index) {
                <mona-breadcrumb-item (itemClick)="onItemClick(item)">
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
            title: "Home"
        },
        {
            text: "Products",
            title: "Products"
        },
        {
            text: "Product 1",
            title: "First product"
        }
    ]);

    public onItemClick(item: unknown): void {
        console.log(item);
    }
}

describe("BreadcrumbComponent", () => {
    let component: BreadcrumbComponent;
    let hostComponent: TestHostComponent;
    let fixture: ComponentFixture<BreadcrumbComponent>;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BreadcrumbComponent, TestHostComponent]
        });
        fixture = TestBed.createComponent(BreadcrumbComponent);
        hostFixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        hostComponent = hostFixture.componentInstance;
        fixture.detectChanges();
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
