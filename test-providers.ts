import type { Provider } from "@angular/core";

/**
 * Loads zone.js for the library's specs. The unit-test builder imports this file before it sets up TestBed, and finding
 * Zone there, it sets TestBed up with zone change detection: the environment these specs were written for.
 *
 * zone.js is not listed under "polyfills" in angular.json because that also compiles async/await down to generators, so
 * that Zone.js can see them. esbuild then bundles a spec that has an async arrow function as CommonJS, which Vitest
 * rejects in a spec that calls vi.mock. Angular 22.2 loaded zone.js the same way on its own.
 */
import "zone.js";
import "zone.js/testing";

const providers: Provider[] = [];

export default providers;
