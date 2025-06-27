// make10.js — Firebase Firestore 連携 & 選択キャンセル対応
const db = window._make10db;
const RANK_COL = "make10_ranking";
const ADMIN_PWD = "iwakuni";
const EPS = 1e-6;

const elNumbers    = document.getElementById("numbers");
const elOperators  = document.getElementById("operators");
const elDisplay    = document.getElementById("display");
const elCurrent    = document.getElementById("current");
const btnClear     = document.getElementById("clear");
const elMessage    = document.getElementById("message");
const elStatus     = document.getElementById("status");
const elTimer      = document.getElementById("timer");
const elGame       = document.getElementById("game");
const elFinish     = document.getElementById("finish");
const elFinalTime  = document.getElementById("finalTime");
const elNameInput  = document.getElementById("nameInput");
const btnSubmit    = document.getElementById("submitName");
const btnResetRank = document.getElementById("resetRanking");
const elRankingBd  = document.getElementById("rankingBody");

let round = 1, startTime, timerID;
let original = [], working = [];
let stage = 0, idx1 = null, op = null;

function isSolvable(arr) {
  if (arr.length === 1) return Math.abs(arr[0] - 10) < EPS;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i === j) continue;
      const a = arr[i], b = arr[j];
      const rest = arr.filter((_, k) => k !== i && k !== j);
      for (let o of ['+','-','*','/']) {
        if (o === '/' && Math.abs(b) < EPS) continue;
        const r = o === '+' ? a+b : o === '-' ? a-b : o === '*' ? a*b : a/b;
        if (isSolvable(rest.concat(r))) return true;
      }
    }
  }
  return false;
}

function genNumbers() {
  while (1) {
    const n = [];
    while (n.length < 4) {
      const x = Math.floor(Math.random()*9)+1;
      if (!n.includes(x)) n.push(x);
    }
    if (isSolvable(n)) return n;
  }
}

function updateTimer() {
  startTime = Date.now();
  clearInterval(timerID);
  timerID = setInterval(() => {
    const t = ((Date.now()-startTime)/1000).toFixed(2);
    elTimer.textContent = `タイム: ${t} 秒`;
  }, 100);
}

function draw() {
  elNumbers.innerHTML = "";
  working.forEach((n, i) => {
    const btn = document.createElement("button");
    btn.textContent = parseFloat(n.toFixed(3));
    btn.dataset.i = i;
    if (stage>0 && i === idx1) btn.classList.add("selected");
    btn.disabled = (stage === 2 && i === idx1);
    btn.addEventListener("click", onNumber);
    elNumbers.appendChild(btn);
  });

  Array.from(elOperators.children).forEach(b => {
    const o = b.dataset.op;
    b.classList.toggle("selected", stage===2 && o===op);
    b.disabled = (stage !== 1 && !(stage === 2 && op === o));
  });

  elStatus.textContent = `問題 ${round}/5`;
  elDisplay.textContent = "式を作ってね";
  elCurrent.textContent = "計算結果：－";
}

function onNumber(e) {
  const i = +e.currentTarget.dataset.i;
  if (stage === 0) {
    idx1 = i; stage = 1;
    elMessage.textContent = "演算子を押してください";
  } else if (stage === 1) {
    if (i === idx1) {
      idx1 = null; stage = 0;
      elMessage.textContent = "";
    }
  } else if (stage === 2) {
    const a = working[idx1], b = working[i];
    let r = op === '+' ? a+b : op === '-' ? a-b : op === '*' ? a*b : a/b;
    working = working.filter((_, j) => j!==idx1 && j!==i).concat(r);
    idx1 = null; op = null; stage = 0;
    elMessage.textContent = "";
    elDisplay.textContent = `計算結果：${parseFloat(r.toFixed(3))}`;
    elCurrent.textContent = `計算結果：${parseFloat(r.toFixed(3))}`;
    if (working.length === 1) {
      if (Math.abs(working[0] - 10) < EPS) {
        elMessage.textContent = "🎉 正解！次へ…";
        setTimeout(() => { round<5 ? (round++, initRound()) : endGame(); }, 700);
      } else {
        elMessage.textContent = "不正解…やり直し";
        setTimeout(initRound, 800);
      }
      return;
    }
  }
  draw();
}

elOperators.addEventListener("click", e => {
  const o = e.target.dataset.op;
  if (!o) return;
  if (stage === 1) {
    op = o; stage = 2;
    elMessage.textContent = "もう一つの数字を選んでください";
  } else if (stage === 2 && o === op) {
    op = null; stage = 1;
    elMessage.textContent = "演算子を押してください";
  }
  draw();
});

btnClear.addEventListener("click", initRound);
btnSubmit.addEventListener("click", async () => {
  const name = elNameInput.value.trim() || "名無し";
  const time = (Date.now()-startTime)/1000;
  const snap = await getDocs(query(collection(db, RANK_COL)));
  const exists = snap.docs.some(doc => {
    const d = doc.data();
    return d.name === name && Math.abs(d.time - time) < EPS;
  });
  if (!exists) await addDoc(collection(db, RANK_COL), { name, time });
  await renderRank();
  elFinish.style.display = "none";
  elGame.style.display = "block";
  round = 1;
  initRound();
  updateTimer();
});

btnResetRank.addEventListener("click", async () => {
  const pwd = prompt("パスワード");
  if (pwd !== ADMIN_PWD) return alert("パスワードが違います");
  const snap = await getDocs(collection(db, RANK_COL));
  for (let d of snap.docs)
    await deleteDoc(doc(db, RANK_COL, d.id));
  await renderRank();
  alert("リセット完了");
});

async function renderRank() {
  const snap = await getDocs(query(collection(db, RANK_COL), orderBy("time")));
  const list = snap.docs.map(d => d.data
