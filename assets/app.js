// assets/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ===== Firebase Config ===== */
const firebaseConfig = {
  apiKey: "AIzaSyD_IuakhMe5Qofl85JDdAJ1IUu1eaN5paU",
  authDomain: "charles01-9eee3.firebaseapp.com",
  projectId: "charles01-9eee3",
  storageBucket: "charles01-9eee3.firebasestorage.app",
  messagingSenderId: "409220278869",
  appId: "1:409220278869:web:ebbab45579e96c22a482dc",
};

/* ===== Init ===== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* ===== UI refs ===== */
const userChip  = document.getElementById("userChip");
const userName  = document.getElementById("userName");
const userAvatar= document.getElementById("userAvatar");
const loginBtn  = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

/* ===== Helpers ===== */
function showLoggedInUI(user){
  const name = user.displayName || user.email || "사용자";
  const photo = user.photoURL || "";
  if (userName)  userName.textContent = name;
  if (userAvatar){ userAvatar.src = photo; userAvatar.alt = name; }
  userChip?.classList.remove("hidden");
  userChip.style.display = "inline-flex";
  loginBtn?.classList.add("hidden");
  logoutBtn?.classList.remove("hidden");
}
function showLoggedOutUI(){
  userChip?.classList.add("hidden");
  userChip.style.display = "none";
  loginBtn?.classList.remove("hidden");
  logoutBtn?.classList.add("hidden");
}
function toggleAuth(open){
  const modal = document.getElementById("authModal");
  if(!modal) return;
  modal.style.display = open ? "flex" : "none";
  if(open){ document.body.classList.remove("menu-open"); }
}
window.toggleAuth = toggleAuth;

/* ===== Persistence ===== */
await setPersistence(auth, browserLocalPersistence).catch(console.warn);

/* ===== Redirect result (iOS/Safari 등) ===== */
getRedirectResult(auth).catch(err => {
  console.warn("Redirect signin error:", err?.code || err?.message || err);
});

/* ===== Buttons ===== */
loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    const code = err?.code || "";
    if (code.includes("popup") || code === "auth/popup-blocked") {
      await signInWithRedirect(auth, provider);
    } else {
      alert("로그인 실패: " + (code || err?.message || err));
    }
  }
});

logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (err) {
    alert("로그아웃 실패: " + (err?.code || err?.message || err));
  }
});

/* ===== Auth State ===== */
onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInUI(user);
    toggleAuth(false);
    console.log("로그인 성공:", user.email || user.displayName);
  } else {
    showLoggedOutUI();
    console.log("로그아웃 상태");
  }
});

/* ===== (선택) 모달 트리거 =====
loginBtn?.addEventListener("click", () => toggleAuth(true));
document.getElementById("googleSignIn")?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if ((err?.code || "").includes("popup")) await signInWithRedirect(auth, provider);
    else alert("로그인 실패: " + (err?.code || err?.message || err));
  }
});
*/
