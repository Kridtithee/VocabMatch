let state = {
  level: 1,
  score: 0,
  mistakes: 0,
  streak: 0,
  pool: [],
  levelPairs: [],
  selected: null,
  matched: 0,
  locked: false,
};

const LEVEL_THEMES = [
  "Academic Vocabulary",
  "Society & Environment",
  "Critical Thinking",
  "Science & Tech",
  "Descriptive Language",
  "Reading Comprehension",
  "Advanced Usage",
  "Mixed Challenge",
];
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
  state.score = 0;
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
  document.getElementById('level-title').textContent = LEVEL_THEMES[(state.level - 1) % LEVEL_THEMES.length];
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

  cards.forEach(card => {
    const el = document.createElement('div');
    el.className = `card ${card.type}`;
    el.dataset.index = card.index;
    el.dataset.type = card.type;
    el.innerHTML = `<span>${card.text}</span>`;
    el.addEventListener('click', () => onCardClick(el, card));
    board.appendChild(el);
  });
}

function onCardClick(el, card) {
  if (state.locked || el.classList.contains('hidden') || (state.selected && state.selected.el === el)) return;

  el.classList.add('selected');
  if (!state.selected) {
    state.selected = { el, ...card };
    return;
  }

  const first = state.selected;
  if (first.type === card.type) {
    first.el.classList.remove('selected');
    state.selected = { el, ...card };
    return;
  }

  if (first.index === card.index) {
    // Matched
    state.matched++;
    state.score += 100 + state.streak * 10;
    state.streak++;
    updateHUD();
    updateProgress();

    first.el.classList.remove('selected');
    el.classList.remove('selected');
    first.el.classList.add('matched');
    el.classList.add('matched');

    setTimeout(() => {
      first.el.classList.add('hidden');
      el.classList.add('hidden');
    }, 420);

    showToast(`+${100 + (state.streak - 1) * 10} pts${state.streak > 1 ? ' 🔥×'+state.streak : ''}`, 'ok');
    state.selected = null;

    if (state.matched === PAIRS_PER_LEVEL) {
      setTimeout(showWin, 600);
    }
  } else {
    // Wrong
    state.locked = true;
    state.mistakes++;
    state.streak = 0;
    updateHUD();

    first.el.classList.add('wrong');
    el.classList.add('wrong');

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
  document.getElementById('score').textContent = state.score;
  document.getElementById('streak').textContent = `🔥 ${state.streak}`;
  document.getElementById('mistakes').textContent = state.mistakes;
}

function updateProgress() {
  document.getElementById('progress-bar').style.width = (state.matched / PAIRS_PER_LEVEL * 100) + '%';
}

function showWin() {
  document.getElementById('win-sub').textContent = `Level ${state.level} Complete!`;
  document.getElementById('wstat-score').textContent = state.score;
  document.getElementById('wstat-mistakes').textContent = state.mistakes;
  document.getElementById('overlay').classList.add('show');
  spawnConfetti();
}

function nextLevel() {
  document.getElementById('overlay').classList.remove('show');
  state.level++;
  startLevel();
}

function spawnConfetti() {
  const colors = ['#a8dadc', '#f28482', '#f4a261', '#a7c957', '#e07a5f', '#cdb4db'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    el.style.animationDelay = Math.random() * 0.8 + 's';
    el.style.width = (6 + Math.random() * 8) + 'px';
    el.style.height = (6 + Math.random() * 8) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

let toastTimer;
function showToast(msg, cls = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + cls;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 1600);
}