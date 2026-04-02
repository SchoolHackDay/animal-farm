/* ================================================================
   ANIMAL FARM — main.js
   Vanilla JS, plain objects, functions only.
================================================================ */

'use strict';

// ================================================================
// STAŁE
// ================================================================

const COLORS      = ['#2196F3','#F44336','#4CAF50','#FFC107','#FF9800','#9C27B0'];
const COLOR_NAMES = ['Niebieski','Czerwony','Zielony','Żółty','Pomarańczowy','Fioletowy'];

const INITIAL_POOL = { rabbit:60, sheep:24, pig:20, cow:12, horse:4, smallDog:4, bigDog:2 };

const ANIMALS    = ['rabbit','sheep','pig','cow','horse'];
const TRADEABLE  = ['rabbit','sheep','pig','cow','horse','smallDog','bigDog'];
const WIN_ANIMALS= ['rabbit','sheep','pig','cow','horse'];

const EMOJI = {
  rabbit:'🐰', sheep:'🐑', pig:'🐷', cow:'🐄', horse:'🐴',
  smallDog:'🐕', bigDog:'🦮', fox:'🦊', wolf:'🐺'
};
const NAMES = {
  rabbit:'Królik', sheep:'Owca', pig:'Świnia', cow:'Krowa', horse:'Koń',
  smallDog:'Mały pies', bigDog:'Duży pies', fox:'Lis', wolf:'Wilk'
};

// Wartość w królikach
const VALUE = { rabbit:1, sheep:6, pig:12, cow:36, horse:72, smallDog:6, bigDog:36 };

// Kostka różowa (12 ścian)
const PINK_DICE = [
  'rabbit','rabbit','rabbit','rabbit','rabbit','rabbit',
  'sheep','sheep',
  'horse',
  'fox',
  'pig','pig'
];
// Kostka żółta (12 ścian)
const YELLOW_DICE = [
  'rabbit','rabbit','rabbit','rabbit','rabbit','rabbit',
  'sheep','sheep','sheep',
  'pig',
  'wolf',
  'cow'
];

const SUPABASE_SCHEMA = `-- Uruchom w SQL Editorze Supabase:

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON game_sessions
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;`;

// ================================================================
// STAN GLOBALNY
// ================================================================

let gs = null;          // game state
let myPlayerId = null;  // id gracza (tryb sieciowy)
let supaClient = null;
let supaChannel = null;
let aiTimer = null;

// Stan wymiany (modal)
const trade = { giving: {}, receiving: {} };

// ================================================================
// NARZĘDZIA
// ================================================================

