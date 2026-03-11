import "./styles/LoadingPage.css";

export default function LoadingPage({ message = "Connecting to server..." }) {
  return (
    <div className="lp-page">
      <div className="lp-glow" />

      <div className="lp-center">

        {/* DNA */}
        <svg className="lp-dna" viewBox="0 0 42 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 4 C9 4 33 11 33 26 C33 41 9 48 9 48" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M33 4 C33 4 9 11 9 26 C9 41 33 48 33 48" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <line x1="12" y1="14" x2="30" y2="18" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" opacity="0.7"/>
          <line x1="10.5" y1="26" x2="31.5" y2="26" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
          <line x1="12" y1="36" x2="30" y2="40" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" opacity="0.7"/>
          <circle cx="9"  cy="4"  r="2.5" fill="#4ade80"/>
          <circle cx="33" cy="4"  r="2.5" fill="#22c55e"/>
          <circle cx="9"  cy="48" r="2.5" fill="#4ade80"/>
          <circle cx="33" cy="48" r="2.5" fill="#22c55e"/>
        </svg>

        {/* Brand */}
        <div className="lp-brand">
          <span className="lp-brand-name">Code sync</span>
          <span className="lp-brand-tag">Realtime collaboration</span>
        </div>

        {/* Spinner + message */}
        <div className="lp-status">
          <div className="lp-spinner" />
          <span className="lp-message">{message}</span>
        </div>

        {/* Progress bar */}
        <div className="lp-track">
          <div className="lp-fill" />
        </div>

      </div>
    </div>
  );
}