import { useState } from "react";
import "./beat-the-line-layout.css";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.75 12h14.5M13 5.75 19.25 12 13 18.25" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.5 8.5h13l1 12h-15l1-12Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5H5.75v15h12.5v-15H16" />
      <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
    </svg>
  );
}

export default function BeatTheLineLayout() {
  const [selection, setSelection] = useState<"customer" | "staff" | null>(null);

  return (
    <main className="bt-layout">
      <header className="bt-topbar">
        <div className="bt-wordmark">
          <span className="bt-mark"><span /></span>
          <span>BeatTheLine</span>
        </div>
        <span className="bt-campus">CAMPUS DINING</span>
      </header>

      <section className="bt-intro">
        <div className="bt-kicker"><span /> A better lunch break</div>
        <h1>Good food.<br /><em>No line.</em></h1>
        <p>Order ahead, then pick up your food when it’s ready.</p>
        <div className="bt-pickup-note">
          <span className="bt-clock">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7v5l3.25 2" />
            </svg>
          </span>
          <span><b>Your time, back.</b><small>Choose a pickup spot in a few taps.</small></span>
          <span className="bt-note-index">01 / 02</span>
        </div>
      </section>

      <section className="bt-choice-section" aria-labelledby="bt-choice-heading">
        <div className="bt-section-heading">
          <span className="bt-step">01</span>
          <h2 id="bt-choice-heading">First, who are you?</h2>
        </div>

        <button
          className={`bt-order-card${selection === "customer" ? " is-selected" : ""}`}
          type="button"
          onClick={() => setSelection(selection === "customer" ? null : "customer")}
          aria-pressed={selection === "customer"}
        >
          <span className="bt-card-topline"><span>FOR THE HUNGRY</span><span>01</span></span>
          <span className="bt-order-row">
            <span className="bt-bag-icon"><BagIcon /></span>
            <span className="bt-order-copy">
              <strong>I’m ordering<br />food</strong>
              <small>Browse dining options<br />and choose a pickup time.</small>
            </span>
            <span className="bt-order-arrow"><ArrowIcon /></span>
          </span>
          {selection === "customer" && <span className="bt-feedback">Great choice — let’s find your next meal.</span>}
          <span className="bt-card-orbit" aria-hidden="true" />
        </button>

        <button
          className={`bt-staff-row${selection === "staff" ? " is-selected" : ""}`}
          type="button"
          onClick={() => setSelection(selection === "staff" ? null : "staff")}
          aria-pressed={selection === "staff"}
        >
          <span className="bt-staff-icon"><ClipboardIcon /></span>
          <span className="bt-staff-copy">
            <strong>I work in dining</strong>
            <small>Sign in to view and prepare incoming orders.</small>
          </span>
          <span className="bt-staff-arrow"><ArrowIcon /></span>
        </button>
        {selection === "staff" && <p className="bt-staff-feedback">Dining team access selected. Sign in to continue.</p>}
      </section>

      <footer className="bt-footer">
        <span className="bt-footer-rule" />
        <span>Prototype staff orders are visible to any signed-in account.</span>
      </footer>
    </main>
  );
}
