import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorFontHighlightComponent } from "./editor-font-highlight.component";

describe("EditorFontHighlightComponent", () => {
    let component: EditorFontHighlightComponent;
    let fixture: ComponentFixture<EditorFontHighlightComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorFontHighlightComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive")
                        },
                        state: signal({
                            selection: {
                                empty: vi.fn(),
                                from: vi.fn(),
                                $from: {
                                    marks: vi.fn().mockReturnValue([])
                                }
                            }
                        })
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorFontHighlightComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
