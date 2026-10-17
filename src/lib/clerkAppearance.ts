// Tema Clerk = tema AnonChat (T-35): satu sumber untuk SignIn & SignUp.
// Variabel memakai var(--*) agar dark mode ([data-theme]) ikut otomatis.
// Tanpa dependency tambahan (@clerk/ui tidak dipakai).

export const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--primary)',
    colorBackground: 'var(--card)',
    colorInputBackground: 'var(--card)',
    colorText: 'var(--foreground)',
    colorTextSecondary: 'var(--muted-foreground)',
    colorDanger: 'var(--destructive)',
    colorSuccess: 'var(--mint)',
    colorRing: 'var(--ring)',
    borderRadius: '8px',
    fontFamily: 'var(--font-sans)',
    fontFamilyButtons: 'var(--font-head)',
  },
  elements: {
    // Bingkai tunggal milik .nb-auth-panel — Clerk tidak menggambar kartu sendiri.
    cardBox: {
      background: 'transparent',
      boxShadow: 'none',
      borderRadius: '0',
      padding: '0',
    },
    card: {
      background: 'var(--card)',
      border: 'none',
      borderRadius: '0',
      boxShadow: 'none',
      margin: '0',
      padding: '2rem 2rem 1.5rem',
    },
    // Footer Clerk (di dalam cardBox, setelah card) — jadi strip menyatu di dasar panel.
    // Padding/margin bawaan Clerk (16px 32px + margin -(8px)) dibuang agar rapat.
    footer: {
      background: 'var(--card)',
      borderTop: '3px solid var(--border-color)',
      margin: '0',
      padding: '0.875rem 1.5rem',
      gap: '0.5rem',
    },
    footerAction: {
      margin: '0 !important',
      padding: '0 !important',
    },
    footerItem: {
      color: 'var(--muted-foreground)',
      fontSize: '0.6875rem',
      margin: '0 !important',
      padding: '0 !important',
    },
    footerActionText: {
      color: 'var(--muted-foreground)',
      fontSize: '0.875rem',
    },
    footerActionLink: {
      background: 'var(--primary)',
      color: '#1a1a2e',
      border: '3px solid var(--border-color)',
      borderRadius: '8px',
      boxShadow: '3px 3px 0 0 var(--border-color)',
      padding: '0.125rem 0.625rem',
      fontFamily: 'var(--font-head)',
      fontWeight: 700,
      textDecoration: 'none',
      '&:hover': {
        background: 'var(--primary-hover)',
        color: '#1a1a2e',
        transform: 'translate(-1px, -1px)',
        boxShadow: '4px 4px 0 0 var(--border-color)',
      },
      '&:active': {
        transform: 'translate(2px, 2px)',
        boxShadow: 'none',
      },
    },
    footerPageLink: {
      color: 'var(--muted-foreground)',
      fontSize: '0.6875rem',
    },
    badge: {
      background: 'var(--muted)',
      color: 'var(--muted-foreground)',
      boxShadow: 'none',
      fontSize: '0.625rem',
    },
    headerTitle: {
      fontFamily: 'var(--font-head)',
      fontWeight: 700,
      color: 'var(--foreground)',
    },
    headerSubtitle: {
      color: 'var(--muted-foreground)',
    },
    socialButtonsBlockButton: {
      background: 'var(--card)',
      color: 'var(--foreground)',
      // !important: default Clerk (ring box-shadow + border 0) di-inject setelah stylesheet kita.
      border: '3px solid var(--border-color) !important',
      borderRadius: '8px',
      boxShadow: '3px 3px 0 0 var(--border-color) !important',
      fontFamily: 'var(--font-head)',
      fontWeight: 600,
      '&:hover': {
        transform: 'translate(-2px, -2px)',
        boxShadow: '5px 5px 0 0 var(--border-color) !important',
        background: 'var(--card)',
      },
      '&:active': {
        transform: 'translate(2px, 2px)',
        boxShadow: 'none !important',
      },
    },
    formButtonPrimary: {
      background: 'var(--primary)',
      color: '#1a1a2e',
      // !important: default Clerk menimpa border/shadow tombol primer.
      border: '3px solid var(--border-color) !important',
      borderRadius: '8px',
      boxShadow: '4px 4px 0 0 var(--border-color) !important',
      fontFamily: 'var(--font-head)',
      fontWeight: 700,
      textTransform: 'none',
      '&:hover, &:focus, &:active': {
        background: 'var(--primary-hover)',
      },
      '&:active': {
        transform: 'translate(4px, 4px)',
        boxShadow: 'none !important',
      },
    },
    formFieldInput: {
      background: 'var(--card)',
      color: 'var(--foreground)',
      border: '3px solid var(--border-color) !important',
      borderRadius: '8px',
      boxShadow: '3px 3px 0 0 var(--border-color) !important',
      '&:focus': {
        borderColor: 'var(--border-color) !important',
        boxShadow: '3px 3px 0 0 var(--border-color) !important',
      },
    },
    formFieldLabel: {
      color: 'var(--foreground)',
      fontFamily: 'var(--font-head)',
      fontWeight: 600,
    },
    formFieldErrorText: {
      color: 'var(--destructive)',
    },
    dividerText: {
      color: 'var(--muted-foreground)',
    },
    identityPreviewText: {
      color: 'var(--foreground)',
    },
    otpCodeFieldInput: {
      border: '3px solid var(--border-color) !important',
      borderRadius: '8px',
      background: 'var(--card)',
      color: 'var(--foreground)',
    },
  },
};

// Teks Indonesia untuk alur utama (kunci tak dikenal diabaikan Clerk).
export const clerkLocalization = {
  formButtonPrimary: 'Lanjut',
  formFieldAction__forgotPassword: 'Lupa kata sandi?',
  formFieldLabel__emailAddress: 'Alamat email',
  formFieldLabel__password: 'Kata sandi',
  formFieldInputPlaceholder__emailAddress: 'nama@email.com',
  formFieldInputPlaceholder__password: 'Kata sandimu',
  formFieldInputPlaceholder__signUpPassword: 'Minimal 8 karakter',
  dividerText: 'atau',
  socialButtonsBlockButton: 'Lanjut dengan {{provider}}',
  signIn: {
    start: {
      title: 'Masuk ke AnonChat',
      subtitle: 'Senang bertemu lagi! Masuk untuk lanjut.',
      actionText: 'Belum punya akun?',
      actionLink: 'Daftar',
    },
    password: {
      title: 'Masukkan kata sandi',
      subtitle: 'Masukkan kata sandi akunmu.',
      actionText: 'Pakai cara lain',
      actionLink: 'Ganti metode',
    },
    emailCode: {
      title: 'Cek emailmu',
      subtitle: 'Kode verifikasi dikirim ke {{identifier}}',
    },
  },
  signUp: {
    start: {
      title: 'Daftar AnonChat',
      subtitle: 'Bikin akun untuk mulai chat anonim.',
      actionText: 'Sudah punya akun?',
      actionLink: 'Masuk',
    },
    emailCode: {
      title: 'Verifikasi emailmu',
      subtitle: 'Kode verifikasi dikirim ke {{identifier}}',
    },
  },
};
