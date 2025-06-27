// トークン（数字 or 演算子）の配列
let tokens = [];
// 選べる数字 4 つ
let numbers = [];

// 要素取得
const elNumbers   = document.getElementById('numbers');
const elOperators = document.getElementById('operators');
const elDisplay   = document.getElementById('display');
const elCurrent   = document.getElementById('current');
const btnClear    = document.getElementById('clear');
const btnSubmit   = document.getElementById('submit');
const elMessage   = document.getElementById('message');

// パズルの数字を生成してボタン表示
function initNumbers() {
  numbers = [];
  for (let i = 0; i < 4; i++) {
    numbers.push(Math.floor(Math.random() * 9) + 1);
  }
  elNumbers.innerHTML = '';
  numbers.forEach((n, i) => {
    const btn = document.createElement('button');
    btn.textContent = n;
    btn.dataset.num = n;
    btn.disabled = false;
    btn.addEventListener('click', onNumber);
    elNumbers.appendChild(btn);
  });
}

// 数字ボタン押下時
function onNumber(e) {
  const num = e.currentTarget.dataset.num;
  // 直前が数字なら連続して押さない
  if (tokens.length > 0 && !isNaN(tokens[tokens.length - 1])) return;
  tokens.push(num);
  e.currentTarget.disabled = true; // １回だけ使える
  updateDisplay();
}

// 演算子ボタン押下時
elOperators.addEventListener('click', e => {
  if (!e.target.dataset.op) return;
  // 直前が演算子 or 先頭では押せない
  if (tokens.length === 0) return;
  if (['+','-','*','/'].includes(tokens[tokens.length - 1])) return;
  tokens.push(e.target.dataset.op);
  updateDisplay();
});

// クリア
btnClear.addEventListener('click', _ => {
  tokens = [];
  initNumbers();
  updateDisplay();
  elMessage.textContent = '';
});

// 表示と逐次計算
function updateDisplay() {
  const expr = tokens.join(' ');
  elDisplay.textContent = expr || '式を作ってね';

  // 「末尾が数字→評価可」だけ評価して表示
  if (tokens.length > 0 && !isNaN(tokens[tokens.length - 1])) {
    try {
      // 安全のため Function を使う
      const val = Function(`"use strict"; return (${expr});`)();
      elCurrent.textContent = '計算結果：' + val;
    } catch {
      elCurrent.textContent = '計算結果：エラー';
    }
  } else {
    elCurrent.textContent = '計算結果：－';
  }
}

// 答え合わせ
btnSubmit.addEventListener('click', _ => {
  const last = tokens[tokens.length - 1];
  if (tokens.length === 0 || isNaN(last)) {
    elMessage.textContent = '最後は数字で終わる式にしてください';
    return;
  }
  const expr = tokens.join(' ');
  const result = Function(`"use strict"; return (${expr});`)();
  if (result === 10 && tokens.filter(t => !isNaN(t)).length === 4) {
    elMessage.textContent = '🎉 正解！おめでとう！';
  } else {
    elMessage.textContent = `❌ 残念…結果は ${result} です`;
  }
});

// 初期化
initNumbers();
updateDisplay();
