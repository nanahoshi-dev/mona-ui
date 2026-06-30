import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SplitterPaneComponent } from "../components/splitter-pane/splitter-pane.component";
import { SplitterComponent } from "../components/splitter/splitter.component";
import { SplitterPaneStyleDirective } from "./splitter-pane-style.directive";

describe("SplitterPaneStyleDirective", () => {
    let directive: SplitterPaneStyleDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SplitterPaneStyleDirective]
        });
        directive = TestBed.runInInjectionContext(() => new SplitterPaneStyleDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});

@Component({
    template: `
        <mona-splitter class="h-64 w-full">
            <mona-splitter-pane [size]="'200px'">Pane 1</mona-splitter-pane>
            <mona-splitter-pane [size]="'1fr'">Pane 2</mona-splitter-pane>
            <mona-splitter-pane [size]="'2fr'">Pane 3</mona-splitter-pane>
        </mona-splitter>
    `,
    imports: [SplitterComponent, SplitterPaneComponent]
})
class FractionalSizeHostComponent {}

describe("SplitterPaneStyleDirective fractional sizing", () => {
    let hostFixture: ComponentFixture<FractionalSizeHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FractionalSizeHostComponent]
        }).compileComponents();

        hostFixture = TestBed.createComponent(FractionalSizeHostComponent);
        hostFixture.detectChanges();
    });

    it("treats an 'fr' size as a weighted flex-grow share with zero flex-basis", () => {
        const paneElements = hostFixture.nativeElement.querySelectorAll("[data-pid]") as NodeListOf<HTMLElement>;
        expect(paneElements.length).toBe(3);

        const [fixedPane, fractionalPaneOne, fractionalPaneTwo] = Array.from(paneElements);

        expect(fixedPane.style.flexBasis).toBe("200px");
        expect(fixedPane.style.flexGrow).toBe("0");

        expect(fractionalPaneOne.style.flexBasis).toBe("0px");
        expect(fractionalPaneOne.style.flexGrow).toBe("1");

        expect(fractionalPaneTwo.style.flexBasis).toBe("0px");
        expect(fractionalPaneTwo.style.flexGrow).toBe("2");
    });
});
