document.addEventListener('DOMContentLoaded', () => {
  // ---- 定数＆状態 ----
  const TOTAL_ROUNDS = 5, EPS = 1e-6;
  let round = 1, startTime, timerID;
  let originalNums = [], nums = [];
  let stage = 0, idx1 = null, selOp = null;

  // ---- DOM参照 ----
  const D = id => document.getElementById(id);
  const statusEl    = D('status');
  const timerEl     = D('timer');
  const numbersEl   = D('numbers');
  const operatorsEl = D('operators');
  const displayEl   = D('display');
  const currentEl   = D('current');
  const resetBtn    = D('reset');
  const finishEl    = D('finish');
  const finalTimeEl = D('finalTime');
  const rankBody    = D('rankingBody');

  // ---- localStorageランキング ----
  function loadRank() {
    return JSON.parse(localStorage.getItem('make10_ranks') || '[]');
  }
  function saveRank(arr) {
    localStorage.setItem('make10_ranks', JSON.stringify(arr));
  }
  function renderRank() {
    const arr = loadRank().sort((a,b)=>a-b);
    rankBody.innerHTML = '';
    arr.forEach((t,i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${t.toFixed(2)}</td>`;
      rankBody.appendChild(tr);
    });
  }

  // ---- 問題生成（4数バックトラック） ----
  function isSolvable(a) {
    if (a.length === 1) return Math.abs(a[0] - 10) < EPS;
    for (let i=0; i<a.length; i++) {
      for (let j=0; j<a.length; j++) {
        if (i===j) continue;
        const x = a[i], y = a[j];
        const rest = a.filter((_,k)=>k!==i && k!==j);
        for (let op of ['+','-','*','/']) {
          if (op==='/' && Math.abs(y)<EPS) continue;
          let r = op==='+'? x+y : op==='-'? x-y : op==='*'? x*y : x/y;
          if (isSolvable(rest.concat(r))) return true;
        }
      }
    }
    return false;
  }
  function genPuzzle() {
    while (1) {
      const t = [];
      while (t.length < 4) {
        const n = Math.floor(Math.random()*9)+1;
        if (!t.includes(n)) t.push(n);
      }
      if (isSolvable(t)) return t;
    }
  }

  // ---- 描画関数 ----
  function updateStatus() {
    statusEl.textContent = `問題 ${round}/${TOTAL_ROUNDS}`;
  }
  function startTimer() {
    clearInterval(timerID);
    startTime = Date.now();
    timerEl.textContent = 'タイム: 0.00 秒';
    timerID = setInterval(()=>{
      const s = ((Date.now() - startTime)/1000).toFixed(2);
      timerEl.textContent = `タイム: ${s} 秒`;
    }, 100);
  }
  function renderNumbers() {
    numbersEl.innerHTML = '';
    nums.forEach((v,i) => {
      const btn = document.createElement('button');
      btn.textContent = v;
      btn.dataset.i = i;
      if (stage>0 && i===idx1) btn.classList.add('selected');
      btn.disabled = (stage===2 && i===idx1);
      btn.addEventListener('click', onNumber);
      numbersEl.appendChild(btn);
    });
  }
  function renderOperators() {
    Array.from(operatorsEl.children).forEach(b => {
      const o = b.dataset.op;
      b.classList.toggle('selected', stage===2 && o===selOp);
      b.disabled = !(stage===1 || (stage===2 && o===selOp));
    });
  }
  function resetDisplay() {
    displayEl.textContent = '式を作ってね';
    currentEl.textContent = '計算結果：－';
  }

  // ---- イベントハンドラ ----
  function onNumber(e) {
    const i = +e.currentTarget.dataset.i;
    const v = nums[i];
    if (stage === 0) {
      idx1 = i; stage = 1;
      displayEl.textContent = `1つ目: ${v}`;
    }
    else if (stage === 1) {
      // 同じをもう一度押せばキャンセル
      if (i===idx1) {
        stage = 0; idx1 = null;
        resetDisplay();
      }
    }
    else if (stage === 2) {
      // 2つ目の数字選択 → 演算実行
      const x = nums[idx1], y = v;
      let r = selOp==='+'? x+y
            : selOp==='-'? x-y
            : selOp==='*'? x*y
            : x/y;
      // 更新
      nums = nums.filter((_,j)=>j!==idx1 && j!==i).concat(r);
      resetDisplay();
      displayEl.textContent = `計算：${x}${selOp}${y} = ${r}`;
      idx1 = selOp = null; stage = 0;
      // 残り1つなら判定
      if (nums.length === 1) {
        clearInterval(timerID);
        const final = (Date.now()-startTime)/1000;
        if (Math.abs(nums[0]-10)<EPS) {
          finishEl.style.display = 'block';
          finalTimeEl.textContent = final.toFixed(2);
          const arr = loadRank(); arr.push(final); saveRank(arr);
          renderRank();
        } else {
          alert('不正解！リトライします');
          startRound();
        }
        return;
      }
    }
    renderNumbers();
    renderOperators();
  }

  operatorsEl.addEventListener('click', e => {
    const o = e.target.dataset.op;
    if (!o) return;
    if (stage===1) {
      selOp = o; stage=2;
    }
    else if (stage===2 && o===selOp) {
      selOp = null; stage=1;
    }
    renderOperators();
  });

  resetBtn.addEventListener('click', () => startRound(false));

  // ---- ラウンド管理 ----
  function startRound(next=true) {
    if (next) {
      round = round < TOTAL_ROUNDS ? round+1 : 1;
    }
    finishEl.style.display = 'none';
    nums = originalNums = genPuzzle();
    stage=0; idx1=null; selOp=null;
    updateStatus();
    renderNumbers();
    renderOperators();
    resetDisplay();
    startTimer();
    renderRank();
  }

  // ---- 初期化 ----
  startRound(false);
});
