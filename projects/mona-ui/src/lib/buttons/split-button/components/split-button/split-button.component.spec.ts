import { CommonModule } from "@angular/common";
import { ApplicationRef, Component } from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { BrowserModule, By } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ContextMenuComponent } from "../../../../menus/contextmenu/components/contextmenu/contextmenu.component";
import { MenuItemComponent } from "../../../../menus/menubar/components/menu-item/menu-item.component";
import { ButtonDirective } from "../../../button/directives/button.directive";

import { SplitButtonComponent } from "./split-button.component";

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
            providers: [ApplicationRef, provideAnimations()]
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

    it("should have a menu icon", () => {
        const buttons = fixture.debugElement
            .queryAll(By.css("button"))
            .map(button => button.nativeElement) as HTMLButtonElement[];
        expect(buttons.length).toBe(2);
        expect(buttons[1].querySelector("lucide-angular")).not.toBeNull();
    });

    it("should have the text 'Split Button'", () => {
        const buttons = hostFixture.debugElement
            .queryAll(By.css("button"))
            .map(button => button.nativeElement) as HTMLButtonElement[];
        expect(buttons.length).toBe(2);
        expect(buttons[0].textContent).toBe("Split Button");
    });

    it("should show the menu when the menu icon is clicked", fakeAsync(() => {
        const buttons = hostFixture.debugElement
            .queryAll(By.css("button"))
            .map(button => button.nativeElement) as HTMLButtonElement[];
        expect(buttons.length).toBe(2);
        buttons[1].click();
        appRef.tick();
        tick();

        const menu = document.querySelector("mona-contextmenu-content ul");
        expect(menu).not.toBeNull();
        const menuItems = menu?.querySelectorAll("li.mona-contextmenu-list-item");
        expect(menuItems?.length).toBe(3);
        expect(menuItems?.item(0)?.textContent).toBe("Item 1");
        expect(menuItems?.item(1)?.textContent).toBe("Item 2");
        expect(menuItems?.item(2)?.textContent).toBe("Item 3");
    }));
});
