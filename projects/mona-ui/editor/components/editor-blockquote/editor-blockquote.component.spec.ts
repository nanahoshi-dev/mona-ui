import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorBlockquoteComponent } from "./editor-blockquote.component";

describe("EditorBlockquoteComponent", () => {
    let component: EditorBlockquoteComponent;
    let fixture: ComponentFixture<EditorBlockquoteComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorBlockquoteComponent],
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

        fixture = TestBed.createComponent(EditorBlockquoteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
