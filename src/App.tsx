import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import MatchingPage from "./features/matching/MatchingPage";
import { useAppStore } from "./store/appStore";

const navigation = [
  { to: "/", label: "Overview", icon: "◫", end: true },
  { to: "/journeys", label: "Journeys", icon: "↗" },
  { to: "/matches", label: "Find a ride", icon: "⌕" },
  { to: "/groups", label: "Ride groups", icon: "◎" },
  { to: "/profile", label: "Profile", icon: "◉" },
];

function App() {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const location = useLocation();
  const currentLabel =
    navigation.find((item) => item.to === location.pathname)?.label ?? "Overview";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="RideTogether home">
          <span className="brand-mark" aria-hidden="true">r</span>
          <span>ride<span className="brand-accent">together</span></span>
        </Link>

        <p className="nav-caption">YOUR SPACE</p>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.to === "/matches" && <span className="nav-new">NEW</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="safety-card">
            <span className="safety-icon" aria-hidden="true">✳</span>
            <strong>Ride with intention</strong>
            <p>Share only what you choose, for only as long as you choose.</p>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} type="button">
            <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
            Switch to {theme === "light" ? "dark" : "light"} theme
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{currentLabel}</strong></div>
          <div className="topbar-actions">
            <span className="semester-pill"><span className="status-dot" /> Student community</span>
            <button
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              className="icon-button mobile-theme-toggle"
              onClick={toggleTheme}
              type="button"
            >
              <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
            </button>
            <button className="avatar-button" type="button" aria-label="Open profile">A</button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/matches" element={<MatchingPage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Routes>
      </main>

      <nav className="mobile-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `mobile-nav-link${isActive ? " active" : ""}`}
            aria-label={item.label}
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label === "Find a ride" ? "Find" : item.label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

// Stage 1 is a static preview; ride controls and the future workflows are intentionally not wired yet.
function OverviewPage() {
  return (
    <div className="page-wrap">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">SAMPLE ROUTE <span className="eyebrow-dot">·</span> PATIALA</p>
          <h1>Good morning, Aanya <span aria-hidden="true">✳</span></h1>
          <p className="page-subtitle">A better ride starts with a route in common.</p>
        </div>
        <Link className="primary-button" to="/matches">
          <span aria-hidden="true">⌕</span> Find a ride
        </Link>
      </section>

      <section className="intro-banner" aria-labelledby="intro-title">
        <div className="intro-copy">
          <span className="banner-label"><span className="banner-sparkle">✳</span> THE RIDE TOGETHER WAY</span>
          <h2 id="intro-title">Your destination doesn&apos;t<br className="desktop-break" /> have to be the same.</h2>
          <p>RideTogether is designed to pair students by shared roads and compatible timing, not identical destinations.</p>
          <span className="text-link">Route-first matching <span aria-hidden="true">↗</span></span>
        </div>
        <div className="route-sketch" role="img" aria-label="Illustration of three student routes sharing part of the same road">
          <span className="route-city city-origin">PATIALA</span>
          <svg viewBox="0 0 360 180" aria-hidden="true">
            <path className="route-line route-main" d="M25 92 C82 92 88 47 148 63 S235 105 332 38" />
            <path className="route-line route-alt-one" d="M25 92 C82 92 88 47 148 63 S235 105 332 112" />
            <path className="route-line route-alt-two" d="M25 92 C82 92 88 47 148 63 S235 105 292 160" />
            <circle className="route-start" cx="25" cy="92" r="7" />
            <circle className="route-stop stop-one" cx="332" cy="38" r="6" />
            <circle className="route-stop stop-two" cx="332" cy="112" r="6" />
            <circle className="route-stop stop-three" cx="292" cy="160" r="6" />
            <circle className="route-share" cx="148" cy="63" r="12" />
            <text x="148" y="67" textAnchor="middle">✳</text>
          </svg>
          <div className="route-city city-destinations">
            <span>CHANDIGARH</span><span>AIRPORT</span><span>MOHALI</span>
          </div>
          <span className="route-note"><span className="route-note-dot" /> shared stretch</span>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <p className="eyebrow">A THOUGHTFUL WAY TO TRAVEL</p>
          <h2>Start with the essentials</h2>
        </div>
        <span className="preview-label">YOUR PREVIEW</span>
      </div>

      <section className="feature-grid" aria-label="RideTogether features">
        <article className="feature-card">
          <div className="feature-icon icon-route" aria-hidden="true">⌁</div>
          <span className="feature-kicker">01 <span>·</span> FIND YOUR PEOPLE</span>
          <h3>Same road, different plans</h3>
          <p>See rides that overlap your route, even when your final stops are different.</p>
          <span className="feature-arrow" aria-hidden="true">↗</span>
        </article>
        <article className="feature-card">
          <div className="feature-icon icon-trust" aria-hidden="true">✳</div>
          <span className="feature-kicker">02 <span>·</span> MAKE AN INFORMED CHOICE</span>
          <h3>Know who&apos;s joining</h3>
          <p>Verification cues help you decide. A college email alone never guarantees safety.</p>
          <span className="feature-arrow" aria-hidden="true">↗</span>
        </article>
        <article className="feature-card">
          <div className="feature-icon icon-control" aria-hidden="true">◷</div>
          <span className="feature-kicker">03 <span>·</span> STAY IN CONTROL</span>
          <h3>Your location, your call</h3>
          <p>Location sharing is opt-in, limited to a ride, and always has a visible expiry.</p>
          <span className="feature-arrow" aria-hidden="true">↗</span>
        </article>
      </section>

      <footer className="page-footer">
        <span>Designed for shared journeys, built around student choice.</span>
        <span className="demo-notice"><span aria-hidden="true">ⓘ</span> Prototype preview — no rides are live</span>
      </footer>
    </div>
  );
}

function ComingSoonPage() {
  return (
    <div className="coming-soon">
      <span className="feature-icon icon-route" aria-hidden="true">⌁</span>
      <p className="eyebrow">COMING IN A LATER STAGE</p>
      <h1>This part of the journey is still taking shape.</h1>
      <p>Ride posting, matching, and trip tools will be added in upcoming prototype stages.</p>
      <NavLink className="text-link" to="/">Back to overview <span aria-hidden="true">↗</span></NavLink>
    </div>
  );
}

export default App;
