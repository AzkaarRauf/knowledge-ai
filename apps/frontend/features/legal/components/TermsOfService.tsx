import Link from 'next/link'
import { ContactLink, LegalPage } from '@/features/legal/components/LegalPage'
import { LEGAL, PRIVACY_ROUTE } from '@/features/legal/legal'

/** Terms of service. Written to protect the operator of a free personal project. */
export function TermsOfService() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms are an agreement between you and {LEGAL.operator} (&quot;we&quot;, &quot;us&quot;), who runs {LEGAL.appName}{' '}
        (&quot;the Service&quot;). By signing in or using the Service you agree to these terms and our{' '}
        <Link href={PRIVACY_ROUTE}>Privacy Policy</Link>. If you do not agree, do not use the Service.
      </p>

      <h2>1. What the Service is</h2>
      <p>
        The Service is a free personal and demo project that answers questions from uploaded documents using AI. It is not a
        commercial product. We may change, limit, pause, or shut it down at any time, with or without notice, and we may delete
        stored data when we do.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>You must be at least 18 and able to agree to these terms.</li>
        <li>You sign in with Google. You are responsible for all activity on your account.</li>
        <li>We may suspend or delete any account at any time, for any reason, including breaking these terms.</li>
      </ul>

      <h2>3. Your content</h2>
      <ul>
        <li>
          You keep ownership of what you type and upload (&quot;Your Content&quot;). You give us a worldwide, free license to
          store, copy, process, and send Your Content to our service providers (including Google&apos;s Gemini AI) as needed to
          run and improve the Service.
        </li>
        <li>
          You confirm you have the right to upload Your Content, and that it does not break any law, contract, confidentiality
          duty, or anyone else&apos;s rights.
        </li>
        <li>
          <strong>Your Content is not private from us.</strong> We can read chats and files. Do not upload or type passwords,
          financial or health data, government IDs, trade secrets, or other sensitive or confidential information.
        </li>
        <li>You are responsible for keeping your own copies. We do not promise backups.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Break any law or use the Service for anything harmful, fraudulent, or abusive.</li>
        <li>Upload malware, illegal content, or content that infringes copyright or other rights.</li>
        <li>Upload other people&apos;s personal data without the right to do so.</li>
        <li>Try to get around rate limits, access data that is not yours, probe or attack the Service, or overload it.</li>
        <li>Scrape the Service, or use it to build a competing product or train AI models.</li>
        <li>Use AI output to harass people, spread false information, or make harmful decisions about people.</li>
      </ul>

      <h2>5. AI output</h2>
      <p>
        Answers are made by AI and <strong>can be wrong, incomplete, or made up</strong>, even when they show sources. Always
        check important information yourself. Output is not professional advice (legal, medical, financial, or other). You use any
        output at your own risk and are responsible for what you do with it.
      </p>

      <h2>6. No warranty</h2>
      <p className="uppercase">
        The Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, express or
        implied, including merchantability, fitness for a particular purpose, accuracy, security, availability, and
        non-infringement. We do not promise the Service will be uninterrupted, error-free, or secure, or that data will not be
        lost.
      </p>

      <h2>7. Limitation of liability</h2>
      <p className="uppercase">
        To the fullest extent allowed by law, we will not be liable for any indirect, incidental, special, consequential, or
        punitive damages, or for any loss of data, profits, revenue, or goodwill, or for any unauthorized access to or disclosure
        of your data, arising from or related to the Service, even if we were told such damages were possible. Our total liability
        for any claim related to the Service is limited to the greater of the amount you paid us in the past 12 months or USD $10.
      </p>
      <p>Some places do not allow some of these limits, so they may not fully apply to you.</p>

      <h2>8. Indemnity</h2>
      <p>
        You agree to defend and hold us harmless from any claims, losses, and costs (including reasonable legal fees) that come
        from Your Content, your use of the Service, or your breaking these terms or the law.
      </p>

      <h2>9. Third-party services</h2>
      <p>
        The Service relies on third parties such as Google and our hosting providers. We are not responsible for their services,
        outages, or how they handle data under their own terms.
      </p>

      <h2>10. Ending use</h2>
      <p>
        You can stop using the Service at any time and ask us to delete your account at <ContactLink />. We may end your access at
        any time. Sections 3 to 8 and 11 still apply after your access ends.
      </p>

      <h2>11. General</h2>
      <ul>
        <li>We may change these terms. If you keep using the Service after a change, you accept the new terms.</li>
        <li>If any part of these terms cannot be enforced, the rest still applies.</li>
        <li>Not enforcing a part of these terms is not a waiver of it.</li>
        <li>These terms and the Privacy Policy are the whole agreement between you and us about the Service.</li>
      </ul>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms: <ContactLink />.
      </p>
    </LegalPage>
  )
}
