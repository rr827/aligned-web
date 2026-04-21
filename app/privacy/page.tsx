export default function PrivacyPolicy() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.08em', color: 'white', textDecoration: 'none' }}>aligned</a>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 48px 96px' }}>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Legal</p>
        <h1 style={{ fontSize: 48, fontWeight: 300, letterSpacing: '-0.02em', marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 64 }}>Effective date: April 21, 2026</p>

        {[
          {
            title: 'What aligned does',
            body: `aligned is a scheduling tool that helps people find a meeting time that works for everyone. You connect your Google Calendar, your busy times are stripped down to start and end times only, and that anonymized data is shared temporarily in a room with the people you invite. No names, no event titles, no descriptions — just blocks of time.`,
          },
          {
            title: 'What we collect',
            body: `We do not collect personal information. We do not have user accounts. When you connect your Google Calendar, we request read access to your calendar events solely to extract busy time ranges. We never store event titles, descriptions, attendees, locations, or any other event metadata on our servers. The only data we store is a room record containing: a random 6-character room code, an expiry timestamp (48 hours from creation), anonymized busy-time blocks (start and end times only), and meeting proposals made within the room.`,
          },
          {
            title: 'How your Google data is used',
            body: `aligned uses the Google Calendar API to read your calendar events and identify when you are busy. This data is used only to generate anonymous busy-time blocks that are shared within your room session. We do not store, sell, transfer, or use your Google Calendar data for any purpose other than displaying your availability within the room you created or joined. Your Google access token is stored only in your browser's session storage and is deleted when you close the tab.`,
          },
          {
            title: 'Data storage and retention',
            body: `Room data is stored in our database for a maximum of 48 hours, after which it is automatically deleted. We do not retain logs of who created or joined a room. We do not link room data to any identity. Because we store no personal information, there is nothing to delete on request — your data expires automatically.`,
          },
          {
            title: 'Third-party services',
            body: `aligned uses Supabase to store temporary room data and Google OAuth 2.0 (with PKCE) for calendar access. We do not use advertising networks, tracking pixels, or analytics that identify individual users. We do not share any data with third parties for marketing purposes.`,
          },
          {
            title: 'Google API scopes',
            body: `aligned requests the following Google OAuth scopes: openid and profile (to confirm authentication), email (required by Google's OAuth flow), calendar.readonly (to read your events and generate busy blocks), and calendar.events (to add an agreed meeting time to your calendar when you choose to). We do not access, store, or transmit any calendar data beyond what is necessary to show your busy times within your active session.`,
          },
          {
            title: 'Children',
            body: `aligned is not directed at children under 13 and we do not knowingly collect any information from children.`,
          },
          {
            title: 'Changes to this policy',
            body: `If we make material changes to this policy, we will update the effective date above. Continued use of aligned after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: 'Contact',
            body: `If you have questions about this privacy policy, you can reach us at privacy@getaligned.app.`,
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 12, color: '#c8f97a' }}>{section.title}</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>{section.body}</p>
          </div>
        ))}

      </div>

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
