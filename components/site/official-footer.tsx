import Link from 'next/link'

const legalLinks = [
  { href: '/contact', label: 'Contact' },
  { href: '/terms-and-conditions', label: 'Terms & Conditions' },
  { href: '/refund-and-cancellation-policy', label: 'Refund & Cancellation' },
]

export function OfficialFooter() {
  return (
    <footer className="official-footer">
      <div className="official-footer-inner">
        <p>© {new Date().getFullYear()} Abhiroop Prasad Ventures. All rights reserved.</p>
        <nav aria-label="Legal links" className="official-footer-links">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
