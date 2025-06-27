// ==== 定義＆UI要素取得 ====
const TOTAL_ROUNDS = 5;
const EPS = 1e-6;

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
let round = 1, startTime, timerID;
let originalNumbers = [], playNumbers = [], history = [];
let stage = 0, firstVal = null, firstIndex = null, selectedOp = null;

// ==== パズル生成：必ず解ける４つの異なる数字を返す ====
function isSolvable(arr) {
  if (arr.length === 1) return Math.abs(arr[0] - 10) < EPS;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i === j) continue;
      const a = arr[i], b = arr[j];
      const rest = arr.filter((_, k) => k !== i && k !== j);
      for (let op of ['+','-','*','/']) {
        if (op === '/' && Math.abs(b) < EPS) continue;
        let res;
        switch(op) {
          case '+': res = a + b; break;
          case '-': res = a - b; break;
          case '*': res = a * b; break;
          case '/': res = a / b; break;
        }
        if (isSolvable(rest.concat([res]))) return true;
      }
    }
  }
  return false;
}

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

// ==== UI 描画関数 ====
function renderNumbers() {
  elNumbers.innerHTML = '';
  playNumbers.forEach((n, i) => {
    const btn = document.createElement('button');
    btn.textContent = n;
    btn.dataset.index = i;
    btn.disabled = (stage === 1) || (stage === 2 && i === firstIndex);
    btn.addEventListener('click', onNumberClick);
    elNumbers.appendChild(btn);
  });
}

function renderOperators() {
  Array.from(elOperators.children).forEach(btn => {
    btn.disabled = (stage !== 1);
  });
}

function renderHistory() {
  // history[0] から順に「(a op b)」→次は「((... ) op b)」でネスト
  let expr = '';
  if (history.length > 0) {
    expr = `(${history[0].a}${history[0].op}${history[0].b})`;
    for (let k = 1; k < history.length; k++) {
      const h = history[k];
      expr = `(${expr}${h.op}${h.b})`;
    }
  }
  elDisplay.textContent = expr || '式を作ってね';
  elCurrent.textContent =
    history.length > 0
      ? '計算結果：' + history[history.length - 1].res
      : '計算結果：－';
}

function updateStatus() {
  elStatus.textContent = `問題 ${round}/${TOTAL_ROUNDS}`;
}

// ==== イベントハンドラ ====
// 1) 数字クリック
function onNumberClick(e) {
  const idx = +e.currentTarget.dataset.index;
  const val = playNumbers[idx];
  if (stage === 0) {
    // 一つ目の数字選択
    firstVal   = val;
    firstIndex = idx;
    stage = 1;
    elMessage.textContent = '演算子を選択してください';
  }
  else if (stage === 2) {
    // 二つ目の数字選択 → 演算してリスト更新
    const secondVal = val;
    let res;
    switch (selectedOp) {
      case '+': res = firstVal + secondVal; break;
      case '-': res = firstVal - secondVal; break;
      case '*': res = firstVal * secondVal; break;
      case '/': res = firstVal / secondVal; break;
    }
    history.push({ a: firstVal, op: selectedOp, b: secondVal, res });
    // リストから両方の数字を削除し、新しい res を追加
    playNumbers = playNumbers
      .filter((_, i) => i !== firstIndex && i !== idx)
      .concat(res);
    // ステージリセット
    stage = 0;
    firstVal = firstIndex = selectedOp = null;
    elMessage.textContent = '';

    // 終了判定
    if (playNumbers.length === 1) {
      const final = playNumbers[0];
      if (Math.abs(final - 10) < EPS) {
        elMessage.textContent = '🎉 正解！次へ';
        setTimeout(nextOrFinish, 500);
      } else {
        elMessage.textContent = '不正解…自動クリア';
        setTimeout(autoClear, 500);
      }
    }
  }
  renderNumbers();
  renderOperators();
  renderHistory();
}

// 2) 演算子クリック
elOperators.addEventListener('click', e => {
  const op = e.target.dataset.op;
  if (stage === 1 && ['+','-','*','/'].includes(op)) {
    selectedOp = op;
    stage = 2;
    elMessage.textContent = 'もう一度数字を選択してください';
    renderOperators();
  }
});

// 3) クリア（入力リセットのみ）
btnClear.addEventListener('click', () => {
  playNumbers = originalNumbers.slice();
  history = [];
  stage = 0; firstVal = firstIndex = selectedOp = null;
  elMessage.textContent = '';
  renderNumbers();
  renderOperators();
  renderHistory();
});

// ==== ラウンド管理 ====
function newRound() {
  originalNumbers = generatePuzzle();
  playNumbers     = originalNumbers.slice();
  history         = [];
  stage = 0; firstVal = firstIndex = selectedOp = null;
  elMessage.textContent = '';
  updateStatus();
  renderNumbers();
  renderOperators();
  renderHistory();
}
function autoClear() {
  playNumbers = originalNumbers.slice();
  history     = [];
  stage = 0; firstVal = firstIndex = selectedOp = null;
  elMessage.textContent = '';
  renderNumbers();
  renderOperators();
  renderHistory();
}
function nextOrFinish() {
  if (round < TOTAL_ROUNDS) {
    round++;
    newRound();
  } else {
    finishGame();
  }
}

// ==== タイマー＆ランキング ====
function startTimer() {
  startTime = Date.now();
  elTimer.textContent = 'タイム: 0.00 秒';
  timerID = setInterval(() => {
    const t = (Date.now() - startTime) / 1000;
    elTimer.textContent = `タイム: ${t.toFixed(2)} 秒`;
  }, 100);
}
function stopTimer() { clearInterval(timerID); }
function finishGame() {
  stopTimer();
  elGame.style.display   = 'none';
  elFinish.style.display = 'block';
  elFinalTime.textContent = ((Date.now() - startTime) / 1000).toFixed(2);
  renderRanking();
}
function loadRanking() {
  const r = localStorage.getItem('make10_ranking');
  return r ? JSON.parse(r) : [];
}
function saveRanking(arr) {
  localStorage.setItem('make10_ranking', JSON.stringify(arr));
}
function renderRanking() {
  const arr = loadRanking().sort((a,b)=>a.time-b.time);
  elRankingBd.innerHTML = '';
  arr.forEach((e,i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${e.name}</td><td>${e.time.toFixed(2)}</td>`;
    elRankingBd.appendChild(tr);
  });
  elRanking.style.display = 'block';
}
btnSubmitNm.addEventListener('click', () => {
  const name = elNameIn.value.trim() || '名無し';
  const time = (Date.now() - startTime) / 1000;
  const arr  = loadRanking();
  arr.push({ name, time });
  saveRanking(arr);
  renderRanking();
  elFinish.style.display = 'none';
});

// ==== 初期化 ====
newRound();
startTimer();
