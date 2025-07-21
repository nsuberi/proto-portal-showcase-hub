import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Github, Mail, Linkedin } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Portfolio = () => {
  const implementedPrototypes = [
    {
      title: "Final Fantasy X Skill Map for Employees",
      description:
        "Interactive skill mapping system inspired by Final Fantasy X's sphere grid. Visualize employee skills, take assessment quizzes, and get personalized learning recommendations with Neo4j graph database.",
      link: "/prototypes/ffx-skill-map/",
      tags: ["Skill Mapping", "Graph Database", "Learning Pathways", "Neo4j"],
      status: "Live Demo Available",
    },
  ];

  const prototypeIdeas = [
    {
      title: "Onboarding Advisor Council",
      description:
        "A team of AI advisors guides new employees through company knowledge, helping them get productive quickly with role-based memory and stakeholder alignment.",
      link: "#prototype1",
      tags: ["Multi-agent", "Memory", "Onboarding"],
      status: "Concept",
    },
    {
      title: "Guitar Spiral + Music Learning",
      description:
        "Interactive visual interface where musical notes spiral by pitch and octaves, with real-time chord-to-shape translation for guitar learning.",
      link: "#prototype2",
      tags: ["Music", "Visualization", "Learning"],
      status: "Concept",
    },
    {
      title: "Conversing Forest / Living Museum",
      description:
        "Embodied AI agents simulate philosophical conversations about nature harmony. When visitors speak, agents pause and respond contextually.",
      link: "#prototype3",
      tags: ["Embodied AI", "Museum", "Interaction"],
      status: "Concept",
    },
    {
      title: "AI Development Team Simulation",
      description:
        "A lightweight, always-on development team of AI agents that creates tickets, works on features, and presents demos with continuous collaboration.",
      link: "#prototype4",
      tags: ["Dev Team", "Automation", "Collaboration"],
      status: "Concept",
    },
    {
      title: "IAM Governance: Path to Production",
      description:
        "Infrastructure management that validates AWS IAM policies automatically, ensuring sandbox environments follow guidelines without ops bottlenecks.",
      link: "#prototype5",
      tags: ["Infrastructure", "Security", "Automation"],
      status: "Concept",
    },
    {
      title: "InfraOracle: Cost-Aware Architecture",
      description:
        "Analyzes cloud infrastructure and offers cost-saving suggestions using AI agents, with visual dashboards and memory of past decisions.",
      link: "#prototype6",
      tags: ["Cloud", "Cost Optimization", "AI Analysis"],
      status: "Concept",
    },
    {
      title: "Story Tags: QR Characters in the Wild",
      description:
        "Tourists scan QR codes at locations to chat with site-specific AI characters who tell stories and answer questions with growing memory.",
      link: "#prototype7",
      tags: ["Location-based", "Storytelling", "Tourism"],
      status: "Concept",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span style={{ color: "rgb(144, 19, 254)" }}>
              Interactive AI Experiences
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto bg-background/20 backdrop-blur-sm rounded-lg px-6 py-4">
            Creating AI-powered interactions that bring people together and
            enhance human connection
          </p>
          <Button
            size="lg"
            className="bg-gradient-primary text-white hover:shadow-glow transition-smooth"
            onClick={() => {
              document.getElementById("prototypes-section")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            Explore My Work
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Implemented Prototypes Section */}
      <section id="prototypes-section" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Live Prototypes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fully implemented interactive experiences ready to explore
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {implementedPrototypes.map((prototype, index) => (
              <Card
                key={index}
                className="group hover:shadow-elegant transition-smooth border-border/50 hover:border-primary/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-smooth">
                      {prototype.title}
                    </h3>
                    <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full font-medium border border-primary/30">
                      {prototype.status}
                    </span>
                  </div>
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
                  <a
                    href={prototype.link}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-primary text-primary-foreground hover:shadow-glow h-9 rounded-md px-3 w-full transition-smooth"
                  >
                    Try Live Demo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Prototype Ideas Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Prototype Ideas
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Concepts and ideas exploring the future of human-AI collaboration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prototypeIdeas.map((prototype, index) => (
              <Card
                key={index}
                className="group hover:shadow-elegant transition-smooth border-border/50 hover:border-muted-foreground/20 opacity-80"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-smooth">
                      {prototype.title}
                    </h3>
                    <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full font-medium">
                      {prototype.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {prototype.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {prototype.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs bg-muted/50 text-muted-foreground rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full transition-smooth"
                    disabled
                  >
                    Coming Soon
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
            I explore how AI can create meaningful interactions between people
            through thoughtful design and technology. My work combines
            human-computer interaction research with practical applications that
            make AI more accessible and genuinely helpful in bringing
            communities together.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Each prototype investigates different ways technology can enhance
            human connection - from collaborative learning experiences to
            immersive storytelling that bridges digital and physical worlds.
          </p>
        </div>
      </section>

      {/* Contact Section - Mobile Responsive */}
      <section className="mobile-section max-vw-100">
        <div className="container-mobile text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">
            Let's Connect
          </h2>
          <p className="mobile-text text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-mobile-safe">
            Interested in exploring how AI can enhance human connection? Let's
            discuss ideas and collaborate!
          </p>

          <div className="btn-group-mobile max-w-none sm:max-w-fit mx-auto">
            <Button
              variant="outline"
              size="default"
              className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              <Mail className="mr-2 mobile-icon" />
              <span className="mobile-text">Email</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              <Linkedin className="mr-2 mobile-icon" />
              <span className="mobile-text">LinkedIn</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              <Github className="mr-2 mobile-icon" />
              <span className="mobile-text">GitHub</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
