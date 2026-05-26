// fill-blank.js — Multiple Choice A B C D Mode (Fixed Blank)

let fbState = {
    currentVocab: null,
    streak: 0,
    mistakes: 0,
    totalAnswered: 0,
    answered: false,
    shuffledPool: [],
    poolIndex: 0,
    choices: [],
  };
  
  const CHOICE_COUNT = 4;
  const LETTERS = ['A', 'B', 'C', 'D'];
  
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // สร้างประโยคที่มีช่องว่าง โดยลองจับคำให้ยืดหยุ่นขึ้น
  function createBlankSentence(sentence, word) {
    // 1. ลองจับทั้งคำแบบมีขอบเขต (word boundary)
    const regexWhole = new RegExp('\\b' + escapeRegex(word) + '\\b', 'i');
    if (regexWhole.test(sentence)) {
      return sentence.replace(regexWhole, '<span class="blank"></span>');
    }
  
    // 2. ถ้าไม่เจอทั้งคำ ลองหาคำที่เป็น substring (เช่น abandon ใน abandoned)
    const lowerSentence = sentence.toLowerCase();
    const lowerWord = word.toLowerCase();
    const idx = lowerSentence.indexOf(lowerWord);
    if (idx !== -1) {
      const before = sentence.substring(0, idx);
      const after = sentence.substring(idx + word.length);
      return before + '<span class="blank"></span>' + after;
    }
  
    // 3. หาไม่เจอเลย → คืน null เพื่อข้ามข้อนี้
    return null;
  }
  
  function initFillBlank() {
    fbState.streak = 0;
    fbState.mistakes = 0;
    fbState.totalAnswered = 0;
    fbState.shuffledPool = shuffleArray(
      [...VOCAB_BANK].filter(v => v.ex && v.ex.trim() !== '')
    );
    fbState.poolIndex = 0;
    fbState.answered = false;
    updateFBHUD();
    nextFillBlank();
  }
  
  function nextFillBlank() {
    // หาข้อถัดไปที่สร้างประโยคได้ถูกต้อง
    let blankSentence = null;
    while (fbState.poolIndex < fbState.shuffledPool.length) {
      const vocab = fbState.shuffledPool[fbState.poolIndex];
      fbState.poolIndex++;
      blankSentence = createBlankSentence(vocab.ex, vocab.en);
      if (blankSentence) {
        fbState.currentVocab = vocab;
        break;
      }
    }
  
    // ถ้าหมด pool แล้วยังไม่ได้ ให้สร้าง pool ใหม่
    if (!blankSentence) {
      fbState.shuffledPool = shuffleArray(
        [...VOCAB_BANK].filter(v => v.ex && v.ex.trim() !== '')
      );
      fbState.poolIndex = 0;
      // ลองอีกครั้ง (อย่างน้อยต้องมีสักคำที่ใช้ได้)
      while (fbState.poolIndex < fbState.shuffledPool.length) {
        const vocab = fbState.shuffledPool[fbState.poolIndex];
        fbState.poolIndex++;
        blankSentence = createBlankSentence(vocab.ex, vocab.en);
        if (blankSentence) {
          fbState.currentVocab = vocab;
          break;
        }
      }
    }
  
    // ถ้ายังไม่ได้อีก (ไม่น่าเกิด) → ใช้ประโยคแรกแบบ brute force ตัดคำ
    if (!blankSentence && VOCAB_BANK.length > 0) {
      fbState.currentVocab = VOCAB_BANK[0];
      blankSentence = '<span class="blank"></span> ' + fbState.currentVocab.ex; // fallback
    }
  
    fbState.answered = false;
  
    document.getElementById('fb-sentence').innerHTML = blankSentence;
    document.getElementById('fb-feedback').textContent = '';
    document.getElementById('fb-feedback').className = 'fb-feedback';
    document.getElementById('fb-hint').textContent = '';
    document.getElementById('fb-next').style.display = 'none';
  
    generateChoices(fbState.currentVocab);
    renderChoices();
    updateProgress();
  }
  
  // ---- ส่วนที่เหลือเหมือนเดิม ----
  function generateChoices(correctVocab) {
    const correctAnswer = correctVocab.en;
    const wrongPool = VOCAB_BANK.filter(v => v.en.toLowerCase() !== correctAnswer.toLowerCase());
    const shuffledWrong = shuffleArray([...wrongPool]);
    const wrongChoices = shuffledWrong.slice(0, CHOICE_COUNT - 1).map(v => v.en);
    fbState.choices = shuffleArray([correctAnswer, ...wrongChoices]);
  }
  
  function renderChoices() {
    const container = document.getElementById('fb-choices');
    if (!container) return;
    container.innerHTML = '';
    fbState.choices.forEach((word, i) => {
      const btn = document.createElement('button');
      btn.className = 'fb-choice';
      btn.innerHTML = `<span class="choice-letter">${LETTERS[i]}</span> <span>${word}</span>`;
      btn.addEventListener('click', () => selectChoice(i, btn));
      container.appendChild(btn);
    });
  }
  
  function selectChoice(index, el) {
    if (fbState.answered) return;
    fbState.answered = true;
    fbState.totalAnswered++;
  
    const userAnswer = fbState.choices[index];
    const correctAnswer = fbState.currentVocab.en;
    const meaning = fbState.currentVocab.th;
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
  
    const allChoices = document.querySelectorAll('.fb-choice');
    allChoices.forEach(btn => btn.classList.add('disabled'));
  
    const correctIndex = fbState.choices.findIndex(c => c.toLowerCase() === correctAnswer.toLowerCase());
    if (correctIndex >= 0 && allChoices[correctIndex]) {
      allChoices[correctIndex].classList.add('correct');
    }
  
    const feedbackEl = document.getElementById('fb-feedback');
    const hintEl = document.getElementById('fb-hint');
  
    if (isCorrect) {
      fbState.streak++;
      el.classList.add('correct');
      feedbackEl.textContent = '✅ ถูกต้อง!';
      feedbackEl.className = 'fb-feedback correct';
      hintEl.textContent = `"${correctAnswer}" = ${meaning}`;
    } else {
      fbState.mistakes++;
      fbState.streak = 0;
      el.classList.add('wrong');
      feedbackEl.textContent = `❌ ผิด! คำตอบคือ "${correctAnswer}"`;
      feedbackEl.className = 'fb-feedback wrong';
      hintEl.textContent = `"${correctAnswer}" = ${meaning}`;
    }
  
    updateFBHUD();
    document.getElementById('fb-next').style.display = 'inline-block';
  }
  
  function updateProgress() {
    const el = document.getElementById('fb-counter');
    if (el) el.textContent = `${fbState.totalAnswered + 1} / ${fbState.shuffledPool.length}`;
  }
  
  function updateFBHUD() {
    document.getElementById('streak').textContent = `🔥 ${fbState.streak}`;
    document.getElementById('mistakes').textContent = fbState.mistakes;
  }
  
  function handleKeyboard(e) {
    const section = document.getElementById('fillblank-section');
    if (!section || section.style.display === 'none') return;
    if (fbState.answered) {
      if (e.key === 'Enter') { e.preventDefault(); nextFillBlank(); }
      return;
    }
    const key = e.key.toUpperCase();
    const idx = LETTERS.indexOf(key);
    if (idx >= 0 && idx < fbState.choices.length) {
      const btns = document.querySelectorAll('.fb-choice');
      if (btns[idx]) btns[idx].click();
    }
  }
  
  function bindFillBlankEvents() {
    document.getElementById('fb-next').addEventListener('click', nextFillBlank);
    document.addEventListener('keydown', handleKeyboard);
  }
  
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  if (typeof window.fillBlankBound === 'undefined') {
    window.fillBlankBound = true;
    window.addEventListener('DOMContentLoaded', bindFillBlankEvents);
  }