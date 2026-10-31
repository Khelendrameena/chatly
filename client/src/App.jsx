import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./index.css";

const SERVER = import.meta.env.VITE_API_URL || "http://localhost:3001";

function fmtTime(s) {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

export default function App() {
  const [screen, setScreen] = useState("home"); // home | chat
  const [state, setState] = useState("idle"); // idle | waiting | connected | disconnected
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [interests, setInterests] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(0);
  const [chatTime, setChatTime] = useState(0);
  const [ageOk, setAgeOk] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTO = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const s = io(SERVER);
    socketRef.current = s;
    s.on("online", ({ count }) => setOnline(count));
    s.on("status", ({ state }) => {
      setState(state);
      if (state === "connected") {
        setChatTime(0);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setChatTime((t) => t + 1), 1000);
        setMessages((m) => [...m, { sys: true, text: "You're now chatting with a random stranger. Say hi!" }]);
      }
      if (state === "disconnected" || state === "idle") {
        clearInterval(timerRef.current);
        setTyping(false);
      }
    });
    s.on("message", ({ text }) => setMessages((m) => [...m, { from: "stranger", text }]));
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
    setMessages((m) => [...m, { from: "you", text }]);
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white grid place-items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </span>
            <span className="text-xl font-extrabold text-slate-800">Chat<span className="text-blue-600">ly</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {online} online now
          </div>
        </div>
      </header>

      {screen === "home" ? (
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">Random Text Chat with Strangers</h1>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Meet new people from around the world in one click. No sign-up, no profile — just pick your interests and start a conversation.</p>
          </div>

          {/* Mode tabs */}
          <div className="max-w-xl mx-auto px-4">
            <div className="flex gap-2 justify-center mb-4">
              <button className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold shadow">💬 Text Chat</button>
              <button disabled className="px-5 py-2 rounded-full bg-white text-slate-400 font-semibold border border-slate-200 cursor-not-allowed" title="Text chat only">📹 Video <span className="text-[10px] align-top bg-slate-100 rounded px-1">SOON</span></button>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:p-6 text-left">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Your interests <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. music, cricket, coding, anime"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">We try to match you with someone who shares an interest.</p>

              <label className="flex items-start gap-2 mt-4 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} className="mt-0.5 accent-blue-600" />
                I confirm that I am 18 years or older and agree to be respectful to strangers.
              </label>

              <button
                onClick={start}
                disabled={!ageOk}
                className={`w-full mt-5 py-3.5 rounded-xl text-white text-lg font-bold transition ${ageOk ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200" : "bg-slate-300 cursor-not-allowed"}`}
              >
                Start Chatting →
              </button>
              <p className="text-center text-xs text-slate-400 mt-3">🔒 Anonymous — no name, no photo, nothing is stored.</p>
            </div>
          </div>

          {/* Features */}
          <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-4">
            {[
              ["🕶️", "Fully Anonymous", "Chat without revealing anything about yourself. No account, no history, no trace when you leave."],
              ["🎯", "Interest Matching", "Add topics you like and get paired with people who like the same things. Conversations start easier."],
              ["⚡", "Instant & Free", "One click and you are talking to a real person. Press Esc anytime to meet the next stranger."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="text-2xl">{icon}</div>
                <h3 className="font-bold text-slate-800 mt-2">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto px-4 pb-12">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
              <b>Stay safe:</b> Never share personal details like your full name, address, phone number or social media with strangers. If someone makes you uncomfortable, press Stop and report the behaviour to a trusted adult or authority.
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-4">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col flex-1 overflow-hidden" style={{ minHeight: "70vh" }}>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${state === "connected" ? "bg-green-500" : state === "waiting" ? "bg-amber-400 animate-pulse" : "bg-slate-300"}`} />
                <span className="font-semibold text-slate-700">
                  {state === "connected" ? "Stranger" : state === "waiting" ? "Searching…" : "Not connected"}
                </span>
                {state === "connected" && <span className="text-xs text-slate-400">⏱ {fmtTime(chatTime)}</span>}
              </div>
              <span className="text-xs text-slate-400">{online} online</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50">
              {state === "waiting" && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                  <span className="relative w-14 h-14 rounded-full bg-green-100 grid place-items-center radar">
                    <span className="text-2xl">🔍</span>
                  </span>
                  <p className="font-medium">Looking for a stranger…</p>
                </div>
              )}
              {messages.map((m, i) =>
                m.sys ? (
                  <div key={i} className="text-center text-xs text-slate-400 py-1">{m.text}</div>
                ) : (
                  <div key={i} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] leading-snug shadow-sm ${m.from === "you" ? "bg-blue-600 text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"}`}>
                      {m.text}
                    </div>
                  </div>
                )
              )}
              {typing && state === "connected" && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm text-slate-400 text-sm">
                    Stranger is typing <span className="dot">•</span><span className="dot">•</span><span className="dot">•</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Controls */}
            <div className="border-t border-slate-100 p-3">
              {state === "disconnected" ? (
                <div className="flex gap-2">
                  <button onClick={next} className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold">New Stranger →</button>
                  <button onClick={stop} className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">Exit</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={next}
                    disabled={state !== "connected"}
                    className="px-4 py-3 rounded-xl bg-slate-800 text-white font-bold disabled:opacity-40"
                    title="Next stranger (Esc)"
                  >New</button>
                  <button onClick={stop} className="px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold">Stop</button>
                  <input
                    value={input}
                    onChange={(e) => onType(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={state === "connected" ? "Type a message…" : "Waiting for a stranger…"}
                    disabled={state !== "connected"}
                    maxLength={500}
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  />
                  <button
                    onClick={send}
                    disabled={state !== "connected" || !input.trim()}
                    className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-40"
                  >Send</button>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2 text-center">Press <b>Esc</b> for the next stranger · Chats are anonymous and never saved</p>
            </div>
          </div>
        </main>
      )}

      <footer className="text-center text-xs text-slate-400 py-5">
        Chatly — random text chat · Made for meeting new people, respectfully.
      </footer>
    </div>
  );
}
