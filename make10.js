// make10.js

// ==== 定数・ユーティリティ ==== 
const TOTAL_ROUNDS = 5;
const EPS = 1e-6;

// ４つの数が必ず解けるかバックトラックでチェック
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

// 1..9 の異なる４つの数を生成
function generatePuzzle() {
  while (true) {
    const nums = [];
    while (nums.length < 4) {
      const n = Math.floor(Math.random() * 9) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    if (isSolvable(nums)) return nums;
  }
}

// ==== DOM 要素取得 ====
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

// ==== ゲーム状態変数 ====
let round = 1,
    startTime, timerID,
    originalNumbers = [],
    playNumbers     = [],
    stage           = 0,   // 0=選択前,1=数1選択済,2=演算子選択済
    idx1            = null,
    selectedOp      = null;

// ==== UI 描画 ====
// 問題番号＆タイマー
function updateStatus(){
  elStatus.textContent = `問題 ${round}/${TOTAL_ROUNDS}`;
}
function startTimer(){
  startTime = Date.now();
  timerID = setInterval(()=>{
    const t = ((Date.now() - startTime)/1000).toFixed(2);
    elTimer.textContent = `タイム: ${t} 秒`;
  }, 100);
}
function stopTimer(){ clearInterval(timerID); }

// 数字ボタンを（再）描画
function renderNumbers(){
  elNumbers.innerHTML = '';
  playNumbers.forEach((n,i)=>{
    const btn = document.createElement('button');
    btn.textContent = parseFloat(n.toFixed(3));
    btn.dataset.i = i;
    btn.classList.toggle('selected', stage > 0 && i === idx1);
    btn.disabled = stage === 2 && i === idx1; // stage=2 のとき第1数は押せない
    btn.addEventListener('click', onNumber);
    elNumbers.appendChild(btn);
  });
}

// 演算子ボタンの活性制御・ハイライト
function renderOperators(){
  Array.from(elOperators.children).forEach(btn=>{
    const op = btn.dataset.op;
    btn.classList.toggle('selected', stage===2 && selectedOp===op);
    btn.disabled = stage !== 1;
  });
}

// 表示クリア
function renderDisplay(){
  elDisplay.textContent = '式を作ってね';
  elCurrent.textContent = '計算結果：－';
}

// メッセージクリア
function clearMessage(){ elMessage.textContent = ''; }

// ==== イベントハンドラ ====
// 数字クリック
function onNumber(e){
  const i = +e.currentTarget.dataset.i;
  const v = playNumbers[i];
  if(stage === 0){
    // １つ目
    idx1     = i;
    stage    = 1;
    elMessage.textContent = '演算子を押してください';
  }
  else if(stage === 2){
    // ２つ目 → 演算実行
    const v2 = v;
    let r;
    switch(selectedOp){
      case '+': r = playNumbers[idx1] + v2; break;
      case '-': r = playNumbers[idx1] - v2; break;
      case '*': r = playNumbers[idx1] * v2; break;
      case '/': r = playNumbers[idx1] / v2; break;
    }
    // 新しい数列を構築
    playNumbers = playNumbers
      .filter((_, j)=> j!==idx1 && j!==i)
      .concat(r);
    // 結果表示
    elDisplay.textContent = `計算：${playNumbers.length+1}個→${parseFloat(r.toFixed(3))}`;
    elCurrent.textContent = `計算結果：${parseFloat(r.toFixed(3))}`;
    clearMessage();

    // ステージ＆選択をリセット
    stage = 0; idx1 = null; selectedOp = null;

    // 数が1つになったら正解判定
    if(playNumbers.length === 1){
      if(Math.abs(playNumbers[0] - 10) < EPS){
        elMessage.textContent = '🎉 正解！次の問題へ';
        setTimeout(nextOrFinish, 500);
      } else {
        elMessage.textContent = '不正解…自動リセット';
        setTimeout(resetRound, 500);
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
  if(op && stage === 1){
    selectedOp = op;
    stage      = 2;
    elMessage.textContent = 'もう一つの数字を押してください';
    renderOperators();
  }
});

// クリア（リセットのみ）
btnClear.addEventListener('click', resetRound);

function resetRound(){
  playNumbers = originalNumbers.slice();
  stage = 0; idx1 = null; selectedOp = null;
  clearMessage();
  renderNumbers();
  renderOperators();
  renderDisplay();
}

// 次の問題 or 終了
function nextOrFinish(){
  if(round < TOTAL_ROUNDS){
    round++;
    newRound();
  } else finishGame();
}

// 新しいラウンド開始
function newRound(){
  originalNumbers = generatePuzzle();
  playNumbers     = originalNumbers.slice();
  stage = 0; idx1 = null; selectedOp = null;
  clearMessage();
  renderNumbers();
  renderOperators();
  renderDisplay();
  updateStatus();
}

// ゲーム終了
function finishGame(){
  stopTimer();
  document.getElementById('game').style.display   = 'none';
  document.getElementById('finish').style.display = 'block';
  document.getElementById('finalTime').textContent =
    ((Date.now() - startTime)/1000).toFixed(2);
  // ランキング表示（前回と同様、localStorage利用）
  renderRanking();
}

// 名前登録とランキング描画（省略、既存コードを流用してください）
// … loadRanking(), saveRanking(), renderRanking(), btnSubmitNm イベント …

// ==== 初期化 ====
newRound();
startTimer();
