// game.js — Matching Game (No Theme Title)

let state = {
  level: 1,
  mistakes: 0,
  streak: 0,
  pool: [],
  levelPairs: [],
  selected: null,
  matched: 0,
  locked: false,
};

const PAIRS_PER_LEVEL = 6;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startGame() {
  if (typeof VOCAB_BANK === 'undefined') {
    console.error('VOCAB_BANK not loaded');
    return;
  }
  state.pool = shuffle([...VOCAB_BANK]);
  state.level = 1;
  state.mistakes = 0;
  state.streak = 0;
  updateHUD();
  startLevel();
}

function startLevel() {
  state.matched = 0;
  state.selected = null;
  state.locked = false;

  if (state.pool.length < PAIRS_PER_LEVEL) {
    state.pool = shuffle([...VOCAB_BANK]);
  }
  state.levelPairs = state.pool.splice(0, PAIRS_PER_LEVEL);

  document.getElementById('level-badge').textContent = `LV ${state.level}`;
  document.getElementById('level-title').textContent = ''; // ✅ ลบ theme title
  document.getElementById('progress-bar').style.width = '0%';

  renderBoard();
}

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  const cards = [];
  state.levelPairs.forEach((pair, i) => {
    cards.push({ type: 'english', index: i, text: pair.en });
    cards.push({ type: 'thai', index: i, text: pair.th });
  });
  shuffle(cards);

  cards.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = `card ${card.type}`;
    el.dataset.index = card.index;
    el.dataset.type = card.type;
    el.innerHTML = `<span>${card.text}</span>`;
    
    // ✅ เพิ่ม animation delay ให้การ์ดเด้งเข้ามาทีละใบ
    el.style.animationDelay = `${idx * 0.03}s`;
    el.classList.add('card-enter');
    
    el.addEventListener('click', () => onCardClick(el, card));
    board.appendChild(el);
  });
}

function onCardClick(el, card) {
  if (state.locked || el.classList.contains('hidden') || (state.selected && state.selected.el === el)) return;

  // ✅ เพิ่มเสียงคลิก (optional — safe fallback)
  playClickSound();

  el.classList.add('selected');
  if (!state.selected) {
    state.selected = { el, ...card };
    return;
  }

  const first = state.selected;
  
  // ถ้าเลือกการ์ดประเภทเดียวกัน → สลับการเลือก
  if (first.type === card.type) {
    first.el.classList.remove('selected');
    state.selected = { el, ...card };
    return;
  }

  // ✅ เช็คว่าจับคู่ตรงกันไหม
  if (first.index === card.index) {
    // ✅ Matched!
    state.matched++;
    state.streak++;
    updateHUD();
    updateProgress();

    first.el.classList.remove('selected');
    el.classList.remove('selected');
    first.el.classList.add('matched');
    el.classList.add('matched');

    // ✅ เล่นเสียงถูก (optional)
    playMatchSound();

    setTimeout(() => {
      first.el.classList.add('hidden');
      el.classList.add('hidden');
    }, 450);

    const msg = state.streak > 1 ? `🔥 Streak ×${state.streak}` : `✅ Matched!`;
    showToast(msg, 'ok');
    state.selected = null;

    // ✅ เช็คว่าจบระดับไหม
    if (state.matched === PAIRS_PER_LEVEL) {
      setTimeout(showWin, 600);
    }
  } else {
    // ❌ Wrong!
    state.locked = true;
    state.mistakes++;
    state.streak = 0;
    updateHUD();

    first.el.classList.add('wrong');
    el.classList.add('wrong');

    // ✅ เล่นเสียงผิด (optional)
    playWrongSound();

    showToast('ลองใหม่! ❌', 'err');

    setTimeout(() => {
      first.el.classList.remove('selected', 'wrong');
      el.classList.remove('selected', 'wrong');
      state.selected = null;
      state.locked = false;
    }, 500);
  }
}

function updateHUD() {
  document.getElementById('streak').textContent = `🔥 ${state.streak}`;
  document.getElementById('mistakes').textContent = state.mistakes;
}

function updateProgress() {
  const pct = (state.matched / PAIRS_PER_LEVEL) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
}

function showWin() {
  document.getElementById('win-sub').textContent = `Level ${state.level} Complete!`;
  document.getElementById('wstat-mistakes').textContent = state.mistakes;
  document.getElementById('overlay').classList.add('show');
  spawnConfetti();
}

function nextLevel() {
  document.getElementById('overlay').classList.remove('show');
  state.level++;
  startLevel();
}

// ─── 🎉 CONFETTI ───
function spawnConfetti() {
  const colors = ['#7dd3fc', '#f9a8d4', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#f472b6'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (1.5 + Math.random() * 2.5) + 's';
    el.style.animationDelay = Math.random() * 0.8 + 's';
    el.style.width = (6 + Math.random() * 10) + 'px';
    el.style.height = (6 + Math.random() * 10) + 'px';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

// ─── 🔔 TOAST ───
let toastTimer;
function showToast(msg, cls = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + cls;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 1800);
}

// ─── 🔊 SOUND EFFECTS (Safe Fallback — ไม่พังถ้า browser บล็อกเสียง) ───
function playClickSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.05;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) { /* silent */ }
}

function playMatchSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 523;
    osc.frequency.linearRampToValueAtTime(784, ctx.currentTime + 0.15);
    gain.gain.value = 0.08;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.stop(ctx.currentTime + 0.2);
  } catch(e) { /* silent */ }
}

function playWrongSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 200;
    gain.gain.value = 0.06;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch(e) { /* silent */ }
}
