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
        breadcrumb: "Navigasi remah roti",
        showFullPath: "Tampilkan jalur lengkap"
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
        announcementSeparator: ", ",
        brushApplied: (count: number) => `Seleksi diterapkan, ${localizeNumber(count)} titik`,
        brushCleared: "Seleksi dihapus",
        brushRange: (from: string, to: string) => `Seleksi dari ${from} hingga ${to}`,
        category: "Kategori",
        categoryFallbackName: (index: number) => `Kategori ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `Dari ${from} hingga ${to}.`,
        change: "Perubahan",
        changeValue: (change: string) => `perubahan ${change}`,
        chart: "Bagan",
        chartLegend: "Legenda bagan",
        chartRoleDescription: "diagram",
        close: "Penutupan",
        closeAbbreviation: "P",
        colorScale: "Skala warna",
        conversion: "Konversi",
        conversionOfPrevious: (rate: string) => `Konversi ${rate} dari tahap sebelumnya`,
        dataTableTruncated: (shown: number, total: number) =>
            `Menampilkan ${localizeNumber(shown)} baris pertama dari ${localizeNumber(total)}.`,
        decrease: "Pengurangan",
        decreaseAnnouncement: (delta: string, from: string, to: string) =>
            `pengurangan ${delta}, total berjalan ${from} hingga ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, ${minimum} hingga ${maximum}, titik tengah ${midpoint}`,
        dropOff: "Penurunan",
        dropOffValue: (value: string) => `Penurunan ${value}`,
        falling: "Turun",
        gaugeRange: (minimum: string, maximum: string) => `rentang ${minimum} hingga ${maximum}`,
        high: "Tertinggi",
        highAbbreviation: "T",
        increase: "Kenaikan",
        increaseAnnouncement: (delta: string, from: string, to: string) =>
            `kenaikan ${delta}, total berjalan ${from} hingga ${to}`,
        itemDeselected: (item: string) => `${item}, batal dipilih`,
        itemFallbackName: (index: number) => `Butir ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}, dipilih`,
        keyboardHelp:
            "Gunakan tombol panah untuk berpindah antar titik data, Home dan End untuk melompat ke yang pertama dan terakhir, Enter atau Spasi untuk mengaktifkan, dan Escape untuk menghapus.",
        labelValueSeparator: ":",
        labeledValue: (label: string, value: string) => `${label}: ${value}`,
        low: "Terendah",
        lowAbbreviation: "R",
        noChange: "Tidak berubah",
        noChangeAnnouncement: (value: string) => `tidak berubah, total berjalan ${value}`,
        noData: "Tidak ada data",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `Pembukaan ${open}, tertinggi ${high}, terendah ${low}, penutupan ${close}`,
        open: "Pembukaan",
        openAbbreviation: "B",
        overall: "Keseluruhan",
        overallConversion: (rate: string) => `Konversi keseluruhan ${rate}`,
        pannedDown: "Digeser ke bawah",
        pannedLeft: "Digeser ke kiri",
        pannedRight: "Digeser ke kanan",
        pannedUp: "Digeser ke atas",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) => `${localizeNumber(position)} dari ${localizeNumber(total)}`,
        range: "Rentang",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, ${minimum} hingga ${maximum}`,
        rangeValue: (from: string, to: string) => `${from} hingga ${to}`,
        rising: "Naik",
        runningTotal: "Total berjalan",
        seriesFallbackName: (index: number) => `Seri ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `${series} disembunyikan`,
        seriesShown: (series: string) => `${series} ditampilkan`,
        seriesSummary: (count: number, names: string) => `${localizeNumber(count)} seri: ${names}.`,
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}: terendah ${minimum}, tertinggi ${maximum}.`,
        shareOfTotal: (share: string) => `${share} dari total`,
        size: "ukuran",
        sizeValue: (size: string) => `ukuran ${size}`,
        stackShare: (share: string) => `porsi tumpukan ${share}`,
        stageFallbackName: (index: number) => `Tahap ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) =>
            `tahap ${localizeNumber(position)} dari ${localizeNumber(total)}`,
        stepFallbackName: (index: number) => `Langkah ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `langkah ${localizeNumber(position)} dari ${localizeNumber(total)}`,
        subtotal: "Jumlah sementara",
        subtotalAnnouncement: (value: string) => `jumlah sementara ${value}`,
        total: "Jumlah",
        totalAnnouncement: (value: string) => `jumlah ${value}`,
        treemapGroup: (count: number) => `Grup (${localizeNumber(count)} turunan)`,
        treemapLeaf: "Daun",
        unchanged: "Tidak berubah",
        value: "Nilai",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "Tampilan diatur ulang ke rentang bawaan",
        viewportResetToFull: "Tampilan diatur ulang ke rentang penuh",
        visualIndicatorClamped: "Indikator visual dibatasi",
        zoomedIn: "Diperbesar",
        zoomedOut: "Diperkecil"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Hapus ${label}` : "Hapus item")
    },
    colorGradient: {
        alpha: "Saluran alfa",
        alphaText: (opacity: number) => `Opasitas ${localizeNumber(opacity)}%`,
        apply: "Terapkan",
        blue: "Biru",
        cancel: "Batal",
        clearColor: "Hapus warna",
        colorCopied: "Warna disalin",
        colorGradient: "Gradien warna",
        copyAsHex: "Salin sebagai HEX",
        copyAsRgb: "Salin sebagai RGB",
        copyColor: "Salin warna",
        copyFailed: "Tidak dapat menyalin warna",
        currentColor: "Warna saat ini",
        green: "Hijau",
        hexColor: "Warna heksadesimal",
        hue: "Rona",
        previousColor: "Warna sebelumnya",
        red: "Merah",
        saturation: "Saturasi",
        saturationAndValue: "Saturasi dan nilai warna",
        saturationAndValueText: (saturation: number, value: number) =>
            `Saturasi ${localizeNumber(saturation)}%, nilai ${localizeNumber(value)}%`,
        switchColorMode: "Ganti mode warna",
        value: "Nilai"
    },
    colorPalette: {
        color: (color: string) => `Warna: ${color}`,
        colorPalette: "Palet warna",
        namedColor: (name: string, color: string) => `${name}, ${color}`
    },
    colorPicker: {
        clearColor: "Hapus warna",
        colorGradientPicker: "Pemilih gradien warna",
        colorPalettePicker: "Pemilih palet warna",
        colorPicker: "Pemilih warna",
        noColor: "Tanpa warna"
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
        alignEnd: "Ratakan teks ke akhir",
        alignLeft: "Rata kiri",
        alignRight: "Rata kanan",
        alignStart: "Ratakan teks ke awal",
        alignmentGroup: "Perataan",
        altText: "Teks alternatif",
        apply: "Terapkan",
        backgroundColor: "Warna latar belakang",
        bold: "Tebal",
        cancel: "Batal",
        codeBlock: "Blok kode",
        color: "Warna",
        contentLabel: "Editor teks kaya",
        defaultFontFamily: "Font default",
        deleteColumn: "Hapus kolom",
        deleteRow: "Hapus baris",
        deleteTable: "Hapus tabel",
        editLink: "Edit tautan",
        enterUrl: "Masukkan URL",
        fontSize: "Ukuran font",
        format: "Pemformatan",
        heading: (level: number) => `Judul ${localizeNumber(level)}`,
        heightPx: "Tinggi (px)",
        historyGroup: "Riwayat",
        imageUrl: "URL gambar",
        indent: "Tambah inden",
        indentGroup: "Indentasi",
        insert: "Sisipkan",
        insertImage: "Sisipkan gambar",
        insertLink: "Sisipkan tautan",
        insertOrderedList: "Sisipkan daftar bernomor",
        insertTable: "Sisipkan tabel",
        insertTaskList: "Sisipkan daftar tugas",
        insertUnorderedList: "Sisipkan daftar berpoin",
        invalidUrl: "Masukkan alamat web, tautan mailto: atau tel:, atau jalur relatif.",
        italic: "Miring",
        justify: "Rata kiri-kanan",
        linkGroup: "Tautan",
        listGroup: "Daftar",
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
        tableGroup: "Tabel",
        tableSize: (rows: number, columns: number) =>
            `Baris: ${localizeNumber(rows)}, kolom: ${localizeNumber(columns)}`,
        textStyleGroup: "Gaya teks",
        toggleHeaderRow: "Aktifkan/nonaktifkan baris header",
        toolbar: "Pemformatan",
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
        logic: "Gabungkan kondisi",
        operator: "Operator",
        or: "Atau",
        secondOperator: "Operator kedua",
        secondValue: "Nilai kedua",
        startsWith: "Diawali dengan",
        value: "Nilai"
    },
    grid: {
        all: "(Semua)",
        apply: "Terapkan",
        cancel: "Batal",
        cancelNewRow: "Batalkan baris baru",
        cancelRowEdit: (rowNumber: number) => `Batalkan pengeditan baris ${localizeNumber(rowNumber)}`,
        clearFilter: (column: string) => `Bersihkan saringan kolom ${column}`,
        collapseDetail: (rowNumber: number) => `Sembunyikan detail baris ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `Dikelompokkan menurut ${column}`,
        columnMoved: (column: string, position: number) =>
            `${column} dipindahkan ke posisi ${localizeNumber(position)}`,
        columns: "Kolom",
        columnsSelected: (count: number) => `${localizeNumber(count)} kolom dipilih`,
        commandColumnTitle: "Perintah",
        delete: "Hapus",
        deleteRowConfirmation: (rowNumber: number) => `Anda yakin ingin menghapus baris ${localizeNumber(rowNumber)}?`,
        deleteRowTitle: "Hapus baris?",
        details: "Rincian",
        dragColumnHeaderToGroup: "Seret header kolom ke sini untuk mengelompokkan",
        edit: "Sunting",
        editRow: (rowNumber: number) => `Sunting baris ${localizeNumber(rowNumber)}`,
        expandDetail: (rowNumber: number) => `Tampilkan detail baris ${localizeNumber(rowNumber)}`,
        fieldValidationError: "Nilai tidak valid.",
        filterByColumn: (column: string) => `Saring berdasarkan kolom ${column}`,
        filterByColumnFiltered: (column: string) => `Saring berdasarkan kolom ${column}, tersaring`,
        filterOperator: (column: string, operator: string) => `Operator saringan kolom ${column}: ${operator}`,
        filterPlaceholder: "Saring...",
        group: "Grup",
        groupOptions: (column: string) => `Opsi grup ${column}`,
        loading: "Memuat",
        modified: "Diubah",
        moveAsNext: "Pindahkan setelahnya",
        moveAsPrevious: "Pindahkan sebelumnya",
        moveRow: "Pindahkan baris",
        noData: "Tidak ada data",
        remove: "Hapus",
        removeRow: (rowNumber: number) => `Hapus baris ${localizeNumber(rowNumber)}`,
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
        saveNewRow: "Simpan baris baru",
        saveRow: (rowNumber: number) => `Simpan baris ${localizeNumber(rowNumber)}`,
        selectAllRows: "Pilih semua baris",
        selectRow: (rowNumber: number) => `Pilih baris ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `Urutan pengurutan ${localizeNumber(position)}`,
        toolbar: "Bilah alat tabel"
    },
    label: {
        optional: "Opsional"
    },
    list: {
        filterList: "Saring daftar",
        loading: "Memuat",
        noData: "Tidak ada data",
        pagerLabel: (list: string) => `Penomoran halaman ${list}`
    },
    listBox: {
        clearSelection: "Hapus semua pilihan",
        itemsMoved: (position: number, total: number) =>
            `Dipindahkan ke posisi ${localizeNumber(position)} dari ${localizeNumber(total)}`,
        itemsRemoved: (count: number) => `${localizeNumber(count)} item dihapus`,
        itemsTransferred: (count: number, list: string) => `${localizeNumber(count)} item dipindahkan ke ${list}`,
        itemsTransferredToOtherList: (count: number) => `${localizeNumber(count)} item dipindahkan ke daftar lain`,
        moveDown: "Pindahkan ke bawah",
        moveUp: "Pindahkan ke atas",
        remove: "Hapus",
        selectionCleared: "Pilihan dihapus",
        toolbarLabel: (list: string) => `Tindakan ${list}`,
        transferAllFrom: "Pindahkan semua dari daftar lain",
        transferAllFromList: (list: string) => `Pindahkan semua dari ${list}`,
        transferAllTo: "Pindahkan semua ke daftar lain",
        transferAllToList: (list: string) => `Pindahkan semua ke ${list}`,
        transferFrom: "Pindahkan dari daftar lain",
        transferFromList: (list: string) => `Pindahkan dari ${list}`,
        transferTo: "Pindahkan ke daftar lain",
        transferToList: (list: string) => `Pindahkan ke ${list}`
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
        region: "Notifikasi",
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
    progressBar: {
        label: "Kemajuan"
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
        pages: "Halaman",
        previousPage: "Halaman sebelumnya",
        scrollPagerNext: "Gulir opsi halaman ke depan",
        scrollPagerPrevious: "Gulir opsi halaman ke belakang",
        slide: "slide"
    },
    sheet: {
        closeSheet: "Tutup panel"
    },
    sidebar: {
        drawerLabel: "Bilah sisi",
        rail: "Tampilkan atau sembunyikan bilah sisi"
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
        menuButtonWithText: (text: string) => `Opsi ${text} lainnya`,
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
        stepCompleted: "Selesai",
        stepInvalid: "Ada kesalahan",
        stepPosition: (current: number, total: number) =>
            `Langkah ${localizeNumber(current)} dari ${localizeNumber(total)}`,
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
        filterLabel: (tree: string) => `Saring ${tree}`,
        filterTree: "Saring pohon",
        loadError: (node: string) => `Tidak dapat memuat item di ${node}`,
        loadingNode: (node: string) => `Memuat ${node}`,
        movedAfter: (node: string, target: string) => `${node} dipindahkan setelah ${target}`,
        movedBefore: (node: string, target: string) => `${node} dipindahkan sebelum ${target}`,
        movedInto: (node: string, target: string) => `${node} dipindahkan ke dalam ${target}`,
        noData: "Tidak ada data",
        noMatches: "Tidak ada item yang cocok",
        results: (count: number) => `${localizeNumber(count)} hasil`,
        retryLoading: (node: string) => `Coba muat ulang ${node}`
    },
    window: {
        close: "Tutup",
        closeWindow: "Tutup jendela",
        maximize: "Maksimalkan",
        minimize: "Minimalkan",
        moveOrResizeWindow:
            "Pindahkan atau ubah ukuran jendela. Gunakan tombol panah untuk memindahkan, atau Ctrl dan tombol panah untuk mengubah ukuran.",
        moveWindow: "Pindahkan jendela. Gunakan tombol panah untuk memindahkan.",
        resizeBottom: "Ubah ukuran jendela dari tepi bawah. Gunakan tombol panah untuk mengubah ukuran.",
        resizeBottomLeft: "Ubah ukuran jendela dari sudut kiri bawah. Gunakan tombol panah untuk mengubah ukuran.",
        resizeBottomRight: "Ubah ukuran jendela dari sudut kanan bawah. Gunakan tombol panah untuk mengubah ukuran.",
        resizeLeft: "Ubah ukuran jendela dari tepi kiri. Gunakan tombol panah untuk mengubah ukuran.",
        resizeRight: "Ubah ukuran jendela dari tepi kanan. Gunakan tombol panah untuk mengubah ukuran.",
        resizeTop: "Ubah ukuran jendela dari tepi atas. Gunakan tombol panah untuk mengubah ukuran.",
        resizeTopLeft: "Ubah ukuran jendela dari sudut kiri atas. Gunakan tombol panah untuk mengubah ukuran.",
        resizeTopRight: "Ubah ukuran jendela dari sudut kanan atas. Gunakan tombol panah untuk mengubah ukuran.",
        resizeWindow: "Ubah ukuran jendela. Gunakan Ctrl dan tombol panah untuk mengubah ukuran.",
        restore: "Pulihkan"
    }
} satisfies MonaLocaleMessages;
