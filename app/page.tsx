import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Wholesale AI - Negotiation Copilot</h1>
      <p>Real-time AI assistance for real estate wholesale negotiations</p>
      
      <div style={{ marginTop: '2rem' }}>
        <Link 
          href="/call" 
          style={{ 
            background: '#0070f3', 
            color: 'white', 
            padding: '1rem 2rem', 
            textDecoration: 'none', 
            borderRadius: '5px',
            display: 'inline-block'
          }}
        >
          Start Call Interface
        </Link>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <h3>Features:</h3>
        <ul>
          <li>Real-time speech transcription</li>
          <li>AI-powered negotiation analysis</li>
          <li>Motivation scoring and objection detection</li>
          <li>Strategic response suggestions</li>
        </ul>
      </div>
    </main>
  );
}