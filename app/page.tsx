"use client";

import { useState } from "react";
import type { FormEvent } from "react";

function WhisperMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>;
}

function SunIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>;
}

function MoonIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"/></svg>;
}

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  function changeMode(next: "signup" | "login") {
    setMode(next);
    setSubmitted(false);
  }

  return (
    <main className="landing" data-theme={theme}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Whisper home"><WhisperMark /><span>whisper<span className="brand-period">.</span></span></a>
        <nav className="top-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#community">Community</a>
        </nav>
        <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}<span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A little less alone</div>
          <h1>A place for the things you <em>can’t say out loud.</em></h1>
          <p className="hero-description">Some thoughts are easier to share when no one knows your name. Leave it here, let it out, and find the feeling that you’re not the only one.</p>
          <div className="hero-actions">
            <a href="#join" className="primary-link">Find your quiet place <span aria-hidden="true">↗</span></a>
            <span className="no-pressure"><span className="lock-icon">⌑</span> No profiles. No pressure.</span>
          </div>

          <div className="feed-preview" id="community">
            <div className="feed-heading"><span><span className="live-dot" /> A few things on people’s minds</span><span className="feed-live">LIVE FEED</span></div>
            <article className="whisper-card">
              <div className="card-meta"><span className="avatar avatar-blue">a</span><span>someone, somewhere</span><span className="card-time">just now</span></div>
              <p>“I’m proud of myself for making it through a week I didn’t think I could.”</p>
              <div className="card-bottom"><span>#small victories</span><span className="heart">♡ <b>12</b></span></div>
            </article>
            <article className="whisper-card second-card">
              <div className="card-meta"><span className="avatar avatar-violet">?</span><span>someone, somewhere</span><span className="card-time">2m ago</span></div>
              <p>“Sometimes I miss who I was before I started trying to be everything for everyone.”</p>
              <div className="card-bottom"><span>#just needed to say it</span><span className="heart">♡ <b>8</b></span></div>
            </article>
            <div className="feed-footnote"><span className="tiny-sparkle">✳</span> Shared without names. Met with kindness.</div>
          </div>
        </div>

        <aside className="join-card" id="join">
          <div className="join-card-top"><div className="join-icon">w.</div><span className="private-label"><span /> PRIVATE BY DESIGN</span></div>
          <h2>{mode === "signup" ? "Start with a clean slate." : "Welcome back."}</h2>
          <p className="form-intro">{mode === "signup" ? "A softer corner of the internet is waiting." : "Your quiet corner is right where you left it."}</p>
          <div className="auth-tabs" role="tablist" aria-label="Account options">
            <button role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => changeMode("signup")}>Create account</button>
            <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button>
          </div>
          <form className="auth-form" onSubmit={handleSubmit} key={mode}>
            {mode === "signup" && <div className="name-row">
              <label>First name<input name="firstName" placeholder="e.g. Jamie" autoComplete="given-name" required /></label>
              <label>Last name<input name="lastName" placeholder="e.g. Taylor" autoComplete="family-name" required /></label>
            </div>}
            <label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
            {mode === "login" && <label>Password<input name="password" type="password" placeholder="Your password" autoComplete="current-password" required /></label>}
            {mode === "signup" && <p className="privacy-note"><span>✳</span> Your name stays private. It will never appear beside what you share.</p>}
            <button className="submit-button" type="submit">{mode === "signup" ? "Create your account" : "Sign in to Whisper"}<span aria-hidden="true">→</span></button>
            {submitted && <p className="form-feedback" role="status">You’re all set to continue. Account access will be available soon.</p>}
          </form>
          <div className="terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</div>
          <div className="secure-note"><span className="secure-shield">◇</span> Your words are yours. Your identity is always yours.</div>
        </aside>
      </section>

      <footer className="page-footer" id="how-it-works"><span>© 2025 Whisper</span><span className="footer-center"><i /> Say what you need to say.</span><div><a href="#privacy">Privacy</a><a href="#guidelines">Community guidelines</a></div></footer>
    </main>
  );
}
