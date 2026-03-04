const Section = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-2xl font-bold mb-3 text-foreground">{title}</h2>
    <div className="text-muted-foreground space-y-3 leading-relaxed">{children}</div>
  </div>
)

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-5xl font-bold mb-4">Terms of Use</h1>
        <p className="text-muted-foreground">
          Last updated: <span className="font-medium text-foreground">March 2026</span>
        </p>
        <p className="mt-4 text-muted-foreground">
          By placing an order or using the NexCart platform, you agree to the following terms.
          Please read them carefully before making a purchase.
        </p>
      </div>

      <div className="border-t pt-10 space-y-2">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using NexCart ("the Platform"), you confirm that you are at least 18 years old
            and agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform.
          </p>
        </Section>

        <Section title="2. Orders & Payments">
          <p>
            All orders placed through NexCart are subject to product availability. We reserve the right
            to refuse or cancel any order at our discretion, including cases of suspected fraud or
            incorrect pricing.
          </p>
          <p>
            Payments are processed securely via <strong>MeSomb</strong> (MTN Mobile Money &amp; Orange Money).
            By initiating a payment you authorise the charge to your mobile money account. All prices are
            displayed in <strong>XAF (FCFA)</strong> and are inclusive of applicable taxes unless stated otherwise.
          </p>
          <p>
            If your payment is not confirmed within the required window, the transaction will be cancelled
            automatically. You may retry at any time.
          </p>
        </Section>

        <Section title="3. Shipping & Delivery">
          <p>
            We deliver within Cameroon. Estimated delivery times are provided at checkout and are
            not guaranteed. NexCart is not responsible for delays caused by circumstances beyond our
            control (weather, strikes, carrier issues).
          </p>
          <p>
            Orders over <strong>25,000 FCFA</strong> qualify for free standard delivery. A flat delivery
            fee of <strong>5 FCFA</strong> applies to smaller orders.
          </p>
        </Section>

        <Section title="4. Returns & Refunds">
          <p>
            You may request a return within <strong>30 days</strong> of receiving your order, provided
            the item is unused, in its original packaging, and accompanied by proof of purchase.
          </p>
          <p>
            Refunds are issued to the original payment method within 5–10 business days after the
            returned item has been inspected and approved. Delivery fees are non-refundable unless
            the return is due to our error.
          </p>
        </Section>

        <Section title="5. User Accounts">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials.
            NexCart will not be liable for any loss resulting from unauthorised access to your account.
            Please notify us immediately if you suspect a breach.
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            All content on the Platform — including logos, images, product descriptions, and code —
            is the property of NexCart or its licensors. Reproduction without prior written consent
            is strictly prohibited.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            NexCart is provided "as is." To the fullest extent permitted by applicable law, we disclaim
            all warranties, express or implied. We shall not be liable for any indirect, incidental,
            or consequential damages arising from your use of the Platform.
          </p>
        </Section>

        <Section title="8. Changes to Terms">
          <p>
            We may update these Terms at any time. Continued use of the Platform after changes are
            posted constitutes your acceptance of the revised Terms. We encourage you to review
            this page periodically.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            If you have questions about these Terms, please contact us at{' '}
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
