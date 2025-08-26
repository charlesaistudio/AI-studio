// assets/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ===== Helpers ===== */
function $(id){ return document.getElementById(id); }
function safeDisplay(el, val){ if(el) el.style.display = val; }
function toggleAuth(open){
  const modal = $("authModal");
  if(!modal) return;
  safeDisplay(modal, open ? "flex" : "none");
  if(open) document.body.classList.remove("menu-open");
}
window.toggleAuth = toggleAuth;

// URL 보정(상대경로 -> 절대경로)
function url(p){
  try { new URL(p); return p; } catch(e) {}
  return new URL(p, document.baseURI).toString();
}

/* ===== UI refs ===== */
const userChip  = $("userChip");
const userName  = $("userName");
const userAvatar= $("userAvatar");
const loginBtn  = $("loginBtn");
const logoutBtn = $("logoutBtn");

function showLoggedInUI(user){
  const name = user?.displayName || user?.email || "사용자";
  const photo = user?.photoURL || "";
  if (userName)  userName.textContent = name;
  if (userAvatar){ userAvatar.src = photo; userAvatar.alt = name; }
  if (userChip){
    userChip.classList.remove("hidden");
    safeDisplay(userChip, "inline-flex");
  }
  loginBtn?.classList.add("hidden");
  logoutBtn?.classList.remove("hidden");
}

function showLoggedOutUI(){
  userChip?.classList.add("hidden");
  safeDisplay(userChip, "none");
  loginBtn?.classList.remove("hidden");
  logoutBtn?.classList.add("hidden");
}

/* ===== 링크 잠금/해제 (하드 가드) ===== */
function lockProtectedLinks() {
  document.querySelectorAll('[data-requires-auth]').forEach(el => {
    const href = el.getAttribute('href');
    if (href && !el.dataset.authHref) {
      el.dataset.authHref = href; // 원래 목적지 백업
    }
    el.setAttribute('href', 'javascript:void(0)'); // 하드 잠금
    el.setAttribute('aria-disabled', 'true');
    el.setAttribute('title', '로그인 후 이용 가능');
    el.style.cursor = 'not-allowed';
  });
}
function unlockProtectedLinks() {
  document.querySelectorAll('[data-requires-auth]').forEach(el => {
    if (el.dataset.authHref) {
      el.setAttribute('href', el.dataset.authHref); // 원래 목적지 복원
    }
    el.removeAttribute('aria-disabled');
    el.removeAttribute('title');
    el.style.removeProperty('cursor');
  });
}

/* ===== Firebase Config ===== */
const firebaseConfig = {
  apiKey: "AIzaSyD_IuakhMe5Qofl85JDdAJ1IUu1eaN5paU",
  authDomain: "charles01-9eee3.firebaseapp.com",
  projectId: "charles01-9eee3",
  // storageBucket: "charles01-9eee3.appspot.com",
  messagingSenderId: "409220278869",
  appId: "1:409220278869:web:ebbab45579e96c22a482dc",
};

/* ===== Init (DOMContentLoaded 이후) ===== */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    // 퍼시스턴스
    try { await setPersistence(auth, browserLocalPersistence); }
    catch (e) { console.warn("persistence 실패:", e?.code || e?.message || e); }

    // 리다이렉트 결과 (무시 가능)
    try { await getRedirectResult(auth); }
    catch (e) { console.warn("getRedirectResult 실패:", e?.code || e?.message || e); }

    // 버튼 핸들러
    loginBtn?.addEventListener("click", async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = err?.code || "";
        if (code.includes("popup") || code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
          await signInWithRedirect(auth, provider);
        } else {
          alert("로그인 실패: " + (code || err?.message || err));
        }
      }
    });

    logoutBtn?.addEventListener("click", async () => {
      try { await signOut(auth); }
      catch (err) { alert("로그아웃 실패: " + (err?.code || err?.message || err)); }
    });

    // 현재 유저/리다이렉트 관리
    let currentUser = null;
    window.currentUser = null; // 전역 노출

    function tryPostLoginRedirect() {
      try {
        const key = "postLoginRedirect";
        const next = localStorage.getItem(key);
        if (next) {
          localStorage.removeItem(key);
          location.href = url(next); // base 고려
        }
      } catch(_) {}
    }

    // 상태 변경
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      window.currentUser = user;

      if (user) {
        unlockProtectedLinks();       // ✅ 로그인 상태: 링크 원복
        showLoggedInUI(user);
        toggleAuth(false);
        tryPostLoginRedirect();
        console.log("로그인:", user.email || user.displayName);
      } else {
        lockProtectedLinks();         // ✅ 비로그인 상태: 링크 잠금
        showLoggedOutUI();
        console.log("로그아웃 상태");
      }
    });

    /* ===========================
       [AUTH-GATE] 보호 네비게이션 (바인딩)
       - 로그인 X: 이동 막고 모달 유도 + postLoginRedirect 저장
       =========================== */
    function handleProtectedClick(e) {
      const el = e.currentTarget;
      if (currentUser) return; // 로그인 시 통과

      e.preventDefault();
      e.stopPropagation();

      const next = el.dataset.authHref
        || (el.tagName.toLowerCase() === "a" ? el.getAttribute("href") : null)
        || el.getAttribute("data-href")
        || "/";

      try { localStorage.setItem("postLoginRedirect", next); } catch(_) {}
      toggleAuth(true);
    }

    function wireAuthGate(selector = "[data-requires-auth]"){
      document.querySelectorAll(selector).forEach((el) => {
        el.addEventListener("click", handleProtectedClick);
        el.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") handleProtectedClick(ev);
        });
      });
    }

    // 초기 바인딩 (필요 시 동적 요소 추가 후 재호출)
    wireAuthGate();

  } catch (fatal) {
    console.error("Firebase 초기화 실패:", fatal);
    showLoggedOutUI();
    toggleAuth(false);
    // Firebase가 죽어도 전역 캡처 가드가 있으니 모달은 뜸
  }
});

/* ===== 전역 캡처링 위임 (가장 먼저 가로채기) ===== */
(function attachAuthGate(){
  // 클릭 위임 (capture = true)
  document.addEventListener('click', (e) => {
    const el = e.target.closest?.('[data-requires-auth]');
    if (!el) return;
    if (window.currentUser) return; // 로그인 시 통과

    e.preventDefault();
    e.stopPropagation();

    const next = el.dataset.authHref || el.getAttribute('href') || el.getAttribute('data-href') || '/';
    try { localStorage.setItem('postLoginRedirect', next); } catch(_) {}

    if (typeof window.toggleAuth === 'function') window.toggleAuth(true);
    else {
      const modal = document.getElementById('authModal');
      if (modal) modal.style.display = 'flex';
    }
  }, true); // ← 캡처링!

  // 키보드 위임 (capture = true)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = document.activeElement?.closest?.('[data-requires-auth]');
    if (!el) return;
    if (window.currentUser) return;

    e.preventDefault();
    e.stopPropagation();

    const next = el.dataset.authHref || el.getAttribute('href') || el.getAttribute('data-href') || '/';
    try { localStorage.setItem('postLoginRedirect', next); } catch(_) {}

    if (typeof window.toggleAuth === 'function') window.toggleAuth(true);
    else {
      const modal = document.getElementById('authModal');
      if (modal) modal.style.display = 'flex';
    }
  }, true); // ← 캡처링!
})();
