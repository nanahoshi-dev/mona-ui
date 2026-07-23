import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CardFooterComponent } from "./card-footer.component";

describe("CardFooterComponent", () => {
    let component: CardFooterComponent;
    let fixture: ComponentFixture<CardFooterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CardFooterComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CardFooterComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
