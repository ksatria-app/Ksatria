export type SystemLanguage = 'id' | 'en';
export type ThemeVariant = 'royal' | 'amethyst' | 'lavender';

export interface ProceduralStep {
  id: string;
  stepNumber: number;
  verbBadge: string; // e.g. "MENAKAR", "MENUANGKAN", "MENGADUK", "MEMANGGANG"
  titleId: string; // Always Indonesian content (pelajaran Bahasa Indonesia)
  instructionId: string; // Always Indonesian content
  linguisticNoteId: string; // Kaidah Kebahasaan Teks Prosedur
  unit: string;
  minVal: number;
  maxVal: number;
  targetVal: number;
  tolerance: number;
  stepIncrement: number;
  actionButtonLabelId: string;
  cameraPreset: [number, number, number];
  lookAtPreset: [number, number, number];
}

export interface ProceduralLevel {
  id: number;
  slug: string;
  title: string; // Konten Bahasa Indonesia
  subtitle: string;
  categoryVerb: string;
  difficultyLabel: string;
  xpReward: number;
  teksProsedur: {
    tujuan: string;
    bahanAlat: string[];
    langkahRingkas: string[];
    penutup: string;
  };
  steps: ProceduralStep[];
}

export const PROCEDURAL_LEVELS: ProceduralLevel[] = [
  {
    id: 1,
    slug: 'membuat-kue-cubit',
    title: 'Cara Membuat Kue Cubit Lumer',
    subtitle: 'Praktik Menakar, Menuang, Mengaduk & Memanggang',
    categoryVerb: 'Membuat & Memasak',
    difficultyLabel: 'Level 1 · Dasar',
    xpReward: 150,
    teksProsedur: {
      tujuan:
        'Teks prosedur ini bertujuan memandu pembaca membuat kue cubit tradisional yang lembut di bagian dalam dan matang merata dengan takaran bahan yang presisi.',
      bahanAlat: [
        '150 gram tepung terigu protein sedang',
        '120 ml susu cair hangat',
        'Gelas ukur, mangkuk adonan, dan pengocok (whisk)',
        'Cetakan kue cubit dan kompor dengan suhu 180°C',
      ],
      langkahRingkas: [
        'Pertama, takarlah 150 gram tepung terigu menggunakan gelas ukur secara tepat.',
        'Kedua, tuangkan 120 ml susu cair hangat ke dalam mangkuk secara perlahan.',
        'Ketiga, aduklah seluruh adonan menggunakan whisk hingga 100% kalis dan tidak menggumpal.',
        'Terakhir, pangganglah adonan di atas cetakan pada suhu 180°C hingga matang keemasan.',
      ],
      penutup:
        'Kue cubit lumer siap disajikan selagi hangat. Dengan mengikuti takaran dan urutan langkah secara tepat, tekstur kue menjadi empuk dan lezat.',
    },
    steps: [
      {
        id: 'l1-s1',
        stepNumber: 1,
        verbBadge: 'MENAKAR',
        titleId: 'Langkah 1: Menakar Tepung Terigu',
        instructionId:
          'Takarlah tepat 150 gram tepung terigu protein sedang ke dalam gelas ukur 3D. Gunakan tombol Tuang atau geser pengatur takaran hingga mencapai garis target!',
        linguisticNoteId:
          'Kaidah Kebahasaan: Menggunakan kalimat imperatif ("Takarlah") dan keterangan ukuran akurat ("150 gram").',
        unit: 'gram',
        minVal: 0,
        maxVal: 250,
        targetVal: 150,
        tolerance: 10,
        stepIncrement: 15,
        actionButtonLabelId: 'Tuang Tepung (+15g)',
        cameraPreset: [-2.1, 2.5, 4.3],
        lookAtPreset: [-0.8, 0.35, 0.2],
      },
      {
        id: 'l1-s2',
        stepNumber: 2,
        verbBadge: 'MENUANGKAN',
        titleId: 'Langkah 2: Menuangkan Susu Cair Hangat',
        instructionId:
          'Kemudian, tuangkan 120 ml susu cair hangat ke dalam mangkuk adonan secara perlahan agar adonan tidak terlalu encer maupun kental.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Menggunakan konjungsi temporal ("Kemudian") dan adverbia cara ("secara perlahan").',
        unit: 'ml',
        minVal: 0,
        maxVal: 200,
        targetVal: 120,
        tolerance: 10,
        stepIncrement: 15,
        actionButtonLabelId: 'Tuang Susu (+15ml)',
        cameraPreset: [0, 2.7, 4.4],
        lookAtPreset: [0, 0.35, 0.2],
      },
      {
        id: 'l1-s3',
        stepNumber: 3,
        verbBadge: 'MENGADUK',
        titleId: 'Langkah 3: Mengaduk Adonan Hingga Kalis',
        instructionId:
          'Selanjutnya, aduklah campuran tepung dan susu menggunakan pengocok (whisk) hingga tingkat kehalusan mencapai 100% kalis tanpa gumpalan.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Menggunakan verba material ("aduklah") dan keterangan tujuan/hasil ("hingga 100% kalis").',
        unit: '%',
        minVal: 0,
        maxVal: 100,
        targetVal: 100,
        tolerance: 5,
        stepIncrement: 20,
        actionButtonLabelId: 'Putar Whisk (+20%)',
        cameraPreset: [0.4, 2.6, 4.1],
        lookAtPreset: [0, 0.4, 0.2],
      },
      {
        id: 'l1-s4',
        stepNumber: 4,
        verbBadge: 'MEMANGGANG',
        titleId: 'Langkah 4: Memanggang pada Suhu Ideal',
        instructionId:
          'Terakhir, nyalakan kompor dan aturlah suhu pemanggangan cetakan kue cubit tepat pada 180°C agar kue mengembang sempurna dan tidak gosong.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Menggunakan konjungsi urutan akhir ("Terakhir") dan batasan suhu ("pada 180°C").',
        unit: '°C',
        minVal: 80,
        maxVal: 240,
        targetVal: 180,
        tolerance: 10,
        stepIncrement: 20,
        actionButtonLabelId: 'Naikkan Suhu (+20°C)',
        cameraPreset: [2.0, 2.5, 4.3],
        lookAtPreset: [0.9, 0.35, 0.2],
      },
    ],
  },
  {
    id: 2,
    slug: 'merakit-router-wifi',
    title: 'Cara Merakit & Memasang Router Wi-Fi',
    subtitle: 'Praktik Memasang, Mencolokkan & Mengonfigurasi Perangkat',
    categoryVerb: 'Merakit & Memasang',
    difficultyLabel: 'Level 2 · Menengah',
    xpReward: 200,
    teksProsedur: {
      tujuan:
        'Memandu pengguna merakit antena, menyambungkan kabel jaringan internet (WAN), serta menyalakan router Wi-Fi rumah agar memancarkan sinyal internet yang stabil.',
      bahanAlat: [
        '1 unit Router Wi-Fi beserta 2 antena omnidirectional',
        '1 utas kabel LAN RJ45 dari modem utama',
        '1 unit adaptor daya listrik 12 Volt',
      ],
      langkahRingkas: [
        'Pertama, pasanglah kedua antena pemancar pada port ulir belakang hingga tegak lurus 90°.',
        'Kedua, colokkan konektor kabel LAN RJ45 ke port WAN berwarna biru hingga terkunci 100%.',
        'Ketiga, sambungkan kabel adaptor daya pada tegangan tepat 12 Volt ke soket DC-IN.',
        'Terakhir, tekanlah tombol daya dan optimalkan pancaran sinyal Wi-Fi hingga 100%.',
      ],
      penutup:
        'Router Wi-Fi kini aktif dengan lampu indikator hijau menyala stabil dan siap menghubungkan seluruh perangkat di rumah.',
    },
    steps: [
      {
        id: 'l2-s1',
        stepNumber: 1,
        verbBadge: 'MEMASANG',
        titleId: 'Langkah 1: Memasang Antena Pemancar',
        instructionId:
          'Pasanglah kedua antena pada port ulir di bagian belakang router, lalu tegakkan sudut kemiringannya tepat pada 90 derajat agar jangkauan sinyal merata.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Verba tindakan fisik ("Pasanglah", "tegakkan") disertai keterangan sudut ("90 derajat").',
        unit: '°',
        minVal: 0,
        maxVal: 120,
        targetVal: 90,
        tolerance: 6,
        stepIncrement: 15,
        actionButtonLabelId: 'Tegakkan Antena (+15°)',
        cameraPreset: [-1.8, 2.5, 4.4],
        lookAtPreset: [0, 0.45, 0.2],
      },
      {
        id: 'l2-s2',
        stepNumber: 2,
        verbBadge: 'MENCOLOKKAN',
        titleId: 'Langkah 2: Mencolokkan Kabel LAN ke Port WAN',
        instructionId:
          'Selanjutnya, colokkan ujung konektor RJ45 dari modem ke dalam port WAN berwarna biru hingga masuk 100% dan terdengar bunyi klik pengunci.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Kalimat perintah spesifik ("colokkan") dengan penanda lokasi ("port WAN berwarna biru").',
        unit: '%',
        minVal: 0,
        maxVal: 100,
        targetVal: 100,
        tolerance: 5,
        stepIncrement: 25,
        actionButtonLabelId: 'Dorong Konektor RJ45 (+25%)',
        cameraPreset: [1.6, 2.4, 4.2],
        lookAtPreset: [0.2, 0.35, 0.3],
      },
      {
        id: 'l2-s3',
        stepNumber: 3,
        verbBadge: 'MENYAMBUNGKAN',
        titleId: 'Langkah 3: Menyambungkan Adaptor Daya 12V',
        instructionId:
          'Kemudian, sambungkan konektor adaptor listrik ke lubang DC-IN dan pastikan tegangan keluaran berada tepat pada 12 Volt agar perangkat aman.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Penggunaan kata penghubung urutan ("Kemudian") dan syarat keamanan ("agar perangkat aman").',
        unit: 'V',
        minVal: 0,
        maxVal: 18,
        targetVal: 12,
        tolerance: 1,
        stepIncrement: 3,
        actionButtonLabelId: 'Atur Tegangan (+3V)',
        cameraPreset: [-1.5, 2.4, 4.2],
        lookAtPreset: [-0.2, 0.35, 0.3],
      },
      {
        id: 'l2-s4',
        stepNumber: 4,
        verbBadge: 'MENYALAKAN',
        titleId: 'Langkah 4: Menyalakan & Kalibrasi Sinyal Wi-Fi',
        instructionId:
          'Terakhir, tekanlah tombol Power di belakang router dan kalibrasi daya pancar frekuensi hingga indikator sinyal mencapai kekuatan 100%.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Penutup langkah menggunakan kata "Terakhir" dan verba imperatif "tekanlah".',
        unit: '%',
        minVal: 0,
        maxVal: 100,
        targetVal: 100,
        tolerance: 5,
        stepIncrement: 25,
        actionButtonLabelId: 'Pancarkan Sinyal (+25%)',
        cameraPreset: [0, 2.9, 4.6],
        lookAtPreset: [0, 0.5, 0.2],
      },
    ],
  },
  {
    id: 3,
    slug: 'mendaftar-kartu-perpustakaan',
    title: 'Cara Mengunduh & Mendaftar e-Pustaka Nasional',
    subtitle: 'Praktik Mengunduh, Memasang, Mengisi & Memverifikasi',
    categoryVerb: 'Mengunduh & Mendaftar',
    difficultyLabel: 'Level 3 · Mahir',
    xpReward: 250,
    teksProsedur: {
      tujuan:
        'Memandu siswa mengunduh aplikasi perpustakaan digital, memasang paket di perangkat, mengisi formulir pendaftaran, dan mengaktifkan kartu anggota melalui pemindaian QR.',
      bahanAlat: [
        '1 unit Tablet pintar dengan koneksi internet stabil',
        'Ruang penyimpanan kosong minimal 250 MB',
        'Data Nomor Induk Pelajar (NISN) dan kartu identitas sekolah',
      ],
      langkahRingkas: [
        'Pertama, unduhlah berkas instalasi resmi aplikasi e-Pustaka berukuran 100 MB hingga tuntas.',
        'Kedua, pasanglah aplikasi dengan mengalokasikan ruang penyimpanan tepat 250 MB.',
        'Ketiga, isilah formulir pendaftaran anggota elektronik hingga kelengkapan data mencapai 100%.',
        'Terakhir, pindailah kode QR aktivasi pada jarak fokus optik 50 mm hingga kartu digital terbit.',
      ],
      penutup:
        'Kartu Perpustakaan Digital Ksatria telah aktif! Anda kini dapat meminjam ribuan buku elektronik secara gratis kapan saja.',
    },
    steps: [
      {
        id: 'l3-s1',
        stepNumber: 1,
        verbBadge: 'MENGUNDUH',
        titleId: 'Langkah 1: Mengunduh Paket Aplikasi e-Pustaka',
        instructionId:
          'Pertama, unduhlah paket aplikasi resmi e-Pustaka berukuran 100 MB pada tablet pintar 3D hingga seluruh paket data selesai diterima.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Menggunakan verba "unduhlah" (partikel -lah) untuk menegaskan instruksi awal.',
        unit: 'MB',
        minVal: 0,
        maxVal: 100,
        targetVal: 100,
        tolerance: 5,
        stepIncrement: 25,
        actionButtonLabelId: 'Unduh Paket (+25 MB)',
        cameraPreset: [-1.4, 2.5, 4.3],
        lookAtPreset: [0, 0.55, 0.2],
      },
      {
        id: 'l3-s2',
        stepNumber: 2,
        verbBadge: 'MEMASANG',
        titleId: 'Langkah 2: Mengalokasikan Ruang Penyimpanan',
        instructionId:
          'Kedua, pasanglah aplikasi pada sistem tablet dan aturlah alokasi ruang cache perpustakaan tepat sebesar 250 MB agar buku offline berjalan lancar.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Konjungsi urutan ("Kedua") diikuti klausa tujuan ("agar buku offline berjalan lancar").',
        unit: 'MB',
        minVal: 50,
        maxVal: 350,
        targetVal: 250,
        tolerance: 15,
        stepIncrement: 50,
        actionButtonLabelId: 'Tambah Alokasi (+50 MB)',
        cameraPreset: [0, 2.6, 4.2],
        lookAtPreset: [0, 0.55, 0.2],
      },
      {
        id: 'l3-s3',
        stepNumber: 3,
        verbBadge: 'MENGISI',
        titleId: 'Langkah 3: Mengisi Formulir Pendaftaran Anggota',
        instructionId:
          'Ketiga, isilah seluruh kolom formulir pendaftaran (Nama Lengkap, NISN, Sekolah, dan Kelas) hingga bilah kelengkapan formulir mencapai 100%.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Rincian objek yang harus dilengkapi dalam kalimat perintah ("isilah seluruh kolom...").',
        unit: '%',
        minVal: 0,
        maxVal: 100,
        targetVal: 100,
        tolerance: 5,
        stepIncrement: 25,
        actionButtonLabelId: 'Isi Kolom Data (+25%)',
        cameraPreset: [1.4, 2.5, 4.3],
        lookAtPreset: [0, 0.55, 0.2],
      },
      {
        id: 'l3-s4',
        stepNumber: 4,
        verbBadge: 'MEMVERIFIKASI',
        titleId: 'Langkah 4: Memindai Kode QR Aktivasi Kartu',
        instructionId:
          'Terakhir, arahkan lensa pemindai optik pada jarak fokus tepat 50 mm di atas kode QR untuk menerbitkan Kartu Anggota Perpustakaan Digital Anda.',
        linguisticNoteId:
          'Kaidah Kebahasaan: Keterangan alat ("lensa pemindai optik") dan ukuran jarak presisi ("50 mm").',
        unit: 'mm',
        minVal: 10,
        maxVal: 90,
        targetVal: 50,
        tolerance: 5,
        stepIncrement: 10,
        actionButtonLabelId: 'Atur Fokus Lensa (+10 mm)',
        cameraPreset: [0, 2.7, 4.4],
        lookAtPreset: [0.3, 0.55, 0.2],
      },
    ],
  },
];

