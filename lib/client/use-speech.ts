"use client";

import { useCallback, useEffect, useState } from "react";
import { toSpeech } from "@/lib/text/speech";

const KEY = "nsmq-voice";
type Settings = { readAloud: boolean; listenOnly: boolean; voiceName: string; rate: number };
const DEFAULTS: Settings = { readAloud: false, listenOnly: false, voiceName: "", rate: 1 };
const read = (): Settings => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return DEFAULTS; }
};

// Clear female English voices found on common phones and computers, best first.
const PREFERRED = [/Google UK English Female/i, /Sonia|Libby|Maisie/i, /Aria|Jenny|Ava|Emma/i, /Samantha|Karen|Moira|Tessa|Serena|Martha|Kate|Fiona/i, /female/i];
export const englishVoices = () => window.speechSynthesis.getVoices().filter((voice) => /^en/i.test(voice.lang));

function pickVoice(name: string) {
  const voices = englishVoices();
  const chosen = name && voices.find((voice) => voice.name === name);
  if (chosen) return chosen;
  for (const pattern of PREFERRED) {
    const match = voices.find((voice) => pattern.test(voice.name));
    if (match) return match;
  }
  return voices.find((voice) => /en-GB/i.test(voice.lang)) ?? voices[0] ?? null;
}

/** Quizmaster voice using the browser's built-in speech. speak() resolves when reading ends (or is cancelled). */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    setSettings(read());
    if ("speechSynthesis" in window) {
      const load = () => setVoices(englishVoices().map((voice) => ({ name: voice.name, lang: voice.lang })));
      load();
      window.speechSynthesis.addEventListener("voiceschanged", load);
    }
    return () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);
  const update = useCallback((patch: Partial<Settings>) => {
    // Saved straight away so a preview spoken in the same click already uses the new voice.
    const next = { ...read(), ...patch };
    if (!next.readAloud) next.listenOnly = false;
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    if (!next.readAloud && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSettings(next);
  }, []);
  const speak = useCallback((text: string) => new Promise<void>((resolve) => {
    if (!("speechSynthesis" in window) || !text.trim()) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(toSpeech(text));
    const voice = pickVoice(read().voiceName);
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    utterance.rate = read().rate || 1;
    // Some browsers never fire "end" if the tab is hidden; cap the wait by text length.
    const fallback = window.setTimeout(done, 4000 + text.length * 90);
    function done() { window.clearTimeout(fallback); setSpeaking(false); resolve(); }
    utterance.onend = done; utterance.onerror = done;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }), []);
  const stop = useCallback(() => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setSpeaking(false); }, []);
  const currentVoice = supported && voices.length ? pickVoice(settings.voiceName)?.name ?? "" : "";
  return { supported, ...settings, voices, currentVoice, update, speak, stop, speaking };
}
