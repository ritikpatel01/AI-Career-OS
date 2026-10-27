
import { Link } from "react-router-dom";
import "./Landing.css";

const features = [
  {
    number: "01",
    path: "/profile",
    icon: "◈",
    title: "Your career profile",
    description:
      "Bring your education, experience, skills, resume, and achievements together in one polished profile.",
    tag: "YOUR FOUNDATION",
  },
  {
    number: "02",
    path: "/projects",
    icon: "⌘",
    title: "Projects & portfolio",
    description:
      "Document what you build, highlight your technologies, and showcase your best work.",
    tag: "SHOW YOUR WORK",
  },
  {
    number: "03",
    path: "/dsa",
    icon: "↗",
    title: "Skills & DSA",
    description:
      "Organize your learning, practice coding problems, and track your development.",
    tag: "KEEP LEARNING",
  },
  {
    number: "04",
    path: "/interview",
    icon: "◎",
    title: "Interview preparation",
    description:
      "Prepare for technical and behavioral interviews with a clear practice plan.",
    tag: "BE PREPARED",
  },
  {
    number: "05",
    path: "/roadmap",
    icon: "⌁",
    title: "Personal roadmaps",
    description:
      "Turn long-term career goals into smaller, actionable milestones.",
    tag: "FIND YOUR DIRECTION",
  },
  {
    number: "06",
    path: "/progress",
    icon: "✳",
    title: "Career progress",
    description:
      "Keep your learning, projects, and career activities connected in one place.",
    tag: "SEE YOUR PROGRESS",
  },
];

const steps = [
  {
    number: "01",
    title: "Build your foundation",
    description:
      "Bring your profile, skills, education, and projects into one organized workspace.",
  },
  {
    number: "02",
    title: "Turn goals into action",
    description:
      "Choose your priorities, practice consistently, and work toward meaningful milestones.",
  },
  {
    number: "03",
    title: "Keep moving forward",
    description:
      "Review your progress, identify your next step, and keep improving.",
  },
];

