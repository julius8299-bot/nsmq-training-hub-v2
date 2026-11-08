"use client";

import { useCallback, useEffect, useState } from "react";
import { toSpeech } from "@/lib/text/speech";

const KEY = "nsmq-voice";
type Settings = { readAloud: boolean; listenOnly: boolean };
const read = (): Settings => {
  try { return { readAloud: false, listenOnly: false, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return { readAloud: false, listenOnly: false }; }
};

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => /en-GB/i.test(voice.lang)) ?? voices.find((voice) => /^en/i.test(voice.lang)) ?? null;
}

/** Quizmaster voice using the browser's built-in speech. speak() resolves when reading ends (or is cancelled). */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [settings, setSettings] = useState<Settings>({ readAloud: false, listenOnly: false });
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    setSettings(read());
    return () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      if (!next.readAloud) next.listenOnly = false;
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      if (!next.readAloud && "speechSynthesis" in window) window.speechSynthesis.cancel();
      return next;
    });
  }, []);
  const speak = useCallback((text: string) => new Promise<void>((resolve) => {
    if (!("speechSynthesis" in window) || !text.trim()) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(toSpeech(text));
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    // Some browsers never fire "end" if the tab is hidden; cap the wait by text length.
    const fallback = window.setTimeout(done, 4000 + text.length * 90);
    function done() { window.clearTimeout(fallback); setSpeaking(false); resolve(); }
    utterance.onend = done; utterance.onerror = done;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }), []);
  const stop = useCallback(() => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setSpeaking(false); }, []);
  return { supported, ...settings, update, speak, stop, speaking };
}
