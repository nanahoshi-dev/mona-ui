import { ComponentFixture, TestBed } from "@angular/core/testing";
import { editorBaseVariants } from "../../styles/editor.mona.styles";

import { EditorComponent } from "./editor.component";

describe("EditorComponent", () => {
    let component: EditorComponent;
    let fixture: ComponentFixture<EditorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses neutral editor structure, selection, and semantic focus styling", () => {
        const host = fixture.nativeElement as HTMLElement;
        const editorClasses = editorBaseVariants();
        const toolbar = host.querySelector(":scope > div") as HTMLElement;

        expect(host.classList.contains("bg-surface")).toBe(true);
        expect(host.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
        expect(toolbar.classList.contains("bg-surface-muted")).toBe(true);
        expect(toolbar.classList.contains("border-b-border-subtle")).toBe(true);
        expect(editorClasses).toContain("[&_.selectedCell]:after:bg-active/70");
        expect(editorClasses).toContain("[&_table_td]:border-border-subtle");
        expect(editorClasses).not.toContain("[&_.selectedCell]:after:bg-primary");
    });
});
