import React, { useState, useRef, useEffect } from 'react';
import Scene from './components/Scene.tsx';
import { AppState } from './types.ts';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SCATTERED);
  
  // State for Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initial Auto-play attempt
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.5;

    const removeListeners = () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    const attemptPlay = () => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Autoplay success
            removeListeners();
          })
          .catch((err) => {
            console.log("Autoplay blocked, waiting for user interaction:", err);
            // Listeners remain active
          });
      }
    };

    const handleInteraction = () => {
      // Only try to play if paused.
      if (audio.paused) {
        audio.play().catch(console.error);
      }
      // Clean up listeners immediately after first interaction
      removeListeners();
    };

    // Try playing immediately
    attemptPlay();

    // Add fallback listeners
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      removeListeners();
    };
  }, []);

  const toggleState = () => {
    setAppState(prev => 
      prev === AppState.SCATTERED ? AppState.TREE_SHAPE : AppState.SCATTERED
    );
  };

  const toggleAudio = (e: React.MouseEvent) => {
    // Prevent this click from triggering the document-level handleInteraction
    e.stopPropagation();
    
    if (!audioRef.current) return;
    
    if (!audioRef.current.paused) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play failed:", e));
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#1a050f] text-white overflow-hidden selection:bg-arix-pinkDeep selection:text-white">
      {/* 
        Robust Audio Setup:
        1. Using Wikimedia MP3 transcode (High reliability)
        2. Event listeners (onPlay/onPause) ensure UI is always in sync with actual audio state
      */}
      <audio 
        ref={audioRef} 
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c5/We_wish_you_a_merry_Christmas_-_US_Marine_Band.ogg/We_wish_you_a_merry_Christmas_-_US_Marine_Band.ogg.mp3" type="audio/mpeg" />
      </audio>

      {/* 3D Layer */}
      <div className="absolute inset-0 z-0">
        <Scene appState={appState} />
      </div>

      {/* UI Overlay */}
      <main className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-12">
        
        {/* Header with Title and Audio Control */}
        <header className="flex w-full items-start justify-between pointer-events-auto">
          <div className="flex flex-col space-y-2">
            <h1 className="font-vintage text-5xl md:text-8xl text-arix-pinkDeep drop-shadow-[0_2px_15px_rgba(255,20,147,0.6)]">
              Merry Christmas
            </h1>
          </div>

          {/* Audio Toggle Button */}
          <button 
            onClick={toggleAudio}
            className="group flex items-center justify-center w-12 h-12 rounded-full border border-arix-pinkDeep/50 bg-black/20 backdrop-blur-sm hover:bg-arix-pinkDeep/20 transition-all duration-300 active:scale-95 cursor-pointer"
            aria-label={isPlaying ? "Mute Music" : "Play Music"}
          >
            {isPlaying ? (
              // Speaker On Icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-arix-pinkDeep">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            ) : (
              // Speaker Off/Mute Icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-arix-pinkDeep/70">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L15.75 12m0 0l-1.5 1.5M15.75 12l1.5 1.5M15.75 12l-1.5-1.5m-11.5 0h1.75l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25z" />
              </svg>
            )}
          </button>
        </header>

        {/* Footer Controls */}
        <footer className="w-full flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto">
          <div className="flex flex-col max-w-md text-center md:text-left">
             {/* Empty div for layout balance */}
          </div>

          <button
            onClick={toggleState}
            className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-sm transition-all duration-500 ease-out hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Button Background Gradient & Borders */}
            <div className="absolute inset-0 border border-arix-pinkDeep/30 group-hover:border-arix-pinkDeep transition-colors duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-arix-pinkDeep to-arix-pinkLight opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent transition-opacity duration-700"></div>

            {/* Button Text */}
            <span className="relative z-10 font-sans font-bold tracking-[0.15em] text-sm text-white group-hover:text-black transition-colors duration-300">
              {appState === AppState.SCATTERED ? 'ASSEMBLE TREE' : 'SCATTER MAGIC'}
            </span>
          </button>
        </footer>
      </main>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 z-[5] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,#1a050f_100%)] opacity-60"></div>
    </div>
  );
}

export default App;