export interface SystemDictionary {
  appName: string;
  tagline: string;
  startLearning: string;
  googleSignIn: string;
  registerAccount: string;
  continueAsKsatria: string;
  controlHint: string;
  levelMap: string;
  leaderboard: string;
  settings: string;
  profile: string;
  stepProgress: string;
  targetLabel: string;
  currentValue: string;
  verifyStep: string;
  resetValue: string;
  explodedView: string;
  cameraAngle: string;
  hideControls: string;
  showControls: string;
  pauseTitle: string;
  resumeGame: string;
  restartLevel: string;
  backToTitle: string;
  victoryTitle: string;
  victorySubtitle: string;
  clearTime: string;
  xpEarned: string;
  accuracy: string;
  nextLevel: string;
  playAgain: string;
  languageSetting: string;
  languageNote: string;
  themeSetting: string;
  darkModeSetting: string;
  reminderSetting: string;
  reminderEnable: string;
  reminderTime: string;
  encryptionTitle: string;
  encryptionDesc: string;
  cloudSyncTitle: string;
  cloudSynced: string;
  offlineCached: string;
  syncNow: string;
  teksProsedurGuide: string;
  closeModal: string;
  saveProfile: string;
  studentNameLabel: string;
  studentClassLabel: string;
  privateNotesLabel: string;
  installApp: string;
}

