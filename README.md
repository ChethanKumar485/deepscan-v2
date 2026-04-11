# DeepScan v2.0 — Multimodal Deepfake Detection System

![DeepScan](https://img.shields.io/badge/DeepScan-v2.0-00c8ff?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Claude AI](https://img.shields.io/badge/Claude_AI-Powered-ff3c6e?style=for-the-badge)

> **AI-powered forensic analysis tool for detecting deepfakes across image, audio, video, and text media — powered by the Anthropic Claude API.**

---

## 📸 Screenshots
## 🚀 UI Overview 

<img width="1819" height="717" alt="image" src="https://github.com/user-attachments/assets/e0aa81c2-2711-43c7-905d-d67a6ef211cd" />

## 📊 -----Analytics---
🖼️ Image Detection  
🎙️ Audio Detection  
🎬 Video Detection  
📄 Text Analysis  

<img width="592" height="529" alt="image" src="https://github.com/user-attachments/assets/54351012-78aa-47ed-b7e8-9dbbad8f8be3" />

## 🛡️THREAT  INTEL

<img width="611" height="391" alt="image" src="https://github.com/user-attachments/assets/5a18f2bd-d4bd-4281-884e-b4576d649fff" />

## 🕘scanning History

<img width="1600" height="492" alt="image" src="https://github.com/user-attachments/assets/1f68f623-0713-4751-8f5d-3f45fdecafb7" />

## 📈ANALYSIS LAYER

<img width="1448" height="537" alt="image" src="https://github.com/user-attachments/assets/8ce3d701-5402-476b-8582-d6a00e93e47c" />


## 📜SCANNING PROCESS

<img width="967" height="615" alt="image" src="https://github.com/user-attachments/assets/17612d6d-b8e8-4438-b35a-e4dca56c9c73" />

## 📄REPORT

<img width="1438" height="906" alt="image" src="https://github.com/user-attachments/assets/11db7cea-7060-4914-a44e-7d779f35ebc3" />

---

## ✨ Features

| Feature | Description |
|---|---|
| 🖼 **Image Detection** | GAN fingerprint, face mesh, DCT spectral, compression artifact analysis |
| 🎙 **Audio Detection** | Vocoder trace, mel spectrogram gap, formant deviation |
| 🎬 **Video Detection** | Temporal blend, optical flow, lip-sync correlation |
| 📄 **Text / NLP** | Perplexity scoring, burstiness, stylometry, semantic entropy |
| 🤖 **AI Analysis** | Expert forensic interpretation via Claude Sonnet |
| 📊 **Full Report** | Per-detector scores, signal metrics, layer-by-layer breakdown |
| 💾 **Export** | Copy plain-text report or download as JSON |
| 🕘 **Scan History** | Last 8 scans saved in-session; click any entry to reload |
| 🔁 **Deterministic Results** | Same file + settings always produces identical scores (seeded PRNG) |

---

## 🗂 Project Structure

```
deepscan-v2/
├── index.html        ← main entry point
├── css/style.css     ← full stylesheet (cyber dark theme)
├── js/config.js      ← all detector configs & signal definitions
├── js/app.js         ← application logic + Claude AI integration
├── README.md         ← full documentation with badges
├── LICENSE           ← MIT license
└── .gitignore

```

## 🚀 Quick Start
<p align="center">
<img width="965" height="376" alt="image" src="https://github.com/user-attachments/assets/be97fcf4-6b74-4e50-b172-a1a282a81231" />
</p>

### Option 1 — Open directly in browser

```bash
git clone https://github.com/ChethanKumar485/deepscan-v2.git
cd deepscan-v2
open index.html
```

> **Note:** Direct file open (`file://`) may block API calls in some browsers. Use Option 2 for full functionality.

### Option 2 — Serve locally (recommended)

```bash
# Using Python (built-in, no install needed)
python3 -m http.server 8080
# Open: http://localhost:8080

# Or using Node.js
npx serve .
# Open: http://localhost:3000
```

Expected output for `npx serve`:
```
 ┌────────────────────────────────────────────┐
 │                                            │
 │   Serving!                                 │
 │                                            │
 │   - Local:    http://localhost:3000        │
 │   - Network:  http://192.168.x.x:3000      │
 │                                            │
 └────────────────────────────────────────────┘
```

### Option 3 — GitHub Pages (live deployment)

1. Push the repository to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Your site will be live at:
   ```
   https://ChethanKumar485.github.io/deepscan-v2
   ```

> AI analysis falls back to pre-written forensic text when deployed without a backend proxy (see [AI Integration](#-claude-ai-integration) below).

---

## 🔑 Claude AI Integration

The forensic AI analysis paragraph is powered by the **Anthropic Claude API** (`claude-sonnet-4-20250514`).

### How it works

When a scan completes, the app sends detector scores and layer results to Claude with a forensic analyst prompt, and renders the expert interpretation in the results panel. If the API is unreachable, a high-quality fallback paragraph is shown automatically — all other features (scores, signals, layers, export) remain fully functional.

### Enable live AI (requires a backend proxy)

The Anthropic API requires a server-side key — it cannot be called directly from a browser in production. Set up a minimal proxy:

**Step 1 — Create `proxy-server.js`:**

```js
const express = require('express');
const fetch   = require('node-fetch');
const app     = express();
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages:   [{ role: 'user', content: req.body.prompt }],
    }),
  });
  const data = await resp.json();
  res.json(data);
});

app.listen(3001, () => console.log('Proxy running on :3001'));
```

**Step 2 — Update the fetch URL in `js/app.js`:**

```js
// Replace:
const response = await fetch('https://api.anthropic.com/v1/messages', { ... });

// With:
const response = await fetch('https://your-proxy.com/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
});
```

**Step 3 — Run the proxy:**

```bash
ANTHROPIC_API_KEY=your_key_here node proxy-server.js
```

---

## 🧠 Detection Modalities

### 🖼 Image

| Detector | Method |
|---|---|
| GAN Fingerprint | Frequency-domain neural artifact analysis |
| Face Mesh Analysis | 468-point landmark geometry consistency |
| Eye Blink Pattern | Temporal blink frequency and duration check |
| DCT Spectral Scan | 8×8 block discrete cosine transform anomalies |
| Compression Artifact Map | JPEG inconsistency heatmap |
| Pixel Noise Distribution | Statistical noise pattern analysis |

### 🎙 Audio

| Detector | Method |
|---|---|
| Vocoder Trace | Neural TTS synthesis fingerprint |
| Mel Spectrogram Gap | 128-band mel filterbank artifact scan |
| Pitch Sync Analysis | Unnatural pitch lock pattern detection |
| Formant Deviation | F1/F2 vocal tract inconsistency |
| Background Noise Match | Ambient noise continuity test |

### 🎬 Video

| Detector | Method |
|---|---|
| Temporal Blend | Inter-frame face blending artifact analysis |
| Optical Flow | Motion vector consistency scoring |
| Head Pose Estimation | 3D temporal head pose coherence |
| Lip Sync Correlation | MFCC-to-mouth-movement alignment |
| Frame Noise Pattern | Per-frame noise distribution tracking |
| Shadow Geometry | 3D lighting model consistency |

### 📄 Text / NLP

| Detector | Method |
|---|---|
| Perplexity Scoring | GPT-2 language model perplexity |
| Burstiness Analysis | Sentence length variance measurement |
| Stylometry | Writing style fingerprint matching |
| Semantic Entropy | Topic coherence and logical flow scoring |
| N-gram Repetition | Unusual phrase repetition flagging |

---

## ⚙️ Configuration

Both sensitivity and analysis depth are configurable directly in the UI:

| Setting | Options | Effect |
|---|---|---|
| **Sensitivity** | High · Medium · Low | Adjusts fake detection threshold |
| **Depth** | Fast (5 detectors) · Full (all) · Deep (extended) | Controls scan thoroughness |

---

## 🔁 Deterministic Scan Results

DeepScan v2.0 uses a **seeded PRNG (Mulberry32)** to ensure that scanning the same file with the same settings always produces identical scores, verdict, confidence, and signal values.

The seed is derived from:
```
seed = hash( filename + filesize + mode + sensitivity )
```

This means:
- Re-scanning the same file gives the same report every time
- Results are reproducible and auditable
- Scan history entries can be reliably compared

---

## 📦 Tech Stack

- **Pure HTML5 / CSS3 / Vanilla JS** — zero build tools, zero dependencies
- **Orbitron + Space Mono + Rajdhani** — Google Fonts (cyber-forensics aesthetic)
- **Anthropic Claude API** — AI-generated forensic analysis text
- **Mulberry32 PRNG** — deterministic result generation
- **No frameworks, no bundlers** — works by opening `index.html`

---

## 📝 Disclaimer

> DeepScan v2.0 is a **demonstration and research tool**.
> Detection results are **probabilistic estimates** and must not be used as sole evidence in legal, journalistic, or security contexts.
> Always consult certified human forensic experts for consequential decisions.

---
## 🙌 Contributing

Pull requests are welcome! Please open an issue first to discuss any major changes.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

Copyright © 2026 Chethan Kumar

---


## 👨‍💻 Author

**Chethan Kumar**
- GitHub: [@ChethanKumar485](https://github.com/ChethanKumar485)

---
## ⭐ Support
> *If you like this project, give it a ⭐ on GitHub! — deep fake detection on multimodalmedia makes sure it stays safe."* 🚀
