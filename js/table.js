function renderVocabTable(filterText = '') {
  const tbody = document.getElementById('vocab-tbody');
  tbody.innerHTML = '';

  const filtered = filterText
    ? VOCAB_BANK.filter(v =>
        v.en.toLowerCase().includes(filterText.toLowerCase()) ||
        v.th.includes(filterText) ||
        v.ex.toLowerCase().includes(filterText.toLowerCase())
      )
    : VOCAB_BANK;

  filtered.forEach((v, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td class="eng">${v.en}</td>
      <td>${v.th}</td>
      <td>${v.ex || '-'}</td>
      <td>${v.ex_th || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function initTableTab() {
  const searchInput = document.getElementById('vocab-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderVocabTable(e.target.value));
  }
  renderVocabTable();
}