function rand(n)    { return Math.floor(Math.random() * n); }
function rollDie(d) { return d[rand(d.length)]; }

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function genCode() {
  // 6-znakowy kod alfanumeryczny
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function calcValue(animalMap) {
  return Object.entries(animalMap).reduce((s, [a, n]) => s + (VALUE[a] || 0) * (n || 0), 0);
}

function qs(sel) { return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }

function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

// ================================================================
// LOGIKA GRY
// ================================================================

function createPlayer(id, name, colorIdx, isAI) {
  return {
    id,
    name,
    colorIdx,
    color: COLORS[colorIdx],
    isAI,
    inventory: { rabbit:0, sheep:0, pig:0, cow:0, horse:0, smallDog:0, bigDog:0 }
  };
}

function createGame(players, mode) {
  return {
    players,
    pool: deepCopy(INITIAL_POOL),
    currentIdx: 0,
    phase: 'trade',       // 'trade' | 'rolled' | 'end'
    tradeUsed: false,
    lastDice: null,
    log: [],
    mode,                  // 'local' | 'network'
    gameId: null,
    creatorId: null,
    winner: null
  };
}

function addLog(msg, type) {
  gs.log.unshift({ msg, type: type || 'normal', t: Date.now() });
  if (gs.log.length > 200) gs.log.pop();
  UI.appendLog(msg, type);
}

/** Oblicz rozmnażanie: zwraca { animal: ile_nowych } */
function calcBreeding(inventory, pink, yellow) {
  const p = ['fox','wolf'].includes(pink)  ? null : pink;
  const y = ['fox','wolf'].includes(yellow) ? null : yellow;
  const result = {};
  for (const a of ANIMALS) {
    const diceCount = (p === a ? 1 : 0) + (y === a ? 1 : 0);
    const invCount  = inventory[a] || 0;
    // Warunek: oba kości = to samo zwierzę LUB 1 kość + 1 w inventory
    const triggered = diceCount >= 2 || (diceCount >= 1 && invCount >= 1);
    if (triggered) {
      result[a] = Math.floor((invCount + diceCount) / 2);
    }
  }
  return result;
}

/** Zastosuj rozmnażanie z puli — zwraca string do loga */
function applyBreeding(player, gained) {
  const parts = [];
  for (const [a, count] of Object.entries(gained)) {
    if (count <= 0) continue;
    const avail  = gs.pool[a] || 0;
    const actual = Math.min(count, avail);
    if (actual > 0) {
      player.inventory[a] = (player.inventory[a] || 0) + actual;
      gs.pool[a] -= actual;
      parts.push(`+${actual}${EMOJI[a]}`);
    }
  }
  return parts.length ? parts.join(' ') : '—';
}

/** Obsługa lisa — zwraca string do loga */
function handleFox(player) {
  if (player.inventory.smallDog > 0) return `🦊${EMOJI.smallDog}ok`;
  const n = player.inventory.rabbit || 0;
  player.inventory.rabbit = 0;
  gs.pool.rabbit = (gs.pool.rabbit || 0) + n;
  return `🦊-${n}${EMOJI.rabbit}`;
}

/** Obsługa wilka — zwraca string do loga */
function handleWolf(player) {
  if (player.inventory.bigDog > 0) return `🐺${EMOJI.bigDog}ok`;
  const lost = [];
  for (const a of ['rabbit','sheep','pig','cow']) {
    const n = player.inventory[a] || 0;
    if (n > 0) {
      lost.push(`-${n}${EMOJI[a]}`);
      gs.pool[a] = (gs.pool[a] || 0) + n;
      player.inventory[a] = 0;
    }
  }
  return lost.length ? `🐺${lost.join('')}` : '🐺—';
}

function hasWon(player) {
  return WIN_ANIMALS.every(a => (player.inventory[a] || 0) >= 1);
}

// ================================================================
// WALIDACJA I WYKONANIE WYMIANY
// ================================================================

function validateTrade(giving, receiving, playerInv) {
  const giveRows = Object.entries(giving).filter(([, v]) => v > 0);
  const recvRows = Object.entries(receiving).filter(([, v]) => v > 0);

  if (giveRows.length === 0 || recvRows.length === 0) {
    return { ok: false, msg: 'Wybierz co dajesz i co dostajesz' };
  }

  // Zakaz wiele→wiele
  if (giveRows.length > 1 && recvRows.length > 1) {
    return { ok: false, msg: 'Nie można zamieniać wiele ↔ wiele!' };
  }

  // Sprawdź czy gracz ma dość
  for (const [a, n] of giveRows) {
    if ((playerInv[a] || 0) < n) {
      return { ok: false, msg: `Za mało: ${NAMES[a]} (masz ${playerInv[a] || 0})` };
    }
  }

  // Sprawdź czy pula ma dość
  for (const [a, n] of recvRows) {
    if ((gs.pool[a] || 0) < n) {
      return { ok: false, msg: `W puli brakuje: ${NAMES[a]} (dostępne: ${gs.pool[a] || 0})` };
    }
  }

  // Psy: max 1 sztuka
  const DOG_MAX = { smallDog: 1, bigDog: 1 };
  for (const [a, limit] of Object.entries(DOG_MAX)) {
    const already  = playerInv[a] || 0;
    const getting  = receiving[a] || 0;
    const giving_  = giving[a]   || 0;
    if (already - giving_ + getting > limit) {
      return { ok: false, msg: `Można mieć tylko 1 ${NAMES[a]}!` };
    }
  }

  const gv = calcValue(giving);
  const rv = calcValue(receiving);
  if (gv !== rv) {
    return { ok: false, msg: `Wartości nie równe: ${gv} ≠ ${rv} 🐰` };
  }

  return { ok: true, msg: `✅ Wymiana możliwa! (${gv} 🐰)` };
}

function doTrade(giving, receiving, player) {
  for (const [a, n] of Object.entries(giving)) {
    if (n > 0) { player.inventory[a] -= n; gs.pool[a] = (gs.pool[a] || 0) + n; }
  }
  for (const [a, n] of Object.entries(receiving)) {
    if (n > 0) { player.inventory[a] = (player.inventory[a] || 0) + n; gs.pool[a] -= n; }
  }
  const gParts = Object.entries(giving).filter(([,v])=>v>0).map(([a,v])=>`${v}${EMOJI[a]}`).join(' ');
  const rParts = Object.entries(receiving).filter(([,v])=>v>0).map(([a,v])=>`${v}${EMOJI[a]}`).join(' ');
  addLog(`🛍️ ${player.name}: ${gParts}→${rParts}`, 'good');
}

// ================================================================
// ANIMACJA KOSTEK
// ================================================================

// Wszystkie możliwe twarze obu kostek (do animacji)
const ALL_DICE_FACES = [...new Set([...PINK_DICE, ...YELLOW_DICE])];

/**
 * Animuje obie kostki jak slot-maszyna: szybkie losowe emoji → zwalnia → wynik.
 * @param {string} finalPink   – wylosowany wynik różowej kostki
 * @param {string} finalYellow – wylosowany wynik żółtej kostki
 * @param {Function} onDone    – callback po zakończeniu animacji
 */
function animateDice(finalPink, finalYellow, onDone, fast) {
  const elPink   = qs('#die-pink');
  const elYellow = qs('#die-yellow');

  elPink.classList.add('rolling');
  elYellow.classList.add('rolling');

  // Harmonogram klatek: human = płynny, AI = błyskawiczny
  const schedule = fast
    ? [20, 25, 30]                          // AI – ~75ms łącznie
    : [28, 33, 38, 45, 55, 70, 88, 110];   // gracz – ~467ms łącznie

  let frame = 0;

  function nextFrame() {
    if (frame >= schedule.length) {
      elPink.classList.remove('rolling');
      elYellow.classList.remove('rolling');

      elPink.textContent   = EMOJI[finalPink]  || finalPink;
      elYellow.textContent = EMOJI[finalYellow] || finalYellow;

      elPink.classList.add('landed');
      elYellow.classList.add('landed');

      const landDelay = fast ? 80 : 220;
      setTimeout(() => {
        elPink.classList.remove('landed');
        elYellow.classList.remove('landed');
        onDone();
      }, landDelay);
      return;
    }

    elPink.textContent   = EMOJI[ALL_DICE_FACES[rand(ALL_DICE_FACES.length)]];
    elYellow.textContent = EMOJI[ALL_DICE_FACES[rand(ALL_DICE_FACES.length)]];

    frame++;
    setTimeout(nextFrame, schedule[frame - 1]);
  }

  nextFrame();
}

// ================================================================
// LOGIKA TURY
// ================================================================

const Game = {

  /** Wykonaj rzut dla bieżącego gracza */
  roll(fast) {
    if (!gs || gs.phase !== 'trade') return;
    if (gs.mode === 'network' && gs.players[gs.currentIdx].id !== myPlayerId) return;

    const pink   = rollDie(PINK_DICE);
    const yellow = rollDie(YELLOW_DICE);

    qs('#btn-roll').disabled  = true;
    qs('#btn-trade').disabled = true;

    animateDice(pink, yellow, () => {
      Game._processRoll(pink, yellow, fast);
    }, fast);
  },

  /** Przetwarza wyniki rzutu (po animacji) */
  _processRoll(pink, yellow, fast) {
    const player = gs.players[gs.currentIdx];
    gs.lastDice  = { pink, yellow };
    gs.phase     = 'rolled';

    // Zbierz efekty w stringi, aplikuj zmiany
    let eventPart = '';
    if (pink === 'fox'  || yellow === 'fox')  eventPart += ' ' + handleFox(player);
    if (pink === 'wolf' || yellow === 'wolf') eventPart += ' ' + handleWolf(player);

    const gained = calcBreeding(player.inventory, pink, yellow);
    const breedPart = applyBreeding(player, gained);

    // Jedna linia: "Pati 🐰+🐑 +2🐰"  lub  "Pati 🦊+🐑 🦊-3🐰"
    const hasBad = eventPart.includes('🦊') || eventPart.includes('🐺');
    const logLine = `${player.name} ${EMOJI[pink]||pink}+${EMOJI[yellow]||yellow}${eventPart} ${breedPart}`;
    addLog(logLine.trim(), hasBad ? 'bad' : breedPart !== '—' ? 'good' : 'normal');

    // Sprawdź wygraną
    if (hasWon(player)) {
      gs.phase  = 'end';
      gs.winner = player;
      addLog(`🏆 ${player.name} wygrał!`, 'turn');
      if (gs.mode === 'network') Net.pushState();
      UI.renderGame();
      setTimeout(() => UI.showEndScreen(player), 1200);
      return;
    }

    if (gs.mode === 'network') Net.pushState();
    UI.renderGame();

    // AI: przejdź niemal natychmiast; gracz: daj chwilę na odczytanie wyniku
    setTimeout(() => Game.nextTurn(), fast ? 200 : 200);
  },

  nextTurn() {
    if (!gs || gs.phase === 'end') return;
    gs.currentIdx  = (gs.currentIdx + 1) % gs.players.length;
    gs.phase       = 'trade';
    gs.tradeUsed   = false;
    gs.lastDice    = null;
    const next = gs.players[gs.currentIdx];
    if (gs.mode === 'network') Net.pushState();
    UI.renderGame();

    // Handoff dla trybu lokalnego z wieloma prawdziwymi graczami
    const hasRealPlayers = gs.players.filter(p => !p.isAI).length > 1;
    if (gs.mode === 'local' && hasRealPlayers && !next.isAI) {
      // brak ekranu przekazania – gra płynnie przechodzi do kolejnego gracza
    } else if (next.isAI) {
      aiTimer = setTimeout(() => Game.aiTurn(next), 0);
    }
  },

  aiTurn(player) {
    if (!gs || gs.phase === 'end') return;
    if (gs.players[gs.currentIdx].id !== player.id) return;

    // AI: opcjonalna wymiana
    const tr = AI.decideTrade(player);
    if (tr) {
      doTrade(tr.giving, tr.receiving, player);
      gs.tradeUsed = true;
    }
    UI.renderGame();

    // AI: rzut natychmiastowy
    setTimeout(() => Game.roll(true), 0);
  }
};

// ================================================================
// AI
// ================================================================

const AI = {
  /**
   * Zwraca { giving, receiving } lub null (brak korzystnej wymiany).
   * Prosta strategia chciwości: zamień na najdroższe brakujące zwierzę.
   */
  decideTrade(player) {
    const inv = player.inventory;

    // Cele w kolejności priorytetu (najdroższe pierwsze, tylko te brakujące)
    const targets = ['horse','cow','pig','sheep']
      .filter(a => (inv[a] || 0) === 0 && (gs.pool[a] || 0) > 0);

    for (const target of targets) {
      const need = VALUE[target]; // wartość w królikach
      const tr = this._buildTrade(inv, target, need);
      if (tr) return tr;
    }
    return null;
  },

  /** Próbuje zbudować wymianę jednego targetu z danych zwierząt */
  _buildTrade(inv, targetAnimal, targetValue) {
    // Zbuduj "koszyk" dając zwierzęta od najtańszych
    const sources = ['rabbit','sheep','pig','cow','horse','smallDog','bigDog']
      .filter(a => a !== targetAnimal);

    const giving = {};
    let remaining = targetValue;

    for (const src of sources) {
      const av = VALUE[src];
      const have = inv[src] || 0;
      if (have === 0 || av === 0) continue;
      const use = Math.min(Math.floor(remaining / av), have);
      if (use > 0) {
        giving[src] = use;
        remaining -= use * av;
      }
      if (remaining === 0) break;
    }

    if (remaining !== 0) return null; // nie udało się zebrać

    const receiving = { [targetAnimal]: 1 };
    // Sprawdź many-to-many
    const gTypes = Object.values(giving).filter(v=>v>0).length;
    if (gTypes > 1) {
      // OK – wiele→jeden jest dozwolone
    }

    // Walidacja
    const v = validateTrade(giving, receiving, inv);
    if (!v.ok) return null;
    return { giving, receiving };
  }
};

// ================================================================
// SUPABASE – INTEGRACJA (TRYB SIECIOWY)
// ================================================================

const Net = {

  init() {
    // Najpierw config.js, potem localStorage (ustawienia z UI)
    const url = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url)
      ? SUPABASE_CONFIG.url
      : localStorage.getItem('supaUrl');
    const key = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.key)
      ? SUPABASE_CONFIG.key
      : localStorage.getItem('supaKey');
    if (!url || !key) return false;
    try {
      supaClient = supabase.createClient(url, key);
      return true;
    } catch (e) {
      console.error('Supabase init error:', e);
      return false;
    }
  },

  async createGame() {
    const btn = qs('#screen-network-create .btn-primary');
    if (btn && btn.disabled) return;           // guard: podwójne kliknięcie
    if (btn) btn.disabled = true;

    const nameInput = qs('#inp-create-name');
    const name = nameInput.value.trim();
    if (!name) { if (btn) btn.disabled = false; alert('Podaj swoje imię'); return; }

    if (!supaClient && !Net.init()) {
      alert('Skonfiguruj Supabase najpierw (⚙️ Konfiguracja Supabase)');
      return;
    }

    const gameId   = genCode();
    const playerId = uid();
    myPlayerId = playerId;
    localStorage.setItem('myPlayerId', playerId);

    const player = createPlayer(playerId, name, 0, false);
    gs = createGame([player], 'network');
    gs.gameId    = gameId;
    gs.creatorId = playerId;
    gs.phase     = 'lobby';

    const { error } = await supaClient
      .from('game_sessions')
      .insert({ id: gameId, state: gs });

    if (error) { alert('Błąd tworzenia gry: ' + error.message); return; }

    qs('#lobby-code').textContent = gameId;
    qs('#lobby-panel').classList.remove('hidden');
    qs('#btn-start-network').disabled = true;

    // QR code
    const joinUrl = `${location.href.split('?')[0]}?join=${gameId}`;
    qs('#lobby-qr').innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(qs('#lobby-qr'), { text: joinUrl, width: 128, height: 128,
        colorDark: '#e8f5e8', colorLight: '#243324' });
    }

    Net._subscribeToLobby(gameId);
    UI.updateLobbyList();
  },

  async joinGame() {
    const code = qs('#inp-join-code').value.trim().toUpperCase();
    const name = qs('#inp-join-name').value.trim();
    if (!code || !name) { alert('Podaj kod gry i imię'); return; }

    if (!supaClient && !Net.init()) {
      alert('Skonfiguruj Supabase najpierw (⚙️ Konfiguracja Supabase)');
      return;
    }

    const { data, error } = await supaClient
      .from('game_sessions')
      .select('state')
      .eq('id', code)
      .single();

    if (error || !data) { alert('Nie znaleziono gry: ' + code); return; }

    gs = data.state;
    if (gs.phase !== 'lobby') { alert('Gra już się rozpoczęła lub zakończyła'); return; }
    if (gs.players.length >= 6) { alert('Gra jest pełna (max 6 graczy)'); return; }

    const playerId = uid();
    myPlayerId = playerId;
    localStorage.setItem('myPlayerId', playerId);

    const colorIdx = gs.players.length;
    const player   = createPlayer(playerId, name, colorIdx, false);
    gs.players.push(player);

    await supaClient.from('game_sessions')
      .update({ state: gs, updated_at: new Date().toISOString() })
      .eq('id', code);

    qs('#join-waiting').classList.remove('hidden');
    Net._subscribeToGame(code);
  },

  async startGame() {
    if (!gs || !supaClient) return;
    if (gs.players.length < 1) { alert('Potrzeba co najmniej 1 gracza'); return; }

    gs.phase     = 'trade';
    gs.gameId    = gs.gameId;
    gs.currentIdx = 0;

    await supaClient.from('game_sessions')
      .update({ state: gs, updated_at: new Date().toISOString() })
      .eq('id', gs.gameId);

    UI.showScreen('screen-game');
    UI.renderGame();
  },

  async pushState() {
    if (!gs || !supaClient || !gs.gameId) return;
    await supaClient.from('game_sessions')
      .update({ state: gs, updated_at: new Date().toISOString() })
      .eq('id', gs.gameId);
  },

  _subscribeToLobby(gameId) {
    if (supaChannel) supaChannel.unsubscribe();
    supaChannel = supaClient
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        gs = payload.new.state;
        UI.updateLobbyList();
        // Jeśli twórca: odblokuj start gdy >= 2 graczy
        if (gs.players && gs.players.length >= 2) {
          const btn = qs('#btn-start-network');
          if (btn && gs.players[0].id === myPlayerId) btn.disabled = false;
        }
        // Auto-start przy 6 graczach (twórca nie musi klikać)
        if (gs.players && gs.players.length >= 6 && gs.players[0].id === myPlayerId) {
          Net.startGame();
        }
        // Dołączający: czekaj na zmianę phase
        if (gs.phase !== 'lobby') {
          UI.showScreen('screen-game');
          UI.renderGame();
        }
      })
      .subscribe();
  },

  _subscribeToGame(gameId) {
    if (supaChannel) supaChannel.unsubscribe();
    supaChannel = supaClient
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        const remote = payload.new.state;
        // Zrób diff logu – dodaj nowe wpisy
        const myLogLen = gs ? gs.log.length : 0;
        gs = remote;
        if (gs.log.length > myLogLen) {
          // Odśwież pełny log
          UI.refreshFullLog();
        }
        if (gs.phase === 'end' && gs.winner) {
          UI.renderGame();
          setTimeout(() => UI.showEndScreen(gs.winner), 800);
          return;
        }
        UI.showScreen('screen-game');
        UI.renderGame();
      })
      .subscribe();
  }
};

