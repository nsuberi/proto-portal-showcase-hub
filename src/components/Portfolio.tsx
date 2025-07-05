import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Github, Mail, Linkedin } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Portfolio = () => {
  const prototypes = [
    {
      title: "AI Chat Assistant",
      description: "Intelligent conversational AI with natural language processing and context awareness.",
      link: "https://example.com/prototype1",
      tags: ["AI", "NLP", "Chat"]
    },
    {
      title: "Smart Analytics Dashboard",
      description: "Data visualization tool powered by machine learning for predictive insights.",
      link: "https://example.com/prototype2",
      tags: ["Analytics", "ML", "Visualization"]
    },
    {
      title: "Voice Recognition App",
      description: "Real-time voice processing application with speech-to-text capabilities.",
      link: "https://example.com/prototype3",
      tags: ["Voice AI", "Speech", "Real-time"]
    },
    {
      title: "Computer Vision Tool",
      description: "Image recognition and processing system for automated content analysis.",
      link: "https://example.com/prototype4",
      tags: ["Computer Vision", "Image AI", "Automation"]
    },
    {
      title: "Recommendation Engine",
      description: "Personalized content recommendation system using collaborative filtering.",
      link: "https://example.com/prototype5",
      tags: ["Recommendations", "Personalization", "AI"]
    },
    {
      title: "Natural Language Processor",
      description: "Advanced NLP tool for text analysis, sentiment detection, and summarization.",
      link: "https://example.com/prototype6",
      tags: ["NLP", "Text Analysis", "Sentiment"]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            AI Product Creator
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Crafting innovative AI-powered solutions that transform ideas into intelligent experiences
          </p>
          <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-smooth">
            Explore My Work
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Prototypes Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Prototypes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore my latest AI innovations and prototype developments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prototypes.map((prototype, index) => (
              <Card key={index} className="group hover:shadow-elegant transition-smooth border-border/50 hover:border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-smooth">
                    {prototype.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {prototype.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {prototype.tags.map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full hover:bg-primary hover:text-primary-foreground transition-smooth"
                    onClick={() => window.open(prototype.link, '_blank')}
                  >
                    View Prototype
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">About Me</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            I'm a passionate AI product creator dedicated to building innovative solutions that push the boundaries 
            of artificial intelligence. With expertise in machine learning, natural language processing, and user 
            experience design, I transform complex AI concepts into intuitive, accessible products.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            My work focuses on creating AI systems that enhance human capabilities while maintaining ethical 
            standards and user-centered design principles.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Let's Connect</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Interested in collaborating or learning more about my work? Get in touch!
          </p>
          
          <div className="flex justify-center gap-6">
            <Button variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground transition-smooth">
              <Mail className="mr-2 h-5 w-5" />
              Email
            </Button>
            <Button variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground transition-smooth">
              <Linkedin className="mr-2 h-5 w-5" />
              LinkedIn
            </Button>
            <Button variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground transition-smooth">
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;