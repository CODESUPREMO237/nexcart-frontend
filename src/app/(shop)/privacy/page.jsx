const Section = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-2xl font-bold mb-3 text-foreground">{title}</h2>
    <div className="text-muted-foreground space-y-3 leading-relaxed">{children}</div>
  </div>
)

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: <span className="font-medium text-foreground">March 2026</span>
        </p>
        <p className="mt-4 text-muted-foreground">
          NexCart is committed to protecting your personal information. This policy explains what
          data we collect, how we use it, and the choices you have.
        </p>
      </div>

      <div className="border-t pt-10 space-y-2">
        <Section title="1. Information We Collect">
          <p>
            When you create an account or place an order, we collect personal information such as
            your name, email address, phone number, and shipping address.
          </p>
          <p>
            We also collect usage data — pages visited, search queries, products viewed — to improve
            your shopping experience and power our AI recommendation engine.
          </p>
          <p>
            Payment transactions are processed by <strong>MeSomb</strong>. NexCart does not store
            your mobile money PIN or full account credentials.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your data to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Process and fulfil your orders</li>
            <li>Send order confirmations and delivery updates</li>
            <li>Personalise product recommendations</li>
            <li>Improve platform performance and detect fraud</li>
            <li>Respond to customer support enquiries</li>
          </ul>
          <p>
            We will never sell your personal data to third parties for marketing purposes.
          </p>
        </Section>

        <Section title="3. Cookies & Tracking">
          <p>
            NexCart uses cookies and similar technologies to keep you logged in, remember your cart,
            and analyse site traffic. You can disable cookies in your browser settings, though some
            features may not function correctly without them.
          </p>
        </Section>

        <Section title="4. Data Sharing">
          <p>
            We share your information only as necessary to operate the Platform:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>MeSomb</strong> — to process mobile money payments</li>
            <li><strong>Cloudinary</strong> — to serve product images</li>
            <li>Delivery partners — to ship your order</li>
          </ul>
          <p>
            All third-party partners are contractually required to handle your data securely and
            only for the purposes outlined above.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your account data for as long as your account is active or as needed to
            provide services. You may request deletion of your account and associated data at any
            time by contacting us.
          </p>
          <p>
            Order records may be retained for up to 7 years for tax and legal compliance purposes.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your account</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:support@nexcart.cm" className="text-primary underline">
              support@nexcart.cm
            </a>
            .
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We implement industry-standard security measures including HTTPS encryption, hashed
            passwords, and access controls. However, no system is completely immune to threats.
            We encourage you to use a strong, unique password for your NexCart account.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            NexCart is not intended for users under the age of 18. We do not knowingly collect
            personal information from minors. If you believe a minor has provided us with their
            data, please contact us immediately.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by email or by posting a prominent notice on the Platform. Continued use after
            changes take effect constitutes your acceptance.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about this Privacy Policy? Reach us at{' '}
            <a href="mailto:support@nexcart.cm" className="text-primary underline">
              support@nexcart.cm
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  )
}
