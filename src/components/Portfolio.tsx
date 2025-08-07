import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Github, Mail, Linkedin } from "lucide-react";
import heroVideo from "@/assets/find_your_path.mp4";
import thisIsMe from "@/assets/this-is-me.jpg";

const Portfolio = () => {
  const implementedPrototypes = [
    {
      title: "Your Learning Adventure Map",
      description:
        "Ready to level up as a team? Set shared goals, share your personal growth dreams, and let AI be your career compass! Inspired by Final Fantasy X's Skill Sphere Grid, this interactive map helps you discover the perfect next skills to master, connects you with ideal mentors, and shows you who you could guide. It's like having a career GPS that knows where your team wants to go AND where your heart wants to grow. Adventure awaits!",
      link: "/prototypes/ffx-skill-map/",
      tags: ["Skill Mapping", "Graph Database", "Learning Pathways"],
      status: "Live Demo Available",
    },
    {
      title: "Home Lending Learning Platform",
      description:
        "Get a behind-the-scenes peek at the home loan journey! Explore interactive process maps, discover who's involved at each step, and learn what documents you'll need. Test your knowledge with fun quiz cards. For educational purposes only - your actual mortgage adventure may vary!",
      link: "/prototypes/home-lending-learning/",
      tags: ["Education", "Financial Services", "Process Flow", "Knowledge Testing"],
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
      title: "Fog of Work: Priority Discovery Game",
      description:
        "Arrows emerge from fog with unknown origins. Ask questions about stakeholder priorities to dispel the cloud - correctly identifying priorities reveals full arrow paths. Align all arrows to help cross-functional teams find a unified path forward.",
      link: "#prototype2",
      tags: ["Visualization", "Organizational Learning", "AI Assessment"],
      status: "Concept",
    },
    {
      title: "Mind Palace: Gesture-Driven Knowledge Explorer",
      description:
        "Minority Report-style document exploration with floating summaries. Camera on! Use hand gestures to dive into data sources, select documents to see relationships. Voice commands add notes that integrate into the knowledge cloud, helping externalize your understanding.",
      link: "#prototype3",
      tags: ["Spatial UI", "Knowledge Management", "Gesture Control", "Voice Interface"],
      status: "Concept",
    },
    {
      title: "Guitar Spiral + Music Learning",
      description:
        "Interactive visual interface where musical notes spiral by pitch and octaves, with real-time chord-to-shape translation for guitar learning.",
      link: "#prototype4",
      tags: ["Music", "Visualization", "Learning"],
      status: "Concept",
    },
    {
      title: "Conversing Forest / Living Museum",
      description:
        "Embodied AI agents simulate philosophical conversations about nature harmony. When visitors speak, agents pause and respond contextually.",
      link: "#prototype5",
      tags: ["Embodied AI", "Museum", "Interaction"],
      status: "Concept",
    },
    {
      title: "Story Tags: QR Characters in the Wild",
      description:
        "Tourists scan QR codes at locations to chat with site-specific AI characters who tell stories and answer questions with growing memory.",
      link: "#prototype6",
      tags: ["Location-based", "Storytelling", "Tourism"],
      status: "Concept",
    },
    {
      title: "AI Development Team Simulation",
      description:
        "A lightweight, always-on development team of AI agents that creates tickets, works on features, and presents demos with continuous collaboration.",
      link: "#prototype7",
      tags: ["Dev Team", "Automation", "Collaboration"],
      status: "Concept",
    },
    {
      title: "IAM Governance: Path to Production",
      description:
        "Infrastructure management that validates AWS IAM policies automatically, ensuring sandbox environments follow guidelines without ops bottlenecks.",
      link: "#prototype8",
      tags: ["Infrastructure", "Security", "Automation"],
      status: "Concept",
    },
    {
      title: "InfraOracle: Cost-Aware Architecture",
      description:
        "Analyzes cloud infrastructure and offers cost-saving suggestions using AI agents, with visual dashboards and memory of past decisions.",
      link: "#prototype9",
      tags: ["Cloud", "Cost Optimization", "AI Analysis"],
      status: "Concept",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          className="absolute inset-0 min-w-full min-h-full w-auto h-auto object-cover opacity-45"
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="bg-background/20 backdrop-blur-sm rounded-lg px-6 py-8 mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent leading-tight pb-2">
              Explore the Future of Learning with AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Create AI-powered interactions. Bring people together.<br />
              Enhance human connection. Grow and access opportunities.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gradient-primary text-white hover:shadow-glow transition-smooth text-lg md:text-xl px-8 py-6"
            onClick={() => {
              document.getElementById("prototypes-section")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            Explore My Work
            <ExternalLink className="ml-2 h-6 w-6" />
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
              Interactive learning experiences ready to explore
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
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-smooth mb-3">
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
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent text-center">About Me</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/3">
              <img 
                src={thisIsMe} 
                alt="Nathan Suberi" 
                className="rounded-lg shadow-lg w-full h-auto object-cover"
              />
            </div>
            <div className="w-full md:w-2/3 text-center md:text-left">
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                As an experienced educator and lifelong learner, I'm passionate about
                helping others learn and grow. I explore how AI can create meaningful 
                interactions between people through thoughtful design of learning experiences.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Each prototype in this portfolio investigates ways technology can enhance
                the human experience by helping to reveal opportunities for personal and communal growth.
                Immersive storytelling that bridges digital and physical worlds
                to create real opportunity for people and their communities is the future of learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Mobile Responsive */}
      <section className="mobile-section max-vw-100">
        <div className="container-mobile text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">
            Let's Connect
          </h2>
          <p className="mobile-text text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-mobile-safe">
            Interested in exploring how AI can enhance human connection and the future of learning and education?<br />
            Let's discuss ideas and collaborate!
          </p>

          <div className="btn-group-mobile max-w-none sm:max-w-fit mx-auto">
            <Button
              variant="outline"
              size="default"
              className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
              onClick={() => window.location.href = "mailto:nsuberi@gmail.com"}
            >
              <Mail className="mr-2 mobile-icon" />
              <span className="mobile-text">Email</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
              onClick={() => window.open("https://www.linkedin.com/in/nathan-suberi-3b13a818/", "_blank")}
            >
              <Linkedin className="mr-2 mobile-icon" />
              <span className="mobile-text">LinkedIn</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
              onClick={() => window.open("https://github.com/nsuberi", "_blank")}
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
