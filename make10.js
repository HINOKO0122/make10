(() => {
  const EPS = 1e-6;
  let solved = 0;
  let original = [], nums = [];
  let stage = 0;    // 0=数字1未選択,1=数字1選択済,2=演算子選択済
  let idx1 = null, selOp = null;

  const countEl = document.getElementById('count');
  const numEl   = document.getElementById('numbers');
  const opEl    = document.getElementById('operators');
  const dispEl  = document.getElementById('display');
  const msgEl   = document.getElementById('message');

  // 1…9の4数が必ず10にできるかバックトラック検査
  function isSolvable(arr) {
    if (arr.length === 1) return Math.abs(arr[0] - 10) < EPS;
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length; j++) {
        if (i === j) continue;
        const a = arr[i], b = arr[j];
        const rest = arr.filter((_,k)=>k!==i && k!==j);
        for (let op of ['+','-','*','/']) {
          if (op==='/' && Math.abs(b)<EPS) continue;
          const r = op==='+'? a+b
                  : op==='-'? a-b
                  : op==='*'? a*b
                  : a/b;
          if (isSolvable(rest.concat(r))) return true;
        }
      }
    }
    return false;
  }

  // 解ける4数をランダム生成
  function genPuzzle() {
    while (true) {
      const a = [];
      while (a.length < 4) {
        const n = Math.floor(Math.random()*9)+1;
        if (!a.includes(n)) a.push(n);
      }
      if (isSolvable(a)) return a;
    }
  }

  // ボタン表示更新
  function render() {
    // 数字ボタン
    numEl.innerHTML = '';
    nums.forEach((v,i) => {
      const b = document.createElement('button');
      b.textContent = parseFloat(v.toFixed(3));
      b.dataset.i = i;
      if (stage>0 && idx1===i) b.classList.add('selected');
      b.disabled = (stage===2 && idx1===i);
      b.addEventListener('click', onNumber);
      numEl.appendChild(b);
    });
    // 演算子ボタン
    Array.from(opEl.children).forEach(b => {
      const o = b.dataset.op;
      b.classList.toggle('selected', stage===2 && selOp===o);
      b.disabled = !(stage===1 || (stage===2 && selOp===o));
    });
    // 表示
    dispEl.textContent = stage===1
      ? `選択中: ${nums[idx1].toFixed(3)} → 演算子を選択`
      : stage===2
        ? `演算子: ${selOp} → 数字を選択`
        : '式を作ってください';
  }

  // 数字ボタン押下
  function onNumber(e) {
    const i = +e.currentTarget.dataset.i;
    const v = nums[i];
    if (stage===0) {
      idx1 = i; stage = 1;
      msgEl.textContent = '';
    }
    else if (stage===1) {
      // 同じ数字を再度押すとキャンセル
      if (i===idx1) {
        stage = 0; idx1 = null;
      }
    }
    else if (stage===2) {
      // 演算実行
      const a = nums[idx1], b = v;
      let r;
      switch(selOp){
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case '*': r = a * b; break;
        case '/': r = a / b; break;
      }
      nums = nums
        .filter((_,k)=>k!==idx1 && k!==i)
        .concat(r);
      msgEl.textContent = `計算: ${a}${selOp}${b} = ${r.toFixed(3)}`;
      stage = 0; idx1 = null; selOp = null;

      // 最後の1個になったら正誤判定
      if (nums.length===1) {
        const ok = Math.abs(nums[0]-10) < EPS;
        nextPuzzle(ok);
        return;
      }
    }
    render();
  }

  // 演算子ボタン押下
  opEl.addEventListener('click', e => {
    const o = e.target.dataset.op;
    if (!o) return;
    if (stage===1) {
      selOp = o; stage = 2;
      msgEl.textContent = '';
    }
    else if (stage===2 && o===selOp) {
      // 再度押すとキャンセル
      selOp = null; stage = 1;
    }
    render();
  });

  // 正誤後に次の問題
  function nextPuzzle(correct) {
    if (correct) {
      solved++;
      countEl.textContent = `Solved: ${solved}`;
      msgEl.style.color = '#080';
      msgEl.textContent = '正解！新しい問題を作成中…';
    } else {
      msgEl.style.color = '#a00';
      msgEl.textContent = '不正解…別の問題をどうぞ';
    }
    setTimeout(() => {
      msgEl.textContent = '';
      nums = original = genPuzzle();
      stage = 0; idx1 = null; selOp = null;
      render();
    }, 1000);
  }

  // 初期化
  countEl.textContent = `Solved: ${solved}`;
  nums = original = genPuzzle();
  render();
})();
