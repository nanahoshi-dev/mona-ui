// Generated from id-id.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "id-ID", options);
}

export const ID_ID_MESSAGES = {
    autoComplete: {
        clear: "Bersihkan"
    },
    breadcrumb: {
        breadcrumb: "Navigasi remah roti"
    },
    buttonGroup: {
        buttonGroup: "Grup tombol"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Kalender, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `Tampilan dekade, ${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `Ke hari ini, ${formattedDate}`,
        nextDecade: "Dekade berikutnya",
        nextMonth: "Bulan berikutnya",
        nextYear: "Tahun berikutnya",
        previousDecade: "Dekade sebelumnya",
        previousMonth: "Bulan sebelumnya",
        previousYear: "Tahun sebelumnya",
        switchToDecadeView: (currentYear: string) => `Beralih ke tampilan dekade, saat ini ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) => `Beralih ke tampilan tahun, saat ini ${currentMonthAndYear}`,
        today: "Hari ini",
        yearCellLabel: (year: number) => `Tahun ${localizeNumber(year, { useGrouping: false })}`,
        yearViewLabel: (year: string) => `Tampilan tahun, ${year}`
    },
    card: {
        actionsLabel: "Tindakan kartu"
    },
    chart: {
        change: "Perubahan",
        chart: "Bagan",
        chartLegend: "Legenda bagan",
        close: "Penutupan",
        closeAbbreviation: "P",
        colorScale: "Skala warna",
        conversion: "Konversi",
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, ${minimum} hingga ${maximum}, titik tengah ${midpoint}`,
        dropOff: "Penurunan",
        falling: "Turun",
        high: "Tertinggi",
        highAbbreviation: "T",
        labelValueSeparator: ":",
        low: "Terendah",
        lowAbbreviation: "R",
        noData: "Tidak ada data",
        open: "Pembukaan",
        openAbbreviation: "B",
        overall: "Keseluruhan",
        range: "Rentang",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, ${minimum} hingga ${maximum}`,
        rising: "Naik",
        runningTotal: "Total berjalan",
        size: "ukuran",
        unchanged: "Tidak berubah",
        value: "Nilai",
        visualIndicatorClamped: "Indikator visual dibatasi"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Hapus ${label}` : "Hapus item")
    },
    colorGradient: {
        apply: "Terapkan",
        cancel: "Batal",
        clearColor: "Hapus warna",
        copyAsHex: "Salin sebagai HEX",
        copyAsRgb: "Salin sebagai RGB",
        copyColor: "Salin warna",
        currentColor: "Warna saat ini",
        previousColor: "Warna sebelumnya",
        saturationAndValue: "Saturasi dan nilai warna",
        saturationAndValueText: (saturation: number, value: number) =>
            `Saturasi ${localizeNumber(saturation)}%, nilai ${localizeNumber(value)}%`,
        switchColorMode: "Ganti mode warna"
    },
    colorPalette: {
        color: (color: string) => `Warna: ${color}`,
        colorPalette: "Palet warna"
    },
    colorPicker: {
        clearColor: "Hapus warna",
        colorGradientPicker: "Pemilih gradien warna",
        colorPalettePicker: "Pemilih palet warna",
        colorPicker: "Pemilih warna"
    },
    comboBox: {
        clear: "Bersihkan"
    },
    datePicker: {
        datePicker: "Pemilih tanggal",
        openCalendar: "Buka kalender"
    },
    dateTimePicker: {
        calendar: "Kalender",
        cancel: "Batal",
        date: "Tanggal",
        dateTimePicker: "Pemilih tanggal dan waktu",
        openDateTimePicker: "Buka pemilih tanggal dan waktu",
        set: "Atur",
        time: "Waktu",
        timePicker: "Pemilih waktu"
    },
    dialog: {
        cancel: "Batal",
        closeDialog: "Tutup dialog",
        ok: "OK"
    },
    dropdownList: {
        clear: "Bersihkan"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${localizeNumber(position)} dari ${localizeNumber(total)}`,
        noResultsFound: "Tidak ada hasil",
        resultsAvailable: (count: number) => `${localizeNumber(count)} hasil tersedia`
    },
    editor: {
        addColumnAfter: "Tambahkan kolom setelahnya",
        addColumnBefore: "Tambahkan kolom sebelumnya",
        addHorizontalLine: "Tambahkan garis horizontal",
        addRowAfter: "Tambahkan baris setelahnya",
        addRowBefore: "Tambahkan baris sebelumnya",
        alignCenter: "Rata tengah",
        alignLeft: "Rata kiri",
        alignRight: "Rata kanan",
        altText: "Teks alternatif",
        backgroundColor: "Warna latar belakang",
        bold: "Tebal",
        cancel: "Batal",
        codeBlock: "Blok kode",
        color: "Warna",
        deleteColumn: "Hapus kolom",
        deleteRow: "Hapus baris",
        deleteTable: "Hapus tabel",
        enterUrl: "Masukkan URL",
        fontSize: "Ukuran font",
        format: "Pemformatan",
        heading: (level: number) => `Judul ${localizeNumber(level)}`,
        heightPx: "Tinggi (px)",
        imageUrl: "URL gambar",
        indent: "Tambah inden",
        insert: "Sisipkan",
        insertImage: "Sisipkan gambar",
        insertLink: "Sisipkan tautan",
        insertOrderedList: "Sisipkan daftar bernomor",
        insertTable: "Sisipkan tabel",
        insertTaskList: "Sisipkan daftar tugas",
        insertUnorderedList: "Sisipkan daftar berpoin",
        italic: "Miring",
        justify: "Rata kiri-kanan",
        mergeCells: "Gabungkan sel yang dipilih",
        outdent: "Kurangi inden",
        paragraph: "Paragraf",
        quotation: "Kutipan",
        redo: "Ulangi",
        removeLink: "Hapus tautan",
        selectFontFamily: "Pilih keluarga font",
        selectFontSize: "Pilih ukuran font",
        splitCell: "Pisahkan sel",
        strikethrough: "Coret",
        subscript: "Subskrip",
        superscript: "Superskrip",
        toggleHeaderRow: "Aktifkan/nonaktifkan baris header",
        underline: "Garis bawah",
        undo: "Urungkan",
        widthPx: "Lebar (px)"
    },
    filter: {
        and: "Dan",
        apply: "Terapkan",
        clear: "Bersihkan",
        contains: "Berisi",
        doesNotContain: "Tidak berisi",
        endsWith: "Diakhiri dengan",
        isAfter: "Setelah",
        isAfterOrEqualTo: "Pada atau setelah",
        isBefore: "Sebelum",
        isBeforeOrEqualTo: "Pada atau sebelum",
        isEmpty: "Kosong",
        isEqualTo: "Sama dengan",
        isFalse: "Salah",
        isGreaterThan: "Lebih besar dari",
        isGreaterThanOrEqualTo: "Lebih besar dari atau sama dengan",
        isLessThan: "Lebih kecil dari",
        isLessThanOrEqualTo: "Lebih kecil dari atau sama dengan",
        isNotEmpty: "Tidak kosong",
        isNotEqualTo: "Tidak sama dengan",
        isNotNull: "Bukan null",
        isNotNullOrEmpty: "Bukan null atau kosong",
        isNull: "Null",
        isNullOrEmpty: "Null atau kosong",
        isTrue: "Benar",
        or: "Atau",
        startsWith: "Diawali dengan"
    },
    grid: {
        all: "(Semua)",
        apply: "Terapkan",
        cancel: "Batal",
        cancelRowEdit: "Batalkan pengeditan baris",
        collapseDetail: (rowNumber: number) => `Sembunyikan detail baris ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `Dikelompokkan menurut ${column}`,
        columnMoved: (column: string, position: number) =>
            `${column} dipindahkan ke posisi ${localizeNumber(position)}`,
        columns: "Kolom",
        columnsSelected: (count: number) => `${localizeNumber(count)} kolom dipilih`,
        delete: "Hapus",
        deleteRowConfirmation: "Anda yakin ingin menghapus item ini?",
        deleteRowTitle: "Hapus baris?",
        details: "Rincian",
        dragColumnHeaderToGroup: "Seret header kolom ke sini untuk mengelompokkan",
        edit: "Sunting",
        editRow: "Sunting baris",
        expandDetail: (rowNumber: number) => `Tampilkan detail baris ${localizeNumber(rowNumber)}`,
        fieldValidationError: "Nilai tidak valid.",
        filterByColumn: (column: string) => `Saring berdasarkan kolom ${column}`,
        filterPlaceholder: "Saring...",
        group: "Grup",
        loading: "Memuat",
        modified: "Diubah",
        moveAsNext: "Pindahkan setelahnya",
        moveAsPrevious: "Pindahkan sebelumnya",
        moveRow: "Pindahkan baris",
        noData: "Tidak ada data",
        remove: "Hapus",
        removeRow: "Hapus baris",
        reorderRow: (rowNumber: number) => `Susun ulang baris ${localizeNumber(rowNumber)}`,
        resizeColumn: (column: string) => `Ubah ukuran kolom ${column}`,
        rowReorder: "Susun ulang baris",
        rowReorderDisabled: "Penyusunan ulang baris dinonaktifkan.",
        rowReorderDisabledEditing: "Selesaikan pengeditan sebelum menyusun ulang baris.",
        rowReorderDisabledFiltered: "Hapus filter sebelum menyusun ulang baris.",
        rowReorderDisabledGrouped: "Hapus pengelompokan sebelum menyusun ulang baris.",
        rowReorderDisabledServerBinding: "Baris tidak dapat disusun ulang saat pengikatan server aktif.",
        rowReorderDisabledSingleRow: "Diperlukan setidaknya dua baris untuk menyusun ulang.",
        rowReorderDisabledSorted: "Hapus pengurutan sebelum menyusun ulang baris.",
        rowReorderDisabledVirtualScroll: "Baris tidak dapat disusun ulang saat pengguliran virtual aktif.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Gunakan Alt + Panah Atas atau Alt + Panah Bawah untuk memindahkan baris.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Baris ${localizeNumber(fromRowNumber)} dipindahkan ke posisi ${localizeNumber(toPosition)}.`,
        rowValidationError: "Baris ini memiliki kesalahan validasi.",
        save: "Simpan",
        saveRow: "Simpan baris",
        selectAllRows: "Pilih semua baris",
        selectRow: (rowNumber: number) => `Pilih baris ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `Urutan pengurutan ${localizeNumber(position)}`,
        toolbar: "Bilah alat tabel"
    },
    list: {
        filterList: "Saring daftar",
        noData: "Tidak ada data"
    },
    listBox: {
        clearSelection: "Hapus semua pilihan",
        moveDown: "Pindahkan ke bawah",
        moveUp: "Pindahkan ke atas",
        remove: "Hapus",
        transferAllFrom: "Pindahkan semua dari daftar lain",
        transferAllTo: "Pindahkan semua ke daftar lain",
        transferFrom: "Pindahkan dari daftar lain",
        transferTo: "Pindahkan ke daftar lain"
    },
    multiSelect: {
        clear: "Bersihkan",
        itemsCount: (count: number) => `+ ${localizeNumber(count)} item`,
        removeMoreItems: (count: number) => `Hapus ${localizeNumber(count)} item lainnya`
    },
    notification: {
        close: "Tutup",
        error: "Kesalahan",
        info: "Informasi",
        success: "Berhasil",
        warning: "Peringatan"
    },
    numericTextBox: {
        decrease: "Kurangi nilai",
        increase: "Tambah nilai"
    },
    otpInput: {
        verificationCode: "Kode verifikasi"
    },
    pager: {
        firstPageLabel: "Halaman pertama",
        itemsPerPageLabel: "Item per halaman",
        jumpBackwardLabel: (pages: number) => `Mundur ${localizeNumber(pages)} halaman`,
        jumpForwardLabel: (pages: number) => `Maju ${localizeNumber(pages)} halaman`,
        lastPageLabel: "Halaman terakhir",
        nextPageLabel: "Halaman berikutnya",
        ofText: "/",
        pageInputPrefix: (_totalPages: number) => "Halaman",
        pageInputSuffix: (totalPages: number) => `dari ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `Halaman ${localizeNumber(page)}`,
        pageSelectLabel: "Halaman",
        pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} per halaman`,
        pageStatus: (page: number, totalPages: number) =>
            `Halaman ${localizeNumber(page)} dari ${localizeNumber(totalPages)}`,
        pageText: "Halaman",
        pagerLabel: "Penomoran halaman",
        previousPageLabel: "Halaman sebelumnya",
        rangeStatus: (start: number, end: number, total: number) =>
            `${localizeNumber(start)} - ${localizeNumber(end)} dari ${localizeNumber(total)} item`
    },
    rating: {
        notRated: "Belum dinilai",
        valueText: (value: number, max: number) => `${localizeNumber(value)} dari ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "karusel",
        nextPage: "Halaman berikutnya",
        page: (current: number) => `Halaman ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `Halaman ${localizeNumber(current)} dari ${localizeNumber(total)}`,
        previousPage: "Halaman sebelumnya",
        scrollPagerNext: "Gulir opsi halaman ke depan",
        scrollPagerPrevious: "Gulir opsi halaman ke belakang",
        slide: "slide"
    },
    sheet: {
        closeSheet: "Tutup panel"
    },
    slider: {
        maximumValue: "Nilai maksimum",
        minimumValue: "Nilai minimum",
        sliderValue: "Nilai penggeser"
    },
    spinner: {
        cancel: "Batal",
        loading: "Memuat"
    },
    splitButton: {
        menuButtonAriaLabel: "Tampilkan opsi menu",
        splitButton: (text: string) => (text ? `${text}, tombol pisah` : "Tombol pisah")
    },
    splitter: {
        collapseDown: "Ciutkan panel bawah",
        collapseNext: "Ciutkan panel berikutnya",
        collapsePrevious: "Ciutkan panel sebelumnya",
        collapseUp: "Ciutkan panel atas",
        resizer: "Pemisah panel"
    },
    stepper: {
        stepProgress: "Progres langkah",
        stepper: "Langkah"
    },
    tabs: {
        closeTab: "Tutup tab",
        scrollNext: "Gulir tab ke depan",
        scrollPrevious: "Gulir tab ke belakang"
    },
    textBox: {
        clear: "Bersihkan"
    },
    timePicker: {
        openTimePicker: "Buka pemilih waktu",
        timePicker: "Pemilih waktu"
    },
    timeSelector: {
        am: "AM",
        amPm: "AM/PM",
        headerHours: "jam",
        headerMinutes: "mnt",
        headerSeconds: "dtk",
        hours: "Jam",
        minutes: "Menit",
        now: "Sekarang",
        pm: "PM",
        seconds: "Detik",
        set: "Atur",
        timeSelector: "Pemilih waktu"
    },
    treeView: {
        collapse: "Ciutkan",
        expand: "Perluas",
        filter: "Saring",
        filterTree: "Saring pohon"
    },
    window: {
        close: "Tutup",
        closeWindow: "Tutup jendela",
        maximize: "Maksimalkan",
        minimize: "Minimalkan",
        moveWindow: "Pindahkan jendela. Gunakan tombol panah untuk memindahkan.",
        resizeBottom: "Ubah ukuran jendela dari tepi bawah. Gunakan tombol panah untuk mengubah ukuran.",
        resizeBottomLeft: "Ubah ukuran jendela dari sudut kiri bawah. Gunakan tombol panah untuk mengubah ukuran.",
        resizeBottomRight: "Ubah ukuran jendela dari sudut kanan bawah. Gunakan tombol panah untuk mengubah ukuran.",
        resizeLeft: "Ubah ukuran jendela dari tepi kiri. Gunakan tombol panah untuk mengubah ukuran.",
        resizeRight: "Ubah ukuran jendela dari tepi kanan. Gunakan tombol panah untuk mengubah ukuran.",
        resizeTop: "Ubah ukuran jendela dari tepi atas. Gunakan tombol panah untuk mengubah ukuran.",
        resizeTopLeft: "Ubah ukuran jendela dari sudut kiri atas. Gunakan tombol panah untuk mengubah ukuran.",
        resizeTopRight: "Ubah ukuran jendela dari sudut kanan atas. Gunakan tombol panah untuk mengubah ukuran.",
        restore: "Pulihkan"
    }
} satisfies MonaLocaleMessages;
