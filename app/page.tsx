"use client";

import { FormEvent, useEffect, useState } from "react";

const features = [
  { number: "01", title: "The day, decoded", copy: "One thoughtful briefing on what changed in AI—and why it actually matters." },
  { number: "02", title: "Tools worth trying", copy: "Practical, beginner-friendly ways to use AI at work without chasing every trend." },
  { number: "03", title: "No jargon, ever", copy: "Clear explanations you can understand, remember, and share with your team." },
];

const topics = ["AI in the U.S.", "AI around the world", "Tools worth trying", "Every original source"];

type BriefingArticle = {
  id?: number;
  region: "us" | "world";
  headline: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: "email" | "web";
  publishedAt?: string | null;
};

const starterBriefing: BriefingArticle[] = [
  {
    region: "us",
    headline: "California challenges OpenAI over agent safety",
    summary: "A new state lawsuit is putting AI agent testing, disclosure, and accountability under a brighter spotlight.",
    sourceName: "The Rundown AI · source email",
    sourceUrl: "https://oag.ca.gov/system/files/attachments/press-docs/complaint-oai-cyber.pdf",
    sourceType: "email",
  },
  {
    region: "us",
    headline: "U.S. tightens rules around remote access to advanced AI chips",
    summary: "New controls focus on overseas data centers that provide high-end American computing power to customers abroad.",
    sourceName: "U.S. Bureau of Industry and Security",
    sourceUrl: "https://media.bis.gov/sites/default/files/documents/BIS%20Issues%20Rule%20Addressing%20Remote%20Access%20to%20American%20Super%20Intelligence%20Technology.pdf",
    sourceType: "web",
  },
  {
    region: "world",
    headline: "APEC puts responsible AI deployment at the center of regional talks",
    summary: "Asia-Pacific officials are focusing on practical cooperation and common expectations for safe AI use.",
    sourceName: "Reuters",
    sourceUrl: "https://www.reuters.com/technology/apec-focuses-safe-responsible-ai-use-chinas-ex-un-envoy-says-2026-11-17/",
    sourceType: "web",
  },
  {
    region: "world",
    headline: "Europe renews its push for AI competitiveness and sovereignty",
    summary: "European leaders are weighing how investment, infrastructure, and policy can strengthen the region’s place in the AI economy.",
    sourceName: "European Council",
    sourceUrl: "https://www.consilium.europa.eu/en/meetings/european-council/2026/11/13/",
    sourceType: "web",
  },
];

function SignupForm({ dark = false }: { dark?: boolean }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return <div className={`success-message ${dark ? "success-message-dark" : ""}`} role="status"><span aria-hidden="true">✓</span>You’re on the list. See you tomorrow!</div>;
  }

  return (
    <form className={`signup-form ${dark ? "signup-form-dark" : ""}`} onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={dark ? "footer-email" : "hero-email"}>Your email address</label>
      <input id={dark ? "footer-email" : "hero-email"} type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
      <button type="submit">Join free <span aria-hidden="true">↗</span></button>
    </form>
  );
}

