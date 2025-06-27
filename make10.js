// make10.js
window.addEventListener('DOMContentLoaded', () => {
  const TOTAL_ROUNDS = 5;
  const EPS = 1e-6;
  const STORAGE_KEY = 'make10_ranking';
  const ADMIN_PWD = 'iwakuni';  // リセット用パスワード

  // DOM
  const elNumbers      = document.getElementById('numbers');
  const elOperators    = document.getElementById('operators');
  const elDisplay      = document.getElementById('display');
  const elCurrent      = document.getElementById('current');
  const btnClear       = document.getElementById('clear');
  const elMessage      = document.getElementById('message');
  const elStatus       = document.getElementById('status');
  const elTimer        = document.getElementById('timer');
  const elGame         = document.getElementById('game');
  const elFinish       = document.getElementById('finish');
  const elFinalTime    = document.getElementById('finalTime');
  const elNameIn       = document.getElementById('nameInput');
  const btnSubmitName  = document.getElementById('submitName');
  const btnResetRanking= document.getElementById('resetRanking');
  const elRankingBody  = document.getElementById('rankingBody');
  const backLink       = document.getElementById('back-link');

  // state
  let round = 1, startTime, timerID;
  let originalNumbers = [], playNumbers = [];
  let stage = 0, idx1 = null, selectedOp = null;

  // util: localStorage 読み書き
  function loadRanking() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveRanking(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  // util: solve-check
  function isSolvable(arr) {
    if (arr.length === 1) return Math.abs(arr[0] - 10) < EPS;
    for (let i=0;i<arr.length;i++) {
      for (let j=0;j<arr.length;j++) {
        if (i===j) continue;
        const a = arr[i], b = arr[j];
        const rest = arr.filter((_,k)=>k!==i&&k!==j);
        for (let op of ['+','-','*','/']) {
          if (op==='/' && Math.abs(b)<EPS) continue;
          let r = op==='+'? a+b
                : op==='-'? a-b
                : op==='*'? a*b
                : a/b;
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

  // UI 更新
  function renderNumbers() {
    elNumbers.innerHTML = '';
    playNumbers.forEach((n,i) => {
      const btn = document.createElement('button');
      btn.textContent = parseFloat(n.toFixed(3));
      btn.dataset.i = i;
      btn.classList.toggle('selected', stage>0 && i===idx1);
      btn.disabled = stage===2 && i===idx1;
      btn.addEventListener('click', onNumber);
      elNumbers.appendChild(btn);
    });
  }
  function renderOperators() {
    Array.from(elOperators.children).forEach(btn=>{
      const op = btn.dataset.op;
      btn.classList.toggle('selected', stage===2 && selectedOp===op);
      btn.disabled = stage!==1;
    });
  }
  function updateDisplay(text, result) {
    elDisplay.textContent = text || '式を作ってね';
    elCurrent.textContent = result!==undefined
      ? `計算結果：${result}`
      : '計算結果：－';
  }
  function updateStatus() {
    elStatus.textContent = `問題 ${round}/${TOTAL_ROUNDS}`;
  }
  function startTimer() {
    startTime = Date.now();
    elTimer.textContent = 'タイム: 0.00 秒';
    timerID = setInterval(()=>{
      const t = ((Date.now()-startTime)/1000).toFixed(2);
      elTimer.textContent = `タイム: ${t} 秒`;
    }, 100);
  }
  function stopTimer() { clearInterval(timerID); }

  // ランキング表示
  function renderRanking() {
    let arr = loadRanking()
      .sort((a,b)=>a.time-b.time)
      // 同名・同タイムは重複除去
      .filter((e,i,x)=> !x.slice(0,i)
        .some(u=>u.name===e.name && Math.abs(u.time - e.time)<EPS));
    saveRanking(arr);
    elRankingBody.innerHTML = '';
    arr.forEach((e,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${e.name}</td><td>${e.time.toFixed(2)}</td>`;
      elRankingBody.appendChild(tr);
    });
  }

  // クリックハンドラ
  function onNumber(e) {
    const i = +e.currentTarget.dataset.i;
    if (stage===0) {
      // 1回目の数字選択
      idx1 = i; stage = 1;
      elMessage.textContent = '演算子を押してください';
    }
    else if (stage===1) {
      // 選択取消 (同じをもう一度押したらキャンセル)
      if (i === idx1) {
        stage = 0; idx1 = null;
        elMessage.textContent = '';
      }
    }
    else if (stage===2) {
      // 2回目の数字選択 → 計算
      const a = playNumbers[idx1], b = playNumbers[i];
      let r;
      switch (selectedOp) {
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case '*': r = a * b; break;
        case '/': r = a / b; break;
      }
      playNumbers = playNumbers
        .filter((_,j)=> j!==idx1 && j!==i)
        .concat(r);
      updateDisplay(null, parseFloat(r.toFixed(3)));
      elMessage.textContent = '';
      stage = 0; idx1 = null; selectedOp = null;

      // 完了判定
      if (playNumbers.length === 1) {
        if (Math.abs(playNumbers[0]-10)<EPS) {
          elMessage.textContent = '🎉 正解！次の問題へ';
          setTimeout(nextOrFinish, 500);
        } else {
          elMessage.textContent = '不正解…自動リセット';
          setTimeout(resetRound, 500);
        }
      }
    }
    renderNumbers();
    renderOperators();
  }

  // 演算子クリック
  elOperators.addEventListener('click', e=>{
    const op = e.target.dataset.op;
    if (stage===1 && ['+','-','*','/'].includes(op)) {
      // 1回目の演算子選択
      selectedOp = op; stage = 2;
      elMessage.textContent = 'もう一つの数字を押してください';
    }
    else if (stage===2 && op===selectedOp) {
      // 選択取消
      selectedOp = null; stage = 1;
      elMessage.textContent = '';
    }
    renderOperators();
  });

  // リセット
  btnClear.addEventListener('click', resetRound);
  function resetRound() {
    playNumbers = originalNumbers.slice();
    stage = 0; idx1 = null; selectedOp = null;
    elMessage.textContent = '';
    renderNumbers(); renderOperators();
    updateDisplay();
  }

  // 次 or 終了
  function nextOrFinish() {
    if (round < TOTAL_ROUNDS) {
      round++; newRound();
    } else finishGame();
  }

  function newRound() {
    originalNumbers = generatePuzzle();
    playNumbers = originalNumbers.slice();
    stage = 0; idx1 = null; selectedOp = null;
    elMessage.textContent = '';
    renderNumbers(); renderOperators();
    updateDisplay(); updateStatus();
  }

  function finishGame() {
    stopTimer();
    elGame.style.display   = 'none';
    elFinish.style.display = 'block';
    elFinalTime.textContent =
      ((Date.now()-startTime)/1000).toFixed(2);
    renderRanking();
  }

  // 登録ボタン（1度きり）
  btnSubmitName.addEventListener('click', ()=>{
    const name = elNameIn.value.trim() || '名無し';
    const time = (Date.now()-startTime)/1000;
    const arr  = loadRanking();
    if (!arr.some(e=>e.name===name && Math.abs(e.time-time)<EPS)) {
      arr.push({name,time});
      saveRanking(arr);
    }
    renderRanking();
    // ゲーム再スタート
    elFinish.style.display = 'none';
    elGame.style.display   = 'block';
    round = 1;
    newRound();
    startTimer();
  });

  // ランキングリセット（管理者パスワード付き）
  btnResetRanking.addEventListener('click', ()=>{
    const pwd = prompt('管理者パスワードを入力してください');
    if (pwd === ADMIN_PWD) {
      localStorage.removeItem(STORAGE_KEY);
      renderRanking();
      alert('ランキングをリセットしました');
    } else {
      alert('パスワードが違います');
    }
  });

  // 初期化
  newRound();
  startTimer();
  renderRanking();
});
