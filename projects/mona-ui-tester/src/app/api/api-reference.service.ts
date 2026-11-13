import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { type Observable, shareReplay } from "rxjs";
import type { ApiEntryPointReference, ApiPageReference, ApiReferenceIndex } from "./api-model";

/**
 * Loads the API reference that `npm run build:api-data` writes, and keeps what it loaded, so moving between the
 * symbols of one entry point doesn't load its file again.
 */
@Injectable({ providedIn: "root" })
export class ApiReferenceService {
    readonly #entryPoints = new Map<string, Observable<ApiEntryPointReference>>();
    readonly #http = inject(HttpClient);
    readonly #pages = new Map<string, Observable<ApiPageReference>>();
    #index: Observable<ApiReferenceIndex> | null = null;

    public entryPoint(name: string): Observable<ApiEntryPointReference> {
        return this.#load(this.#entryPoints, name, `/assets/api/${encodeURIComponent(name)}.json`);
    }

    public index(): Observable<ApiReferenceIndex> {
        this.#index ??= this.#http
            .get<ApiReferenceIndex>("/assets/api/index.json")
            .pipe(shareReplay({ bufferSize: 1, refCount: false }));
        return this.#index;
    }

    /** What a component page's API section lists, by the page's folder under `assets/docs`. */
    public page(slug: string): Observable<ApiPageReference> {
        return this.#load(this.#pages, slug, `/assets/api/pages/${encodeURIComponent(slug)}.json`);
    }

    #load<T>(cache: Map<string, Observable<T>>, key: string, url: string): Observable<T> {
        let loaded = cache.get(key);
        if (!loaded) {
            loaded = this.#http.get<T>(url).pipe(shareReplay({ bufferSize: 1, refCount: false }));
            cache.set(key, loaded);
        }
        return loaded;
    }
}
