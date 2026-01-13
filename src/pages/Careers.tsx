import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Heart, Rocket, Users, Mail } from "lucide-react";

const Careers = () => {
  const values = [
    {
      icon: Rocket,
      title: "Innovation",
      description: "We're constantly pushing boundaries to build the best invoicing platform for South African businesses."
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "We believe great things happen when talented people work together towards a common goal."
    },
    {
      icon: Heart,
      title: "Customer Focus",
      description: "Everything we do is centered around making our customers' lives easier and their businesses more successful."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4" />
              Careers
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join Our <span className="text-accent">Team</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Help us build the future of invoicing for South African businesses.
            </p>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto text-center">
              <CardContent className="py-16">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-10 h-10 text-accent" />
                </div>
                <h2 className="text-3xl font-bold mb-4">We're Growing!</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  We're building something exciting and will be hiring soon. Check back regularly 
                  for new opportunities, or register your interest below.
                </p>
                <div className="bg-muted/50 rounded-xl p-6 mb-8 max-w-md mx-auto">
                  <p className="text-sm text-muted-foreground mb-4">
                    Want to be notified when positions open?
                  </p>
                  <Link to="/contact?purpose=general">
                    <Button variant="accent" size="lg" className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Register Your Interest
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send us a message through our <Link to="/contact?purpose=general" className="text-accent hover:underline">contact form</Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-2">Our Values</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              What drives us every day
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {values.map((value) => (
                <div key={value.title} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Why Join IEOSUIA?
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-left mt-8">
                <div className="bg-white/10 rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Make an Impact</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Help thousands of South African businesses manage their finances more efficiently.
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Grow With Us</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    We're a growing company with opportunities for career development and learning.
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Flexible Work</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    We believe in work-life balance and offer flexible working arrangements.
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Great Team</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Join a passionate team of professionals who love what they do.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
