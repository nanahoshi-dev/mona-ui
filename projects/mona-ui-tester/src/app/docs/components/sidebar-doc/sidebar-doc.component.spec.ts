import { provideHttpClient } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideMarkdown } from "ngx-markdown";

import { PageService } from "../../../layout/services/page.service";
import { SidebarDocComponent } from "./sidebar-doc.component";

describe("SidebarDocComponent", () => {
    let component: SidebarDocComponent;
    let fixture: ComponentFixture<SidebarDocComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarDocComponent],
            // The page now renders written documentation alongside the demo. `app-markdown-doc`
            // fetches it and registers its headings with the page it is on, so the markdown renderer
            // and the section registry both have to exist — the page component supplies the latter in
            // the running app.
            providers: [provideHttpClient(), provideMarkdown(), PageService]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarDocComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
