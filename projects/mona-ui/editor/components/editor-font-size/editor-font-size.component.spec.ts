import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableSet } from "@mirei/ts-collections";
import { EditorService } from "../../services/editor.service";

import { EditorFontSizeComponent } from "./editor-font-size.component";

describe("EditorFontSizeComponent", () => {
    let component: EditorFontSizeComponent;
    let fixture: ComponentFixture<EditorFontSizeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorFontSizeComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive")
                        },
                        state: vi.fn(),
                        fontSizes: signal(ImmutableSet.create(["16px", "24px"]))
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorFontSizeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
