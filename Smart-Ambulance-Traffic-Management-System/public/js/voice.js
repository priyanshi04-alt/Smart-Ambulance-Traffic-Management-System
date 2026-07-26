// Voice and Audio Synthesis Module

let synth = window.speechSynthesis;
let sirenAudio = null;
let voices = [];

document.addEventListener('DOMContentLoaded', () => {
    // Attempt to load voices
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => { voices = synth.getVoices(); };
    }

    // Create virtual siren oscillator (Using Web Audio API to avoid external assets)
    initVirtualSiren();
});

function speak(text) {
    if (window.isMuted) return;
    
    // Prevent Speech Synthesis queue from clogging up and speaking old messages randomly
    if (synth.speaking) {
         synth.cancel(); 
    }
    
    // Strip HTML tags and &nbsp; entities so browser does not read them out loud
    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, " ").replace(/&nbsp;/g, " ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a good English voice
    const voice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US') || voices[0];
    if (voice) {
        utterance.voice = voice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = text.includes("EMERGENCY") ? 1.2 : 1.0; 
    
    synth.speak(utterance);
}

// Global scope access
window.speak = speak;

// Web Audio API virtual Siren
let audioCtx;
let sirenInterval;
let oscInstance;

function initVirtualSiren() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    } catch (e) {
        console.warn("Web Audio API not supported");
    }
}

window.playSiren = function() {
    if (window.isMuted || !audioCtx) return;
    
    // Resume context if suspended
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (sirenInterval) return; // already playing
    
    let isHigh = false;
    
    const playTone = () => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Classic European Hi-Lo siren pattern
        osc.type = 'square';
        osc.frequency.value = isHigh ? 960 : 700; 
        
        // Soften the harshness
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.6);
        
        oscInstance = osc;
        isHigh = !isHigh;
    };
    
    playTone();
    sirenInterval = setInterval(playTone, 600);
};

window.stopSiren = function() {
    if (sirenInterval) {
        clearInterval(sirenInterval);
        sirenInterval = null;
    }
    if (oscInstance) {
        try { oscInstance.stop(); } catch(e){}
    }
};
