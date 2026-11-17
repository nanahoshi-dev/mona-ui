import { HttpClient } from "@angular/common/http";
import { DOCUMENT, Injectable, inject, signal } from "@angular/core";

/** The public repository the docs link to. */
export const GITHUB_REPOSITORY = "nanahoshi-dev/mona-ui";
export const GITHUB_REPOSITORY_URL = `https://github.com/${GITHUB_REPOSITORY}`;

/**
 * GitHub answers 60 requests an hour from one address without a token, so a count is kept for an hour and shared by
 * every page and tab.
 */
export const GITHUB_STARS_MAX_AGE = 60 * 60 * 1000;
export const GITHUB_STARS_STORAGE_KEY = "mona-docs-github-stars";
/** The field of GitHub's repository response that holds the count, named as GitHub names it. */
export const GITHUB_STARS_FIELD = "stargazers_count";

const COMPACT_NUMBER = new Intl.NumberFormat("en", { maximumFractionDigits: 1, notation: "compact" });

export interface StarCountText {
    /** What the header shows, such as "1.2K". */
    readonly short: string;
    /** "star" or "stars", for the link's name. */
    readonly unit: string;
}

interface StoredStars {
    readonly count: number;
    readonly fetchedAt: number;
}

/** How the header writes a star count: short, as GitHub does, with the word for the link's name. */
export function describeStarCount(count: number): StarCountText {
    return { short: COMPACT_NUMBER.format(count), unit: count === 1 ? "star" : "stars" };
}

function isStarCount(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * The repository's star count, from GitHub's API. It's null until a count arrives, and stays null if GitHub can't be
 * reached, so the header shows the link without a number rather than a wrong one.
 */
@Injectable({ providedIn: "root" })
export class GitHubRepositoryService {
    readonly #http = inject(HttpClient);
    readonly #stars = signal<number | null>(null);
    readonly #storage = this.#readStorage();
    public readonly stars = this.#stars.asReadonly();

    public constructor() {
        const stored = this.#readStored();
        if (stored) {
            this.#stars.set(stored.count);
            if (Date.now() - stored.fetchedAt < GITHUB_STARS_MAX_AGE) {
                return;
            }
        }
        this.#http
            .get<Readonly<Record<string, unknown>>>(`https://api.github.com/repos/${GITHUB_REPOSITORY}`)
            .subscribe({
                // Without GitHub, the header keeps the count it had, or shows none.
                error: () => undefined,
                next: repository => {
                    const count = repository[GITHUB_STARS_FIELD];
                    if (isStarCount(count)) {
                        this.#stars.set(count);
                        this.#writeStored({ count, fetchedAt: Date.now() });
                    }
                }
            });
    }

    #readStorage(): Storage | null {
        try {
            return inject(DOCUMENT).defaultView?.localStorage ?? null;
        } catch {
            return null;
        }
    }

    #readStored(): StoredStars | null {
        try {
            const stored: unknown = JSON.parse(this.#storage?.getItem(GITHUB_STARS_STORAGE_KEY) ?? "null");
            if (stored && typeof stored === "object") {
                const { count, fetchedAt } = stored as Partial<StoredStars>;
                if (isStarCount(count) && typeof fetchedAt === "number") {
                    return { count, fetchedAt };
                }
            }
        } catch {
            // A value that isn't JSON counts as nothing stored.
        }
        return null;
    }

    #writeStored(value: StoredStars): void {
        try {
            this.#storage?.setItem(GITHUB_STARS_STORAGE_KEY, JSON.stringify(value));
        } catch {
            // Storage that's full or blocked only costs the next page a request.
        }
    }
}
