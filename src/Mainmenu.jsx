import React, { useState, useEffect, useRef } from 'react';
import './Mainmenu.css';

import friendNeutral from '/src/assets/10.png';   
import friendShocked from '/src/assets/7.png';    
import friendDoubtful from '/src/assets/9.png';  

// ─── Global SFX Helper ────────────────────────────────────────────────────────
const playSFX = (fileName, volume = 1.0) => {
  const audio = new Audio(`/${fileName}`);
  audio.volume = volume;
  audio.play().catch((e) => console.log('Audio blocked by browser:', e));
};

// ─── Storyline Dialogues ───────────────────────────────────────────────────────
const STORY_DIALOGUES = [
  {
    speaker: null,
    text: "Universiti Malaya. Exam week.",
    isNarration: true,
  },
  {
    speaker: "Friend",
    portraitImg: friendNeutral,
    text: "...You heard the rumors going around lately? They're saying people from Kolej Kediaman keep hearing whispers outside their rooms at night.",
  },
  {
    speaker: "You",
    text: "Meh... That's probably seniors trolling first years again.",
  },
  {
    speaker: "Friend",
    portraitImg: friendDoubtful,
    text: "That's what everyone thought at first. But last week, my friend stayed late at DK1 doing revisions. And he swore the projector turned on by itself!",
  },
  {
    speaker: "You",
    text: "Maybe someone forgot to shut it down.",
  },
  {
    speaker: "Friend",
    portraitImg: friendShocked,
    text: "No one was inside the hall... He even said the projector kept flashing random student names!!",
  },
  {
    speaker: "You",
    text: "...That's creepy.",
  },
  {
    speaker: "Friend",
    portraitImg: friendShocked,
    text: "It gets worse. They're saying that library staff have been complaining too. Books showing up in the wrong sections. Impossible places. Medical journals inside engineering shelves. Old archived books appearing on tables that were locked the night before.",
  },
  {
    speaker: "You",
    text: "People are really bored during exam week huh?",
  },
  {
    speaker: "Friend",
    portraitImg: friendDoubtful,
    text: "You joke now, but students have been talking about someone missing. They say a student disappeared years ago around campus. The weird part is...",
    whisper: "...she never actually left campus.",
  },
  {
    speaker: null,
    text: "That night, as you were studying, your laptop pinged with a new email.",
    isNarration: true,
  },
  {
    speaker: "EMAIL",
    text: 'From: !#$^!*12@gmail.com\n\n"If you want the truth, follow the trail."\n\n● Residential College\n● FSKTM Lecture Hall DK1\n● Main Library',
    isEmail: true,
  },
  {
    speaker: null,
    text: "Your laptop screen flickered. The Wi-Fi died. All exits locked automatically.",
    isNarration: true,
  },
  {
    speaker: null,
    text: '"Find what they buried."',
    isNarration: true,
    isWhisper: true,
  },
  {
    speaker: null,
    text: "Everything went dark. When you opened your eyes, you were inside Kolej Kediaman Ke-1.",
    isNarration: true,
  },
];

// ─── Typewriter Component ─────────────────────────────────────────────────────
function TypewriterText({ text, onDone, speed = 28 }) {
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
        setTimeout(onDone, 600);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onDone]);

  return (
    <span className="typewriter-text">
      {displayed}
      {!done && <span className="typewriter-cursor">▌</span>}
    </span>
  );
}

// ─── Logo Screen ──────────────────────────────────────────────────────────────
function LogoScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="logo-screen">
      <div className="logo-title">UM ESCAPE</div>
      <div className="logo-subtitle">A Story of Shadows &amp; Secrets</div>
      <div className="logo-line" />
      <div className="logo-university">Universiti Malaya</div>
    </div>
  );
}

// ─── Main Menu ────────────────────────────────────────────────────────────────
function MainMenuScreen({ onPlay, onInstructions }) {
  return (
    <div className="main-menu">
      <div className="menu-glitch-bg" aria-hidden="true" />
      <div className="menu-content">
        <h1 className="menu-title">UM<span className="menu-title-accent"> ESCAPE</span></h1>
        <p className="menu-tagline">Some truths refuse to stay buried.</p>
        <nav className="menu-buttons">
          <button className="menu-btn menu-btn--primary" onClick={() => { playSFX('click.wav', 0.6); onPlay(); }}>
            ▶ &nbsp;PLAY
          </button>
          <button className="menu-btn" onClick={() => { playSFX('click.wav', 0.6); onInstructions(); }}>
            ? &nbsp;INSTRUCTIONS
          </button>
        </nav>
      </div>
    </div>
  );
}

// ─── Instructions Screen ──────────────────────────────────────────────────────
function InstructionsScreen({ onBack }) {
  return (
    <div className="main-menu">
      <div className="menu-glitch-bg" aria-hidden="true" />
      <div className="menu-content instructions-content">
        <h2 className="menu-title" style={{ fontSize: '1.8rem' }}>HOW TO PLAY</h2>
        <div className="instructions-grid">
          <div className="instr-block">
            <h3>Movement</h3>
            <p><kbd>W</kbd> Walk forward</p>
            <p><kbd>A</kbd> Strafe left</p>
            <p><kbd>S</kbd> Walk backward</p>
            <p><kbd>D</kbd> Strafe right</p>
          </div>
          <div className="instr-block">
            <h3>Actions</h3>
            <p><kbd>Mouse</kbd> Look around (right-click)</p>
            <p><kbd>Click</kbd> Inspect / pick up objects</p>
            <p><kbd>I</kbd> Toggle inventory</p>
            <p><kbd>T</kbd> Toggle flashlight</p>
          </div>
          <div className="instr-block">
            <h3>System</h3>
            <p><kbd>ESC</kbd> Pause / unlock mouse</p>
            <p>Click the screen to lock your mouse for full control.</p>
          </div>
          <div className="instr-block">
            <h3>Objective</h3>
            <p>Explore three locations. Solve puzzles. Uncover the truth behind Maya Rahman's disappearance.</p>
          </div>
        </div>
        <button className="menu-btn" style={{ marginTop: '2rem' }} onClick={() => { playSFX('click.wav', 0.6); onBack(); }}>
          ← Back
        </button>
      </div>
    </div>
  );
}

