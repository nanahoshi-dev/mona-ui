import { ApplicationInitStatus } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MonaI18nConfig } from "../models/mona-i18n-config";
import type { MonaLocale } from "../models/mona-locale";
import { provideMonaI18n } from "../providers/provide-mona-i18n";
import { MonaI18nService } from "./mona-i18n.service";

const DE_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "de-DE",
    messages: { pager: { nextPageLabel: "Nächste Seite" } }
};
const AR_LOCALE: MonaLocale = { direction: "rtl", id: "ar-SA", messages: {} };
const TR_LOCALE: MonaLocale = { direction: "ltr", id: "tr-TR", messages: {} };

interface Deferred<T> {
    readonly promise: Promise<T>;
    readonly reject: (error: unknown) => void;
    readonly resolve: (value: T) => void;
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, reject, resolve };
}

function setup(config: MonaI18nConfig): MonaI18nService {
    TestBed.configureTestingModule({ providers: [provideMonaI18n(config)] });
    return TestBed.inject(MonaI18nService);
}

describe("MonaI18nService.load", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("rejects without a configured loader and keeps the locale", async () => {
        const service = setup({});

        await expect(service.load("de-DE")).rejects.toThrow(/needs a loader/);
        expect(service.localeId()).toBe("en-US");
        expect(service.loading()).toBe(false);
    });

    it("loads a locale with the canonical id and switches to it", async () => {
        const loadLocale = vi.fn((_id: string) => Promise.resolve(DE_LOCALE));
        const service = setup({ loadLocale });

        const pending = service.load("de_DE");
        expect(service.loading()).toBe(true);
        await pending;

        expect(loadLocale).toHaveBeenCalledExactlyOnceWith("de-DE");
        expect(service.locale()).toBe(DE_LOCALE);
        expect(service.loading()).toBe(false);
        expect(service.loadError()).toBeNull();
    });

    it("loads each locale once and shares concurrent requests", async () => {
        const loadLocale = vi.fn((_id: string) => Promise.resolve(DE_LOCALE));
        const service = setup({ loadLocale });

        await Promise.all([service.load("de-DE"), service.load("de_DE")]);
        service.use(TR_LOCALE);
        await service.load("de-DE");

        expect(loadLocale).toHaveBeenCalledOnce();
        expect(service.locale()).toBe(DE_LOCALE);
    });

    it("lets the latest load win when an earlier one finishes last", async () => {
        const de = createDeferred<MonaLocale>();
        const ar = createDeferred<MonaLocale>();
        const service = setup({ loadLocale: id => (id === "de-DE" ? de.promise : ar.promise) });

        const first = service.load("de-DE");
        const second = service.load("ar-SA");
        ar.resolve(AR_LOCALE);
        await second;
        de.resolve(DE_LOCALE);
        await first;

        expect(service.localeId()).toBe("ar-SA");
        expect(service.direction()).toBe("rtl");
        expect(service.loading()).toBe(false);
    });

    it("keeps loading true until the latest load finishes", async () => {
        const de = createDeferred<MonaLocale>();
        const ar = createDeferred<MonaLocale>();
        const service = setup({ loadLocale: id => (id === "de-DE" ? de.promise : ar.promise) });

        const first = service.load("de-DE");
        const second = service.load("ar-SA");
        de.resolve(DE_LOCALE);
        await first;

        expect(service.loading()).toBe(true);
        expect(service.localeId()).toBe("en-US");

        ar.resolve(AR_LOCALE);
        await second;
        expect(service.loading()).toBe(false);
    });

    it("lets use() supersede a load in progress", async () => {
        const de = createDeferred<MonaLocale>();
        const service = setup({ loadLocale: () => de.promise });

        const pending = service.load("de-DE");
        service.use(TR_LOCALE);
        expect(service.loading()).toBe(false);
        de.resolve(DE_LOCALE);
        await pending;

        expect(service.localeId()).toBe("tr-TR");
    });

    it("keeps the locale, sets loadError and retries on failure", async () => {
        const error = new Error("offline");
        const loadLocale = vi
            .fn<(id: string) => Promise<MonaLocale>>()
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(DE_LOCALE);
        const service = setup({ loadLocale, locale: TR_LOCALE });

        await expect(service.load("de-DE")).rejects.toBe(error);
        expect(service.localeId()).toBe("tr-TR");
        expect(service.loadError()).toBe(error);
        expect(service.loading()).toBe(false);

        await service.load("de-DE");
        expect(loadLocale).toHaveBeenCalledTimes(2);
        expect(service.localeId()).toBe("de-DE");
        expect(service.loadError()).toBeNull();
    });

    it("rejects a loader that throws synchronously instead of throwing from load()", async () => {
        const error = new Error("bad id");
        const service = setup({
            loadLocale: () => {
                throw error;
            }
        });

        const pending = service.load("de-DE");
        await expect(pending).rejects.toBe(error);
        expect(service.loadError()).toBe(error);
    });

    it("does not report the error of a superseded load", async () => {
        const de = createDeferred<MonaLocale>();
        const service = setup({ loadLocale: () => de.promise });

        const pending = service.load("de-DE");
        service.use(TR_LOCALE);
        de.reject(new Error("offline"));

        await expect(pending).rejects.toThrow("offline");
        expect(service.loadError()).toBeNull();
        expect(service.localeId()).toBe("tr-TR");
    });
});

describe("provideMonaI18n initialLocale", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("loads the initial locale before the application starts", async () => {
        const service = setup({ initialLocale: "de-DE", loadLocale: () => Promise.resolve(DE_LOCALE) });

        await TestBed.inject(ApplicationInitStatus).donePromise;

        expect(service.locale()).toBe(DE_LOCALE);
    });

    it("starts with the configured locale and logs when the initial locale fails to load", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const service = setup({
            initialLocale: "de-DE",
            loadLocale: () => Promise.reject(new Error("offline")),
            locale: TR_LOCALE
        });

        await TestBed.inject(ApplicationInitStatus).donePromise;

        expect(service.localeId()).toBe("tr-TR");
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('initial locale "de-DE"'), expect.any(Error));
    });
});