// ================================================================
// UI
// ================================================================

const UI = {

  showScreen(id) {
    qsa('.screen').forEach(s => s.classList.remove('active'));
    qs(`#${id}`).classList.add('active');
  },

  // ---------- EKRAN STARTOWY ----------

  showLocalSetup() {
    UI.showScreen('screen-local-setup');
    const saved = UI._loadLocalSetup();
    if (saved) {
      qs('#sel-player-count').value = saved.length;
    }
    UI.updatePlayerSetup(saved);
  },

  _loadLocalSetup() {
    try { return JSON.parse(localStorage.getItem('localSetup')); } catch { return null; }
  },

  _saveLocalSetup() {
    const rows = qsa('#player-setup-list .player-setup-row');
    const data = rows.map(row => ({
      name: row.querySelector('input').value.trim(),
      ai:   row.querySelector('.type-toggle').dataset.ai === '1'
    }));
    localStorage.setItem('localSetup', JSON.stringify(data));
  },

  updatePlayerSetup(saved) {
    const n    = parseInt(qs('#sel-player-count').value, 10);
    const list = qs('#player-setup-list');
    // Zachowaj bieżące wartości jeśli brak saved
    if (!saved) {
      saved = qsa('#player-setup-list .player-setup-row').map(row => ({
        name: row.querySelector('input').value.trim(),
        ai:   row.querySelector('.type-toggle').dataset.ai === '1'
      }));
    }
    list.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s    = saved && saved[i];
      const name = s ? s.name : (i === 0 && n === 1 ? 'Ty' : `Gracz ${i+1}`);
      const isAI = s ? s.ai : false;
      const row  = document.createElement('div');
      row.className = 'player-setup-row';
      row.innerHTML = `
        <div class="color-dot pc-${i}"></div>
        <input type="text" placeholder="Gracz ${i+1}" value="${escHtml(name)}" maxlength="20" />
        <button class="type-toggle${isAI ? ' ai' : ''}" data-ai="${isAI ? '1' : '0'}" data-idx="${i}" onclick="UI.toggleAI(this)">${isAI ? '🤖 AI' : '👤 Człowiek'}</button>
      `;
      list.appendChild(row);
    }
  },

  toggleAI(btn) {
    const isAI = btn.dataset.ai === '1';
    btn.dataset.ai = isAI ? '0' : '1';
    btn.classList.toggle('ai', !isAI);
    btn.textContent = isAI ? '👤 Człowiek' : '🤖 AI';
  },

  startLocalGame() {
    const rows = qsa('#player-setup-list .player-setup-row');
    if (rows.length === 0) { alert('Dodaj co najmniej jednego gracza'); return; }

    UI._saveLocalSetup();

    const players = rows.map((row, i) => {
      const name  = row.querySelector('input').value.trim() || `Gracz ${i+1}`;
      const isAI  = row.querySelector('.type-toggle').dataset.ai === '1';
      return createPlayer(uid(), name, i, isAI);
    });

    gs = createGame(players, 'local');
    UI.showScreen('screen-game');
    UI.renderGame();

    const first = gs.players[0];
    if (first.isAI) {
      aiTimer = setTimeout(() => Game.aiTurn(first), 0);
    }
  },

  // ---------- SIECIOWY ----------

  showNetworkSetup() {
    UI.showScreen('screen-network-setup');
  },

  showNetworkCreate() {
    UI.showScreen('screen-network-create');
    // Odblokuj przycisk (mógł zostać zablokowany przez poprzednie tworzenie gry)
    const btn = qs('#screen-network-create .btn-primary');
    if (btn) btn.disabled = false;
    // Ukryj lobby z poprzedniej sesji
    const lobby = qs('#lobby-panel');
    if (lobby) lobby.classList.add('hidden');
    // Sprawdź czy URL ma parametr ?join=CODE (do dołączania)
    const params = new URLSearchParams(location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      qs('#inp-join-code').value = joinCode;
      UI.showScreen('screen-network-join');
    }
  },

  copyCode() {
    const code = qs('#lobby-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = qs('#lobby-panel .btn-sm');
      btn.textContent = '✅';
      setTimeout(() => { btn.textContent = '📋'; }, 1500);
    });
  },

  updateLobbyList() {
    if (!gs || !gs.players) return;
    const ul = qs('#lobby-ul');
    if (!ul) return;
    ul.innerHTML = gs.players.map((p, i) => `
      <li>
        <span class="dot pc-${i}"></span>
        ${escHtml(p.name)}
        ${p.id === gs.creatorId ? '<span style="font-size:.75rem;color:var(--accent)">👑 twórca</span>' : ''}
      </li>
    `).join('');
    const hint = qs('#lobby-hint');
    if (hint) hint.textContent = `${gs.players.length} gracz(y) w lobby`;

    // Aktualizuj też listę dla dołączającego
    const jlp = qs('#join-lobby-players');
    if (jlp) {
      jlp.innerHTML = `<p class="hint">${gs.players.length} gracz(y):<br>` +
        gs.players.map(p => escHtml(p.name)).join(', ') + '</p>';
    }
  },

  // ---------- KONFIGURACJA SUPABASE ----------

  showSupabaseConfig() {
    qs('#supabase-schema-pre').textContent = SUPABASE_SCHEMA;
    qs('#inp-supa-url').value = localStorage.getItem('supaUrl') || '';
    qs('#inp-supa-key').value = localStorage.getItem('supaKey') || '';
    qs('#modal-supabase').classList.remove('hidden');
  },

  saveSupabaseConfig() {
    const url = qs('#inp-supa-url').value.trim();
    const key = qs('#inp-supa-key').value.trim();
    if (!url || !key) { alert('Podaj URL i klucz'); return; }
    localStorage.setItem('supaUrl', url);
    localStorage.setItem('supaKey', key);
    supaClient = null;
    Net.init();
    UI.closeSupabaseConfig();
    alert('✅ Konfiguracja zapisana!');
  },

  closeSupabaseConfig() {
    qs('#modal-supabase').classList.add('hidden');
  },

  // ---------- RENDEROWANIE GRY ----------

  renderGame() {
    if (!gs) return;
    const player = gs.players[gs.currentIdx];
    const isMyTurn = gs.mode === 'local'
      ? true
      : (player && player.id === myPlayerId);

    // Nagłówek
    qs('#turn-badge').textContent = `Tura: ${player ? player.name : '–'}`;
    qs('#turn-badge').style.borderLeftColor = player ? player.color : 'var(--accent)';

    const phaseLabels = { trade: '🛍️ Wymiana / Rzut', rolled: '🎲 Wyrzucono!', end: '🏆 Koniec!', lobby: '⏳ Lobby' };
    qs('#phase-badge').textContent = phaseLabels[gs.phase] || gs.phase;

    // Kostki
    if (gs.lastDice) {
      const { pink, yellow } = gs.lastDice;
      qs('#die-pink').textContent   = EMOJI[pink]  || pink;
      qs('#die-yellow').textContent = EMOJI[yellow] || yellow;
    } else {
      qs('#die-pink').textContent   = '🎲';
      qs('#die-yellow').textContent = '🎲';
    }

    // Przyciski
    const canAct = isMyTurn && gs.phase === 'trade' && !player.isAI;
    qs('#btn-roll').disabled  = !canAct;
    qs('#btn-trade').disabled = !canAct || gs.tradeUsed;

    // Pula
    UI.renderPool();

    // Gracze
    UI.renderPlayers();
  },

  renderPool() {
    const grid = qs('#pool-grid');
    grid.innerHTML = TRADEABLE.map(a => {
      const n = gs.pool[a] || 0;
      const low = n <= 3;
      return `<div class="pool-item${low ? ' low' : ''}">
        <span class="emoji">${EMOJI[a]}</span>
        <span style="font-size:.78rem">${NAMES[a]}</span>
        <span class="count">${n}</span>
      </div>`;
    }).join('');
  },

  renderPlayers() {
    const panel = qs('#players-panel');
    panel.innerHTML = gs.players.map((p, i) => {
      const isActive  = i === gs.currentIdx && gs.phase !== 'end';
      const isWinner  = gs.winner && gs.winner.id === p.id;

      const invHtml = TRADEABLE.map(a => {
        const n = p.inventory[a] || 0;
        if (a === 'smallDog' || a === 'bigDog') {
          return `<div class="inv-item inv-dog${n > 0 ? ' has' : ' zero'}" title="${NAMES[a]}">
            <span class="inv-emoji">${EMOJI[a]}</span>
          </div>`;
        }
        return `<div class="inv-item${n > 0 ? ' has' : ' zero'}">
          <span class="inv-emoji">${EMOJI[a]}</span>
          <span class="inv-count">${n}</span>
        </div>`;
      }).join('');

      const winHtml = WIN_ANIMALS.map(a => {
        const done = (p.inventory[a] || 0) >= 1;
        return `<span class="win-check${done ? ' done' : ''}">${EMOJI[a]}</span>`;
      }).join('');

      return `<div class="player-card${isActive ? ' active-player' : ''}${isWinner ? ' winner-card' : ''} border-pc-${p.colorIdx}">
        <div class="player-header">
          <div class="player-color-dot pc-${p.colorIdx}"></div>
          <span class="player-name">${escHtml(p.name)}</span>
          ${p.isAI ? '<span class="ai-tag">🤖 AI</span>' : ''}
          ${isActive ? '<span class="player-tag">◀ gra teraz</span>' : ''}
          ${isWinner ? '<span class="player-tag">🏆 WYGRAŁ!</span>' : ''}
        </div>
        <div class="inventory-grid">${invHtml}</div>
      </div>`;
    }).join('');
  },

  appendLog(msg, type) {
    const log = qs('#event-log');
    if (!log) return;
    const el = document.createElement('div');
    el.className = `log-entry ${type === 'bad' ? 'event-bad' : type === 'good' ? 'event-good' : type === 'turn' ? 'event-turn' : ''}`;
    el.textContent = msg;
    log.prepend(el);
    // Ogranicz do 80 wpisów
    while (log.children.length > 80) log.lastChild.remove();
  },

  refreshFullLog() {
    const log = qs('#event-log');
    if (!log || !gs) return;
    log.innerHTML = gs.log.map(entry =>
      `<div class="log-entry ${entry.type === 'bad' ? 'event-bad' : entry.type === 'good' ? 'event-good' : entry.type === 'turn' ? 'event-turn' : ''}">${escHtml(entry.msg)}</div>`
    ).join('');
  },

  showEndScreen(player) {
    const invStr = TRADEABLE.map(a => {
      const n = player.inventory[a] || 0;
      return n > 0 ? `${n}${EMOJI[a]}` : '';
    }).filter(Boolean).join(' ');

    qs('#winner-info').innerHTML = `
      <div class="w-name" style="color:${player.color}">${escHtml(player.name)}</div>
      <div class="w-inv">${invStr}</div>
      <p style="margin-top:.5rem;color:var(--text-muted)">Ma po jednym każdego zwierzęcia! 🎉</p>
    `;
    UI.showScreen('screen-end');
  },

  // ---------- MODAL WYMIANY ----------

  openTradeModal() {
    if (!gs || gs.phase !== 'trade' || gs.tradeUsed) return;
    trade.giving   = {};
    trade.receiving = {};
    UI._buildTradeModal();
    qs('#modal-trade').classList.remove('hidden');
  },

  _buildTradeModal() {
    const player   = gs.players[gs.currentIdx];
    const inv      = player.inventory;
    const totalVal = calcValue(inv);   // łączna wartość inwentarza gracza

    // "Dajesz" – tylko zwierzęta które gracz ma (lub już dodał do wymiany)
    const giveRows = TRADEABLE.filter(a => (inv[a] || 0) > 0 || (trade.giving[a] || 0) > 0);
    qs('#trade-give-list').innerHTML = giveRows.length
      ? giveRows.map(a => UI._tradeRow(a, inv[a] || 0, 'give')).join('')
      : '<p class="hint" style="padding:.5rem">Brak zwierząt w inwentarzu</p>';

    // "Dostajesz" – tylko zwierzęta:
    //   • dostępne w puli (lub już wybrane)
    //   • wartość ≤ łączna wartość inwentarza (jest sens wymiany)
    //   • psy: tylko jeśli gracz jeszcze nie ma
    const recvRows = TRADEABLE.filter(a => {
      const alreadySelected = (trade.receiving[a] || 0) > 0;
      if (!alreadySelected && (gs.pool[a] || 0) === 0) return false;
      if ((VALUE[a] || 0) > totalVal) return false;
      if ((a === 'smallDog' || a === 'bigDog') && (inv[a] || 0) >= 1 && !alreadySelected) return false;
      return true;
    });
    qs('#trade-recv-list').innerHTML = recvRows.length
      ? recvRows.map(a => UI._tradeRow(a, gs.pool[a] || 0, 'recv')).join('')
      : '<p class="hint" style="padding:.5rem">Brak możliwych wymian</p>';

    UI._validateTradeUI();
  },

  _tradeRow(animal, available, side) {
    const current = (side === 'give' ? trade.giving[animal] : trade.receiving[animal]) || 0;
    const max = available;
    return `<div class="trade-item">
      <span class="t-emoji">${EMOJI[animal]}</span>
      <span class="t-name">${NAMES[animal]}</span>
      <span class="t-avail">(${available})</span>
      <button class="t-btn" onclick="UI.tradeAdj('${animal}','${side}',-1)" ${current <= 0 ? 'disabled' : ''}>−</button>
      <span class="t-count">${current}</span>
      <button class="t-btn" onclick="UI.tradeAdj('${animal}','${side}',+1)" ${current >= max ? 'disabled' : ''}>+</button>
    </div>`;
  },

  tradeAdj(animal, side, delta) {
    const map   = side === 'give' ? trade.giving : trade.receiving;
    const player = gs.players[gs.currentIdx];
    const max   = side === 'give' ? (player.inventory[animal] || 0) : (gs.pool[animal] || 0);
    map[animal] = Math.max(0, Math.min((map[animal] || 0) + delta, max));
    UI._buildTradeModal();
  },

  _validateTradeUI() {
    const player = gs.players[gs.currentIdx];
    const res = validateTrade(trade.giving, trade.receiving, player.inventory);
    const msgEl = qs('#trade-msg');
    msgEl.textContent = res.msg;
    msgEl.className   = 'trade-msg ' + (res.ok ? 'ok' : 'err');
    qs('#btn-do-trade').disabled = !res.ok;

    qs('#trade-give-val').textContent = calcValue(trade.giving);
    qs('#trade-recv-val').textContent = calcValue(trade.receiving);
  },

  confirmTrade() {
    const player = gs.players[gs.currentIdx];
    const res    = validateTrade(trade.giving, trade.receiving, player.inventory);
    if (!res.ok) return;

    doTrade(trade.giving, trade.receiving, player);
    gs.tradeUsed = true;
    UI.closeTradeModal();
    if (gs.mode === 'network') Net.pushState();
    UI.renderGame();
  },

  resetTrade() {
    trade.giving   = {};
    trade.receiving = {};
    UI._buildTradeModal();
  },

  closeTradeModal() {
    qs('#modal-trade').classList.add('hidden');
  }
};

// ================================================================
// POMOCNICZE
// ================================================================

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ================================================================
// INICJALIZACJA
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Wczytaj konfigurację Supabase jeśli jest
  Net.init();

  // Obsłuż ?join=CODE w URL (dołączanie przez QR)
  const params   = new URLSearchParams(location.search);
  const joinCode = params.get('join');
  if (joinCode) {
    UI.showScreen('screen-network-join');
    qs('#inp-join-code').value = joinCode;
  }
});
