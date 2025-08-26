// assets/app.js (패치 버전)
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

// URL 보정(상대경로 -> 절대경로) 필요 시 사용
function url(p){
  try { new URL(p); return p; } catch(e) { /* not absolute */ }
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

/* ===== Firebase Config ===== */
const firebaseConfig = {
  apiKey: "AIzaSyD_IuakhMe5Qofl85JDdAJ1IUu1eaN5paU",
  authDomain: "charles01-9eee3.firebaseapp.com",
  projectId: "charles01-9eee3",
  // storageBucket는 보통 appspot.com 형식. 현재 기능 안쓰면 일단 주석처리 가능.
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

    // 퍼시스턴스: 실패해도 앱이 멈추지 않게
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      console.warn("persistence 실패:", e?.code || e?.message || e);
    }

    // 리다이렉트 결과: 실패/없음 모두 무시
    try {
      await getRedirectResult(auth);
    } catch (e) {
      console.warn("getRedirectResult 실패:", e?.code || e?.message || e);
    }

    // 버튼 핸들러
    loginBtn?.addEventListener("click", async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = err?.code || "";
        if (code.includes("popup") || code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
          // 팝업 불가 환경: 리다이렉트로 폴백
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

    // 상태 변경
    onAuthStateChanged(auth, (user) => {
      if (user) {
        showLoggedInUI(user);
        toggleAuth(false);
        console.log("로그인:", user.email || user.displayName);
      } else {
        showLoggedOutUI();
        console.log("로그아웃 상태");
      }
    });

  } catch (fatal) {
    // 실패해도 UI가 '멈춘' 상태로 남지 않게
    console.error("Firebase 초기화 실패:", fatal);
    showLoggedOutUI();
    toggleAuth(false);
  }
});
