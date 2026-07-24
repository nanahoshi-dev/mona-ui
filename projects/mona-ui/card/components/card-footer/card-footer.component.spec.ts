import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CardService } from "../../services/card.service";
import { CardFooterComponent } from "./card-footer.component";

@Component({
    imports: [CardFooterComponent],
    template: `
        <mona-card-footer class="footer-class">
            <button type="button">Accept</button>
        </mona-card-footer>
    `
})
class TestHostComponent {
    public readonly footer = viewChild.required(CardFooterComponent);
}

describe("CardFooterComponent", () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let service: CardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [CardService]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        service = TestBed.inject(CardService);
        hostFixture.detectChanges();
        await hostFixture.whenStable();
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostFixture.componentInstance.footer()).toBeTruthy();
    });

    it("publishes its template and class to the service", () => {
        expect(service.footerTemplate()).toBeTruthy();
        expect(service.footerClass()).toBe("footer-class");
    });

    it("resets the published slot on destroy", () => {
        hostFixture.destroy();

        expect(service.footerTemplate()).toBeNull();
        expect(service.footerClass()).toBeNull();
    });
});
