import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createNotificationStyleStrategy,
    NOTIFICATION_STYLE_STRATEGY,
    provideNotificationStyles
} from "./notification.styles";

describe("notification style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createNotificationStyleStrategy();

        const mona = strategy.resolve("mona").base();
        const reina = strategy.resolve("reina").base();

        expect(reina).not.toBe(mona);
        expect(reina).toContain("border-input-border");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createNotificationStyleStrategy([
            {
                base: { base: "provider-notification-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const bodyClasses = strategy.resolve("mona").body();

        expect(baseClasses).toContain("provider-notification-base");
        expect(bodyClasses).not.toContain("provider-notification-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createNotificationStyleStrategy([
            {
                theme: "reina",
                icon: { type: { error: "reina-provider-error-icon" } }
            }
        ]);

        expect(strategy.resolve("mona").icon({ type: "error" })).not.toContain("reina-provider-error-icon");
        expect(strategy.resolve("reina").icon({ type: "error" })).toContain("reina-provider-error-icon");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideNotificationStyles({
                    container: { base: "injected-notification-container" }
                })
            ]
        });

        const strategy = TestBed.inject(NOTIFICATION_STYLE_STRATEGY);

        expect(strategy.resolve("mona").container()).toContain("injected-notification-container");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideNotificationStyles({
                    strategy: {
                        resolve: () => ({
                            action: () => "replacement-action",
                            base: () => "replacement-base",
                            body: () => "replacement-body",
                            container: () => "replacement-container",
                            content: () => "replacement-content",
                            header: () => "replacement-header",
                            icon: () => "replacement-icon",
                            text: () => "replacement-text"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(NOTIFICATION_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
