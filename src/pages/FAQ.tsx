import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is IEOSUIA really free?",
    answer: "Yes. Every account includes the complete invoicing workspace with no tiers, trials, or locked core features.",
  },
  {
    question: "What can I create?",
    answer: "You can create invoices, clients, products, reusable templates, recurring invoices, reports, PDF files, and data exports.",
  },
  {
    question: "Are invoice and client limits enforced?",
    answer: "No. The free workspace supports unlimited invoices and clients.",
  },
  {
    question: "Can I customize invoice templates?",
    answer: "Yes. Custom invoice designs and all professional template presets are included for every account.",
  },
  {
    question: "Can invoices recur automatically?",
    answer: "Yes. Create weekly, monthly, quarterly, or annual billing schedules. The app reminds you when billing is due, and you create the invoice when ready.",
  },
  {
    question: "Can I download and share invoices?",
    answer: "Yes. Download invoices as professional PDF documents and share them using your preferred method.",
  },
  {
    question: "Can I export my information?",
    answer: "Yes. Reports and business records can be exported from the dashboard, and you can request a complete data export from Settings.",
  },
  {
    question: "How is my account protected?",
    answer: "Passwords are securely hashed, email verification is supported, sessions use expiring tokens, and sensitive API routes require authorization.",
  },
  {
    question: "How do I get support?",
    answer: "Use the Contact or Support page and the IEOSUIA team will respond as soon as possible.",
  },
];

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <PageHeader title="Frequently Asked Questions" subtitle="Everything you need to know about your free invoicing workspace." />
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.question} value={`faq-${index}`} className="rounded-xl border bg-card px-5">
            <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
    <Footer />
  </div>
);

export default FAQ;