export const SYSTEM_STRINGS: Record<SystemLanguage, SystemDictionary> = {
  id: {
    appName: 'Teka-Teki by Ksatria',
    tagline: 'Petualangan 3D Interaktif Teks Prosedur Bahasa Indonesia',
    startLearning: 'Mulai Praktik 3D',
    googleSignIn: 'Masuk dengan Google',
    registerAccount: 'Daftar Akun Ksatria',
    continueAsKsatria: 'Akun Ksatria Aktif',
    controlHint: 'WASD / Seret: Putar Kamera · Space / Klik 3D: Lakukan Langkah · 1-3: Pilih Level · H: Sembunyikan Dock · Esc: Jeda',
    levelMap: 'Jalur Level',
    leaderboard: 'Papan Skor',
    settings: 'Pengaturan',
    profile: 'Akun Ksatria',
    stepProgress: 'Tahap Prosedur',
    targetLabel: 'Target Presisi',
    currentValue: 'Takaran Saat Ini',
    verifyStep: 'Periksa & Selesaikan Langkah',
    resetValue: 'Ulangi Takaran',
    explodedView: 'Bedah Komponen 3D',
    cameraAngle: 'Sudut Kamera',
    hideControls: 'Sembunyikan Panel [H]',
    showControls: 'Tampilkan Panel [H]',
    pauseTitle: 'Simulasi Dijeda',
    resumeGame: 'Lanjutkan Praktik',
    restartLevel: 'Ulangi Level Ini',
    backToTitle: 'Layar Utama',
    victoryTitle: 'Prosedur Tuntas!',
    victorySubtitle: 'Seluruh langkah Teks Prosedur berhasil dipraktikkan dengan presisi.',
    clearTime: 'Waktu Selesai',
    xpEarned: 'Skor XP',
    accuracy: 'Ketepatan',
    nextLevel: 'Lanjut Level Berikutnya',
    playAgain: 'Praktik Lagi',
    languageSetting: 'Bahasa Sistem (Antarmuka)',
    languageNote: 'Hanya mengubah bahasa tombol & sistem. Materi Teks Prosedur tetap berbahasa Indonesia.',
    themeSetting: 'Kustomisasi Tema Ungu',
    darkModeSetting: 'Mode Malam (Dark Mode)',
    reminderSetting: 'Pengingat Belajar Harian',
    reminderEnable: 'Aktifkan Notifikasi Harian',
    reminderTime: 'Waktu Pengingat',
    encryptionTitle: 'Enkripsi Privasi AES-256-GCM',
    encryptionDesc: 'Data identitas & catatan belajar dienkripsi di perangkat menggunakan standar kriptografi Web Crypto AES-256-GCM sebelum disimpan.',
    cloudSyncTitle: 'Sinkronisasi Cloud & Mode Offline',
    cloudSynced: 'Tersinkron ke Firebase Cloud',
    offlineCached: 'Mode Offline Aktif (Tersimpan Lokal)',
    syncNow: 'Sinkronkan Sekarang',
    teksProsedurGuide: 'Buka Lembar Teks Prosedur',
    closeModal: 'Tutup',
    saveProfile: 'Simpan & Enkripsi Profil',
    studentNameLabel: 'Nama Ksatria (Siswa)',
    studentClassLabel: 'Kelas / Sekolah',
    privateNotesLabel: 'Catatan Belajar Pribadi (Dienkripsi AES-256)',
    installApp: 'Pasang Aplikasi (Offline)',
  },
  en: {
    appName: 'Teka-Teki by Ksatria',
    tagline: 'Interactive 3D Indonesian Procedural Text Adventure',
    startLearning: 'Start 3D Practice',
    googleSignIn: 'Sign in with Google',
    registerAccount: 'Register Ksatria Account',
    continueAsKsatria: 'Active Ksatria Account',
    controlHint: 'WASD / Drag: Orbit Camera · Space / 3D Click: Perform Action · 1-3: Select Level · H: Hide Dock · Esc: Pause',
    levelMap: 'Level Path',
    leaderboard: 'Leaderboard',
    settings: 'Settings',
    profile: 'Ksatria Account',
    stepProgress: 'Procedural Step',
    targetLabel: 'Target Precision',
    currentValue: 'Current Measure',
    verifyStep: 'Check & Complete Step',
    resetValue: 'Reset Measure',
    explodedView: '3D Exploded View',
    cameraAngle: 'Camera View',
    hideControls: 'Hide Dock [H]',
    showControls: 'Show Dock [H]',
    pauseTitle: 'Simulation Paused',
    resumeGame: 'Resume Practice',
    restartLevel: 'Restart Level',
    backToTitle: 'Title Screen',
    victoryTitle: 'Procedure Complete!',
    victorySubtitle: 'All Indonesian Procedural Text steps were practiced with high precision.',
    clearTime: 'Clear Time',
    xpEarned: 'XP Score',
    accuracy: 'Precision',
    nextLevel: 'Next Procedural Level',
    playAgain: 'Practice Again',
    languageSetting: 'System UI Language',
    languageNote: 'Changes system controls only. Learning content remains in Bahasa Indonesia.',
    themeSetting: 'Purple Theme Customization',
    darkModeSetting: 'Night Comfort (Dark Mode)',
    reminderSetting: 'Daily Study Reminder',
    reminderEnable: 'Enable Daily Notification',
    reminderTime: 'Reminder Schedule',
    encryptionTitle: 'AES-256-GCM Privacy Encryption',
    encryptionDesc: 'Personal identity and study notes are encrypted client-side via Web Crypto AES-256-GCM before storage.',
    cloudSyncTitle: 'Cloud Sync & Offline Mode',
    cloudSynced: 'Synced with Firebase Cloud',
    offlineCached: 'Offline Mode Active (Local Cache)',
    syncNow: 'Sync to Cloud Now',
    teksProsedurGuide: 'Open Procedural Text Sheet',
    closeModal: 'Close',
    saveProfile: 'Save & Encrypt Profile',
    studentNameLabel: 'Ksatria Name (Student)',
    studentClassLabel: 'Grade / Class',
    privateNotesLabel: 'Private Study Notes (AES-256 Encrypted)',
    installApp: 'Install App (Offline)',
  },
};
