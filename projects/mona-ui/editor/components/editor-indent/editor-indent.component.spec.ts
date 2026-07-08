import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorIndentComponent } from "./editor-indent.component";

describe("EditorIndentComponent", () => {
    let component: EditorIndentComponent;
    let fixture: ComponentFixture<EditorIndentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorIndentComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive"),
                            can: vi.fn().mockReturnValue({
                                indent: vi.fn(),
                                outdent: vi.fn()
                            })
                        },
                        state: vi.fn()
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorIndentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
