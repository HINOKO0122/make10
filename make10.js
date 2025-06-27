// make10.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8CVjzjsPMw08Iad-pPTfOX27r9KhCtls",
  authDomain: "make10-1713b.firebaseapp.com",
  projectId: "make10-1713b",
  storageBucket: "make10-1713b.appspot.com",
  messagingSenderId: "845023446068",
  appId: "1:845023446068:web:80504512db0a1b9c453661"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  // 定数・状態
  const TOTAL_ROUNDS = 5, EPS = 1e-6, ADMIN_PWD = "iwakuni";
  let round = 1, startTime, timerID;
  let originalNums = [], nums = [];
  let stage = 0, idx1 = null, selOp = null;

  // DOM 参照
  const D = id => document.getElementById(id);
  const elNumbers   = D("numbers");
  const elOperators = D("operators");
  const elDisplay   = D("display");
  const elCurrent   = D("current");
  const btnClear    = D("clear");
  const elMessage   = D("message");
  const elStatus    = D("status");
  const elTimer     = D("timer");
  const elGame      = D("game");
  const elFinish    = D("finish");
  const elFinalTime = D("finalTime");
  const elNameIn    = D("nameInput");
  const btnSubmit   = D("submitName");
  const btnResetR   = D("resetRanking");
  const elRankingBd = D("rankingBody");

  // Firestore ランキング関数
  async function loadRank() {
    const q = query(collection(db, "make10_ranking"), orderBy("time","asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  async function saveRank(name, time) {
    // 重複チェック
    const list = await loadRank();
    if (!list.some(e => e.name===name && Math.abs(e.time-time)<EPS))
      await addDoc(collection(db, "make10_ranking"), { name, time });
  }
  async function clearRank(pwd) {
    if (pwd !== ADMIN_PWD) throw new Error("パスワード違い");
    const snap = await getDocs(collection(db, "make10_ranking"));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "make10_ranking", d.id))));
  }
  async function renderRank() {
    const list = await loadRank();
    elRankingBd.innerHTML = "";
    list.forEach((e,i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i+1}</td><td>${e.name}</td><td>${e.time.toFixed(2)}</td>`;
      elRankingBd.appendChild(tr);
    });
  }

  // 問題生成バックトラック
  function isSolvable(arr) {
    if (arr.length===1) return Math.abs(arr[0]-10)<EPS;
    for (let i=0;i<arr.length;i++){
      for (let j=0;j<arr.length;j++){
        if(i===j) continue;
        const a=arr[i], b=arr[j];
        const rest=arr.filter((_,k)=>k!==i&&k!==j);
        for (let o of ['+','-','*','/']) {
          if(o==='/'&&Math.abs(b)<EPS) continue;
          const r = o==='+'?a+b:o==='-'?a-b:o==='*'?a*b:a/b;
          if(isSolvable(rest.concat(r))) return true;
        }
      }
    }
    return false;
  }
  function genPuzzle() {
    while(true) {
      const t=[];
      while(t.length<4){
        const x = Math.floor(Math.random()*9)+1;
        if(!t.includes(x)) t.push(x);
      }
      if(isSolvable(t)) return t;
    }
  }

  // UI 描画
  function drawUI() {
    // 数字ボタン
    elNumbers.innerHTML = "";
    nums.forEach((v,i)=>{
      const b = document.createElement("button");
      b.textContent = parseFloat(v.toFixed(3));
      b.dataset.i = i;
      if(stage>0 && i===idx1) b.classList.add("selected");
      b.disabled = (stage===2 && i===idx1);
      b.addEventListener("click", onNum);
      elNumbers.appendChild(b);
    });
    // 演算子
    Array.from(elOperators.children).forEach(b=>{
      const o = b.dataset.op;
      if(stage===2 && o===selOp) b.classList.add("selected");
      else b.classList.remove("selected");
      b.disabled = !(stage===1 || (stage===2 && o===selOp));
    });
    elStatus.textContent = `問題 ${round}/${TOTAL_ROUNDS}`;
    elDisplay.textContent = "式を作ってね";
    elCurrent.textContent = "計算結果：－";
    elMessage.textContent = "";
  }

  // タイマー開始
  function startTimer() {
    clearInterval(timerID);
    startTime = Date.now();
    elTimer.textContent = "タイム: 0.00 秒";
    timerID = setInterval(()=>{
      const t = ((Date.now()-startTime)/1000).toFixed(2);
      elTimer.textContent = `タイム: ${t} 秒`;
    },100);
  }

  // 数字ボタン押下
  function onNum(e) {
    const i = +e.currentTarget.dataset.i, v = nums[i];
    if(stage===0) {
      idx1 = i; stage=1; elMessage.textContent="演算子を選んでください";
    }
    else if(stage===1) {
      if(i===idx1) { stage=0; idx1=null; elMessage.textContent=""; }
    }
    else if(stage===2) {
      const a=nums[idx1], b=v;
      let r;
      switch(selOp){
        case '+': r=a+b; break;
        case '-': r=a-b; break;
        case '*': r=a*b; break;
        case '/': r=a/b; break;
      }
      nums = nums.filter((_,j)=>j!==idx1&&j!==i).concat(r);
      elDisplay.textContent = `計算結果：${parseFloat(r.toFixed(3))}`;
      elCurrent.textContent = `計算結果：${parseFloat(r.toFixed(3))}`;
      stage=0; idx1=null; selOp=null;
      if(nums.length===1){
        if(Math.abs(nums[0]-10)<EPS){
          elMessage.textContent="🎉 正解！次へ…";
          setTimeout(()=>{ round<5 ? nextRound() : finishGame(); },700);
        } else {
          elMessage.textContent="不正解…リトライ";
          setTimeout(currentRound,700);
        }
      }
    }
    drawUI();
  }

  // 演算子押下
  elOperators.addEventListener("click", e=>{
    const o = e.target.dataset.op;
    if(!o) return;
    if(stage===1){ selOp=o; stage=2; elMessage.textContent="次の数字を選んでください"; }
    else if(stage===2 && o===selOp){ selOp=null; stage=1; elMessage.textContent="演算子を選んでください"; }
    drawUI();
  });

  // リセット（入力のみクリア）
  btnClear.addEventListener("click", currentRound);

  // 次の問題 or 終了
  function nextRound(){
    round++;
    currentRound();
  }
  function currentRound(){
    nums = originalNums = genPuzzle();
    stage=0; idx1=null; selOp=null;
    drawUI();
  }

  // ゲーム終了
  async function finishGame(){
    clearInterval(timerID);
    elGame.style.display = "none";
    elFinish.style.display = "block";
    elFinalTime.textContent = ((Date.now()-startTime)/1000).toFixed(2);
    await renderRank();
  }

  // 登録ボタン
  btnSubmit.addEventListener("click", async ()=>{
    const name = elNameIn.value.trim()||"名無し";
    const time = (Date.now()-startTime)/1000;
    await saveRank(name,time);
    await renderRank();
    // 再スタート
    round=1;
    elFinish.style.display="none";
    elGame.style.display="block";
    currentRound();
    startTimer();
  });

  // ランキングリセット
  btnResetR.addEventListener("click", async ()=>{
    const pwd = prompt("管理者パスワード");
    try{
      await clearRank(pwd);
      await renderRank();
      alert("リセット完了");
    }catch{
      alert("パスワード違い");
    }
  });

  // 初期化
  currentRound();
  startTimer();
  renderRank();
});
