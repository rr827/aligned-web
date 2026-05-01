export default function TermsPage() {
  return (
    <main style={{
      backgroundColor: '#080808',
      minHeight: '100vh',
      color: '#e8e8e8',
      fontFamily: "'Georgia', serif",
    }}>
      {/* Nav */}
      <nav style={{
        padding: '20px 40px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{ color: '#c8f97a', fontFamily: 'monospace', fontSize: '18px', textDecoration: 'none', letterSpacing: '0.05em' }}>
          Aligned
        </a>
        <a href="/" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>← Back</a>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 40px 100px' }}>
        <p style={{ color: '#666', fontSize: '13px', fontFamily: 'monospace', marginBottom: '12px' }}>
          Last updated: May 1, 2026
        </p>
        <h1 style={{ fontSize: '38px', fontWeight: '400', color: '#ffffff', marginBottom: '16px', lineHeight: '1.2' }}>
          Terms of Service
        </h1>
        <p style={{ color: '#c8f97a', fontSize: '16px', marginBottom: '48px', fontFamily: 'monospace' }}>
          Simple terms for a simple tool.
        </p>

        <Section title="Acceptance">
          <p>
            By using Aligned (the app or website), you agree to these terms. If you do not agree, do not use Aligned.
          </p>
        </Section>

        <Section title="What Aligned does">
          <p>
            Aligned is a scheduling tool. It reads your calendar (with your permission), computes your busy/free availability locally on your device, and lets you share that availability with others through a room code. No calendar event details ever leave your device.
          </p>
        </Section>

        <Section title="Your responsibilities">
          <ul>
            <li>Use Aligned only for lawful purposes.</li>
            <li>Do not attempt to reverse-engineer, scrape, or abuse the service.</li>
            <li>Do not use Aligned to harass or harm others.</li>
            <li>Keep your room codes private — anyone with the code can join your room.</li>
          </ul>
        </Section>

        <Section title="Google Calendar access">
          <p>
            Aligned requests read-only access to your Google Calendar via OAuth. You can revoke this access at any time through your Google account settings or through the Aligned app. Aligned does not store, transmit, or sell your calendar event data.
          </p>
        </Section>

        <Section title="Room data">
          <p>
            When you create or join a room, your encoded availability payload is stored on our servers for up to 48 hours to enable the room feature. This data contains only busy/free time blocks — no event titles, attendees, or other metadata. It is automatically deleted after 48 hours.
          </p>
        </Section>

        <Section title="Service availability">
          <p>
            Aligned is provided as-is. We make no guarantees about uptime, accuracy, or fitness for any particular purpose. We may modify, suspend, or discontinue the service at any time without notice.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            To the fullest extent permitted by law, Aligned and its creators are not liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including missed meetings, scheduling errors, or data loss.
          </p>
        </Section>

        <Section title="Intellectual property">
          <p>
            Aligned and its original content, features, and functionality are owned by the Aligned team. You may not reproduce or redistribute the service without written permission.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We may update these terms from time to time. We will update the date at the top of this page. Continued use of Aligned after changes constitutes acceptance of the updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms?{' '}
            <a href="mailto:support@aligned.app" style={{ color: '#c8f97a' }}>support@aligned.app</a>
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '48px' }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: '16px',
        fontFamily: 'monospace',
        letterSpacing: '0.02em',
      }}>
        {title}
      </h2>
      <div style={{ color: '#aaa', lineHeight: '1.8', fontSize: '16px' }}>
        {children}
      </div>
    </section>
  );
}
