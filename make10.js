(() => {
  const EPS = 1e-6;
  let solved = 0;
  let original = [], nums = [];
  let stage = 0;    // 0=数字1未選択,1=数字1選択済,2=演算子選択済
  let idx1 = null, selOp = null;

  // DOM
  const countEl     = document.getElementById('count');
  const numEl       = document.getElementById('numbers');
  const opEl        = document.getElementById('operators');
  const dispEl      = document.getElementById('display');
  const msgEl       = document.getElementById('message');
  const showBtn     = document.getElementById('showAnswer');
  const nextBtn     = document.getElementById('nextPuzzle');

  // 初期：ボタン隠す
  showBtn.style.display = 'none';
  nextBtn.style.display = 'none';

  // バックトラックで答え（式）を求める
  function solveRec(arr) {
    if (arr.length === 1) {
      return Math.abs(arr[0].value - 10) < EPS
        ? arr[0].expr
        : null;
    }
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length; j++) {
        if (i === j) continue;
        const a = arr[i], b = arr[j];
        const rest = arr.filter((_,k)=>k!==i&&k!==j);
        for (let op of ['+','-','*','/']) {
          if (op==='/' && Math.abs(b.value) < EPS) continue;
          const val = op==='+'? a.value + b.value
                    : op==='-'? a.value - b.value
                    : op==='*'? a.value * b.value
                    : a.value / b.value;
          const expr = `(${a.expr}${op}${b.expr})`;
          const nextArr = rest.concat({ value: val, expr });
          const sol = solveRec(nextArr);
          if (sol) return sol;
        }
      }
    }
    return null;
  }
  function solvePuzzle(numbers) {
    const arr = numbers.map(n => ({ value: n, expr: n.toString() }));
    return solveRec(arr);
  }

  // 正解可能な4数生成
  function isSolvable(a) {
    if (a.length === 1) return Math.abs(a[0] - 10) < EPS;
    for (let i=0;i<a.length;i++){
      for (let j=0;j<a.length;j++){
        if(i===j) continue;
        const x=a[i], y=a[j];
        const rest=a.filter((_,k)=>k!==i&&k!==j);
        for (let op of ['+','-','*','/']) {
          if (op==='/' && Math.abs(y)<EPS) continue;
          const r = op==='+'?x+y:op==='-'?x-y:op==='*'?x*y:x/y;
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

  // 表示更新
  function render() {
    // 数字
    numEl.innerHTML = '';
    nums.forEach((v,i) => {
      const b = document.createElement('button');
      b.textContent = parseFloat(v.toFixed(3));
      b.dataset.i = i;
      if (stage>0 && idx1===i) b.classList.add('selected');
      b.disabled = (stage===2 && idx1===i);
      b.onclick = onNumber;
      numEl.appendChild(b);
    });
    // 演算子
    Array.from(opEl.children).forEach(b => {
      const o = b.dataset.op;
      b.classList.toggle('selected', stage===2 && selOp===o);
      b.disabled = !(stage===1 || (stage===2 && selOp===o));
    });
    // ヒント表示
    if (stage===0) {
      dispEl.textContent = '数字→演算子→数字 の順にタップ';
    } else if (stage===1) {
      dispEl.textContent = `選択中: ${nums[idx1].toFixed(3)} → 演算子を選択`;
    } else {
      dispEl.textContent = `演算子: ${selOp} → もう一つの数字を選択`;
    }
  }

  // 数字タップ
  function onNumber(e) {
    const i = +e.currentTarget.dataset.i;
    const v = nums[i];
    if (stage===0) {
      idx1 = i; stage = 1;
      msgEl.textContent = '';
    }
    else if (stage===1) {
      if (i===idx1) {
        stage = 0; idx1 = null;
      }
    }
    else if (stage===2) {
      const a = nums[idx1], b = v;
      let r = selOp==='+'?a+b: selOp==='-'?a-b: selOp==='*'?a*b:a/b;
      nums = nums.filter((_,k)=>k!==idx1&&k!==i).concat(r);
      msgEl.textContent = `計算: ${a}${selOp}${b} = ${r.toFixed(3)}`;
      stage = 0; idx1 = null; selOp = null;
      // 最後の1つなら判定
      if (nums.length===1) {
        if (Math.abs(nums[0]-10) < EPS) {
          solved++;
          countEl.textContent = `Solved: ${solved}`;
          msgEl.style.color = '#080';
          msgEl.textContent = '正解！次の問題を作成中…';
          setTimeout(startNew, 800);
        } else {
          msgEl.style.color = '#a00';
          msgEl.textContent = '不正解…リセットしました';
          resetCurrent();
          // 答えボタンを表示
          showBtn.style.display = 'inline-block';
          nextBtn.style.display = 'none';
        }
      }
    }
    render();
  }

  // 演算子タップ
  opEl.addEventListener('click', e => {
    const o = e.target.dataset.op;
    if (!o) return;
    if (stage===1) {
      selOp = o; stage = 2;
      msgEl.textContent = '';
    }
    else if (stage===2 && o===selOp) {
      selOp = null; stage = 1;
    }
    render();
  });

  // 現在の問題をリセット
  function resetCurrent() {
    nums = original.slice();
    stage = 0; idx1 = null; selOp = null;
    render();
  }

  // 新しい問題へ
  function startNew() {
    original = genPuzzle();
    nums = original.slice();
    stage = 0; idx1 = selOp = null;
    msgEl.textContent = '';
    render();
    showBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }

  // 「答えを見る」押下
  showBtn.addEventListener('click', () => {
    const expr = solvePuzzle(original);
    msgEl.style.color = '#008';
    msgEl.textContent = expr ? `答え: ${expr} = 10` : '解答なし';
    showBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
  });

  // 「次の問題へ」押下
  nextBtn.addEventListener('click', () => {
    startNew();
  });

  // 初期化
  countEl.textContent = `Solved: ${solved}`;
  original = genPuzzle();
  nums = original.slice();
  render();
})();
