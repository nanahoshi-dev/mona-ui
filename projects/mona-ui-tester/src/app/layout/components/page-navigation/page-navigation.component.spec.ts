import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it } from "vitest";
import { PageNavigationComponent } from "./page-navigation.component";
import { PageService } from "../../services/page.service";

describe("PageNavigationComponent", () => {
    let component: PageNavigationComponent;
    let fixture: ComponentFixture<PageNavigationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PageNavigationComponent],
            providers: [PageService, provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(PageNavigationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
