import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PricingFAQ = () => {
  const faqs = [
    {
      question: "Can I try IEOSUIA before paying?",
      answer: "Absolutely! Our Free plan gives you access to core features forever - no credit card required. You can also start a 14-day free trial of any paid plan to experience all premium features."
    },
    {
      question: "What happens when I exceed my monthly email or SMS limit?",
      answer: "You can continue sending by purchasing additional credits from your dashboard. Additional emails cost R0.10 each, and SMS costs vary by plan (R0.23-R0.25 each). Credits never expire."
    },
    {
      question: "Can I change or cancel my plan anytime?",
      answer: "Yes! You can upgrade, downgrade, or cancel your plan at any time from your dashboard. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing cycle."
    },
    {
      question: "Is there a discount for annual billing?",
      answer: "Yes! When you choose annual billing, you save 20% compared to monthly billing. Toggle the billing switch above to see annual prices."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards, as well as EFT/bank transfers for annual plans. All payments are processed securely in South African Rand (ZAR)."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied within the first 14 days, contact us for a full refund. After 14 days, unused time is not refundable."
    },
    {
      question: "What's the difference between monthly invoices limits?",
      answer: "Free plan allows up to 30 invoices per month. All paid plans (Solo, Pro, Business) offer unlimited invoices - create as many as your business needs."
    },
    {
      question: "Can I add team members to my account?",
      answer: "Team access depends on your plan: Free and Solo plans are single-user. Pro plan includes 3 team members. Business plan includes up to 10 team members with role-based permissions."
    },
    {
      question: "Do you offer custom enterprise pricing?",
      answer: "Yes! For larger organizations needing custom limits, dedicated infrastructure, or special requirements, contact us through our contact form for a tailored enterprise solution."
    },
    {
      question: "Are there any hidden fees?",
      answer: "No hidden fees. The price you see is what you pay. The only additional costs are if you purchase extra email or SMS credits beyond your plan's monthly allocation."
    }
  ];

  return (
    <div className="mt-16 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Pricing <span className="text-accent">FAQ</span>
        </h3>
        <p className="text-muted-foreground">
          Common questions about our pricing and plans
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, index) => (
          <AccordionItem 
            key={index} 
            value={`pricing-faq-${index}`}
            className="bg-card rounded-lg border px-4"
          >
            <AccordionTrigger className="text-left hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default PricingFAQ;
