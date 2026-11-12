import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { type Observable, shareReplay } from "rxjs";
import type { ApiEntryPointReference, ApiReferenceIndex } from "./api-model";

/**
 * Loads the API reference that `npm run build:api-data` writes, and keeps what it loaded, so moving between the
 * symbols of one entry point doesn't load its file again.
 */
@Injectable({ providedIn: "root" })
export class ApiReferenceService {
    readonly #entryPoints = new Map<string, Observable<ApiEntryPointReference>>();
    readonly #http = inject(HttpClient);
    #index: Observable<ApiReferenceIndex> | null = null;

    public entryPoint(name: string): Observable<ApiEntryPointReference> {
        let reference = this.#entryPoints.get(name);
        if (!reference) {
            reference = this.#http
                .get<ApiEntryPointReference>(`/assets/api/${encodeURIComponent(name)}.json`)
                .pipe(shareReplay({ bufferSize: 1, refCount: false }));
            this.#entryPoints.set(name, reference);
        }
        return reference;
    }

    public index(): Observable<ApiReferenceIndex> {
        this.#index ??= this.#http
            .get<ApiReferenceIndex>("/assets/api/index.json")
            .pipe(shareReplay({ bufferSize: 1, refCount: false }));
        return this.#index;
    }
}
