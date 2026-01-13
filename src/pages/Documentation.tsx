import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FileText, 
  Video, 
  HelpCircle, 
  ArrowRight,
  Zap,
  Users,
  CreditCard,
  Bell,
  BarChart3,
  Settings
} from "lucide-react";

const Documentation = () => {
  const gettingStartedGuides = [
    {
      icon: Zap,
      title: "Quick Start Guide",
      description: "Get up and running with IEOSUIA in under 5 minutes",
      link: "/support"
    },
    {
      icon: FileText,
      title: "Creating Your First Invoice",
      description: "Step-by-step guide to creating and sending invoices",
      link: "/support"
    },
    {
      icon: Users,
      title: "Managing Clients",
      description: "How to add, edit, and organize your client database",
      link: "/support"
    },
    {
      icon: CreditCard,
      title: "Payment Tracking",
      description: "Track payments and manage your cash flow",
      link: "/support"
    }
  ];

  const featureGuides = [
    {
      icon: Bell,
      title: "Reminders & Notifications",
      description: "Set up automated email and SMS reminders"
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Generate financial reports and insights"
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Customize your profile and preferences"
    },
    {
      icon: FileText,
      title: "Invoice Templates",
      description: "Create and customize professional templates"
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
              <BookOpen className="w-4 h-4" />
              Documentation
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Learn How to Use <span className="text-accent">IEOSUIA</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Everything you need to know to get the most out of our invoicing platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/support">
                <Button size="lg" variant="accent">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Visit Support Center
                </Button>
              </Link>
              <a 
                href="https://www.youtube.com/@ieosuia" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline">
                  <Video className="w-4 h-4 mr-2" />
                  Watch Tutorials
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-2">Getting Started</h2>
            <p className="text-muted-foreground mb-8">
              New to IEOSUIA? Start here to learn the basics.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {gettingStartedGuides.map((guide) => (
                <Link key={guide.title} to={guide.link}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all">
                        <guide.icon className="w-6 h-6 text-accent group-hover:text-accent-foreground" />
                      </div>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription>{guide.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Guides */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-2">Feature Guides</h2>
            <p className="text-muted-foreground mb-8">
              Deep dive into specific features and capabilities.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureGuides.map((guide) => (
                <Card key={guide.title} className="h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <guide.icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Video Tutorials */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
              <Video className="w-12 h-12 mx-auto mb-6 text-accent" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Prefer Video Tutorials?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
                Visit our YouTube channel for step-by-step video guides, tips and tricks, 
                and feature walkthroughs.
              </p>
              <a 
                href="https://www.youtube.com/@ieosuia" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="accent" size="lg" className="group">
                  Watch on YouTube
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Need More Help */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link to="/support">
              <Button variant="outline" size="lg">
                Contact Support
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Documentation;
