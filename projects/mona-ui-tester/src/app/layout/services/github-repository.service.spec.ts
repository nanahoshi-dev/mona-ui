import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    GITHUB_STARS_FIELD,
    GITHUB_STARS_MAX_AGE,
    GITHUB_STARS_STORAGE_KEY,
    GitHubRepositoryService,
    describeStarCount
} from "./github-repository.service";

const API_URL = "https://api.github.com/repos/nanahoshi-dev/mona-ui";
const NOW = new Date(2026, 10, 17, 12).getTime();

describe("GitHubRepositoryService", () => {
    function setUp(): { http: HttpTestingController; service: GitHubRepositoryService } {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        return { service: TestBed.inject(GitHubRepositoryService), http: TestBed.inject(HttpTestingController) };
    }

    function store(value: unknown): void {
        localStorage.setItem(GITHUB_STARS_STORAGE_KEY, typeof value === "string" ? value : JSON.stringify(value));
    }

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(NOW);
        localStorage.removeItem(GITHUB_STARS_STORAGE_KEY);
    });

    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
        localStorage.removeItem(GITHUB_STARS_STORAGE_KEY);
        vi.useRealTimers();
    });

    it("asks GitHub for the repository's star count and keeps it for the next page", () => {
        const { http, service } = setUp();
        expect(service.stars()).toBeNull();

        http.expectOne(API_URL).flush({ [GITHUB_STARS_FIELD]: 1234 });

        expect(service.stars()).toBe(1234);
        expect(JSON.parse(localStorage.getItem(GITHUB_STARS_STORAGE_KEY) ?? "null")).toEqual({
            count: 1234,
            fetchedAt: NOW
        });
    });

    it("uses a count from the last hour without asking again", () => {
        store({ count: 42, fetchedAt: NOW - GITHUB_STARS_MAX_AGE + 1000 });
        const { http, service } = setUp();

        http.expectNone(API_URL);
        expect(service.stars()).toBe(42);
    });

    it("shows an older count at once, and replaces it with GitHub's", () => {
        store({ count: 42, fetchedAt: NOW - GITHUB_STARS_MAX_AGE - 1000 });
        const { http, service } = setUp();
        expect(service.stars()).toBe(42);

        http.expectOne(API_URL).flush({ [GITHUB_STARS_FIELD]: 43 });

        expect(service.stars()).toBe(43);
    });

    it("shows no count when GitHub can't be reached, and keeps an older one", () => {
        const { http, service } = setUp();
        http.expectOne(API_URL).flush({ message: "API rate limit exceeded" }, { status: 403, statusText: "Forbidden" });
        expect(service.stars()).toBeNull();

        TestBed.resetTestingModule();
        store({ count: 42, fetchedAt: NOW - GITHUB_STARS_MAX_AGE - 1000 });
        const second = setUp();
        second.http.expectOne(API_URL).error(new ProgressEvent("error"));
        expect(second.service.stars()).toBe(42);
    });

    it("ignores an answer or a stored value that isn't a count", () => {
        store("not json");
        const { http, service } = setUp();
        http.expectOne(API_URL).flush({ [GITHUB_STARS_FIELD]: "many" });
        expect(service.stars()).toBeNull();

        TestBed.resetTestingModule();
        store({ count: -1, fetchedAt: NOW });
        const second = setUp();
        second.http.expectOne(API_URL).flush({ [GITHUB_STARS_FIELD]: 1.5 });
        expect(second.service.stars()).toBeNull();
    });
});

describe("describeStarCount", () => {
    it("writes the count short, as GitHub does", () => {
        expect(describeStarCount(0)).toEqual({ short: "0", unit: "stars" });
        expect(describeStarCount(1)).toEqual({ short: "1", unit: "star" });
        expect(describeStarCount(999).short).toBe("999");
        expect(describeStarCount(1234).short).toBe("1.2K");
        expect(describeStarCount(15000).short).toBe("15K");
        expect(describeStarCount(2_500_000).short).toBe("2.5M");
    });
});
