import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorHistoryComponent } from "./editor-history.component";

describe("EditorHistoryComponent", () => {
    let component: EditorHistoryComponent;
    let fixture: ComponentFixture<EditorHistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorHistoryComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive"),
                            can: vi.fn().mockReturnValue({
                                undo: vi.fn(),
                                redo: vi.fn()
                            })
                        },
                        state: vi.fn()
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
