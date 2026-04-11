/**
 * DeepScan v2.0 — Detector Configuration
 * All modality configs, detector lists, signal definitions, and progress steps
 */

const MODES = {
  image: {
    label: 'IMAGE',
    accept: '.jpg,.jpeg,.png,.webp,.bmp',
    formats: 'jpg · png · webp · bmp · tiff',
    fileIcon: '🖼',
    color: '#00c8ff',
    detectors: [
      { name: 'GAN Fingerprint',          desc: 'Detects GAN generation artifacts in the frequency domain', color: '#00c8ff' },
      { name: 'Face Mesh Analysis',        desc: 'Analyzes facial landmark consistency and geometry',         color: '#00c8ff' },
      { name: 'Eye Blink Pattern',         desc: 'Checks for unnatural eye blink frequency and timing',       color: '#00c8ff' },
      { name: 'DCT Spectral Scan',         desc: 'Discrete cosine transform anomaly detection',               color: '#00c8ff' },
      { name: 'Compression Artifact Map',  desc: 'Identifies inconsistent JPEG compression regions',          color: '#00c8ff' },
      { name: 'Pixel Noise Distribution',  desc: 'Statistical analysis of image noise patterns',              color: '#00c8ff' },
    ],
    layers: [
      { name: 'DCT Frequency Analysis',    desc: 'Discrete cosine transform on 8x8 pixel blocks' },
      { name: 'Facial Landmark Mesh',      desc: '468-point face mesh consistency check' },
      { name: 'GAN Fingerprint Extraction',desc: 'Neural network generation artifact scan' },
      { name: 'JPEG Artifact Heatmap',     desc: 'Compression inconsistency localization' },
      { name: 'Color Distribution Check',  desc: 'Statistical color space anomaly detection' },
    ],
    signals: [
      { key: 'ela_score',   label: 'ELA Score',     unit: '',   desc: 'Error Level Analysis' },
      { key: 'face_sym',    label: 'Face Symmetry', unit: '%',  desc: 'Geometric symmetry' },
      { key: 'noise_lvl',   label: 'Noise Level',   unit: 'σ',  desc: 'Pixel std deviation' },
      { key: 'freq_peak',   label: 'Freq Peak',     unit: 'hz', desc: 'DCT peak frequency' },
    ],
  },

  audio: {
    label: 'AUDIO',
    accept: '.mp3,.wav,.ogg,.flac,.m4a',
    formats: 'mp3 · wav · ogg · flac · m4a',
    fileIcon: '🎙',
    color: '#00ff9d',
    detectors: [
      { name: 'Vocoder Trace Detection', desc: 'Neural vocoder synthesis fingerprint',               color: '#00ff9d' },
      { name: 'Mel Spectrogram Gap',     desc: 'Frequency gap artifacts in mel domain',              color: '#00ff9d' },
      { name: 'Pitch Sync Analysis',     desc: 'Unnatural pitch synchronization patterns',           color: '#00ff9d' },
      { name: 'Formant Deviation',       desc: 'Vocal tract formant inconsistency check',            color: '#00ff9d' },
      { name: 'Background Noise Match',  desc: 'Environmental noise continuity test',                color: '#00ff9d' },
    ],
    layers: [
      { name: 'Mel Spectrogram Extraction', desc: '128-band mel filterbank analysis' },
      { name: 'Vocoder Fingerprint',        desc: 'Neural TTS synthesis artifact scan' },
      { name: 'Breathing Pattern Analysis', desc: 'Natural breath pause timing check' },
      { name: 'Phase Coherence Test',       desc: 'Waveform phase consistency analysis' },
      { name: 'SNR Consistency',            desc: 'Signal-to-noise ratio uniformity scan' },
    ],
    signals: [
      { key: 'snr_db',      label: 'SNR',          unit: 'dB',  desc: 'Signal noise ratio' },
      { key: 'pitch_var',   label: 'Pitch Var',    unit: 'Hz',  desc: 'Pitch variation range' },
      { key: 'formant_dev', label: 'Formant Dev',  unit: 'Hz',  desc: 'F1/F2 deviation' },
      { key: 'silence_r',   label: 'Silence Ratio',unit: '%',   desc: 'Pause distribution' },
    ],
  },

  video: {
    label: 'VIDEO',
    accept: '.mp4,.mov,.avi,.webm,.mkv',
    formats: 'mp4 · mov · avi · webm · mkv',
    fileIcon: '🎬',
    color: '#ffb800',
    detectors: [
      { name: 'Temporal Blend Detection', desc: 'Inter-frame blending artifact analysis',        color: '#ffb800' },
      { name: 'Optical Flow Analysis',    desc: 'Motion vector consistency across frames',       color: '#ffb800' },
      { name: 'Head Pose Estimation',     desc: '3D head pose temporal coherence check',         color: '#ffb800' },
      { name: 'Lip Sync Correlation',     desc: 'Audio-visual synchronization scoring',          color: '#ffb800' },
      { name: 'Frame Noise Pattern',      desc: 'Per-frame noise distribution tracking',         color: '#ffb800' },
      { name: 'Shadow Geometry',          desc: 'Lighting and shadow consistency check',         color: '#ffb800' },
    ],
    layers: [
      { name: 'Frame-Level Face Detector', desc: 'Per-frame deepfake classification' },
      { name: 'Temporal Consistency',      desc: 'Cross-frame identity consistency score' },
      { name: 'Lip-Sync Correlation',      desc: 'MFCC to mouth-movement correlation' },
      { name: 'Shadow Geometry Analysis',  desc: '3D lighting model consistency test' },
      { name: 'Motion Vector Analysis',    desc: 'Optical flow anomaly detection' },
    ],
    signals: [
      { key: 'fps_stable',  label: 'FPS Stability', unit: '%',  desc: 'Frame rate consistency' },
      { key: 'lip_lag',     label: 'Lip Lag',        unit: 'ms', desc: 'AV sync delay' },
      { key: 'head_jitter', label: 'Head Jitter',    unit: 'px', desc: 'Pose instability' },
      { key: 'blend_score', label: 'Blend Score',    unit: '',   desc: 'Face blend artifact' },
    ],
  },

  text: {
    label: 'TEXT/NLP',
    accept: '.txt,.md,.csv',
    formats: 'txt · md · csv',
    fileIcon: '📄',
    color: '#ff3c6e',
    detectors: [
      { name: 'Perplexity Scoring',    desc: 'GPT-2 language model perplexity test',      color: '#ff3c6e' },
      { name: 'Burstiness Analysis',   desc: 'Sentence length variance measurement',       color: '#ff3c6e' },
      { name: 'Stylometry',            desc: 'Author style signature analysis',            color: '#ff3c6e' },
      { name: 'Semantic Entropy',      desc: 'Topic coherence and entropy scoring',        color: '#ff3c6e' },
      { name: 'N-gram Repetition',     desc: 'Repetitive phrase pattern detection',        color: '#ff3c6e' },
    ],
    layers: [
      { name: 'Token Perplexity Scan',       desc: 'Per-token language model scoring' },
      { name: 'Sentence Burstiness',         desc: 'Variance in sentence length patterns' },
      { name: 'Author Stylometry',           desc: 'Writing style fingerprint matching' },
      { name: 'Semantic Entropy',            desc: 'Logical flow and coherence scoring' },
      { name: 'N-gram Anomaly Detection',    desc: 'Unusual phrase repetition flagging' },
    ],
    signals: [
      { key: 'ppl_score',   label: 'Perplexity',    unit: '',   desc: 'LM perplexity score' },
      { key: 'burst_ratio', label: 'Burstiness',    unit: '',   desc: 'Length variance ratio' },
      { key: 'vocab_rich',  label: 'Vocab Rich',    unit: '',   desc: 'Vocabulary richness' },
      { key: 'avg_sent',    label: 'Avg Sent Len',  unit: 'w',  desc: 'Mean sentence words' },
    ],
  },
};

const PROGRESS_STEPS = {
  image: [
    'Extracting DCT frequency components...',
    'Running facial landmark detection...',
    'Scanning GAN fingerprint patterns...',
    'Analyzing compression artifacts...',
    'Computing final forensic score...',
  ],
  audio: [
    'Extracting mel spectrograms...',
    'Detecting vocoder fingerprints...',
    'Analyzing pitch & formant patterns...',
    'Checking phase coherence...',
    'Computing final forensic score...',
  ],
  video: [
    'Scanning frame sequences...',
    'Computing optical flow vectors...',
    'Measuring lip-sync correlation...',
    'Analyzing temporal consistency...',
    'Computing final forensic score...',
  ],
  text: [
    'Tokenizing input text...',
    'Computing perplexity scores...',
    'Running burstiness analysis...',
    'Performing stylometry check...',
    'Computing final forensic score...',
  ],
};
