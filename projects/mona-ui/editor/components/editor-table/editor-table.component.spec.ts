import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorTableComponent } from "./editor-table.component";

describe("EditorTableComponent", () => {
    let component: EditorTableComponent;
    let fixture: ComponentFixture<EditorTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorTableComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive").mockReturnValue(vi.fn()),
                            can: vi.fn().mockReturnValue({
                                addColumnAfter: vi.fn(),
                                addColumnBefore: vi.fn(),
                                addRowAfter: vi.fn(),
                                addRowBefore: vi.fn(),
                                deleteColumn: vi.fn(),
                                deleteRow: vi.fn(),
                                deleteTable: vi.fn(),
                                mergeCells: vi.fn(),
                                splitCell: vi.fn(),
                                toggleHeaderRow: vi.fn()
                            })
                        },
                        state: vi.fn()
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
