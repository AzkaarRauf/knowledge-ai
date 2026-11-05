import Link from 'next/link'
import { ContactLink, LegalPage } from '@/features/legal/components/LegalPage'
import { LEGAL, TERMS_ROUTE } from '@/features/legal/legal'

/** Privacy policy. Keep it true to what the app really stores and who it shares with. */
export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {LEGAL.appName} (&quot;the Service&quot;) is a personal project run by {LEGAL.operator} (&quot;we&quot;, &quot;us&quot;).
        This policy explains what we collect, how we use it, and who can see it. By using the Service you agree to this policy and
        our <Link href={TERMS_ROUTE}>Terms of Service</Link>.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>
          <strong>Your chats are not private from us.</strong> Everything you type, every answer, and every file you upload is
          stored on our servers, and we (the operator) can read it.
        </li>
        <li>Your questions and document contents are sent to Google&apos;s Gemini AI service to produce answers.</li>
        <li>Chats are not end-to-end encrypted.</li>
        <li>
          <strong>
            Do not enter passwords, financial data, health data, government IDs, or anything secret or confidential.
          </strong>
        </li>
        <li>We do not sell your data and we do not use it for advertising.</li>
      </ul>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> from Google sign-in: your name, email address, and Google account ID.
        </li>
        <li>
          <strong>Chat content</strong>: your messages, the AI&apos;s replies, conversation titles, and a log of each question
          (including a rewritten version of it), how long it took, and any errors.
        </li>
        <li>
          <strong>Uploaded documents</strong>: the files you upload, the text taken out of them, and search data made from that
          text.
        </li>
        <li>
          <strong>Feedback</strong>: thumbs up/down ratings and any comments you add.
        </li>
        <li>
          <strong>Activity logs</strong>: records of actions such as uploading or deleting documents and deleting conversations.
        </li>
        <li>
          <strong>Technical data</strong>: your IP address (used for rate limiting) and data our hosting providers log
          automatically, such as request times and browser type.
        </li>
        <li>
          <strong>Cookies and local storage</strong>: a sign-in cookie and a session token so you stay logged in. We do not use
          advertising or tracking cookies.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To sign you in and run the Service, including answering your questions from documents.</li>
        <li>To prevent abuse, enforce usage limits, and keep the Service secure.</li>
        <li>To fix bugs, review quality, and improve the Service. This can include us reading chats and feedback.</li>
        <li>To comply with the law or respond to valid legal requests.</li>
      </ul>

      <h2>Who can see your data</h2>
      <ul>
        <li>
          <strong>The operator</strong> has full access to the database, including all chats and uploaded files.
        </li>
        <li>
          <strong>Admins</strong> of the Service can manage users and departments, and documents shared to a department can be
          searched by people in that department.
        </li>
        <li>
          <strong>Service providers</strong> who host or process data for us: Google (sign-in and the Gemini AI service), our
          cloud hosting, database, cache, and file storage providers. They process data under their own terms. Google&apos;s
          Gemini API terms apply to the text we send it; on some plans Google may keep that text, use it to improve its products,
          and have human reviewers read it.
        </li>
        <li>
          <strong>Legal reasons</strong>: we may share data if required by law or to protect the Service, its users, or others.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <ul>
        <li>Account data, chats, and documents are kept until you delete them or ask us to delete your account.</li>
        <li>
          Deleting a conversation removes its messages, but the question log (your question text and timing) is kept for
          analytics. Ask us if you want those removed too.
        </li>
        <li>Activity logs are kept for security and are not removed when a conversation or document is deleted.</li>
        <li>Backups and provider logs may keep copies for a limited time after deletion.</li>
      </ul>

      <h2>Security</h2>
      <p>
        We use HTTPS, Google sign-in, and access controls. But this is a small personal project without dedicated security staff,
        audits, or end-to-end encryption. No system is fully secure, and we cannot guarantee your data will never be accessed,
        lost, or disclosed. Use the Service with that in mind.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>You can delete your conversations at any time in the app.</li>
        <li>
          You can ask us to show you, correct, export, or delete your data, or delete your account, by contacting us at{' '}
          <ContactLink />. We may need to confirm it is you.
        </li>
        <li>
          Depending on where you live (for example under GDPR or CCPA) you may have more rights, including the right to complain
          to your local data protection authority.
        </li>
      </ul>

      <h2>International transfers</h2>
      <p>Our providers may store and process data in countries other than yours, including the United States.</p>

      <h2>Children</h2>
      <p>
        The Service is not for anyone under 18. We do not knowingly collect data from children. If you think a child has used the
        Service, contact us and we will delete their data.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy. The &quot;last updated&quot; date above shows when. If you keep using the Service after a
        change, you accept the new policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests: <ContactLink />.
      </p>
    </LegalPage>
  )
}
