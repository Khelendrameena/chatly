import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./index.css";

const SERVER = import.meta.env.VITE_API_URL || "http://localhost:3001";
const AVATARS = ["🦊", "🐼", "🦉", "🐯", "🦄", "🐸", "🦁", "🐙", "🦋", "🐳"];

function fmtTime(s) {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}
function clock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [state, setState] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [interests, setInterests] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(0);
  const [chatTime, setChatTime] = useState(0);
  const [ageOk, setAgeOk] = useState(false);
  const [avatar, setAvatar] = useState("🦊");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTO = useRef(null);
  const timerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const s = io(SERVER);
    socketRef.current = s;
    s.on("online", ({ count }) => setOnline(count));
    s.on("status", ({ state }) => {
      setState(state);
      if (state === "connected") {
        setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
        setChatTime(0);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setChatTime((t) => t + 1), 1000);
        setMessages((m) => [...m, { sys: true, text: "You're connected! Be kind and say hi 👋" }]);
      }
      if (state === "disconnected" || state === "idle") {
        clearInterval(timerRef.current);
        setTyping(false);
      }
    });
    s.on("message", ({ text, at }) => setMessages((m) => [...m, { from: "stranger", text, at: at || Date.now() }]));
    s.on("system", (text) => setMessages((m) => [...m, { sys: true, text }]));
    s.on("typing", (t) => setTyping(!!t));
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const start = () => {
    if (!ageOk) return;
    setMessages([]);
    setScreen("chat");
    socketRef.current?.emit("find", {
      interests: interests.split(",").map((x) => x.trim()).filter(Boolean),
    });
  };

  const next = () => {
    setMessages([]);
    setTyping(false);
    socketRef.current?.emit("next");
  };

  const stop = () => {
    socketRef.current?.emit("stop");
    setScreen("home");
    setState("idle");
    setMessages([]);
  };

  const send = () => {
    const text = input.trim();
    if (!text || state !== "connected") return;
    socketRef.current?.emit("message", text);
    socketRef.current?.emit("typing", false);
    setMessages((m) => [...m, { from: "you", text, at: Date.now() }]);
    setInput("");
  };

  const onType = (v) => {
    setInput(v);
    if (state !== "connected") return;
    socketRef.current?.emit("typing", true);
    clearTimeout(typingTO.current);
    typingTO.current = setTimeout(() => socketRef.current?.emit("typing", false), 1200);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && screen === "chat" && state === "connected") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, state]);

  const scrollToCard = () => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col relative overflow-x-hidden text-slate-100" style={{ background: "radial-gradient(1200px 600px at 80% -10%, #232f66 0%, transparent 60%), radial-gradient(1000px 520px at 0% 110%, #0e4256 0%, transparent 55%), #0b1023" }}>
      <div className="blob w-72 h-72 bg-indigo-600 -top-10 -left-10" />
      <div className="blob w-80 h-80 bg-cyan-500 top-1/3 -right-16" style={{ animationDelay: "-3s" }} />
      <div className="blob w-64 h-64 bg-emerald-500 -bottom-16 left-1/4" style={{ animationDelay: "-6s" }} />

      {/* Header */}
      <header className="glass sticky top-0 z-20 border-x-0 border-t-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl grad-send text-white grid place-items-center shadow-lg shadow-indigo-900/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </span>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight">Chat<span className="grad-text">ly</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">🛡️ Safe & Anonymous</span>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-300/25 rounded-full px-2.5 sm:px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {online} online now
            </div>
          </div>
        </div>
      </header>

      {screen === "home" ? (
        <main className="flex-1 relative">
          {/* Hero */}
          <div className="max-w-5xl mx-auto px-4 pt-10 sm:pt-14 pb-4 text-center rise">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-cyan-200 bg-cyan-400/10 border border-cyan-300/25 rounded-full px-3.5 py-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
              {online > 0 ? `${online} people are chatting right now` : "People are chatting right now"}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mt-5">
              One click away from<br /><span className="grad-text">your next great conversation</span>
            </h1>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-base sm:text-lg">Bored? Curious? Just want to talk? Chatly pairs you with a real stranger in seconds — anonymous, free, and surprisingly fun.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 text-sm text-slate-300 font-medium">
              <span>✅ No sign-up</span><span>⚡ Matched in seconds</span><span>🕶️ 100% anonymous</span><span>💸 Free forever</span>
            </div>
          </div>

          {/* Floating preview bubbles (desktop) */}
          <div className="relative max-w-xl mx-auto px-4">
            <div className="hidden lg:block absolute -left-56 top-6 w-48 bob z-10">
              <div className="glass rounded-3xl rounded-bl-lg p-3.5 text-sm shadow-xl"><span className="text-lg mr-1">🦊</span>hey! where are you from?</div>
              <div className="glass rounded-3xl rounded-br-lg p-3.5 text-sm shadow-xl mt-3 ml-8 grad-send text-white">India 🇮🇳 you?</div>
            </div>
            <div className="hidden lg:block absolute -right-56 top-24 w-48 bob-slow z-10">
              <div className="glass rounded-3xl rounded-bl-lg p-3.5 text-sm shadow-xl"><span className="text-lg mr-1">🐼</span>we both like cricket! 🏏</div>
              <div className="glass rounded-3xl rounded-br-lg p-3.5 text-sm shadow-xl mt-3 ml-8 grad-send text-white">no way, favourite team?</div>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1.5 justify-center mb-5 glass rounded-full p-1.5 w-fit mx-auto rise">
              <button className="px-4 sm:px-5 py-2 rounded-full grad-send text-white font-semibold shadow-lg shadow-indigo-900/40">💬 Text Chat</button>
              <button disabled className="px-4 sm:px-5 py-2 rounded-full text-slate-400 font-semibold cursor-not-allowed" title="Text chat only">📹 Video <span className="text-[10px] align-top bg-white/10 rounded px-1">SOON</span></button>
            </div>

            {/* Start card */}
            <div ref={cardRef} className="glass-strong glow-card text-slate-800 rounded-[1.75rem] p-4 sm:p-5 md:p-7 text-left rise">
              <label className="block text-sm font-bold text-slate-700 mb-1">Your interests <span className="font-normal text-slate-400">(optional — better matches)</span></label>
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. music, cricket, coding, anime"
                className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition"
              />
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {["music", "cricket", "movies", "coding", "anime", "travel"].map((t) => (
                  <button key={t} onClick={() => setInterests((v) => (v ? v.replace(/,?\s*$/, "") + ", " + t : t))} className="text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-full px-2.5 py-1 transition">+ {t}</button>
                ))}
              </div>

              <label className="flex items-start gap-2 mt-4 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} className="mt-0.5 accent-indigo-600 w-4 h-4" />
                I confirm that I am 18 years or older and agree to be respectful to strangers.
              </label>

              <button
                onClick={start}
                disabled={!ageOk}
                className={`shine-wrap w-full mt-5 py-4 rounded-2xl text-white text-lg font-extrabold tracking-wide transition ${ageOk ? "grad-btn shadow-xl shadow-emerald-900/30 hover:scale-[1.01] active:scale-[.99]" : "bg-slate-300 cursor-not-allowed"}`}
              >
                Start Chatting →
              </button>
              <p className="text-center text-xs text-slate-400 mt-3">🔒 Anonymous — no name, no photo, nothing is stored.</p>
            </div>
          </div>

          {/* How it works */}
          <div className="max-w-5xl mx-auto px-4 pt-12">
            <h2 className="text-center text-2xl sm:text-3xl font-extrabold">How it works</h2>
            <div className="grid md:grid-cols-3 gap-3 sm:gap-4 mt-6">
              {[
                ["1️⃣", "Add your interests", "Tell us what you love — music, sports, anything. Or skip and go fully random."],
                ["2️⃣", "Get matched instantly", "Our engine finds someone online who shares your vibe. Usually in under 5 seconds."],
                ["3️⃣", "Chat, hop, repeat", "Loved it? Keep talking. Didn't click? Press Esc and meet someone new."],
              ].map(([icon, title, desc]) => (
                <div key={title} className="glass rounded-3xl p-5 text-center hover:bg-white/[.12] hover:-translate-y-1 transition duration-300">
                  <div className="text-3xl">{icon}</div>
                  <h3 className="font-bold mt-2">{title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-3 sm:gap-4">
            {[
              ["🕶️", "Truly anonymous", "No account, no profile, no history. When you leave, the conversation is gone forever."],
              ["🎯", "Interest matching", "Common interests break the ice. Conversations start warmer and last longer."],
              ["🌍", "People worldwide", "Day or night, someone somewhere is awake and up for a chat."],
              ["⚡", "Zero waiting", "One click, one stranger. No downloads, no installs, works on any phone or laptop."],
              ["🛡️", "You are in control", "Stop or skip anyone instantly. Your comfort always comes first."],
              ["💸", "Free, forever", "No premium walls, no coins, no nonsense. Just people talking to people."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="glass rounded-3xl p-5 hover:bg-white/[.12] hover:-translate-y-1 transition duration-300">
                <div className="w-11 h-11 rounded-2xl grad-send grid place-items-center text-xl shadow-lg shadow-indigo-900/40">{icon}</div>
                <h3 className="font-bold mt-3">{title}</h3>
                <p className="text-sm text-slate-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ + safety */}
          <div className="max-w-3xl mx-auto px-4 pb-6 space-y-3">
            {[
              ["Is Chatly really free?", "Yes — completely. No sign-up, no payment, no hidden premium tier."],
              ["Is it anonymous?", "Fully. We never ask your name, email or photo, and chats are never saved."],
              ["What if someone is rude?", "Press Stop or Esc and you are instantly disconnected and matched with someone new."],
            ].map(([q, a]) => (
              <div key={q} className="glass rounded-3xl p-5">
                <h3 className="font-bold">{q}</h3>
                <p className="text-sm text-slate-400 mt-1">{a}</p>
              </div>
            ))}
            <div className="rounded-3xl p-5 text-sm text-amber-200 bg-amber-400/10 border border-amber-300/25">
              <b>Stay safe:</b> Never share personal details like your full name, address, phone number or social media with strangers. If someone makes you uncomfortable, press Stop and report the behaviour to a trusted adult or authority.
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="max-w-3xl mx-auto px-4 pb-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Someone out there wants to talk <span className="grad-text">right now</span></h2>
            <button onClick={scrollToCard} className="shine-wrap mt-5 px-8 py-4 rounded-2xl grad-btn text-white text-lg font-extrabold shadow-xl shadow-emerald-900/30 hover:scale-[1.03] active:scale-[.99] transition">Start Chatting →</button>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-2.5 sm:px-4 py-3 sm:py-4 relative">
          <div className="glass-strong text-slate-800 rounded-[1.75rem] shadow-2xl shadow-black/40 flex flex-col flex-1 overflow-hidden rise" style={{ minHeight: "68dvh" }}>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 grid place-items-center text-xl shrink-0">
                  {state === "connected" ? avatar : "👤"}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${state === "connected" ? "bg-emerald-500" : state === "waiting" ? "bg-amber-400" : "bg-slate-300"}`} />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-slate-700 leading-tight truncate">
                    {state === "connected" ? "Stranger" : state === "waiting" ? "Searching…" : "Not connected"}
                  </span>
                  <span className="block text-xs text-slate-400 leading-tight">
                    {state === "connected" ? "online · anonymous" : state === "waiting" ? "finding someone for you" : "press New to start"}
                  </span>
                </span>
                {state === "connected" && <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 shrink-0">⏱ {fmtTime(chatTime)}</span>}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{online} online</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-4 space-y-2 chat-bg">
              {state === "waiting" && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 px-6 text-center">
                  <span className="relative w-16 h-16 rounded-full bg-emerald-100 grid place-items-center radar">
                    <span className="text-3xl">🔍</span>
                  </span>
                  <p className="font-bold text-slate-600">Looking for a stranger…</p>
                  <p className="text-sm text-slate-400 -mt-2">Matching you with someone{interests ? ` who likes ${interests.split(",")[0].trim()}` : ""}. This usually takes a few seconds.</p>
                </div>
              )}
              {state === "disconnected" && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 px-6 text-center">
                  <span className="text-5xl">👋</span>
                  <p className="font-bold text-slate-600">That chat ended</p>
                  <p className="text-sm text-slate-400 -mt-1">Every stranger is a new story. Ready for the next one?</p>
                </div>
              )}
              {messages.map((m, i) =>
                m.sys ? (
                  <div key={i} className="text-center py-1">
                    <span className="inline-block text-xs font-medium text-slate-500 bg-white/80 border border-slate-200/70 rounded-full px-3 py-1 shadow-sm">{m.text}</span>
                  </div>
                ) : (
                  <div key={i} className={`flex msg items-end gap-1.5 ${m.from === "you" ? "justify-end" : "justify-start"}`}>
                    {m.from === "stranger" && <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 grid place-items-center text-sm shrink-0">{avatar}</span>}
                    <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 rounded-3xl text-[15px] leading-snug shadow ${m.from === "you" ? "grad-send text-white rounded-br-lg" : "bg-white border border-slate-100 text-slate-800 rounded-bl-lg"}`}>
                      {m.text}
                      {m.at && <span className={`block text-[10px] mt-1 text-right ${m.from === "you" ? "text-white/70" : "text-slate-400"}`}>{clock(m.at)}</span>}
                    </div>
                  </div>
                )
              )}
              {typing && state === "connected" && (
                <div className="flex justify-start items-end gap-1.5 msg">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 grid place-items-center text-sm shrink-0">{avatar}</span>
                  <div className="bg-white border border-slate-100 rounded-3xl rounded-bl-lg px-4 py-3 shadow text-slate-400 text-sm">
                    Stranger is typing <span className="dot">•</span><span className="dot">•</span><span className="dot">•</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick icebreakers (connected only) */}
            {state === "connected" && messages.filter((m) => !m.sys).length === 0 && (
              <div className="px-3 pt-2 bg-white flex gap-1.5 flex-wrap">
                {["Hi! 👋", "Where are you from?", "What music do you like?", "Tell me a fun fact!"].map((q) => (
                  <button key={q} onClick={() => { socketRef.current?.emit("message", q); setMessages((m) => [...m, { from: "you", text: q, at: Date.now() }]); }} className="text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-full px-3 py-1.5 transition">{q}</button>
                ))}
              </div>
            )}

            {/* Controls — same position */}
            <div className="border-t border-slate-100 p-3 bg-white">
              {state === "disconnected" ? (
                <div className="flex gap-2">
                  <button onClick={next} className="shine-wrap flex-1 py-3.5 rounded-2xl grad-btn text-white font-extrabold shadow-lg shadow-emerald-600/20">New Stranger →</button>
                  <button onClick={stop} className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">Exit</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={next}
                    disabled={state !== "connected"}
                    className="px-3 sm:px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm sm:text-base disabled:opacity-40 hover:bg-slate-700 transition"
                    title="Next stranger (Esc)"
                  >New</button>
                  <button onClick={stop} className="px-3 sm:px-4 py-3 rounded-2xl bg-red-50 text-red-600 border border-red-200 font-bold text-sm sm:text-base hover:bg-red-100 transition">Stop</button>
                  <input
                    value={input}
                    onChange={(e) => onType(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={state === "connected" ? "Type a message…" : "Waiting for a stranger…"}
                    disabled={state !== "connected"}
                    maxLength={500}
                    className="flex-1 min-w-0 border border-slate-200 bg-slate-50 rounded-2xl px-3.5 sm:px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 transition"
                  />
                  <button
                    onClick={send}
                    disabled={state !== "connected" || !input.trim()}
                    className="px-4 sm:px-5 py-3 rounded-2xl grad-send text-white font-bold text-sm sm:text-base disabled:opacity-40 shadow-lg shadow-indigo-600/20"
                  >Send</button>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2 text-center">Press <b>Esc</b> for the next stranger · Chats are anonymous and never saved</p>
            </div>
          </div>
        </main>
      )}

      <footer className="text-center text-xs text-slate-500 py-5 relative px-4">
        Chatly — random text chat · Made for meeting new people, respectfully.
      </footer>
    </div>
  );
}
