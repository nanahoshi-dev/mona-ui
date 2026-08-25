import { defineConfig } from "vitest/config";
import { readPositiveIntegerEnv } from "./vitest-config-utils";

const maxWorkers = readPositiveIntegerEnv("MONA_VITEST_MAX_WORKERS") ?? 1;

export default defineConfig({
    test: {
        isolate: true,
        maxWorkers,
        minWorkers: 1,
        pool: "forks"
    }
});
