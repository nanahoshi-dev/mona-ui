import { HttpEventType, HttpHeaderResponse, HttpResponse } from "@angular/common/http";
import { Observable, of, Subject } from "rxjs";
import { describe, expect, it, type Mock, vi } from "vitest";
import { type UploadRunCallbacks, type UploadRunContext, runUpload } from "./runUpload";

function file(size = 100): File {
    return new File([new Uint8Array(size)], "photo.png", { type: "image/png" });
}

function callbacks(): {
    readonly failure: Mock<UploadRunCallbacks["failure"]>;
    readonly progress: Mock<UploadRunCallbacks["progress"]>;
    readonly success: Mock<UploadRunCallbacks["success"]>;
} {
    return {
        failure: vi.fn<UploadRunCallbacks["failure"]>(),
        progress: vi.fn<UploadRunCallbacks["progress"]>(),
        success: vi.fn<UploadRunCallbacks["success"]>()
    };
}

describe("runUpload", () => {
    it("succeeds with what a promise resolves to", async () => {
        const reported = callbacks();
        runUpload(() => Promise.resolve("https://example.com/photo.png"), file(), reported);
        await Promise.resolve();
        await Promise.resolve();
        expect(reported.success).toHaveBeenCalledWith("https://example.com/photo.png");
        expect(reported.failure).not.toHaveBeenCalled();
    });

    it("fails with what a promise rejects with, and with what the function throws", async () => {
        const rejected = callbacks();
        runUpload(() => Promise.reject(new Error("offline")), file(), rejected);
        await Promise.resolve();
        await Promise.resolve();
        expect(rejected.failure).toHaveBeenCalledWith(new Error("offline"));

        const thrown = callbacks();
        runUpload(
            () => {
                throw new Error("bad");
            },
            file(),
            thrown
        );
        expect(thrown.failure).toHaveBeenCalledWith(new Error("bad"));
        expect(thrown.success).not.toHaveBeenCalled();
    });

    it("succeeds with an observable's last value, even when it completes at once", () => {
        const reported = callbacks();
        runUpload(() => of("first", "last"), file(), reported);
        expect(reported.success).toHaveBeenCalledExactlyOnceWith("last");
    });

    it("reports HttpClient's upload progress, and succeeds with the response's body", () => {
        const events = new Subject<unknown>();
        const reported = callbacks();
        runUpload(() => events, file(200), reported);

        events.next({ type: HttpEventType.Sent });
        events.next({ loaded: 50, total: 200, type: HttpEventType.UploadProgress });
        events.next({ loaded: 150, type: HttpEventType.UploadProgress });
        events.next(new HttpHeaderResponse({ status: 200 }));
        events.next(new HttpResponse({ body: { url: "https://example.com/photo.png" }, status: 200 }));
        events.complete();

        expect(reported.progress.mock.calls).toEqual([[0.25], [0.75]]);
        expect(reported.success).toHaveBeenCalledExactlyOnceWith({ url: "https://example.com/photo.png" });
    });

    it("reports progress from the context, clamped and against the file's size by default", () => {
        let context: UploadRunContext | null = null;
        const reported = callbacks();
        runUpload(
            (_file, uploadContext) => {
                context = uploadContext;
                return new Promise(() => undefined);
            },
            file(100),
            reported
        );
        context!.progress(40);
        context!.progress(300, 200);
        context!.progress(Number.NaN);
        expect(reported.progress.mock.calls).toEqual([[0.4], [1]]);
    });

    it("aborts the signal and unsubscribes when stopped, and reports nothing after", () => {
        let signal: AbortSignal | null = null;
        const teardown = vi.fn();
        const reported = callbacks();
        const abort = runUpload(
            (_file, context) => {
                signal = context.signal;
                return new Observable(() => teardown);
            },
            file(),
            reported
        );
        abort();
        expect(signal!.aborted).toBe(true);
        expect(teardown).toHaveBeenCalled();
        expect(reported.success).not.toHaveBeenCalled();
        expect(reported.failure).not.toHaveBeenCalled();
    });

    it("ignores a promise that settles after the upload is stopped", async () => {
        let resolve!: (value: string) => void;
        const reported = callbacks();
        const abort = runUpload(() => new Promise<string>(res => (resolve = res)), file(), reported);
        abort();
        resolve("https://example.com/photo.png");
        await Promise.resolve();
        await Promise.resolve();
        expect(reported.success).not.toHaveBeenCalled();
    });

    it("does nothing when stopped after it finished", () => {
        let signal: AbortSignal | null = null;
        const reported = callbacks();
        const abort = runUpload(
            (_file, context) => {
                signal = context.signal;
                return of("done");
            },
            file(),
            reported
        );
        abort();
        expect(signal!.aborted).toBe(false);
        expect(reported.success).toHaveBeenCalledExactlyOnceWith("done");
    });
});
