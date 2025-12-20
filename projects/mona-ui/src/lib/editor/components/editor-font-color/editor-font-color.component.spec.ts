import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { EditorService } from "../../services/editor.service";

import { EditorFontColorComponent } from "./editor-font-color.component";

describe("EditorFontColorComponent", () => {
    let component: EditorFontColorComponent;
    let fixture: ComponentFixture<EditorFontColorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorFontColorComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive").mockReturnValue(vi.fn()),
                            getAttributes: vi.fn().mockName("Editor.getAttributes").mockReturnValue(vi.fn().mockReturnValue({}))
                        },
                        state: vi.fn()
                    }
                },
                provideAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorFontColorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