// ─── Storyline Screen ─────────────────────────────────────────────────────────
function StorylineScreen({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const current = STORY_DIALOGUES[index];
  const isLast = index === STORY_DIALOGUES.length - 1;

  // 🎵 HORROR AUDIO CUES DURING DIALOGUE
  useEffect(() => {
    if (!current) return;
    
    // Play the email ping when the email appears
    if (current.isEmail) {
      playSFX('mail_ping_placeholder.wav', 1.0);
    }
    
    // Play reversed whispers when the whispering text appears
    if (current.isWhisper) {
      playSFX('distorted_reversed_whispers.mp3', 0.8);
    }
    
    // Final bass drop before teleporting into the game
    if (isLast) {
      playSFX('bass_drop.wav', 1.0);
    }
  }, [current, index]);

  const advance = () => {
    if (!ready) return;
    playSFX('click.wav', 0.4);
    
    if (isLast) {
      onComplete();
    } else {
      setIndex((i) => i + 1);
      setReady(false);
    }
  };

  const showPortrait = current && current.speaker === 'Friend';

  return (
    <div className="storyline-screen" onClick={ready ? advance : undefined}>
      <div className="storyline-bg" />

      {/* Skip button — top right */}
      <button
        className="storyline-skip"
        onClick={(e) => { 
          e.stopPropagation(); 
          playSFX('click.wav', 0.6);
          onComplete(); 
        }}
      >
        SKIP ▶▶
      </button>

      {/* Character portrait — bottom right of box area */}
      {showPortrait && (
        <div className="storyline-portrait">
          <img src={current.portraitImg} alt={current.speaker} />
        </div>
      )}

      <div className="storyline-box">
        {current.isNarration ? (
          <div className={`storyline-narration ${current.isWhisper ? 'storyline-narration--whisper' : ''}`}>
            <TypewriterText
              key={index}
              text={current.text}
              onDone={() => setReady(true)}
              speed={current.isWhisper ? 45 : 30}
            />
          </div>
        ) : current.isEmail ? (
          <>
            <div className="storyline-speaker storyline-speaker--email">{current.speaker}</div>
            <div className="storyline-email">
              <TypewriterText key={index} text={current.text} onDone={() => setReady(true)} speed={18} />
            </div>
          </>
        ) : (
          <>
            <div className={`storyline-speaker ${current.speaker === 'You' ? 'storyline-speaker--player' : ''}`}>
              {current.speaker}
            </div>
            <div className="storyline-dialogue">
              <TypewriterText
                key={`main-${index}`}
                text={current.whisper ? current.text + current.whisper : current.text}
                onDone={() => setReady(true)}
                speed={current.whisper ? 35 : 28}
              />
            </div>
          </>
        )}

        {ready && (
          <div className="storyline-continue">
            {isLast ? 'Press anywhere to begin...' : 'Press anywhere to continue...'}
          </div>
        )}
      </div>

      <div className="storyline-progress">
        {STORY_DIALOGUES.map((_, i) => (
          <span key={i} className={`progress-dot ${i <= index ? 'progress-dot--active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Exported Controller ──────────────────────────────────────────────────────
// phase: 'logo' → 'menu' → 'instructions' → 'story' → 'game'
export default function MainMenuController({ onStartGame }) {
  const [phase, setPhase] = useState('logo');
  const bgmRef = useRef(null);

  // 🎵 MAIN MENU BGM LOBBY MUSIC
  useEffect(() => {
    // Start background music when the main menu mounts
    bgmRef.current = new Audio('/main_menu_starting_scene.mp3');
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.5;
    
    // Auto-play might be blocked by browser policy until interaction,
    // so we catch the promise rejection silently.
    bgmRef.current.play().catch(e => console.log('BGM waiting for user interaction.'));

    return () => {
      // Cleanup: Stop the music completely when transitioning into the actual game
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  // Helper to ensure BGM plays after an interaction if it was blocked initially
  const handleUserInteraction = (nextPhase) => {
    if (bgmRef.current && bgmRef.current.paused) {
      bgmRef.current.play().catch(e => {});
    }
    setPhase(nextPhase);
  };

  if (phase === 'logo') return <LogoScreen onDone={() => setPhase('menu')} />;
  
  if (phase === 'menu') return (
    <MainMenuScreen
      onPlay={() => handleUserInteraction('story')}
      onInstructions={() => handleUserInteraction('instructions')}
    />
  );
  
  if (phase === 'instructions') return <InstructionsScreen onBack={() => handleUserInteraction('menu')} />;
  
  if (phase === 'story') return <StorylineScreen onComplete={onStartGame} />;
  
  return null;
}