export default function Home() {
  const [briefing, setBriefing] = useState(starterBriefing);
  const [issueDate, setIssueDate] = useState("Latest edition");

  useEffect(() => {
    let active = true;
    fetch("/api/briefing", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active || !data?.articles?.length) return;
        setBriefing(data.articles);
        if (data.issueDate) {
          setIssueDate(new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(`${data.issueDate}T12:00:00-05:00`)));
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const usStories = briefing.filter((story) => story.region === "us");
  const worldStories = briefing.filter((story) => story.region === "world");

  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Plainly AI home"><span className="brand-mark" aria-hidden="true">P</span><span>Plainly AI</span></a>
        <div className="nav-links"><a href="#daily">Today’s briefing</a><a href="#inside">What’s inside</a><a href="#about">Our promise</a></div>
        <a className="nav-cta" href="#subscribe">Subscribe</a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> AI news for curious humans</div>
          <h1>Feel smarter about AI.<br /><em>Not overwhelmed.</em></h1>
          <p className="hero-subhead">A five-minute daily newsletter that turns trusted AI reporting into a clear U.S. and World briefing.</p>
          <SignupForm />
          <p className="form-note">Fresh every morning · No spam · Unsubscribe anytime</p>
          <div className="editor-note"><span aria-hidden="true">P</span><div><strong>Independent newsletter</strong><br />Curated and written by Plainly AI</div></div>
        </div>

        <div className="hero-visual" aria-label="Preview of the Plainly AI newsletter">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <article className="newsletter-card">
            <header className="newsletter-header"><div className="mini-brand"><span>P</span> Plainly AI</div><span className="issue-tag">Issue 042</span></header>
            <div className="newsletter-content">
              <p className="newsletter-date">Today, 8:02 AM</p>
              <h2>Today in AI, at home and around the world.</h2>
              <p>Good morning! Here’s everything worth knowing, minus the noise.</p>
              <div className="story-block">
                <span className="story-number">01</span>
                <div><p className="story-label">THE BIG STORY · 2 MIN READ</p><h3>The AI assistant in your browser just grew up</h3><p>What changed, what it means for your work, and one thing to try today...</p></div>
              </div>
              <div className="tool-row"><span className="tool-icon" aria-hidden="true">✦</span><div><small>TOOL OF THE WEEK</small><strong>Turn a messy meeting into a clear plan</strong></div><span aria-hidden="true">→</span></div>
            </div>
          </article>
          <div className="float-note note-one"><span>Daily</span> U.S. + World</div>
          <div className="float-note note-two"><span>100%</span> human edited</div>
        </div>
      </section>

      <section className="daily-briefing" id="daily">
        <div className="shell">
          <div className="daily-heading">
            <div><p className="kicker">THE DAILY BRIEFING</p><h2>Two lenses.<br /><em>One clear picture.</em></h2></div>
            <div className="daily-meta"><span>Updated {issueDate}</span><p>Plainly AI is independently written and edited. The Rundown AI, original documents, and reputable web reporting are source material—and every story keeps its source attached.</p></div>
          </div>
          <div className="region-grid">
            {[
              { id: "us", label: "AI in the U.S.", marker: "US", stories: usStories },
              { id: "world", label: "AI Around the World", marker: "WORLD", stories: worldStories },
            ].map((region) => (
              <div className={`region-column region-${region.id}`} key={region.id}>
                <header><span className="region-marker">{region.marker}</span><h3>{region.label}</h3><span>{region.stories.length} stories</span></header>
                <div className="story-list">
                  {region.stories.map((story, index) => (
                    <article className="daily-story" key={`${story.sourceUrl}-${index}`}>
                      <div className="daily-story-number">0{index + 1}</div>
                      <div>
                        <div className="source-line"><span className={`source-type source-${story.sourceType}`}>{story.sourceType === "email" ? "INBOX" : "WEB"}</span><span>{story.sourceName}</span></div>
                        <h4>{story.headline}</h4>
                        <p>{story.summary}</p>
                        <a href={story.sourceUrl} target="_blank" rel="noreferrer">Read the source <span aria-hidden="true">↗</span></a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="source-standard"><span aria-hidden="true">✓</span><p><strong>Our source standard:</strong> Plainly AI selects and explains the news. Newsletter emails help us spot stories; original documents and reputable reporting help us verify them. No unattributed summaries.</p></div>
        </div>
      </section>

      <section className="features shell" id="inside">
        <div className="section-heading">
          <div><p className="kicker">WHY PLAINLY AI</p><h2>All signal.<br />No <em>silicon valley.</em></h2></div>
          <p>We do the scrolling, testing, and translating so you can stay informed without making AI your full-time job.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => <article className="feature-card" key={feature.number}><div className="feature-top"><span>{feature.number}</span><span aria-hidden="true">↗</span></div><div className={`feature-art art-${feature.number}`} aria-hidden="true"><span /><span /><span /></div><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}
        </div>
      </section>

      <section className="inside" id="about">
        <div className="shell inside-grid">
          <div className="inside-copy">
            <p className="kicker kicker-light">ONE DAILY EMAIL. ZERO HOMEWORK.</p>
            <h2>Know what matters<br />before your second coffee.</h2>
            <p>Every issue follows the same simple rhythm. Open it, get oriented, try something useful, and get on with your day.</p>
            <ul>{topics.map((topic, index) => <li key={topic}><span>0{index + 1}</span>{topic}<span aria-hidden="true">→</span></li>)}</ul>
          </div>
          <aside className="editorial-card">
            <div className="quote-mark">P</div>
            <p>We read widely, verify carefully, and write every edition in Plainly AI’s own voice—so the result is useful, original, and yours.</p>
            <footer><div className="quote-avatar">PA</div><div><strong>The Plainly AI promise</strong><br /><span>Independent newsletter · sources always linked</span></div></footer>
          </aside>
        </div>
      </section>

      <section className="final-cta" id="subscribe">
        <div className="shell cta-inner"><p className="kicker">START TOMORROW MORNING</p><h2>AI is moving fast.<br /><em>You don’t have to.</em></h2><p>Get the calm, clear daily guide to what’s next.</p><SignupForm dark /><span className="cta-note">Free forever. Independently written for humans.</span></div>
      </section>

      <footer className="footer shell"><div className="brand"><span className="brand-mark">P</span><span>Plainly AI</span></div><p>© 2026 Plainly AI. Less hype, more helpful.</p><div><a href="#top">Privacy</a><a href="#top">Archive</a><a href="#top">Back to top ↑</a></div></footer>
    </main>
  );
}
