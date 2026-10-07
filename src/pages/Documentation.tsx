import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  ArrowRight,
  Zap,
  Users,
  CreditCard,
  BarChart3,
  Settings
} from "@/lib/icons";

const Documentation = () => {
  const gettingStartedGuides = [
    {
      icon: Zap,
      title: "Quick Start Guide",
      description: "Set up your business profile, clients and first document",
      link: "/features"
    },
    {
      icon: FileText,
      title: "Creating Your First Invoice",
      description: "Step-by-step guide to creating and downloading invoices",
      link: "/invoicing"
    },
    {
      icon: Users,
      title: "Managing Clients",
      description: "How to add, edit, and organize your client database",
      link: "/client-management"
    },
    {
      icon: CreditCard,
      title: "Invoice Status Tracking",
      description: "Track draft, pending, partially paid, paid and overdue invoices",
      link: "/payment-tracking"
    }
  ];

  const featureGuides = [
    {
      icon: FileText,
      title: "PDF Downloads & Exports",
      description: "Download invoice PDFs and export your business data"
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
