// make10.js

const TOTAL_ROUNDS = 5;
const EPS = 1e-6;

// バックトラックで必ず解ける４つの異なる 1–9 の数字を生成
function isSolvable(arr) {
  if (arr.length === 1) return Math.abs(arr[0] - 10) < EPS;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i === j) continue;
      const a = arr[i], b = arr[j];
      const rest = arr.filter((_, k) => k !== i && k !== j);
      for (let op of ['+','-','*','/']) {
        if (op === '/' && Math.abs(b) < EPS) continue;
        let r = op === '+' ? a + b
              : op === '-' ? a - b
              : op === '*' ? a * b
              : a / b;
        if (isSolvable(rest.concat(r))) return true;
      }
    }
  }
  return false;
}

function generatePuzzle() {
  while (1) {
    const nums = [];
    while (nums.length < 4) {
      const n = Math.floor(Math.random()*9)+1;
      if (!nums.includes(n)) nums.push(n);
    }
    if (isSolvable(nums)) return nums;
  }
}

// DOM
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

// 状態
let round = 1, startTime, timerID;
let originalNumbers = [], playNumbers = [];
let stage = 0, idx1 = null, selectedOp = null;

// ステータス更新
function updateStatus(){
  elStatus.textContent = `問題 ${round}/${TOTAL_ROUNDS}`;
}
function startTimer(){
  startTime = Date.now();
  timerID = setInterval(()=>{
    const t = ((Date.now()-startTime)/1000).toFixed(2);
    elTimer.textContent = `タイム: ${t} 秒`;
  }, 100);
}
function stopTimer(){ clearInterval(timerID); }

// 数字ボタン描画
function renderNumbers(){
  elNumbers.innerHTML = '';
  playNumbers.forEach((n,i)=>{
    const btn = document.createElement('button');
    btn.textContent = parseFloat(n.toFixed(3));
    btn.dataset.i = i;
    btn.classList.toggle('selected', stage>0 && i===idx1);
    btn.disabled = stage===2 && i===idx1;
    btn.addEventListener('click', onNumber);
    elNumbers.appendChild(btn);
  });
}

// 演算子ボタン制御
function renderOperators(){
  Array.from(elOperators.children).forEach(btn=>{
    const op = btn.dataset.op;
    btn.classList.toggle('selected', stage===2 && selectedOp===op);
    btn.disabled = stage!==1;
  });
}

// 表示初期化
function renderDisplay(){
  elDisplay.textContent = '式を作ってね';
  elCurrent.textContent = '計算結果：－';
}

// メッセージクリア
function clearMessage(){ elMessage.textContent = ''; }

// 数字クリック
function onNumber(e){
  const i = +e.currentTarget.dataset.i;
  const v = playNumbers[i];
  if(stage===0){
    idx1 = i; stage=1;
    elMessage.textContent = '演算子を押してください';
  }
  else if(stage===2){
    let r;
    switch(selectedOp){
      case '+': r = playNumbers[idx1]+v; break;
      case '-': r = playNumbers[idx1]-v; break;
      case '*': r = playNumbers[idx1]*v; break;
      case '/': r = playNumbers[idx1]/v; break;
    }
    playNumbers = playNumbers
      .filter((_,j)=> j!==idx1 && j!==i)
      .concat(r);
    elDisplay.textContent = `計算結果：${parseFloat(r.toFixed(3))}`;
    clearMessage();
    stage=0; idx1=null; selectedOp=null;

    if(playNumbers.length===1){
      if(Math.abs(playNumbers[0]-10)<EPS){
        elMessage.textContent = '🎉 正解！次の問題へ';
        setTimeout(nextOrFinish,500);
      } else {
        elMessage.textContent = '不正解…自動リセット';
        setTimeout(resetRound,500);
      }
      return;
    }
  }
  renderNumbers();
  renderOperators();
}

// 演算子クリック
elOperators.addEventListener('click', e=>{
  const op = e.target.dataset.op;
  if(op && stage===1){
    selectedOp=op; stage=2;
    elMessage.textContent = 'もう一つの数字を押してください';
    renderOperators();
  }
});

// リセット（問題は変えず、入力だけクリア）
btnClear.addEventListener('click', resetRound);
function resetRound(){
  playNumbers = originalNumbers.slice();
  stage=0; idx1=null; selectedOp=null;
  clearMessage();
  renderNumbers();
  renderOperators();
  renderDisplay();
}

// 次 or 終了
function nextOrFinish(){
  if(round<TOTAL_ROUNDS){
    round++; newRound();
  } else finishGame();
}

// 新ラウンド
function newRound(){
  originalNumbers = generatePuzzle();
  playNumbers     = originalNumbers.slice();
  stage=0; idx1=null; selectedOp=null;
  clearMessage();
  renderNumbers();
  renderOperators();
  renderDisplay();
  updateStatus();
}

// ゲーム終了
function finishGame(){
  stopTimer();
  elGame.style.display   = 'none';
  elFinish.style.display = 'block';
  elFinalTime.textContent = ((Date.now()-startTime)/1000).toFixed(2);
  renderRanking();
}

// ランキング（localStorage）
function loadRanking(){
  const r = localStorage.getItem('make10_ranking');
  return r?JSON.parse(r):[];
}
function saveRanking(arr){
  localStorage.setItem('make10_ranking', JSON.stringify(arr));
}
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
btnSubmitNm.addEventListener('click', ()=>{
  const name = elNameIn.value.trim() || '名無し';
  const time = (Date.now()-startTime)/1000;
  const arr  = loadRanking(); arr.push({name,time});
  saveRanking(arr); renderRanking();
  elFinish.style.display = 'none';
});

// 初期化
newRound();
startTimer();
