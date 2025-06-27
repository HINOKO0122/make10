(function(){
  const TOTAL = 5, EPS = 1e-6;
  let round=1, startTime, timerID;
  let originalNums=[], nums=[];
  let stage=0, idx1=null, selOp=null;

  // DOM
  const D=id=>document.getElementById(id);
  const elNum   = D('numbers');
  const elOp    = D('operators');
  const elDisp  = D('display');
  const elCur   = D('current');
  const elSta   = D('status');
  const elTim   = D('timer');
  const btnRes  = D('reset');
  const elMsg   = D('message');
  const elFin   = D('finish');
  const elFinT  = D('finalTime');
  const elRankB = D('rankingBody');

  // localStorage ランキング
  function loadRank(){
    return JSON.parse(localStorage.getItem('m10rank') || '[]');
  }
  function saveRank(arr){
    localStorage.setItem('m10rank', JSON.stringify(arr));
  }
  function renderRank(){
    const arr = loadRank().sort((a,b)=>a-b);
    elRankB.innerHTML = '';
    arr.forEach((t,i)=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${t.toFixed(2)}</td>`;
      elRankB.appendChild(tr);
    });
  }

  // 4つの数が必ず解けるかチェック
  function isSolvable(arr){
    if(arr.length===1) return Math.abs(arr[0]-10)<EPS;
    for(let i=0;i<arr.length;i++){
      for(let j=0;j<arr.length;j++){
        if(i===j) continue;
        const a=arr[i], b=arr[j];
        const rest=arr.filter((_,k)=>k!==i&&k!==j);
        for(let o of ['+','-','*','/']){
          if(o==='/' && Math.abs(b)<EPS) continue;
          let r = o==='+'?a+b
                : o==='-'?a-b
                : o==='*'?a*b
                : a/b;
          if(isSolvable(rest.concat(r))) return true;
        }
      }
    }
    return false;
  }
  function genPuzzle(){
    while(true){
      const t=[];
      while(t.length<4){
        const x=Math.floor(Math.random()*9)+1;
        if(!t.includes(x)) t.push(x);
      }
      if(isSolvable(t)) return t;
    }
  }

  // 画面更新
  function draw(){
    elNum.innerHTML = '';
    nums.forEach((v,i) => {
      const b=document.createElement('button');
      b.textContent = parseFloat(v.toFixed(3));
      b.dataset.i = i;
      if(stage>0 && i===idx1) b.classList.add('selected');
      b.disabled = (stage===2 && i===idx1);
      b.addEventListener('click', onNum);
      elNum.appendChild(b);
    });
    Array.from(elOp.children).forEach(b=>{
      const o=b.dataset.op;
      b.classList.toggle('selected', stage===2 && o===selOp);
      b.disabled = !(stage===1 || (stage===2 && o===selOp));
    });
    elSta.textContent = `問題 ${round}/${TOTAL}`;
    elDisp.textContent = '式を作ってね';
    elCur.textContent = '計算結果：－';
    elMsg.textContent = '';
  }
  function startTimer(){
    clearInterval(timerID);
    startTime=Date.now();
    elTim.textContent='タイム: 0.00 秒';
    timerID=setInterval(()=>{
      const t=((Date.now()-startTime)/1000).toFixed(2);
      elTim.textContent=`タイム: ${t} 秒`;
    },100);
  }

  // 数字ボタン
  function onNum(e){
    const i=+e.currentTarget.dataset.i, v=nums[i];
    if(stage===0){
      idx1=i; stage=1; elMsg.textContent='演算子を選んでください';
    }
    else if(stage===1){
      if(i===idx1){
        stage=0; idx1=null; elMsg.textContent='';
      }
    }
    else if(stage===2){
      const a=nums[idx1], b=v;
      let r = selOp==='+'?a+b
            : selOp==='-'?a-b
            : selOp==='*'?a*b
            : a/b;
      nums = nums.filter((_,j)=>j!==idx1&&j!==i).concat(r);
      elDisp.textContent=`計算結果：${parseFloat(r.toFixed(3))}`;
      stage=0; idx1=null; selOp=null;
      if(nums.length===1){
        clearInterval(timerID);
        if(Math.abs(nums[0]-10)<EPS){
          elFin.style.display='block';
          elFinT.textContent=((Date.now()-startTime)/1000).toFixed(2);
          const t=(Date.now()-startTime)/1000;
          const arr=loadRank(); arr.push(t); saveRank(arr); renderRank();
        } else {
          alert('不正解！リトライ');
          initRound();
        }
      }
    }
    draw();
  }

  // 演算子ボタン
  elOp.addEventListener('click', e=>{
    const o=e.target.dataset.op;
    if(!o) return;
    if(stage===1){
      selOp=o; stage=2; elMsg.textContent='最後の数字を選んでください';
    }
    else if(stage===2 && o===selOp){
      selOp=null; stage=1; elMsg.textContent='';
    }
    draw();
  });

  // リセット
  btnRes.addEventListener('click', initRound);

  // 問題開始
  function initRound(){
    elFin.style.display='none';
    nums = originalNums = genPuzzle();
    stage=0; idx1=null; selOp=null;
    draw(); startTimer(); renderRank();
  }

  // 初期化
  initRound();
})();
