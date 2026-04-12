export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.05em' }}>aligned</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#how" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>How it works</a>
            <a href="#privacy" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy</a>
            <a href="/connect" style={{ fontSize: 14, backgroundColor: '#c8f97a', color: '#0a0a0a', fontWeight: 600, padding: '8px 20px', borderRadius: 999, textDecoration: 'none' }}>Get started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '160px 48px 120px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '6px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#c8f97a', display: 'inline-block' }}></span>
            No account required
          </div>
          <h1 style={{ fontSize: 64, fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Find the time.<br />
            <span style={{ color: '#c8f97a' }}>Stay accountable.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>
            Share your availability privately. See where your schedules overlap.
            Book sessions together without the back and forth.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="/connect" style={{ backgroundColor: '#c8f97a', color: '#0a0a0a', fontWeight: 600, padding: '16px 32px', borderRadius: 999, fontSize: 16, textDecoration: 'none' }}>
              Share my availability
            </a>
            <a href="#how" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>See how it works →</a>
          </div>
        </div>

        {/* Preview card */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>When you are both free</span>
            <span style={{ fontSize: 12, backgroundColor: 'rgba(200,249,122,0.1)', color: '#c8f97a', border: '1px solid rgba(200,249,122,0.2)', borderRadius: 999, padding: '4px 12px' }}>14 slots found</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.25)', paddingBottom: 6 }}>{d}</div>
            ))}
            {Array.from({ length: 28 }, (_, i) => {
              const bright = [2,9,10,16,23].includes(i);
              const green = [1,3,8,15,22].includes(i);
              const blue = [4,11,17,24].includes(i);
              return (
                <div key={i} style={{
                  height: 28, borderRadius: 6,
                  backgroundColor: bright ? '#c8f97a' : green ? '#2d6e0f' : blue ? '#0a1a3a' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${bright ? '#c8f97a' : green ? 'rgba(74,158,26,0.5)' : blue ? 'rgba(16,45,90,0.5)' : 'rgba(255,255,255,0.05)'}`,
                }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#c8f97a', display: 'inline-block' }}></span>Both free</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#2d6e0f', display: 'inline-block' }}></span>You free</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#0a1a3a', border: '1px solid #102d5a', display: 'inline-block' }}></span>Them free</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>How it works</p>
          <h2 style={{ fontSize: 40, fontWeight: 300, letterSpacing: '-0.02em', marginBottom: 64 }}>Four steps, zero friction.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {[
              { num: '01', title: 'Connect your calendar', body: 'Link Google Calendar with one tap. We read your events to find free windows.' },
              { num: '02', title: 'Share a link', body: 'Your availability is encoded into a link. Event details stay on your device.' },
              { num: '03', title: 'See the overlap', body: 'Your friend opens the link and both schedules are compared locally.' },
              { num: '04', title: 'Book the session', body: 'Pick a mutual free window and it gets added to both Google Calendars.' },
            ].map((step) => (
              <div key={step.num} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
                <span style={{ fontSize: 11, color: '#c8f97a', fontWeight: 600, letterSpacing: '0.15em', display: 'block', marginBottom: 16 }}>{step.num}</span>
                <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 96, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Privacy first</p>
            <h2 style={{ fontSize: 40, fontWeight: 300, letterSpacing: '-0.02em', marginBottom: 24 }}>Your calendar details never leave your device.</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 32 }}>
              Aligned strips every event down to just a start and end time before anything is shared. No titles, no descriptions, no attendees.
            </p>
            {['No account or sign-up required', 'Event details stay on your device', 'Nothing stored on our servers', 'Availability links are snapshots only'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
                <span style={{ color: '#c8f97a', fontSize: 16 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24 }}>What gets shared</p>
            {[
              { label: 'Event title', shared: false },
              { label: 'Event description', shared: false },
              { label: 'Attendees', shared: false },
              { label: 'Location', shared: false },
              { label: 'Start time', shared: true },
              { label: 'End time', shared: true },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 999, backgroundColor: item.shared ? 'rgba(200,249,122,0.1)' : 'rgba(255,255,255,0.05)', color: item.shared ? '#c8f97a' : 'rgba(255,255,255,0.25)' }}>
                  {item.shared ? 'Shared' : 'Never shared'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '96px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
          <h2 style={{ fontSize: 52, fontWeight: 300, letterSpacing: '-0.02em', marginBottom: 24 }}>Ready to find your overlap?</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 40, fontSize: 18 }}>No account. Takes 30 seconds.</p>
          <a href="/connect" style={{ display: 'inline-block', backgroundColor: '#c8f97a', color: '#0a0a0a', fontWeight: 600, padding: '20px 48px', borderRadius: 999, fontSize: 18, textDecoration: 'none' }}>
            Share my availability
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.3)' }}>aligned</span>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>No data collected. No accounts. Just time.</p>
        </div>
      </footer>

    </main>
  );
}
