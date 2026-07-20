import { CommonModule } from "@angular/common";
import { ApplicationRef, Component } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { BrowserModule, By } from "@angular/platform-browser";
import { MenuItemComponent } from "../../../menubar/components/menu-item/menu-item.component";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { SplitButtonComponent } from "./split-button.component";
import { ContextMenuComponent } from "../../../contextmenu/components/contextmenu/context-menu.component";

@Component({
    template: `
        <mona-split-button text="Split Button">
            <mona-menu-item text="Item 1"></mona-menu-item>
            <mona-menu-item text="Item 2" (menuClick)="onItemClick($event)"></mona-menu-item>
            <mona-menu-item text="Item 3">
                <mona-menu-item text="Item 3.1"></mona-menu-item>
                <mona-menu-item text="Item 3.2" (menuClick)="onItemClick($event)"></mona-menu-item>
                <mona-menu-item text="Item 3.3"></mona-menu-item>
            </mona-menu-item>
            @if (menuVisible) {
                <mona-menu-item text="Item 4"></mona-menu-item>
            }
        </mona-split-button>
    `,
    imports: [SplitButtonComponent, MenuItemComponent, CommonModule]
})
class TestHostComponent {
    public menuVisible: boolean = false;

    public constructor(public readonly appRef: ApplicationRef) {}

    public onItemClick(event: any): void {
        console.log(event);
    }
}

describe("SplitButtonComponent", () => {
    let component: SplitButtonComponent;
    let hostComponent: TestHostComponent;
    let fixture: ComponentFixture<SplitButtonComponent>;
    let hostFixture: ComponentFixture<TestHostComponent>;
    let appRef: ApplicationRef;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                SplitButtonComponent,
                TestHostComponent,
                CommonModule,
                BrowserModule,
                ContextMenuComponent,
                ButtonDirective
            ],
            providers: [ApplicationRef]
        });
        fixture = TestBed.createComponent(SplitButtonComponent);
        hostFixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        hostComponent = hostFixture.componentInstance;
        appRef = TestBed.inject(ApplicationRef);
        fixture.detectChanges();
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should use the input border for an outline split divider", () => {
        fixture.componentRef.setInput("look", "outline");
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(element.classList.contains("[&>button:not(:last-child)]:border-input-border")).toBe(true);
    });
});
