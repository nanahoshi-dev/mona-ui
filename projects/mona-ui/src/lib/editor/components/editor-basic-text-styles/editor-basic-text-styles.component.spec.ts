import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorService } from "../../services/editor.service";

import { EditorBasicTextStylesComponent } from "./editor-basic-text-styles.component";

describe("EditorBasicTextStylesComponent", () => {
    let component: EditorBasicTextStylesComponent;
    let fixture: ComponentFixture<EditorBasicTextStylesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorBasicTextStylesComponent],
            providers: [
                {
                    provide: EditorService,
                    useValue: {
                        editor: {
                            isActive: vi.fn().mockName("Editor.isActive")
                        },
                        state: vi.fn(),
                        settings: signal({})
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditorBasicTextStylesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
