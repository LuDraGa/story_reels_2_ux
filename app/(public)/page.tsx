import Link from 'next/link'
import { OfficialPageShell } from '@/components/site/official-page-shell'

export default function HomePage() {
  return (
    <OfficialPageShell
      title="Reel Story Studio"
      subtitle="AI-powered video reel creation — from story to voiceover to polished short-form video, in minutes."
    >
      <div className="official-grid">
        <article>
          <h2>Script to Voice</h2>
          <p>
            Generate natural-sounding voiceovers from your script with AI TTS,
            or clone your own voice for a personal touch.
          </p>
        </article>
        <article>
          <h2>Automated Video Composition</h2>
          <p>
            Combine audio, background videos, and styled captions into a
            ready-to-publish 9:16 reel — no editing software needed.
          </p>
        </article>
        <article>
          <h2>Manage Multiple Projects</h2>
          <p>
            Sign in to track your reels, reuse background assets, and manage
            your full pipeline across projects.
          </p>
        </article>
      </div>

      <div className="official-actions">
        <Link href="/app" className="official-btn">
          Launch App
        </Link>
        <Link href="/contact" className="official-btn secondary">
          Contact Us
        </Link>
      </div>
    </OfficialPageShell>
  )
}
