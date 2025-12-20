import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BreadcrumbItem } from "../../models/BreadcrumbItem";

import { BreadcrumbComponent } from "./breadcrumb.component";

@Component({
    template: ` <mona-breadcrumb [items]="items" (itemClick)="onItemClick($event)"></mona-breadcrumb> `,
    imports: [BreadcrumbComponent]
})
class TestHostComponent {
    public items: BreadcrumbItem[] = [
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
    ];

    public onItemClick(item: BreadcrumbItem): void {
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
