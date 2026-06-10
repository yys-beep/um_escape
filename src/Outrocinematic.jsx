import React, { useState, useEffect } from 'react';
import './Outrocinematic.css';
import mayaImg from '/src/assets/14.png';

// ─── Typewriter ───────────────────────────────────────────────────────────────
function TypewriterText({ text, onDone, speed = 30 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
        setTimeout(onDone, 500);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span className="outro-typewriter">
      {displayed}
      {!done && <span className="outro-cursor">▌</span>}
    </span>
  );
}

// ─── Scene data ───────────────────────────────────────────────────────────────
const SCENES = [
  { id: 'black1',     type: 'auto',     duration: 1800 },
  { id: 'wakeup',     type: 'narration',text: 'Your eyes open slowly.\n\nThe ceiling. The familiar ceiling of your room.' },
  { id: 'bed',        type: 'narration',text: 'You are lying in bed. It feels like waking from the deepest sleep of your life.' },
  { id: 'tv',         type: 'narration',text: 'The television is on. The sound of a news broadcast fills the room.' },
  { id: 'news',       type: 'news',
    headline: 'BREAKING — UM PSYCHOLOGICAL EXPERIMENT SCANDAL',
    body: 'Leaked archive files have spread rapidly across the country.\n\nNews reports flood television screens, social media feeds, and university websites. The university can no longer deny what happened.\n\nInvestigations begin immediately. Several former administrators and researchers are questioned.',
  },
  { id: 'notdream',   type: 'dialogue', speaker: 'You', text: '"It wasn\'t a dream..?"' },
  { id: 'window',     type: 'narration',text: 'The window opens abruptly.\n\nThe curtains blow hard against the night air.' },
  { id: 'figure',     type: 'narration',text: 'There — by the window — a figure.\n\nWomanly. Transparent. Still.' },
  { id: 'blink1',     type: 'narration',text: 'You blink.' },
  { id: 'blink2',     type: 'narration',text: 'You rub your eyes.' },
  { id: 'maya_q',     type: 'dialogue', speaker: 'You', text: '"...Maya?"' },
  { id: 'maya_clear', type: 'narration',text: 'You see her face clearly now.\n\nIt is her. Maya Rahman. She is smiling — gently, softly.' },
  { id: 'maya_gone',  type: 'narration',text: 'Before you could move toward her, she disappeared.' },
  { id: 'whisper',    type: 'whisper',  text: '"Thank you."',  showMaya: true },
  { id: 'curtain',    type: 'narration',text: 'You looked around. The night was quiet again.\n\nYou walked to the window and slowly closed the curtains.' },
  { id: 'theend',     type: 'end' },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function OutroCinematic({ onPlayAgain }) {
  const [idx, setIdx]       = useState(0);
  const [ready, setReady]   = useState(false);
  const [ending, setEnding] = useState(false);

  const scene = SCENES[idx];

  useEffect(() => {
    if (scene.type === 'auto') {
      const t = setTimeout(() => { setIdx(i => i + 1); setReady(false); }, scene.duration);
      return () => clearTimeout(t);
    }
    if (scene.type === 'end') {
      const t = setTimeout(() => setEnding(true), 600);
      return () => clearTimeout(t);
    }
  }, [scene]);

  const advance = () => {
    if (!ready) return;
    setIdx(i => i + 1);
    setReady(false);
  };

  // ── THE END screen ──────────────────────────────────────────────────────────
  if (scene.type === 'end') {
    return (
      <div className="outro-end-screen">
        <div className={`outro-theend ${ending ? 'outro-theend--visible' : ''}`}>THE END</div>
        <div className={`outro-endlogo ${ending ? 'outro-endlogo--visible' : ''}`}>UM ESCAPE</div>
        <button
          className={`outro-again-btn ${ending ? 'outro-again-btn--visible' : ''}`}
          onClick={onPlayAgain}
        >
          Play Again
        </button>
      </div>
    );
  }

  // ── Opening black ────────────────────────────────────────────────────────────
  if (scene.type === 'auto') {
    return (
      <div
        className="outro-screen outro-screen--pure-black"
        onClick={() => { setIdx(i => i + 1); setReady(false); }}
        style={{ cursor: 'pointer' }}
      />
    );
  }

  // ── Story scenes ─────────────────────────────────────────────────────────────
  return (
    <div className="outro-screen" onClick={ready ? advance : undefined}>

      {/* Scanlines + vignette */}
      <div className="outro-vignette" aria-hidden="true" />

      {/* Curtain wind on window scene */}
      {scene.id === 'window' && <div className="outro-curtain-wind" />}

      {/* Background silhouette — always visible, dark shadow of a girl */}
      <div className="outro-silhouette" aria-hidden="true" />

      {/* Maya portrait — only on the "Thank you" whisper scene, centered above dialogue box */}
      {scene.showMaya && (
        <div className="outro-maya-portrait">
          <img src={mayaImg} alt="Maya" className="outro-maya-img" />
        </div>
      )}

      {/* News TV overlay */}
      {scene.type === 'news' && (
        <div className="outro-news-layer">
          <div className="outro-news-ticker" aria-hidden="true">
            📺 &nbsp; BREAKING NEWS &nbsp;|&nbsp; UM PSYCHOLOGICAL EXPERIMENT EXPOSED &nbsp;|&nbsp;
            UNIVERSITY UNDER INVESTIGATION &nbsp;|&nbsp; OFFICIALS QUESTIONED &nbsp;|&nbsp;
            ARCHIVE FILES LEAKED NATIONWIDE &nbsp;|&nbsp; UM PSYCHOLOGICAL EXPERIMENT EXPOSED &nbsp;|&nbsp;
          </div>
          <div className="outro-news-headline">{scene.headline}</div>
        </div>
      )}

      {/* Dialogue / narration box */}
      <div className="outro-box">
        {scene.type === 'dialogue' && (
          <div className="outro-label outro-label--player">{scene.speaker}</div>
        )}
        {scene.type === 'whisper' && (
          <div className="outro-label outro-label--whisper">— whisper —</div>
        )}

        <div className={[
          'outro-text',
          scene.type === 'narration' && 'outro-text--narration',
          scene.type === 'whisper'   && 'outro-text--whisper',
          scene.type === 'news'      && 'outro-text--news',
        ].filter(Boolean).join(' ')}>
          <TypewriterText
            key={scene.id}
            text={scene.type === 'news' ? scene.body : scene.text}
            onDone={() => setReady(true)}
            speed={scene.type === 'whisper' ? 55 : scene.type === 'news' ? 16 : 28}
          />
        </div>

        {ready && (
          <div className="outro-continue">press anywhere to continue...</div>
        )}
      </div>
    </div>
  );
}