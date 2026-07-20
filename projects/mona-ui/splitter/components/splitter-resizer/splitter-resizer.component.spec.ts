import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SplitterPaneComponent } from "../splitter-pane/splitter-pane.component";
import { SplitterComponent } from "../splitter/splitter.component";

@Component({
    template: `
        <mona-splitter>
            <mona-splitter-pane> Pane 1</mona-splitter-pane>
            <mona-splitter-pane> Pane 2</mona-splitter-pane>
        </mona-splitter>
    `,
    styles: "",
    imports: [SplitterComponent, SplitterPaneComponent]
})
class TestHostComponent {}

describe("SplitterResizerComponent", () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SplitterComponent, SplitterPaneComponent, TestHostComponent]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });

    it("uses a quiet neutral separator with a semantic keyboard focus indicator", () => {
        const resizer = hostFixture.nativeElement.querySelector("mona-splitter-resizer") as HTMLElement;

        expect(resizer.classList.contains("bg-border-subtle")).toBe(true);
        expect(resizer.classList.contains("hover:bg-border-control")).toBe(true);
        expect(resizer.classList.contains("active:bg-border-control-hover")).toBe(true);
        expect(resizer.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(resizer.classList.contains("bg-accent")).toBe(false);
        expect(resizer.classList.contains("focus-visible:bg-primary")).toBe(false);
    });
});
