import { describe, expect, it } from "vitest";
import { MONA_ID_ID_LOCALE } from "./id-id.locale";
import { ID_ID_MESSAGES } from "./id-id.messages";

describe("MONA_ID_ID_LOCALE", () => {
    describe("metadata", () => {
        it("declares id-ID locale id", () => {
            expect(MONA_ID_ID_LOCALE.id).toBe("id-ID");
            expect(MONA_ID_ID_LOCALE.id).not.toBe("id");
            expect(MONA_ID_ID_LOCALE.id).not.toBe("id_ID");
            expect(MONA_ID_ID_LOCALE.id).not.toBe("id-id");
            expect(MONA_ID_ID_LOCALE.id).not.toBe("in-ID");
        });

        it("canonicalizes to id-ID via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_ID_ID_LOCALE.id)[0]).toBe("id-ID");
        });

        it("declares ltr direction", () => {
            expect(MONA_ID_ID_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to ID_ID_MESSAGES", () => {
            expect(MONA_ID_ID_LOCALE.messages).toBe(ID_ID_MESSAGES);
            expect(typeof MONA_ID_ID_LOCALE.messages).toBe("object");
        });
    });

    describe("completeness", () => {
        it("defines message namespaces without empty sections", () => {
            const namespaces = Object.keys(MONA_ID_ID_LOCALE.messages);
            expect(namespaces.length).toBeGreaterThan(0);
            for (const ns of namespaces) {
                const section = (MONA_ID_ID_LOCALE.messages as Record<string, unknown>)[ns];
                expect(typeof section).toBe("object");
                expect(section).not.toBeNull();
                expect(Object.keys(section as object).length).toBeGreaterThan(0);
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_ID_ID_LOCALE.messages;

        it("translates Pager messages correctly with Indonesian terminology", () => {
            expect(m.pager?.firstPageLabel).toBe("Halaman pertama");
            expect(m.pager?.lastPageLabel).toBe("Halaman terakhir");
            expect(m.pager?.nextPageLabel).toBe("Halaman berikutnya");
            expect(m.pager?.previousPageLabel).toBe("Halaman sebelumnya");
            expect(m.pager?.ofText).toBe("/");
            expect(m.pager?.pageText).toBe("Halaman");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 per halaman");
        });

        it("translates Grid messages correctly with Indonesian terminology", () => {
            expect(m.grid?.all).toBe("(Semua)");
            expect(m.grid?.delete).toBe("Hapus");
            expect(m.grid?.deleteRowConfirmation).toBe("Anda yakin ingin menghapus item ini?");
            expect(m.grid?.deleteRowTitle).toBe("Hapus baris?");
            expect(m.grid?.edit).toBe("Sunting");
            expect(m.grid?.filterPlaceholder).toBe("Saring...");
            expect(m.grid?.moveRow).toBe("Pindahkan baris");
            expect(m.grid?.noData).toBe("Tidak ada data");
            expect(m.grid?.moveAsNext).toBe("Pindahkan setelahnya");
            expect(m.grid?.moveAsPrevious).toBe("Pindahkan sebelumnya");
            expect(m.grid?.remove).toBe("Hapus");
            expect(m.grid?.rowReorder).toBe("Susun ulang baris");
            expect(m.grid?.save).toBe("Simpan");
            expect(m.grid?.selectAllRows).toBe("Pilih semua baris");
        });

        it("translates ListBox messages correctly with accessible descriptive labels", () => {
            expect(m.listBox?.clearSelection).toBe("Hapus semua pilihan");
            expect(m.listBox?.moveDown).toBe("Pindahkan ke bawah");
            expect(m.listBox?.moveUp).toBe("Pindahkan ke atas");
            expect(m.listBox?.remove).toBe("Hapus");
            expect(m.listBox?.transferFrom).toBe("Pindahkan dari daftar lain");
            expect(m.listBox?.transferTo).toBe("Pindahkan ke daftar lain");
            expect(m.listBox?.transferAllFrom).toBe("Pindahkan semua dari daftar lain");
            expect(m.listBox?.transferAllTo).toBe("Pindahkan semua ke daftar lain");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("Tebal");
            expect(m.editor?.italic).toBe("Miring");
            expect(m.editor?.underline).toBe("Garis bawah");
            expect(m.editor?.strikethrough).toBe("Coret");
            expect(m.editor?.insertLink).toBe("Sisipkan tautan");
            expect(m.editor?.removeLink).toBe("Hapus tautan");
            expect(m.editor?.codeBlock).toBe("Blok kode");
            expect(m.editor?.quotation).toBe("Kutipan");
            expect(m.editor?.undo).toBe("Urungkan");
            expect(m.editor?.redo).toBe("Ulangi");
            expect(m.editor?.alignCenter).toBe("Rata tengah");
            expect(m.editor?.insertTable).toBe("Sisipkan tabel");
            expect(m.editor?.deleteTable).toBe("Hapus tabel");
            expect(m.editor?.format).toBe("Pemformatan");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("Hari ini");
            expect(m.calendar?.nextMonth).toBe("Bulan berikutnya");
            expect(m.calendar?.previousMonth).toBe("Bulan sebelumnya");
            expect(m.calendar?.nextYear).toBe("Tahun berikutnya");
            expect(m.calendar?.previousYear).toBe("Tahun sebelumnya");
            expect(m.calendar?.nextDecade).toBe("Dekade berikutnya");
            expect(m.calendar?.previousDecade).toBe("Dekade sebelumnya");
            expect(m.datePicker?.datePicker).toBe("Pemilih tanggal");
            expect(m.datePicker?.openCalendar).toBe("Buka kalender");
        });

        it("translates TimeSelector & TimePicker messages correctly with native day periods", () => {
            expect(m.timeSelector?.am).toBe("AM");
            expect(m.timeSelector?.pm).toBe("PM");
            expect(m.timeSelector?.amPm).toBe("AM/PM");
            expect(m.timeSelector?.timeSelector).toBe("Pemilih waktu");
            expect(m.timeSelector?.now).toBe("Sekarang");
            expect(m.timeSelector?.set).toBe("Atur");
            expect(m.timePicker?.timePicker).toBe("Pemilih waktu");
            expect(m.timePicker?.openTimePicker).toBe("Buka pemilih waktu");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("Kurangi nilai");
            expect(m.numericTextBox?.increase).toBe("Tambah nilai");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("Bersihkan");
            expect(m.dropdownList?.clear).toBe("Bersihkan");
            expect(m.dropdowns?.noResultsFound).toBe("Tidak ada hasil");
        });

        it("translates Dialog & Window messages correctly", () => {
            expect(m.dialog?.ok).toBe("OK");
            expect(m.dialog?.cancel).toBe("Batal");
            expect(m.dialog?.closeDialog).toBe("Tutup dialog");
            expect(m.window?.close).toBe("Tutup");
            expect(m.window?.closeWindow).toBe("Tutup jendela");
            expect(m.window?.maximize).toBe("Maksimalkan");
            expect(m.window?.minimize).toBe("Minimalkan");
            expect(m.window?.restore).toBe("Pulihkan");
            expect(m.window?.moveWindow).toBe("Pindahkan jendela. Gunakan tombol panah untuk memindahkan.");
            expect(m.window?.resizeTop).toBe(
                "Ubah ukuran jendela dari tepi atas. Gunakan tombol panah untuk mengubah ukuran."
            );
            expect(m.window?.resizeBottom).toBe(
                "Ubah ukuran jendela dari tepi bawah. Gunakan tombol panah untuk mengubah ukuran."
            );
            expect(m.window?.resizeLeft).toBe(
                "Ubah ukuran jendela dari tepi kiri. Gunakan tombol panah untuk mengubah ukuran."
            );
            expect(m.window?.resizeRight).toBe(
                "Ubah ukuran jendela dari tepi kanan. Gunakan tombol panah untuk mengubah ukuran."
            );
        });

        it("translates TreeView & List messages correctly", () => {
            expect(m.treeView?.collapse).toBe("Ciutkan");
            expect(m.treeView?.expand).toBe("Perluas");
            expect(m.treeView?.filterTree).toBe("Saring pohon");
            expect(m.list?.noData).toBe("Tidak ada data");
        });

        it("translates ScrollView messages correctly", () => {
            expect(m.scrollView?.carousel).toBe("karusel");
            expect(m.scrollView?.slide).toBe("slide");
            expect(m.scrollView?.nextPage).toBe("Halaman berikutnya");
            expect(m.scrollView?.previousPage).toBe("Halaman sebelumnya");
            expect(m.scrollView?.scrollPagerNext).toBe("Gulir opsi halaman ke depan");
            expect(m.scrollView?.scrollPagerPrevious).toBe("Gulir opsi halaman ke belakang");
        });

        it("translates Spinner & Notification messages correctly", () => {
            expect(m.spinner?.loading).toBe("Memuat");
            expect(m.spinner?.cancel).toBe("Batal");
            expect(m.notification?.close).toBe("Tutup");
            expect(m.notification?.success).toBe("Berhasil");
            expect(m.notification?.error).toBe("Kesalahan");
            expect(m.notification?.warning).toBe("Peringatan");
            expect(m.notification?.info).toBe("Informasi");
        });

        it("translates Sheet & Splitter & Stepper & Tabs correctly", () => {
            expect(m.sheet?.closeSheet).toBe("Tutup panel");
            expect(m.splitter?.resizer).toBe("Pemisah panel");
            expect(m.splitter?.collapsePrevious).toBe("Ciutkan panel sebelumnya");
            expect(m.splitter?.collapseNext).toBe("Ciutkan panel berikutnya");
            expect(m.splitter?.collapseUp).toBe("Ciutkan panel atas");
            expect(m.splitter?.collapseDown).toBe("Ciutkan panel bawah");
            expect(m.stepper?.stepProgress).toBe("Progres langkah");
            expect(m.stepper?.stepper).toBe("Langkah");
            expect(m.tabs?.closeTab).toBe("Tutup tab");
        });

        it("translates Filter date, boolean, and null operators correctly", () => {
            expect(m.filter?.isAfter).toBe("Setelah");
            expect(m.filter?.isAfterOrEqualTo).toBe("Pada atau setelah");
            expect(m.filter?.isBefore).toBe("Sebelum");
            expect(m.filter?.isBeforeOrEqualTo).toBe("Pada atau sebelum");
            expect(m.filter?.isEqualTo).toBe("Sama dengan");
            expect(m.filter?.isNotEqualTo).toBe("Tidak sama dengan");
            expect(m.filter?.isNull).toBe("Null");
            expect(m.filter?.isNotNull).toBe("Bukan null");
            expect(m.filter?.isTrue).toBe("Benar");
            expect(m.filter?.isFalse).toBe("Salah");
            expect(m.filter?.contains).toBe("Berisi");
            expect(m.filter?.doesNotContain).toBe("Tidak berisi");
            expect(m.filter?.startsWith).toBe("Diawali dengan");
            expect(m.filter?.endsWith).toBe("Diakhiri dengan");
        });

        it("translates Breadcrumb messages correctly with Indonesian accessibility terminology", () => {
            expect(m.breadcrumb?.breadcrumb).toBe("Navigasi remah roti");
        });

        it("translates SplitButton menu toggle message correctly", () => {
            expect(m.splitButton?.menuButtonAriaLabel).toBe("Tampilkan opsi menu");
        });

        it("translates ColorGradient accessibility labels correctly", () => {
            expect(m.colorGradient?.saturationAndValue).toBe("Saturasi dan nilai warna");
        });

        it("translates Grid row-reorder disabled reasons correctly", () => {
            expect(m.grid?.rowReorderDisabled).toBe("Penyusunan ulang baris dinonaktifkan.");
            expect(m.grid?.rowReorderDisabledEditing).toBe(
                "Selesaikan pengeditan sebelum menyusun ulang baris."
            );
            expect(m.grid?.rowReorderDisabledFiltered).toBe(
                "Hapus filter sebelum menyusun ulang baris."
            );
            expect(m.grid?.rowReorderDisabledGrouped).toBe(
                "Hapus pengelompokan sebelum menyusun ulang baris."
            );
            expect(m.grid?.rowReorderDisabledSingleRow).toBe(
                "Diperlukan setidaknya dua baris untuk menyusun ulang."
            );
            expect(m.grid?.rowReorderDisabledSorted).toBe(
                "Hapus pengurutan sebelum menyusun ulang baris."
            );
            expect(m.grid?.rowReorderDisabledVirtualScroll).toBe(
                "Baris tidak dapat disusun ulang saat pengguliran virtual aktif."
            );
            expect(m.grid?.rowReorderKeyboardHint).toBe(
                "Gunakan Alt + Panah Atas atau Alt + Panah Bawah untuk memindahkan baris."
            );
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_ID_ID_LOCALE.messages;

        it("formats Calendar functions correctly with natural Indonesian date composition", () => {
            expect(m.calendar?.calendarLabel?.("September 2026")).toBe("Kalender, September 2026");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020 - 2029");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("Tampilan dekade, 2020 - 2029");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("Tahun 2026");
            expect(m.calendar?.yearViewLabel?.("2026")).toBe("Tampilan tahun, 2026");
            expect(m.calendar?.goToToday?.("15/09/2026")).toBe("Ke hari ini, 15/09/2026");
            expect(m.calendar?.switchToYearView?.("September 2026")).toBe(
                "Beralih ke tampilan tahun, saat ini September 2026"
            );
            expect(m.calendar?.switchToDecadeView?.("2026")).toBe(
                "Beralih ke tampilan dekade, saat ini 2026"
            );
        });

        it("formats Chart functions and preserves Indonesian financial terminology", () => {
            expect(m.chart?.open).toBe("Pembukaan");
            expect(m.chart?.high).toBe("Tertinggi");
            expect(m.chart?.low).toBe("Terendah");
            expect(m.chart?.close).toBe("Penutupan");
            expect(m.chart?.openAbbreviation).toBe("B");
            expect(m.chart?.highAbbreviation).toBe("T");
            expect(m.chart?.lowAbbreviation).toBe("R");
            expect(m.chart?.closeAbbreviation).toBe("P");
            expect(m.chart?.rangeDescription?.("Pendapatan", "0", "100")).toBe("Pendapatan, 0 hingga 100");
            expect(m.chart?.divergingRangeDescription?.("Profitabilitas", "-10", "0", "+10")).toBe(
                "Profitabilitas, -10 hingga +10, titik tengah 0"
            );
        });

        it("formats Chip removeLabel function correctly for both labelled and unlabelled cases", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Hapus Angular");
            expect(m.chip?.removeLabel?.()).toBe("Hapus item");
            expect(m.chip?.removeLabel?.("")).toBe("Hapus item");
        });

        it("formats ColorGradient saturationAndValueText function correctly", () => {
            expect(m.colorGradient?.saturationAndValueText?.(50, 75)).toBe("Saturasi 50%, nilai 75%");
        });

        it("formats ColorPalette color function correctly", () => {
            expect(m.colorPalette?.color?.("#FF00AA")).toBe("Warna: #FF00AA");
        });

        it("formats Dropdowns functions with singular counted nouns across 0, 1, 2, 10 counts", () => {
            expect(m.dropdowns?.itemPosition?.("Opsi 1", 1, 10)).toBe("Opsi 1, 1 dari 10");
            expect(m.dropdowns?.resultsAvailable?.(0)).toBe("0 hasil tersedia");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("1 hasil tersedia");
            expect(m.dropdowns?.resultsAvailable?.(2)).toBe("2 hasil tersedia");
            expect(m.dropdowns?.resultsAvailable?.(10)).toBe("10 hasil tersedia");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("Judul 1");
            expect(m.editor?.heading?.(3)).toBe("Judul 3");
        });

        it("formats Grid functions correctly with singular counted nouns across 0, 1, 2, 10 counts", () => {
            expect(m.grid?.columnsSelected?.(0)).toBe("0 kolom dipilih");
            expect(m.grid?.columnsSelected?.(1)).toBe("1 kolom dipilih");
            expect(m.grid?.columnsSelected?.(2)).toBe("2 kolom dipilih");
            expect(m.grid?.columnsSelected?.(10)).toBe("10 kolom dipilih");
            expect(m.grid?.filterByColumn?.("Nama")).toBe("Saring berdasarkan kolom Nama");
            expect(m.grid?.reorderRow?.(4)).toBe("Susun ulang baris 4");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "Baris 1",
                    "Gunakan Alt + Panah Atas atau Alt + Panah Bawah untuk memindahkan baris."
                )
            ).toBe("Baris 1. Gunakan Alt + Panah Atas atau Alt + Panah Bawah untuk memindahkan baris.");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "Baris 1",
                    "Gunakan Alt + Panah Atas atau Alt + Panah Bawah untuk memindahkan baris.",
                    "Penyusunan ulang baris dinonaktifkan."
                )
            ).toBe(
                "Baris 1. Gunakan Alt + Panah Atas atau Alt + Panah Bawah untuk memindahkan baris. Penyusunan ulang baris dinonaktifkan."
            );
            expect(m.grid?.rowReorderMoved?.(3, 2)).toBe("Baris 3 dipindahkan ke posisi 2.");
            expect(m.grid?.selectRow?.(2)).toBe("Pilih baris 2");
        });

        it("formats MultiSelect itemsCount function without plural suffix across 0, 1, 2, 10 counts", () => {
            expect(m.multiSelect?.itemsCount?.(0)).toBe("+ 0 item");
            expect(m.multiSelect?.itemsCount?.(1)).toBe("+ 1 item");
            expect(m.multiSelect?.itemsCount?.(2)).toBe("+ 2 item");
            expect(m.multiSelect?.itemsCount?.(10)).toBe("+ 10 item");
        });

        it("formats Pager functions correctly without plural suffix across 0, 1, 2, 10 counts", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("Halaman 3");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 per halaman");
            expect(m.pager?.pageStatus?.(1, 1)).toBe("Halaman 1 dari 1");
            expect(m.pager?.pageStatus?.(1, 2)).toBe("Halaman 1 dari 2");
            expect(m.pager?.pageStatus?.(2, 10)).toBe("Halaman 2 dari 10");
            expect(m.pager?.jumpBackwardLabel?.(0)).toBe("Mundur 0 halaman");
            expect(m.pager?.jumpBackwardLabel?.(1)).toBe("Mundur 1 halaman");
            expect(m.pager?.jumpBackwardLabel?.(2)).toBe("Mundur 2 halaman");
            expect(m.pager?.jumpBackwardLabel?.(10)).toBe("Mundur 10 halaman");
            expect(m.pager?.jumpForwardLabel?.(0)).toBe("Maju 0 halaman");
            expect(m.pager?.jumpForwardLabel?.(1)).toBe("Maju 1 halaman");
            expect(m.pager?.jumpForwardLabel?.(2)).toBe("Maju 2 halaman");
            expect(m.pager?.jumpForwardLabel?.(10)).toBe("Maju 10 halaman");
        });

        it("formats Pager rangeStatus with singular noun without plural branching", () => {
            expect(m.pager?.rangeStatus?.(0, 0, 0)).toBe("0 - 0 dari 0 item");
            expect(m.pager?.rangeStatus?.(1, 1, 1)).toBe("1 - 1 dari 1 item");
            expect(m.pager?.rangeStatus?.(1, 2, 2)).toBe("1 - 2 dari 2 item");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("1 - 10 dari 50 item");
            expect(m.pager?.rangeStatus?.(1, 20, 100)).toBe("1 - 20 dari 100 item");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("4 dari 5");
        });

        it("formats ScrollView page functions correctly", () => {
            expect(m.scrollView?.page?.(1)).toBe("Halaman 1");
            expect(m.scrollView?.pageOf?.(2, 8)).toBe("Halaman 2 dari 8");
        });

        it("formats SplitButton function correctly for both text and empty states", () => {
            expect(m.splitButton?.splitButton?.("Simpan")).toBe("Simpan, tombol pisah");
            expect(m.splitButton?.splitButton?.("")).toBe("Tombol pisah");
        });
    });

    describe("Indonesian count invariance", () => {
        const m = MONA_ID_ID_LOCALE.messages;

        it("keeps Indonesian counted nouns invariant across 0, 1, 2, and 10", () => {
            expect(m.dropdowns.resultsAvailable(0)).toBe("0 hasil tersedia");
            expect(m.dropdowns.resultsAvailable(1)).toBe("1 hasil tersedia");
            expect(m.dropdowns.resultsAvailable(2)).toBe("2 hasil tersedia");
            expect(m.dropdowns.resultsAvailable(10)).toBe("10 hasil tersedia");

            expect(m.multiSelect.itemsCount(0)).toBe("+ 0 item");
            expect(m.multiSelect.itemsCount(1)).toBe("+ 1 item");
            expect(m.multiSelect.itemsCount(2)).toBe("+ 2 item");
            expect(m.multiSelect.itemsCount(10)).toBe("+ 10 item");

            expect(m.grid.columnsSelected(0)).toBe("0 kolom dipilih");
            expect(m.grid.columnsSelected(1)).toBe("1 kolom dipilih");
            expect(m.grid.columnsSelected(2)).toBe("2 kolom dipilih");
            expect(m.grid.columnsSelected(10)).toBe("10 kolom dipilih");

            expect(m.pager.jumpBackwardLabel(0)).toBe("Mundur 0 halaman");
            expect(m.pager.jumpBackwardLabel(1)).toBe("Mundur 1 halaman");
            expect(m.pager.jumpBackwardLabel(2)).toBe("Mundur 2 halaman");
            expect(m.pager.jumpBackwardLabel(10)).toBe("Mundur 10 halaman");

            expect(m.pager.jumpForwardLabel(0)).toBe("Maju 0 halaman");
            expect(m.pager.jumpForwardLabel(1)).toBe("Maju 1 halaman");
            expect(m.pager.jumpForwardLabel(2)).toBe("Maju 2 halaman");
            expect(m.pager.jumpForwardLabel(10)).toBe("Maju 10 halaman");
        });
    });
});
