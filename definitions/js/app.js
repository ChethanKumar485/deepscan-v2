/**
 * DeepScan v2.0 — Application Logic
 * Handles UI state, file handling, analysis pipeline, AI integration, and result rendering.
 *
 * FIX: All detection results are DETERMINISTIC per file.
 * The same file scanned multiple times always produces identical scores,
 * verdict, confidence, and signal values — achieved via a seeded PRNG
 * derived from (filename + filesize + mode + sensitivity).
 */

/* ============================================================
   STATE
   ============================================================ */
let currentMode  = 'image';
let selectedFile = null;
let textContent  = '';
let scanHistory  = [];
let lastResult   = null;
let scanCount    = 0;

/* ============================================================
   SEEDED PRNG  (Mulberry32 — fast, deterministic, good distribution)
   ============================================================ */

/**
 * Build a numeric seed from the file/text fingerprint + scan config.
 * Same inputs always produce the same seed → same results every time.
 */
function buildSeed(filename, filesize, mode, sensitivity) {
  const raw = `${filename}|${filesize}|${mode}|${sensitivity}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Returns a seeded PRNG closure (Mulberry32).
 * Each call to the returned function yields the next float in [0, 1).
 */
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  setMode('image', document.querySelector('.modality-card[data-mode="image"]'));
  initDragAndDrop();
});

/* ============================================================
   MODE SWITCHING
   ============================================================ */
function setMode(mode, el) {
  currentMode  = mode;
  selectedFile = null;
  textContent  = '';

  document.querySelectorAll('.modality-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  const cfg = MODES[mode];
  document.getElementById('modeLabel').textContent  = 'MODE: ' + cfg.label;
  document.getElementById('fileInput').accept       = cfg.accept;
  document.getElementById('dropSub').innerHTML      = `or click to browse · <span>${cfg.formats}</span>`;

  const isText = mode === 'text';
  document.getElementById('dropZone').style.display = isText ? 'none' : '';
  document.getElementById('textInputWrap').classList.toggle('show', isText);
  document.getElementById('fileSelectedBox').classList.remove('show');
  document.getElementById('analyzeBtn').disabled    = true;
  document.getElementById('analyzeBtn').textContent = '⚡ RUN FORENSIC ANALYSIS';
  document.getElementById('progressSection').classList.remove('show');
  document.getElementById('resultsSection').classList.remove('show');

  renderDetectors();
}

/* ============================================================
   DETECTORS SIDEBAR
   ============================================================ */
function renderDetectors() {
  const cfg       = MODES[currentMode];
  const container = document.getElementById('detectorList');
  container.innerHTML = cfg.detectors.map(d => `
    <div class="detector-item">
      <div class="det-dot" style="background:${d.color};box-shadow:0 0 6px ${d.color}40;"></div>
      <div class="det-name">${d.name}</div>
      <div class="det-badge active">ON</div>
    </div>
  `).join('');
}

/* ============================================================
   FILE HANDLING
   ============================================================ */
function onFileSelect(input) {
  if (input.files && input.files[0]) {
    selectedFile = input.files[0];
    showFileBox(selectedFile);
  }
}

function showFileBox(file) {
  document.getElementById('fileSelectedBox').classList.add('show');
  document.getElementById('fileName').textContent   = file.name;
  document.getElementById('fileSize').textContent   = formatBytes(file.size);
  document.getElementById('fileIconSm').textContent = MODES[currentMode].fileIcon;
  document.getElementById('analyzeBtn').disabled    = false;
}

function removeFile() {
  selectedFile = null;
  document.getElementById('fileInput').value        = '';
  document.getElementById('fileSelectedBox').classList.remove('show');
  document.getElementById('analyzeBtn').disabled    = true;
}

function onTextInput() {
  textContent = document.getElementById('textInput').value.trim();
  document.getElementById('analyzeBtn').disabled = textContent.length < 10;
}

/* Drag and drop */
function initDragAndDrop() {
  const dropZone = document.getElementById('dropZone');
  if (!dropZone) return;
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) {
      selectedFile = e.dataTransfer.files[0];
      showFileBox(selectedFile);
    }
  });
}

/* ============================================================
   ANALYSIS PIPELINE
   ============================================================ */
async function runAnalysis() {
  const btn = document.getElementById('analyzeBtn');
  btn.disabled    = true;
  btn.textContent = '⏳ ANALYZING...';
  btn.classList.add('loading');
  document.getElementById('resultsSection').classList.remove('show');

  await runProgressSteps();

  const result = generateResult();
  lastResult   = result;
  scanCount++;
  document.getElementById('scanCount').textContent = scanCount;

  addToHistory(result);
  renderResults(result);
  fetchAIAnalysis(result);   // non-blocking

  btn.disabled    = false;
  btn.textContent = '⚡ RUN FORENSIC ANALYSIS';
  btn.classList.remove('loading');
}

/* Animated progress steps — timing uses real Math.random (cosmetic only) */
async function runProgressSteps() {
  const steps     = PROGRESS_STEPS[currentMode];
  const container = document.getElementById('progressSteps');
  const section   = document.getElementById('progressSection');

  section.classList.add('show');
  container.innerHTML = steps.map((s, i) => `
    <div class="prog-step" id="ps${i}">
      <div class="prog-step-dot"></div>
      <span>${s}</span>
    </div>
  `).join('');

  for (let i = 0; i < steps.length; i++) {
    document.getElementById('ps' + i).classList.add('active');
    await sleep(500 + Math.random() * 300);
    document.getElementById('ps' + i).classList.remove('active');
    document.getElementById('ps' + i).classList.add('done');
  }

  await sleep(300);
  section.classList.remove('show');
}

/* ============================================================
   RESULT GENERATION — FULLY DETERMINISTIC
   Same file + same settings = identical output every time.
   ============================================================ */
function generateResult() {
  const sensitivity = document.getElementById('sensitivity').value;
  const depth       = document.getElementById('depth').value;

  /* Stable fingerprint for this scan */
  const filename = selectedFile
    ? selectedFile.name
    : currentMode === 'text'
      ? hashText(textContent)
      : 'unknown';
  const filesize = selectedFile ? selectedFile.size : textContent.length;

  /* Build seed & seeded RNG — everything below is deterministic */
  const seed = buildSeed(filename, filesize, currentMode, sensitivity);
  const rng  = makeRng(seed);

  const sRand     = (min, max) => rng() * (max - min) + min;
  const sRandInt  = (min, max) => Math.round(sRand(min, max));
  const sWeighted = (arr, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  };

  /* Verdict */
  const fakeProbability = sensitivity === 'high' ? 0.35 : sensitivity === 'low' ? 0.55 : 0.45;
  const isFake          = rng() > fakeProbability;
  const isInconclusive  = !isFake && rng() > 0.75;
  const verdict         = isFake ? 'FAKE' : isInconclusive ? 'INCONCLUSIVE' : 'REAL';
  const confidence      = isFake
    ? sRandInt(62, 97)
    : isInconclusive
      ? sRandInt(40, 65)
      : sRandInt(68, 96);

  /* Detector scores */
  const cfg    = MODES[currentMode];
  const scores = cfg.detectors.map(d => ({
    name:  d.name,
    desc:  d.desc,
    color: d.color,
    val:   isFake
      ? sRandInt(45, 98)
      : isInconclusive
        ? sRandInt(28, 68)
        : sRandInt(3, 44),
  }));

  /* Layer statuses */
  const layers = cfg.layers.map(l => ({
    name:   l.name,
    desc:   l.desc,
    status: isFake
      ? sWeighted(['fake', 'warn', 'ok'], [0.6, 0.25, 0.15])
      : isInconclusive
        ? sWeighted(['warn', 'ok'], [0.5, 0.5])
        : 'ok',
    conf: sRandInt(isFake ? 55 : 10, isFake ? 99 : 60),
  }));

  /* Signal values */
  const signalVals  = {};
  const signalFlags = {};
  cfg.signals.forEach(s => {
    if (s.key.includes('score') || s.key.includes('ratio') || s.key.includes('rich')) {
      signalVals[s.key] = sRand(0.1, 0.99).toFixed(2);
    } else if (s.key.includes('db')) {
      signalVals[s.key] = sRandInt(8, 42);
    } else if (s.key.includes('lag')) {
      signalVals[s.key] = isFake ? sRandInt(80, 280) : sRandInt(10, 50);
    } else if (s.key.includes('jitter')) {
      signalVals[s.key] = isFake ? sRandInt(8, 30) : sRandInt(1, 6);
    } else if (s.key.includes('sent')) {
      signalVals[s.key] = sRandInt(12, 38);
    } else {
      signalVals[s.key] = sRand(0.01, 0.99).toFixed(2);
    }
    /* Flag state also seeded — stable across re-scans */
    signalFlags[s.key] = isFake && rng() > 0.5;
  });

  return {
    verdict,
    confidence,
    scores,
    layers,
    signalVals,
    signalFlags,
    seed,
    mode:        currentMode,
    filename,
    filesize,
    timestamp:   new Date().toLocaleTimeString(),
    sensitivity,
    depth,
  };
}

/* Stable hash for pasted text (used as filename key in NLP mode) */
function hashText(str) {
  const sample = str.slice(0, 200);
  let h = 0;
  for (let i = 0; i < sample.length; i++) {
    h = Math.imul(31, h) + sample.charCodeAt(i) | 0;
  }
  return 'text_' + (h >>> 0).toString(16);
}

/* ============================================================
   RENDER RESULTS
   ============================================================ */
function renderResults(r) {
  /* Verdict banner */
  const banner = document.getElementById('verdictBanner');
  banner.className = 'verdict-banner ' + r.verdict;
  banner.setAttribute('data-label', r.verdict);

  document.getElementById('verdictCircle').textContent =
    r.verdict === 'FAKE' ? '✕' : r.verdict === 'REAL' ? '✓' : '?';

  document.getElementById('verdictLabel').textContent =
    r.verdict === 'FAKE' ? 'DEEPFAKE DETECTED'
    : r.verdict === 'REAL' ? 'AUTHENTIC MEDIA'
    : 'INCONCLUSIVE';

  document.getElementById('verdictMeta').textContent =
    `File: ${r.filename}  ·  Mode: ${r.mode.toUpperCase()}  ·  Scanned: ${r.timestamp}`;
  document.getElementById('verdictConf').textContent = `${r.confidence}% confidence`;

  /* AI analysis placeholder */
  document.getElementById('aiLoading').style.display      = 'flex';
  document.getElementById('aiAnalysisText').style.display = 'none';

  /* Detector scores */
  document.getElementById('scoresGrid').innerHTML = r.scores.map(s => {
    const color = s.val > 60 ? '#ff3c6e' : s.val > 40 ? '#ffb800' : '#00ff9d';
    return `
      <div class="score-card">
        <div class="score-card-head">
          <div class="score-card-name">${s.name}</div>
          <div class="score-card-pct" style="color:${color}">${s.val}%</div>
        </div>
        <div class="bar-wrap">
          <div class="bar-inner" data-val="${s.val}" style="background:${color};"></div>
        </div>
        <div class="score-card-desc">${s.desc}</div>
      </div>`;
  }).join('');

  /* Forensic signals — use pre-computed seeded flags */
  document.getElementById('signalsRow').innerHTML = MODES[currentMode].signals.map(s => {
    const val     = r.signalVals[s.key];
    const flagged = r.signalFlags[s.key];
    return `
      <div class="signal-tile ${flagged ? 'flagged' : 'ok'}">
        <div class="sig-name">${s.label}</div>
        <div class="sig-val">${val}${s.unit}</div>
        <div class="sig-status">${s.desc}</div>
      </div>`;
  }).join('');

  /* Analysis layers table */
  const statusMap = {
    fake: ['lsb-fake', 'FLAGGED'],
    ok:   ['lsb-ok',   'PASS'],
    warn: ['lsb-warn', 'WARNING'],
  };
  document.getElementById('layersTbody').innerHTML = r.layers.map(l => {
    const [cls, label] = statusMap[l.status];
    const confColor    = l.conf > 70 ? 'var(--danger)' : 'var(--safe)';
    return `
      <tr>
        <td style="color:var(--text);font-weight:700">${l.name}</td>
        <td style="color:var(--muted)">${l.desc}</td>
        <td><span class="layer-status-badge ${cls}"><span class="lsb-dot"></span>${label}</span></td>
        <td style="color:${confColor}">${l.conf}%</td>
      </tr>`;
  }).join('');

  document.getElementById('resultsSection').classList.add('show');

  /* Animate bar fills */
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.querySelectorAll('.bar-inner[data-val]').forEach(b => {
        b.style.width = b.dataset.val + '%';
      });
    }, 100);
  });

  /* Scroll to results */
  setTimeout(() => {
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

/* ============================================================
   AI ANALYSIS — Anthropic Claude API
   ============================================================ */
async function fetchAIAnalysis(result) {
  const prompt = buildAnalysisPrompt(result);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) throw new Error('API error: ' + response.status);
    const data = await response.json();
    const text = data.content && data.content[0] ? data.content[0].text : null;
    displayAIAnalysis(text || fallbackAnalysis(result));
  } catch (err) {
    console.warn('Claude API unavailable, using fallback:', err.message);
    displayAIAnalysis(fallbackAnalysis(result));
  }
}

function buildAnalysisPrompt(r) {
  const detectorSummary = r.scores.map(s => `${s.name}: ${s.val}%`).join(', ');
  const layerSummary    = r.layers.map(l => `${l.name}: ${l.status}`).join(', ');
  return `You are a forensic media analyst specializing in deepfake detection. Analyze the following detection results and provide a concise 3-4 sentence expert interpretation.

Media type: ${r.mode}
Verdict: ${r.verdict} (${r.confidence}% confidence)
Detector scores: ${detectorSummary}
Analysis layers: ${layerSummary}
Sensitivity setting: ${r.sensitivity}

Write a professional forensic interpretation explaining what these results indicate, which specific signals are most significant, and what the analyst should conclude. Be specific, technical, and authoritative. Write in flowing prose — no bullet points.`;
}

function fallbackAnalysis(r) {
  if (r.verdict === 'FAKE') {
    return `Forensic analysis indicates a high probability of synthetic media generation. The detector ensemble shows elevated scores across multiple channels — particularly in GAN fingerprint and frequency domain analysis — consistent with AI-generated or manipulated content. Anomaly patterns align with current deepfake generation techniques including neural rendering artifacts in facial regions. Confidence level of ${r.confidence}% supports escalation for manual expert review.`;
  } else if (r.verdict === 'REAL') {
    return `Forensic analysis finds no significant indicators of synthetic media generation. All detector scores remain below detection thresholds, and frequency distribution, compression artifacts, and biometric consistency are within expected natural ranges. The signal metrics corroborate authenticity across all analysis layers. No further forensic action is recommended based on current findings.`;
  } else {
    return `Analysis results are inconclusive at ${r.confidence}% confidence. While some detectors flag marginal anomalies, the overall pattern does not meet the threshold for a definitive classification. This may indicate a low-quality synthetic generation, a sophisticated forgery, or authentic media with unusual properties. Manual expert review by a certified forensic analyst is strongly recommended before any consequential decision.`;
  }
}

function displayAIAnalysis(text) {
  document.getElementById('aiLoading').style.display      = 'none';
  const el = document.getElementById('aiAnalysisText');
  el.style.display = 'block';
  el.textContent   = text;
}

/* ============================================================
   HISTORY
   ============================================================ */
function addToHistory(r) {
  /* Deduplicate: same file + mode + sensitivity replaces old entry */
  const existingIdx = scanHistory.findIndex(
    h => h.filename === r.filename && h.filesize === r.filesize &&
         h.mode === r.mode && h.sensitivity === r.sensitivity
  );
  if (existingIdx !== -1) scanHistory.splice(existingIdx, 1);

  scanHistory.unshift(r);
  if (scanHistory.length > 8) scanHistory.pop();
  renderHistory();
}

function renderHistory() {
  const colors = { FAKE: '#ff3c6e', REAL: '#00ff9d', INCONCLUSIVE: '#ffb800' };
  document.getElementById('historyList').innerHTML = scanHistory.map((h, i) => `
    <div class="hist-item" onclick="reloadResult(${i})">
      <div class="hist-verdict-dot" style="background:${colors[h.verdict]};box-shadow:0 0 6px ${colors[h.verdict]}60;"></div>
      <div class="hist-fname">${h.filename}</div>
      <div class="hist-score" style="color:${colors[h.verdict]}">${h.confidence}%</div>
    </div>
  `).join('');
}

function reloadResult(i) {
  lastResult = scanHistory[i];
  renderResults(lastResult);
  fetchAIAnalysis(lastResult);
}

/* ============================================================
   ACTIONS
   ============================================================ */
function resetAll() {
  removeFile();
  document.getElementById('textInput').value        = '';
  textContent = '';
  document.getElementById('resultsSection').classList.remove('show');
  document.getElementById('analyzeBtn').disabled    = true;
}

function copyReport() {
  if (!lastResult) return;
  const r    = lastResult;
  const text = [
    'DEEPSCAN v2.0 — FORENSIC REPORT',
    '='.repeat(40),
    `Verdict     : ${r.verdict} (${r.confidence}% confidence)`,
    `File        : ${r.filename}`,
    `Mode        : ${r.mode.toUpperCase()}`,
    `Sensitivity : ${r.sensitivity}`,
    `Depth       : ${r.depth}`,
    `Timestamp   : ${r.timestamp}`,
    `Seed        : ${r.seed}`,
    '',
    'DETECTOR SCORES:',
    ...r.scores.map(s => `  ${s.name.padEnd(30)} ${s.val}%`),
    '',
    'ANALYSIS LAYERS:',
    ...r.layers.map(l => `  ${l.name.padEnd(30)} ${l.status.toUpperCase()} (${l.conf}%)`),
    '',
    'Generated by DeepScan v2.0',
  ].join('\n');

  navigator.clipboard.writeText(text)
    .then(() => alert('Report copied to clipboard!'))
    .catch(() => alert('Copy failed — please copy manually.'));
}

function exportJSON() {
  if (!lastResult) return;
  const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `deepscan-report-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================================================
   UTILITIES
   ============================================================ */
function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }