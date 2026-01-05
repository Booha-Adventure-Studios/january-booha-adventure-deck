(async function () {
  const API_BASE = 'https://www.bryanharper.tokyo';
  const GATE_URL = 'https://www.bryanharper.tokyo/booha-gate';

  const MSG = {
    kicked: {
      en: "Someone just logged in using your name and PIN.",
      jp: "別の端末であなたの名前とPINでログインされました。"
    },
    expired: {
      en: "Your session has expired. Please log in again.",
      jp: "セッションの有効期限が切れました。もう一度ブーハーゲートからログインしてください。"
    },
    invalid: {
      en: "Your session is invalid. Please log in again.",
      jp: "セッションの確認に問題が発生しました。もう一度ブーハーゲートからログインしてください。"
    },
    missing: {
      en: "No session found. Please log in through the Booha Gate.",
      jp: "セッションが見つかりません。ブーハーゲートからログインしてください。"
    }
  };

  function kickOut(kind) {
    const m = MSG[kind] || MSG.invalid;
    alert(m.en + "\n\n" + m.jp);
    window.location.href = GATE_URL;
  }

  // ---- get token ----
  const params = new URLSearchParams(window.location.search);
  let token = params.get('token');

  // fallback: reuse stored token (Adventure flow)
  if (!token) {
    try {
      token = sessionStorage.getItem('boohaToken');
    } catch {}
  }

  if (!token) {
    kickOut('missing');
    return;
  }

  // ---- verify token ----
  try {
    const res = await fetch(
      API_BASE + '/_functions/verifyToken?token=' + encodeURIComponent(token),
      { headers: { 'Accept': 'application/json' } }
    );

    const data = await res.json();

    if (!data.valid) {
      if (data.reason === "KICKED" || data.isActive === false) {
        kickOut('kicked');
      } else if (data.reason === "EXPIRED" || data.expired) {
        kickOut('expired');
      } else {
        kickOut('invalid');
      }
      return;
    }

    // ---- token OK ----
    try {
      sessionStorage.setItem('boohaToken', token);
    } catch {}

    // ---- append token to all internal links ----
    document.querySelectorAll('a').forEach(a => {
      const raw = a.dataset.href || a.getAttribute('href');
      if (!raw) return;
      if (raw.startsWith('#')) return;
      if (raw.startsWith('http')) return;

      const u = new URL(raw, window.location.href);
      if (!u.searchParams.get('token')) {
        u.searchParams.set('token', token);
      }

      const out = u.pathname + u.search + u.hash;
      a.setAttribute('href', out);
      a.dataset.href = out;
    });

  } catch (err) {
    console.error('[Booha token] verification error:', err);
    kickOut('invalid');
  }
})();
