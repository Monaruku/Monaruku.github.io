/* ── Tarot App Logic ── */
(function() {
  'use strict';

  // ── State ──
  var state = {
    phase: 'intention',
    intention: '',
    category: 'general',
    deck: [],
    fanCards: [],
    selectedCards: [],
    currentPosition: 0
  };
  var POSITIONS = ['past', 'present', 'future'];
  var POSITION_NAMES = ['Past', 'Present', 'Future'];
  var SUIT_SYMBOLS = { wands: '\u{1F525}', cups: '\u{1F4A7}', swords: '\u{1F4A8}', pentacles: '\u2B50' };
  var ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV'];

  // ── DOM cache ──
  var els = {};

  function $(id) { return document.getElementById(id); }

  // ── Phase Controller ──
  function showPhase(name) {
    state.phase = name;
    var phases = document.querySelectorAll('.phase');
    for (var i = 0; i < phases.length; i++) {
      phases[i].classList.remove('phase-active');
    }
    var target = $('phase-' + name);
    if (target) {
      target.classList.add('phase-active');
      // Smooth scroll to top of app
      var app = document.querySelector('.tarot-app');
      if (app) app.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── Phase 1: Intention ──
  function initIntention() {
    var btn = $('btn-shuffle');
    if (btn) {
      btn.addEventListener('click', function() {
        state.intention = ($('intention-input') || {}).value || '';
        showPhase('category');
      });
    }
  }

  // ── Phase 2: Category ──
  function initCategory() {
    var cards = document.querySelectorAll('.category-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', function() {
        state.category = this.getAttribute('data-category') || 'general';
        startShuffle();
      });
    }
  }

  // ── Phase 3: Shuffle ──
  function startShuffle() {
    showPhase('shuffle');
    // Shuffle after a delay for animation
    state.deck = window.TarotUtils.shuffleDeck();
    var stopBtn = $('btn-stop-shuffle');
    if (stopBtn) {
      stopBtn.disabled = false;
      stopBtn.addEventListener('click', function handler() {
        stopBtn.removeEventListener('click', handler);
        showSelection();
      });
    }
    // Auto-stop after 4 seconds
    setTimeout(function() {
      if (state.phase === 'shuffle') showSelection();
    }, 4000);
  }

  // ── Phase 4: Selection ──
  function showSelection() {
    state.selectedCards = [];
    state.currentPosition = 0;
    state.fanCards = state.deck.slice(0, 7);
    showPhase('select');

    var fan = $('select-fan');
    if (!fan) return;
    fan.innerHTML = '';

    // Update position prompt
    updatePositionPrompt();

    for (var i = 0; i < state.fanCards.length; i++) {
      var cardData = state.fanCards[i];
      var el = buildCardElement(cardData.card, cardData.isReversed);
      el.setAttribute('data-index', i);
      el.addEventListener('click', onFanCardClick);
      fan.appendChild(el);
    }
  }

  function updatePositionPrompt() {
    var prompt = $('position-prompt');
    if (!prompt) return;
    var pos = POSITIONS[state.currentPosition];
    prompt.textContent = POSITION_NAMES[state.currentPosition];
    prompt.className = 'position-prompt ' + pos;
  }

  function onFanCardClick() {
    if (state.currentPosition >= 3) return;
    var idx = parseInt(this.getAttribute('data-index'), 10);
    var cardData = state.fanCards[idx];

    // Mark selected
    this.classList.add('selected');
    this.removeEventListener('click', onFanCardClick);

    state.selectedCards.push({
      card: cardData.card,
      isReversed: cardData.isReversed,
      position: POSITIONS[state.currentPosition]
    });
    state.currentPosition++;

    // Dim unselected if we have enough
    if (state.currentPosition >= 3) {
      var fanCards = $('select-fan').querySelectorAll('.tarot-card');
      for (var i = 0; i < fanCards.length; i++) {
        if (!fanCards[i].classList.contains('selected')) {
          fanCards[i].classList.add('dimmed');
        }
      }
      // Transition to reveal after delay
      setTimeout(revealCards, 800);
    } else {
      updatePositionPrompt();
    }
  }

  // ── Build Card Element ──
  function buildCardElement(card, isReversed) {
    var wrapper = document.createElement('div');
    wrapper.className = 'tarot-card' + (isReversed ? ' reversed' : '');

    var suitClass = '';
    if (card.arcana === 'major') suitClass = ' arcana-major';
    else if (card.suit) suitClass = ' suit-' + card.suit;

    var inner = document.createElement('div');
    inner.className = 'tarot-card-inner' + suitClass;

    // Back
    var back = document.createElement('div');
    back.className = 'tarot-card-face tarot-card-back';
    var backImg = document.createElement('img');
    backImg.src = (window.TAROT_CARD_BACK || '/assets/tarot/card-back.png');
    backImg.alt = 'Card back';
    backImg.onerror = function() {
      this.style.display = 'none';
      var fb = document.createElement('span');
      fb.className = 'back-fallback';
      fb.textContent = '\u2726';
      back.appendChild(fb);
    };
    back.appendChild(backImg);

    // Front
    var front = document.createElement('div');
    front.className = 'tarot-card-face tarot-card-front';

    var numEl = document.createElement('div');
    numEl.className = 'card-front-number';
    if (card.arcana === 'major') {
      numEl.textContent = (ROMAN[card.number] || card.number) + ' \u00B7 Major Arcana';
    } else {
      numEl.textContent = card.number <= 10 ? card.number : ['','A','2','3','4','5','6','7','8','9','10','Page','Knight','Queen','King'][card.number];
      numEl.textContent += ' of ' + capitalize(card.suit);
    }

    var iconEl = document.createElement('div');
    iconEl.className = 'card-front-icon';
    if (card.arcana === 'major') {
      iconEl.textContent = '\u2726';
    } else {
      iconEl.textContent = SUIT_SYMBOLS[card.suit] || '\u2726';
    }

    var nameEl = document.createElement('div');
    nameEl.className = 'card-front-name';
    nameEl.textContent = card.name;

    var divider = document.createElement('div');
    divider.className = 'card-front-divider';

    var orient = isReversed ? card.reversed : card.upright;
    var kwEl = document.createElement('div');
    kwEl.className = 'card-front-keywords';
    kwEl.textContent = orient.keywords.join(', ');

    front.appendChild(numEl);
    front.appendChild(iconEl);
    front.appendChild(nameEl);
    front.appendChild(divider);
    front.appendChild(kwEl);

    inner.appendChild(back);
    inner.appendChild(front);
    wrapper.appendChild(inner);
    return wrapper;
  }

  // ── Phase 5: Reveal ──
  function revealCards() {
    showPhase('reveal');
    var spread = $('reveal-spread');
    if (!spread) return;
    spread.innerHTML = '';

    for (var i = 0; i < state.selectedCards.length; i++) {
      var sel = state.selectedCards[i];
      var posDiv = document.createElement('div');
      posDiv.className = 'spread-position';

      var label = document.createElement('span');
      label.className = 'position-label ' + sel.position;
      label.textContent = POSITION_NAMES[i];

      var cardEl = buildCardElement(sel.card, sel.isReversed);
      cardEl.id = 'reveal-card-' + i;

      posDiv.appendChild(label);
      posDiv.appendChild(cardEl);
      spread.appendChild(posDiv);
    }

    // Sequential flip
    setTimeout(function() { flipCard(0); }, 600);
  }

  function flipCard(index) {
    var card = $('reveal-card-' + index);
    if (card) card.classList.add('flipped');

    if (index < 2) {
      setTimeout(function() { flipCard(index + 1); }, 1200);
    } else {
      // All flipped — show reading after delay
      setTimeout(showReading, 1500);
    }
  }

  // ── Phase 6: Reading (Interpretation) ──
  function showReading() {
    showPhase('reading');

    // Build spread (reuse reveal cards)
    var readingSpread = $('reading-spread');
    if (readingSpread) {
      readingSpread.innerHTML = '';
      for (var i = 0; i < state.selectedCards.length; i++) {
        var sel = state.selectedCards[i];
        var posDiv = document.createElement('div');
        posDiv.className = 'spread-position';

        var label = document.createElement('span');
        label.className = 'position-label ' + sel.position;
        label.textContent = POSITION_NAMES[i];

        var cardEl = buildCardElement(sel.card, sel.isReversed);
        cardEl.classList.add('flipped');

        posDiv.appendChild(label);
        posDiv.appendChild(cardEl);
        readingSpread.appendChild(posDiv);
      }
    }

    // Build interpretation
    var content = $('reading-content');
    if (!content) return;
    content.innerHTML = '';

    var interp = window.TAROT_INTERPRETATIONS;
    var cat = interp.categories[state.category] || interp.categories.general;

    // Intro
    var introDiv = document.createElement('div');
    introDiv.className = 'reading-intro fade-in';
    introDiv.innerHTML = cat.tone + ' the cards speak to your journey.';
    if (state.intention) {
      var qSpan = document.createElement('span');
      qSpan.className = 'question-text';
      qSpan.textContent = '"' + escapeHtml(state.intention) + '"';
      introDiv.appendChild(qSpan);
    }
    content.appendChild(introDiv);

    // Category intro
    var catIntro = document.createElement('p');
    catIntro.className = 'reading-card-text fade-in';
    catIntro.textContent = pickRandom(cat.intros);
    content.appendChild(catIntro);

    // Each card
    for (var i = 0; i < state.selectedCards.length; i++) {
      var sel = state.selectedCards[i];
      var section = buildCardReading(sel, i);
      content.appendChild(section);
    }

    // Card pair interactions
    var interactions = buildInteractions();
    if (interactions) content.appendChild(interactions);

    // Summary
    var summary = buildSummary();
    content.appendChild(summary);

    // New reading button
    var newBtn = $('btn-new-reading');
    if (newBtn) {
      newBtn.onclick = resetReading;
    }
  }

  function buildCardReading(sel, index) {
    var interp = window.TAROT_INTERPRETATIONS;
    var cat = interp.categories[state.category] || interp.categories.general;
    var posData = interp.positions[sel.position];
    var orient = sel.isReversed ? 'reversed' : 'upright';
    var cardOrient = sel.card[orient];

    var section = document.createElement('div');
    section.className = 'reading-card-section fade-in';
    section.style.animationDelay = (index * 0.2) + 's';

    // Header
    var header = document.createElement('div');
    header.className = 'reading-card-header';

    var posBadge = document.createElement('span');
    posBadge.className = 'reading-position-badge ' + sel.position;
    posBadge.textContent = POSITION_NAMES[index];

    var orientBadge = document.createElement('span');
    orientBadge.className = 'reading-orientation ' + orient;
    orientBadge.textContent = sel.isReversed ? 'Reversed' : 'Upright';

    var nameEl = document.createElement('span');
    nameEl.className = 'reading-card-name';
    nameEl.textContent = sel.card.name;

    header.appendChild(posBadge);
    header.appendChild(orientBadge);
    header.appendChild(nameEl);
    section.appendChild(header);

    // Keywords
    var kw = document.createElement('div');
    kw.className = 'reading-card-keywords';
    kw.textContent = cardOrient.keywords.join(' \u00B7 ');
    section.appendChild(kw);

    // Position intro
    var posIntro = document.createElement('p');
    posIntro.className = 'reading-card-text';
    posIntro.textContent = posData.intro;
    section.appendChild(posIntro);

    // Position-specific framing
    var posFraming = document.createElement('p');
    posFraming.className = 'reading-card-text';
    var framingPool = posData[orient];
    posFraming.textContent = pickRandom(framingPool);
    section.appendChild(posFraming);

    // Description (random variant)
    var desc = document.createElement('p');
    desc.className = 'reading-card-text';
    desc.textContent = pickRandom(cardOrient.descriptions);
    section.appendChild(desc);

    // Category-specific note
    if (cardOrient.categories && cardOrient.categories[state.category]) {
      var catNote = document.createElement('div');
      catNote.className = 'reading-card-category';
      catNote.textContent = cardOrient.categories[state.category];
      section.appendChild(catNote);
    }

    return section;
  }

  function buildInteractions() {
    var interp = window.TAROT_INTERPRETATIONS;
    var pairs = interp.pairInteractions;
    var bridges = interp.genericBridges;
    var items = [];

    // Check Past-Present and Present-Future pairs
    for (var p = 0; p < state.selectedCards.length - 1; p++) {
      var c1 = state.selectedCards[p].card;
      var c2 = state.selectedCards[p + 1].card;
      var key1 = c1.name + '-' + c2.name;
      var key2 = c2.name + '-' + c1.name;
      var text = pairs[key1] || pairs[key2];

      if (!text) {
        // Generic bridge
        var bridge = pickRandom(bridges);
        text = bridge.replace(/\{card1\}/g, c1.name).replace(/\{card2\}/g, c2.name);
      }

      var label = POSITION_NAMES[p] + ' \u2194 ' + POSITION_NAMES[p + 1];
      items.push({ label: label, text: text });
    }

    if (items.length === 0) return null;

    var div = document.createElement('div');
    div.className = 'reading-interactions fade-in';

    var h3 = document.createElement('h3');
    h3.textContent = 'Card Interactions';
    div.appendChild(h3);

    for (var i = 0; i < items.length; i++) {
      var item = document.createElement('div');
      item.className = 'interaction-item';
      item.innerHTML = '<strong>' + items[i].label + ':</strong> ' + items[i].text;
      div.appendChild(item);
    }
    return div;
  }

  function buildSummary() {
    var interp = window.TAROT_INTERPRETATIONS;
    var templates = interp.summaryTemplates;
    var cat = interp.categories[state.category] || interp.categories.general;

    var div = document.createElement('div');
    div.className = 'reading-summary fade-in';

    var h3 = document.createElement('h3');
    h3.textContent = 'Overall Reading';
    div.appendChild(h3);

    // Count major vs minor
    var majorCount = 0, suitCounts = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
    for (var i = 0; i < state.selectedCards.length; i++) {
      if (state.selectedCards[i].card.arcana === 'major') majorCount++;
      else if (state.selectedCards[i].card.suit) suitCounts[state.selectedCards[i].card.suit]++;
    }

    // Major/minor template
    var mmText;
    if (majorCount >= 2) mmText = pickRandom(templates.majorDominant).replace('{count}', majorCount);
    else if (majorCount === 0) mmText = pickRandom(templates.minorDominant);
    else mmText = pickRandom(templates.balanced);

    var p1 = document.createElement('p');
    p1.textContent = mmText;
    div.appendChild(p1);

    // Dominant suit
    var maxSuit = '', maxCount = 0;
    for (var s in suitCounts) {
      if (suitCounts[s] > maxCount) { maxCount = suitCounts[s]; maxSuit = s; }
    }
    if (maxCount >= 2 && templates.suitDominant[maxSuit]) {
      var p2 = document.createElement('p');
      p2.textContent = templates.suitDominant[maxSuit];
      div.appendChild(p2);
    }

    // Category summary
    var p3 = document.createElement('p');
    p3.textContent = pickRandom(cat.summaries);
    div.appendChild(p3);

    // Closing
    var p4 = document.createElement('p');
    p4.textContent = pickRandom(templates.closings);
    p4.style.fontStyle = 'italic';
    p4.style.color = 'rgba(240,240,245,0.5)';
    div.appendChild(p4);

    return div;
  }

  // ── Reset ──
  function resetReading() {
    state.intention = '';
    state.category = 'general';
    state.deck = [];
    state.fanCards = [];
    state.selectedCards = [];
    state.currentPosition = 0;

    var input = $('intention-input');
    if (input) input.value = '';

    showPhase('intention');
  }

  // ── Helpers ──
  function pickRandom(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }
  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ── Init ──
  function init() {
    if (!window.TAROT_DECK) return;
    window.TarotUtils.init();

    initIntention();
    initCategory();
    showPhase('intention');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