function DashboardPreview() {
  return (
    <div className="ac-visual">
      <div className="ac-visual-glow ac-visual-glow-one" />
      <div className="ac-visual-glow ac-visual-glow-two" />

      <div className="ac-float-card ac-float-card-top">
        <span className="ac-float-icon">✦</span>
        <span>
          <strong>Your next chapter</strong>
          <small>Built one step at a time</small>
        </span>
      </div>

      <div
        className="ac-dashboard"
        aria-label="Illustrative AI Career OS dashboard preview"
      >
        <div className="ac-window-bar">
          <div className="ac-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          <span className="ac-window-title">AI CAREER OS</span>
          <span className="ac-window-menu">•••</span>
        </div>

        <div className="ac-dashboard-body">
          <div className="ac-sidebar">
            <div className="ac-sidebar-brand">
              <span className="ac-mini-logo">A</span>
              <span>
                <strong>Career OS</strong>
                <small>YOUR WORKSPACE</small>
              </span>
            </div>

            <span className="ac-sidebar-label">WORKSPACE</span>

            <div className="ac-side-link ac-side-link-active">
              <span>▦</span> Overview
            </div>
            <div className="ac-side-link">
              <span>◈</span> Profile
            </div>
            <div className="ac-side-link">
              <span>⌘</span> Projects
            </div>
            <div className="ac-side-link">
              <span>↗</span> Skills & DSA
            </div>
            <div className="ac-side-link">
              <span>◎</span> Interviews
            </div>
            <div className="ac-side-link">
              <span>⌁</span> Roadmap
            </div>

            <div className="ac-sidebar-user">
              <span className="ac-user-avatar">Y</span>
              <span>
                <strong>Your workspace</strong>
                <small>Career development</small>
              </span>
            </div>
          </div>

          <div className="ac-dashboard-main">
            <div className="ac-dashboard-topline">
              <span>
                Workspace <b>/</b> Overview
              </span>
              <span className="ac-preview-pill">
                <i /> Preview
              </span>
            </div>

            <div className="ac-dashboard-content">
              <div className="ac-dashboard-heading">
                <div>
                  <span className="ac-overline">
                    YOUR CAREER AT A GLANCE
                  </span>
                  <h2>Build your future.</h2>
                  <p>Your goals. Your skills. Your next move.</p>
                </div>

                <div className="ac-heading-spark">✦</div>
              </div>

              <div className="ac-stat-grid">
                <article className="ac-stat-card">
                  <span className="ac-stat-icon ac-purple">◈</span>
                  <small>Career profile</small>
                  <strong>Build</strong>
                  <span>Set your foundation</span>
                </article>

                <article className="ac-stat-card">
                  <span className="ac-stat-icon ac-blue">⌘</span>
                  <small>Projects</small>
                  <strong>Create</strong>
                  <span>Show what you know</span>
                </article>

                <article className="ac-stat-card">
                  <span className="ac-stat-icon ac-pink">↗</span>
                  <small>Skills & DSA</small>
                  <strong>Grow</strong>
                  <span>Practice with purpose</span>
                </article>
              </div>

              <div className="ac-roadmap-card">
                <div className="ac-roadmap-head">
                  <div>
                    <strong>Your career roadmap</strong>
                    <p>Turn your ambitions into action.</p>
                  </div>
                  <span className="ac-plan-label">YOUR PLAN</span>
                </div>

                <div className="ac-roadmap-track">
                  <span />
                </div>

                <div className="ac-roadmap-labels">
                  <span>Learn</span>
                  <span>Practice</span>
                  <span>Build</span>
                  <span>Reflect</span>
                </div>
              </div>

              <div className="ac-next-step">
                <span className="ac-next-step-icon">✦</span>
                <span className="ac-next-step-copy">
                  <strong>Your next step starts here</strong>
                  <small>
                    Choose a goal and make progress today.
                  </small>
                </span>
                <span className="ac-next-arrow">↗</span>
              </div>

              <div className="ac-mini-activity">
                <div className="ac-mini-activity-heading">
                  <strong>Your workspace</strong>
                  <span>QUICK OVERVIEW</span>
                </div>

                <div className="ac-mini-activity-row">
                  <span className="ac-mini-activity-icon">⌘</span>
                  <span>
                    <strong>Portfolio projects</strong>
                    <small>Build and showcase your work</small>
                  </span>
                  <span className="ac-mini-tag">BUILD</span>
                </div>

                <div className="ac-mini-activity-row">
                  <span className="ac-mini-activity-icon">◎</span>
                  <span>
                    <strong>Interview preparation</strong>
                    <small>Prepare for your next opportunity</small>
                  </span>
                  <span className="ac-mini-tag">PRACTICE</span>
                </div>
              </div>
            </div>

            <p className="ac-preview-disclaimer">
              Illustrative interface · Not live account data
            </p>
          </div>
        </div>
      </div>

      <div className="ac-float-card ac-float-card-bottom">
        <span className="ac-bottom-check">✓</span>
        <span>
          <strong>Progress with purpose</strong>
          <small>One goal at a time</small>
        </span>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="ac-page">
      <header className="ac-header">
        <nav className="ac-nav" aria-label="Main navigation">
          <Link
            to="/"
            className="ac-brand"
            aria-label="AI Career OS home"
          >
            <span className="ac-logo">A</span>
            <span className="ac-brand-copy">
              <strong>AI Career OS</strong>
              <small>Your career, connected.</small>
            </span>
          </Link>

          <div className="ac-nav-links">
            <a href="#platform">Platform</a>
            <a href="#how-it-works">How it works</a>
          </div>

          <div className="ac-nav-actions">
            <Link to="/login" className="ac-signin">
              Sign in
            </Link>
            <Link to="/register" className="ac-nav-cta">
              Get started <span>↗</span>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="ac-hero">
          <div className="ac-hero-grid" aria-hidden="true" />

          <div className="ac-hero-copy">
            <div className="ac-kicker">
              <span className="ac-kicker-dot" />
              YOUR CAREER. ONE CONNECTED WORKSPACE
            </div>

            <h1>
              Build your future.
              <br />
              <span>One move at a time.</span>
            </h1>

            <p className="ac-hero-description">
              A clear path from learning to your next opportunity.
              Organize your skills, build your portfolio, and prepare for
              interviews in one connected workspace.
            </p>

            <div className="ac-hero-actions">
              <Link to="/register" className="ac-primary-button">
                Get Started Free <span>↗</span>
              </Link>

              <a href="#platform" className="ac-secondary-button">
                Explore the Platform <span>→</span>
              </a>
            </div>

            <div className="ac-value-line">
              <span className="ac-value-check">✓</span>
              <span>
                One organized space for the career you're building
              </span>
            </div>

            <div className="ac-hero-proof">
              <div className="ac-proof-divider" />
              <span>
                <strong>01</strong> Organize
              </span>
              <span>
                <strong>02</strong> Build
              </span>
              <span>
                <strong>03</strong> Progress
              </span>
            </div>
          </div>

          <DashboardPreview />

          <div className="ac-hero-bottom">
            <span>ONE CONNECTED CAREER WORKSPACE</span>
            <div>
              <span>Profile</span>
              <i />
              <span>Learn</span>
              <i />
              <span>Build</span>
              <i />
              <span>Progress</span>
            </div>
          </div>
        </section>

        <section className="ac-platform" id="platform">
          <div className="ac-section-shell">
            <div className="ac-section-heading">
              <span className="ac-section-kicker">
                ONE WORKSPACE. A CLEARER DIRECTION.
              </span>

              <h2>
                Everything you're building,
                <br />
                <span>working together.</span>
              </h2>

              <p>
                A career is made up of many moving parts. Give your learning,
                projects, and preparation a home that makes sense.
              </p>
            </div>

            <div className="ac-feature-grid">
              {features.map((feature) => (
                <article className="ac-feature-card" key={feature.number}>
                  <div className="ac-feature-top">
                    <span className="ac-feature-icon">{feature.icon}</span>
                    <span className="ac-feature-number">
                      {feature.number}
                    </span>
                  </div>

                  <span className="ac-feature-tag">{feature.tag}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>

                  <Link className="ac-feature-open" to={feature.path} aria-label={`Explore ${feature.title}`}>
                    Explore <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ac-how" id="how-it-works">
          <div className="ac-section-shell">
            <div className="ac-how-heading">
              <div>
                <span className="ac-section-kicker">
                  A SIMPLE WAY FORWARD
                </span>
                <h2>
                  Make progress
                  <br />
                  <span>feel achievable.</span>
                </h2>
              </div>

              <p>
                You don't need to solve everything at once. Start where you
                are, take the next step, and keep building momentum.
              </p>
            </div>

            <div className="ac-steps">
              {steps.map((step) => (
                <article className="ac-step" key={step.number}>
                  <span className="ac-step-number">{step.number}</span>
                  <div className="ac-step-rule" />
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ac-cta-section">
          <div className="ac-cta-card">
            <div className="ac-cta-orb ac-cta-orb-one" />
            <div className="ac-cta-orb ac-cta-orb-two" />

            <div className="ac-cta-copy">
              <span className="ac-section-kicker">
                START WITH ONE STEP
              </span>

              <h2>
                Your future isn't built
                <br />
                <span>all at once.</span>
              </h2>

              <p>
                Give your goals a home. Then start moving toward them.
              </p>
            </div>

            <Link to="/register" className="ac-primary-button">
              Build your workspace <span>↗</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="ac-footer">
        <div className="ac-footer-main">
          <Link to="/" className="ac-brand ac-footer-brand">
            <span className="ac-logo">A</span>
            <span className="ac-brand-copy">
              <strong>AI Career OS</strong>
              <small>Your career, connected.</small>
            </span>
          </Link>

          <p>
            A more organized way to build the future you're working toward.
          </p>

          <div className="ac-footer-links">
            <a href="#platform">Platform</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
          </div>
        </div>

        <div className="ac-footer-bottom">
          <span>© {new Date().getFullYear()} AI Career OS</span>
          <span>Built for your next chapter.</span>
        </div>
      </footer>
    </div>
  );
}
