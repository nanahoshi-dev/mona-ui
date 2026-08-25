import { defineConfig } from "vitest/config";
import { readPositiveIntegerEnv } from "./vitest-config-utils";

const maxWorkers = readPositiveIntegerEnv("MONA_VITEST_MAX_WORKERS");

export default defineConfig({
    test: {
        pool: "forks",
        ...(maxWorkers === undefined ? {} : { maxWorkers })
    },
});
