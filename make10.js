// ==== 定義領域 ====
const TOTAL_ROUNDS = 5;

// UI 要素
const elNumbers   = document.getElementById('numbers');
const elOperators = document.getElementById('operators');
const elDisplay   = document.getElementById('display');
const elCurrent   = document.getElementById('current');
const btnClear    = document.getElementById('clear');
const elMessage   = document.getElementById('message');
const elStatus    = document.getElementById('status');
const elTimer     = document.getElementById('timer');
const elGame      = document.getElementById('game');
const elFinish    = document.getElementById('finish');
const elFinalTime = document.getElementById('finalTime');
const elNameIn    = document.getElementById('nameInput');
const btnSubmitNm = document.getElementById('submitName');
const elRanking   = document.getElementById('ranking');
const elRankingBd = document.getElementById('rankingBody');

// ゲーム状態
let numbers = [];      // 今の問題の 4 数字
let tokens  = [];      // 入力トークン
let round   = 1;       // 現在のラウンド
let startTime, timerID;

// ==== ユーティリティ ====
// AST を作って括弧付き文字列を返す
function parseAndStringify(exprTokens) {
  // シンプルな Shunting-yard で逆ポーランド → AST
  const prec = { '+':1, '-':1, '*':2, '/':2 };
  let outQ = [], opS = [];
  exprTokens.forEach(t => {
    if (!isNaN(t)) outQ.push({type:'num',value:t});
    else {
      while(opS.length && prec[opS[opS.length-1]] >= prec[t]) {
        let op = opS.pop();
        let b = outQ.pop(), a = outQ.pop();
        outQ.push({type:'op', op, left:a, right:b});
      }
      opS.push(t);
    }
  });
  while(opS.length) {
    let op = opS.pop();
    let b = outQ.pop(), a = outQ.pop();
    outQ.push({type:'op', op, left:a, right:b});
  }
  // 再帰で括弧付き文字列化
  function fmt(node){
    if(node.type==='num') return node.value;
    return `(${fmt(node.left)}${node.op}${fmt(node.right)})`;
  }
  return fmt(outQ[0]);
}

// 評価関数（AST ではなく直接 eval）
function evalExpr(expr) {
  try { return Function(`"use strict";return(${expr});`)(); }
  catch { return null; }
}

// ランキング読み書き (localStorage)
function loadRanking(){
  const r = localStorage.getItem('make10_ranking');
  return r ? JSON.parse(r) : [];
}
function saveRanking(arr){
  localStorage.setItem('make10_ranking', JSON.stringify(arr));
}

// ==== UI 更新 ====
function renderNumbers(){
  elNumbers.innerHTML = '';
  numbers.forEach((n,i)=>{
    const btn = document.createElement('button');
    btn.textContent = n;
    btn.dataset.num = n;
    btn.disabled = false;
    btn.addEventListener('click', onNumber);
    elNumbers.appendChild(btn);
  });
}
function updateDisplay(){
  if(tokens.length === 0) elDisplay.textContent = '式を作ってね';
  else {
    // 表示は AST＋括弧
    elDisplay.textContent = parseAndStringify(tokens);
  }
  // リアルタイム計算
  if(tokens.length && !isNaN(tokens[tokens.length-1])) {
    const val = evalExpr(tokens.join(''));
    elCurrent.textContent = '計算結果：' + (val==null?'エラー':val);
  } else {
    elCurrent.textContent = '計算結果：－';
  }
}
function updateStatus(){
  elStatus.textContent = `問題 ${round}/${TOTAL_ROUNDS}`;
}
function startTimer(){
  startTime = Date.now();
  elTimer.textContent = 'タイム: 0.00 秒';
  timerID = setInterval(()=>{
    const t = (Date.now()-startTime)/1000;
    elTimer.textContent = `タイム: ${t.toFixed(2)} 秒`;
  }, 100);
}
function stopTimer(){
  clearInterval(timerID);
}

// ==== ゲーム進行 ====
function newRound(){
  // 問題用数字をランダム生成
  numbers = [];
  for(let i=0;i<4;i++) numbers.push(Math.floor(Math.random()*9)+1);
  tokens = [];
  elMessage.textContent = '';
  renderNumbers();
  updateDisplay();
  updateStatus();
}
function autoClear(){
  tokens = [];
  elMessage.textContent = '不正解…自動クリアしました';
  renderNumbers();
  updateDisplay();
}
function nextOrFinish(){
  if(round < TOTAL_ROUNDS){
    round++;
    newRound();
  } else {
    finishGame();
  }
}
function finishGame(){
  stopTimer();
  elGame.style.display   = 'none';
  elFinish.style.display = 'block';
  const final = ((Date.now()-startTime)/1000).toFixed(2);
  elFinalTime.textContent = final;

  // 既存ランキング表示
  renderRanking();
}

// ==== ランキング表示 ====
function renderRanking(){
  const arr = loadRanking().sort((a,b)=>a.time-b.time);
  elRankingBd.innerHTML = '';
  arr.forEach((e,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${e.name}</td><td>${e.time.toFixed(2)}</td>`;
    elRankingBd.appendChild(tr);
  });
  elRanking.style.display = 'block';
}

// ==== イベントハンドラ ====
function onNumber(e){
  if(tokens.length && !isNaN(tokens[tokens.length-1])) return; // 直前が数字なら無視
  tokens.push(e.currentTarget.dataset.num);
  e.currentTarget.disabled = true;
  updateDisplay();
  checkAuto();
}
elOperators.addEventListener('click', e=>{
  const op = e.target.dataset.op;
  if(!op) return;
  if(tokens.length===0) return;
  if(isNaN(tokens[tokens.length-1])) return;
  tokens.push(op);
  updateDisplay();
});
btnClear.addEventListener('click', _=>{
  tokens = [];
  elMessage.textContent = '';
  renderNumbers();
  updateDisplay();
});

// 入力完了を自動判定
function checkAuto(){
  // 完全な式＝7トークン(4数字+3演算子)かつ数字で終わっている
  if(tokens.length===7 && !isNaN(tokens[6])){
    const expr = tokens.join('');
    const res  = evalExpr(expr);
    if(res === 10){
      elMessage.textContent = '🎉 正解！次の問題に移ります';
      setTimeout(nextOrFinish, 500);
    } else {
      autoClear();
    }
  }
}

// 名前登録
btnSubmitNm.addEventListener('click', _=>{
  const name = elNameIn.value.trim() || '名無し';
  const time = (Date.now()-startTime)/1000;
  const arr  = loadRanking();
  arr.push({name, time});
  saveRanking(arr);
  renderRanking();
  elFinish.style.display = 'none';
});

// ==== 初期化 ====
newRound();
startTimer();
