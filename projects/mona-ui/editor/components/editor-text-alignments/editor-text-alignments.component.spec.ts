import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorTextAlignmentsComponent } from "./editor-text-alignments.component";

describe("EditorTextAlignmentsComponent", () => {
    let component: EditorTextAlignmentsComponent;
    let fixture: ComponentFixture<EditorTextAlignmentsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorTextAlignmentsComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive")
                        },
                        state: vi.fn()
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorTextAlignmentsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
