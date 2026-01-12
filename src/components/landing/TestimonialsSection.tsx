import { Quote, Star } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "IEOSUIA Invoices helped me get paid 3x faster. The automated reminders are a game-changer!",
      author: "Sarah M.",
      role: "Freelance Designer",
      location: "Cape Town",
      rating: 5,
    },
    {
      quote: "Finally, an invoicing solution that understands South African businesses. Multi-currency support is brilliant.",
      author: "David K.",
      role: "Consulting Agency Owner",
      location: "Johannesburg",
      rating: 5,
    },
    {
      quote: "The SMS reminders feature alone is worth the subscription. My clients never forget to pay now.",
      author: "Thabo N.",
      role: "IT Contractor",
      location: "Pretoria",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Loved by <span className="text-accent">Businesses</span> Across SA
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of satisfied customers who've transformed their invoicing workflow.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="relative bg-card rounded-2xl p-8 border border-border shadow-soft hover:shadow-lg transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
                  <Quote className="w-5 h-5 text-accent-foreground fill-accent-foreground" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4 pt-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">Trusted by businesses across South Africa</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {["Startups", "Agencies", "Freelancers", "Consultants", "SMEs"].map((type) => (
              <span key={type} className="text-lg font-semibold text-foreground/60">
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;