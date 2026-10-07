import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is IEOSUIA Invoices?",
    answer: "IEOSUIA Invoices is an online workspace for creating business documents, managing clients and reusable items, tracking invoice payments, and reviewing reports.",
  },
  {
    question: "How do I create an invoice?",
    answer: "Create an account, add your business and client details, choose an invoice design, add items and dates, then save or issue the invoice.",
  },
  {
    question: "Can I create quotes and estimates?",
    answer: "Yes. Quote and estimate documents are available alongside invoices, credit notes, debit notes and receipts.",
  },
  {
    question: "Can I track full and partial payments?",
    answer: "Yes. You can record payments against an issued invoice and view the amount paid, outstanding balance, payment history and payment status.",
  },
  {
    question: "Can I manage clients and reusable products or services?",
    answer: "Yes. Save client contact details and reusable products or services so relevant information can be carried into new documents.",
  },
  {
    question: "Can I download documents as PDF files?",
    answer: "Yes. Supported documents can be previewed and downloaded as PDF files from your authenticated workspace.",
  },
  {
    question: "Does IEOSUIA Invoices support receipts and credit notes?",
    answer: "Yes. Receipts, credit notes and debit notes use their own document labels and numbering and can be linked to relevant invoice information.",
  },
  {
    question: "Is IEOSUIA Invoices free?",
    answer: "A free option is available. The product will show the features available to your account when you sign in.",
  },
  {
    question: "Is accounting available?",
    answer: "Not yet. Accounting is marked as Coming Soon. The currently available product focuses on invoicing and related business documents.",
  },
  {
    question: "Is the platform intended for South African businesses?",
    answer: "The platform supports South African business use, including rand-denominated documents and business details commonly used locally.",
  },
  {
    question: "Can I include VAT information?",
    answer: "You can enter relevant tax and VAT details where supported. You remain responsible for making sure each document meets your business and regulatory requirements.",
  },
];

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <PageHeader title="Frequently Asked Questions" subtitle="Practical answers about IEOSUIA Invoices, documents and payment tracking." />
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
