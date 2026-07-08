import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ImmutableSet } from "@mirei/ts-collections";
import { EditorService } from "../../services/editor.service";

import { EditorFontFamilyComponent } from "./editor-font-family.component";

describe("EditorFontFamilyComponent", () => {
    let component: EditorFontFamilyComponent;
    let fixture: ComponentFixture<EditorFontFamilyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorFontFamilyComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive").mockReturnValue(vi.fn()),
                            chain: vi.fn().mockReturnValue({
                                focus: vi.fn().mockReturnValue({
                                    setFontFamily: vi.fn().mockReturnValue({
                                        run: vi.fn()
                                    })
                                })
                            })
                        },
                        state: vi.fn(),
                        fonts: signal(ImmutableSet.create(["Arial", "Verdana"]))
                    }
                },
                provideAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorFontFamilyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
