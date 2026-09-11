import { CommonModule } from "@angular/common";
import { ApplicationRef, Component } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { BrowserModule, By } from "@angular/platform-browser";
import { MenuItemComponent } from "../../../menubar/components/menu-item/menu-item.component";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
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
        expect(element.classList.contains("[&>button:not(:last-child)]:border-e")).toBe(true);
    });

    it("applies logical border radiuses and border reset to inner buttons", () => {
        const buttons = fixture.nativeElement.querySelectorAll("button");
        expect(buttons[0].classList.contains("rounded-e-none")).toBe(true);
        expect(buttons[1].classList.contains("rounded-s-none")).toBe(true);
        expect(buttons[1].classList.contains("border-s-0")).toBe(true);
    });

    describe("i18n", () => {
        it("renders default English aria labels for main and menu buttons", () => {
            fixture.componentRef.setInput("text", "Save");
            fixture.detectChanges();

            const buttons = fixture.nativeElement.querySelectorAll("button");
            expect(buttons[0].getAttribute("aria-label")).toBe("Save splitbutton");
            expect(buttons[1].getAttribute("aria-label")).toBe("Show menu options");
        });

        it("allows consumer inputs to override default aria labels", () => {
            fixture.componentRef.setInput("text", "Save");
            fixture.componentRef.setInput("aria-label", "Custom action");
            fixture.componentRef.setInput("menuButtonAriaLabel", "Custom menu");
            fixture.detectChanges();

            const buttons = fixture.nativeElement.querySelectorAll("button");
            expect(buttons[0].getAttribute("aria-label")).toBe("Custom action");
            expect(buttons[1].getAttribute("aria-label")).toBe("Custom menu");
        });

        it("updates aria labels dynamically when locale changes", () => {
            fixture.componentRef.setInput("text", "Kaydet");
            fixture.detectChanges();

            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({
                direction: "ltr",
                id: "tr-TR",
                messages: {
                    splitButton: {
                        menuButtonAriaLabel: "Menü seçeneklerini göster",
                        splitButton: (text: string) => `${text} ayrık düğme`
                    }
                }
            });
            fixture.detectChanges();

            const buttons = fixture.nativeElement.querySelectorAll("button");
            expect(buttons[0].getAttribute("aria-label")).toBe("Kaydet ayrık düğme");
            expect(buttons[1].getAttribute("aria-label")).toBe("Menü seçeneklerini göster");
        });
    });
});
