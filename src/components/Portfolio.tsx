import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Mail, Linkedin } from "lucide-react";
import heroVideo from "@/assets/find_your_path.mp4";
import heroPoster from "@/assets/find_your_path-poster.jpg";
import thisIsMe from "@/assets/this-is-me.jpg";
import {
  type Prototype,
  type Theme,
} from "./PortfolioPrototypeCard";
import { PortfolioThemeRail, type ThemeRailItem } from "./PortfolioThemeRail";
import { PortfolioThemeSection } from "./PortfolioThemeSection";

// Inlined low-quality placeholder (first video frame, 32px wide, ~284 bytes) so the
// hero paints instantly with zero network round-trip — eliminates the black flash
// while the poster JPG and full video stream in. Average frame color is the fallback.
const HERO_LQIP =
  "data:image/jpeg;base64,/9j//gAQTGF2YzYyLjExLjEwMAD/2wBDAAgYGBwYHCEhISEhISckJygoKCcnJycoKCgrKyszMzMrKysoKCsrMDAzMzc5NzQ0MzQ5OTw8PEhIRUVUVFdnZ3z/xABnAAACAwEBAQAAAAAAAAAAAAADAgYFBwAEAQEBAQEBAAAAAAAAAAAAAAAAAgEAAxAAAgEDAQkBAAAAAAAAAAAAAQACFBNxYQMSETHRYoFCMkERAQEBAQAAAAAAAAAAAAAAAAABERL/wAARCAAYACADASIAAhEAAxEA/9oADAMBAAIRAxEAPwCdVeH5WYYFLdj7E4HVrbpCuI2tPrT2p63SLlt4rXzo3iJqMnaE/p8oxJ8a0eb2BYB7isPkoCg3/9k=";

interface ThemeMeta {
  id: Theme;
  railLabel: string;
  title: string;
  blurb: string;
}

const THEMES: ReadonlyArray<ThemeMeta> = [
  {
    id: "coding-data-structures",
    railLabel: "Coding & Data Structures",
    title: "Coding & Data Structures Fundamentals",
    blurb:
      "Building intuition for the algorithms and data structures that power software — visual, scrubbable, and studyable.",
  },
  {
    id: "organizing-community-transformation",
    railLabel: "Organizing Community Transformation",
    title: "Organizing Community Transformation",
    blurb:
      "Tools for moving teams together through new capabilities, shared goals, and collective learning.",
  },
  {
    id: "enterprise-ai",
    railLabel: "Enterprise AI",
    title: "Enterprise AI",
    blurb:
      "Governance, evaluation, and strategy patterns for shipping AI inside larger organizations.",
  },
  {
    id: "enabling-ai-agents",
    railLabel: "Enabling AI Agents",
    title: "Enabling AI Agents",
    blurb:
      "Infrastructure, benchmarks, and simulations that make AI agents more effective collaborators on real work.",
  },
  {
    id: "domain-expertise-onboarding",
    railLabel: "Domain Expertise & Onboarding",
    title: "Domain Expertise & Onboarding",
    blurb:
      "Making complex professional domains learnable for newcomers stepping into the field.",
  },
  {
    id: "ai-augmented-knowledge-work",
    railLabel: "AI-Augmented Knowledge Work",
    title: "AI-Augmented Knowledge Work",
    blurb:
      "Platforms where AI extends what one person can research, synthesize, and publish.",
  },
  {
    id: "interactive-learning-patterns",
    railLabel: "Interactive Learning Patterns",
    title: "Interactive Learning Patterns",
    blurb:
      "Reusable interaction patterns for guided exploration, progress, and discovery across any domain.",
  },
];

const Portfolio = () => {
  const implementedPrototypes: ReadonlyArray<Prototype> = [
    {
      title: "AI Builders Portal: Community of Practice",
      description:
        "A community-of-practice platform for professionals learning to build with AI. Progress through three phases — Developing Intuition, Exercising Judgment, and Navigating Independently — with scaffolded challenges, live community sessions, a showcase gallery of member work, and peer feedback. Built around the idea that becoming an AI builder is about developing professional judgment, not just learning syntax.",
      link: "/prototypes/ai-builders/",
      tags: ["Community of Practice", "AI Builder", "Professional Development", "Challenges"],
      status: "Live Demo Available",
      theme: "organizing-community-transformation",
    },
    {
      title: "Research Workspace: AI-Powered Knowledge Platform",
      description:
        "A multi-user research platform with a public gallery and authenticated workspaces. Set learning intentions to have Claude Code research arXiv papers, then synthesize findings into cross-article narratives and architecture diagrams. Built with code-server, Foam, and Claude Code on ECS Fargate with per-user EFS vaults and Cognito authentication.",
      link: "/prototypes/research-workspace/",
      tags: ["Research Platform", "Claude Code", "Knowledge Management", "Automated Research"],
      status: "Live Demo Available",
      theme: "ai-augmented-knowledge-work",
    },
    {
      title: "Your Learning Adventure Map",
      description:
        "Ready to level up as a team? Set shared goals, share your personal growth dreams, and let AI be your career compass! Inspired by Final Fantasy X's Skill Sphere Grid, this interactive map helps you discover the perfect next skills to master, connects you with ideal mentors, and shows you who you could guide. It's like having a career GPS that knows where your team wants to go AND where your heart wants to grow. Adventure awaits!",
      link: "/prototypes/ffx-skill-map/",
      tags: ["Skill Mapping", "Graph Database", "Learning Pathways"],
      status: "Live Demo Available",
      theme: "organizing-community-transformation",
    },
    {
      title: "Learning Path: Recipes Explorer",
      description:
        "Explore a multi-section interactive experience: clustered recipe nodes, parchment-styled world cuisines list with progress tracking, and a hex-grid world map placement. Demonstrates shared design tokens and synchronized interactions.",
      link: "/prototypes/learning-path/",
      tags: ["Data Viz", "Interaction", "Synchronization"],
      status: "Live Demo Available",
      theme: "interactive-learning-patterns",
    },
    {
      title: "Home Lending Learning Platform",
      description:
        "Get a behind-the-scenes peek at the home loan journey! Explore interactive process maps, discover who's involved at each step, and learn what documents you'll need. Test your knowledge with fun quiz cards. For educational purposes only - your actual mortgage adventure may vary!",
      link: "/prototypes/home-lending-learning/",
      tags: ["Education", "Financial Services", "Process Flow", "Knowledge Testing"],
      status: "Live Demo Available",
      theme: "domain-expertise-onboarding",
    },
    {
      title: "AI Integration Strategy Visualizer",
      description:
        "A leadership communication tool that visualizes three organizational strategies for integrating AI into existing business systems. Animated 3D sphere constellations show how different team structures operate on the same data pipeline, with progressive disclosure into the before/after data model at each stage.",
      link: "/prototypes/ai-integration-visualizer/",
      tags: ["AI Strategy", "Data Pipeline", "Visualization", "Organization Design"],
      status: "Live Demo Available",
      theme: "enterprise-ai",
    },
    {
      title: "Island Algorithms Visualizer",
      description:
        "A Tron-inspired WebGL visualizer for the connected-components algorithm family. Step through DFS, BFS, Dijkstra, and DP solutions to the Number-of-Islands problem in 2D or fully volumetric 3D grids. A live codex explains the data structure, Big-O, and pseudocode at each step — a studyable, scrubbable LeetCode cheat sheet.",
      link: "/prototypes/island-algorithms-visualizer/",
      tags: ["Algorithms", "WebGL", "DFS/BFS", "Dijkstra", "Dynamic Programming"],
      status: "Live Demo Available",
      theme: "coding-data-structures",
    },
  ];

  const prototypeIdeas: ReadonlyArray<Prototype> = [
    {
      title: "Eval Trace Workspace: From Traces to Product Insight",
      description:
        "A reimagining of my earlier AI testing prototype. The first version walked through AI evaluation as an SDLC discipline; the next one is a workspace that automatically processes evaluation traces — clustering failures, surfacing recurring patterns, and turning raw eval runs into concrete, prioritized product-improvement recommendations. The original hosted demo has been retired while this trace-processing pipeline is built.",
      link: "#eval-trace-workspace",
      tags: ["AI Evaluation", "Trace Analysis", "Product Insights", "Eval Pipeline"],
      status: "Concept",
      theme: "enterprise-ai",
    },
    {
      title: "Onboarding Advisor Council",
      description:
        "A team of AI advisors guides new employees through company knowledge, helping them get productive quickly with role-based memory and stakeholder alignment.",
      link: "#prototype1",
      tags: ["Multi-agent", "Memory", "Onboarding"],
      status: "Concept",
      theme: "domain-expertise-onboarding",
    },
    {
      title: "Fog of Work: Priority Discovery Game",
      description:
        "Arrows emerge from fog with unknown origins. Ask questions about stakeholder priorities to dispel the cloud - correctly identifying priorities reveals full arrow paths. Align all arrows to help cross-functional teams find a unified path forward.",
      link: "#prototype2",
      tags: ["Visualization", "Organizational Learning", "AI Assessment"],
      status: "Concept",
      theme: "organizing-community-transformation",
    },
    {
      title: "Mind Palace: Gesture-Driven Knowledge Explorer",
      description:
        "Minority Report-style document exploration with floating summaries. Camera on! Use hand gestures to dive into data sources, select documents to see relationships. Voice commands add notes that integrate into the knowledge cloud, helping externalize your understanding.",
      link: "#prototype3",
      tags: ["Spatial UI", "Knowledge Management", "Gesture Control", "Voice Interface"],
      status: "Concept",
      theme: "ai-augmented-knowledge-work",
    },
    {
      title: "Guitar Spiral + Music Learning",
      description:
        "Interactive visual interface where musical notes spiral by pitch and octaves, with real-time chord-to-shape translation for guitar learning.",
      link: "#prototype4",
      tags: ["Music", "Visualization", "Learning"],
      status: "Concept",
      theme: "interactive-learning-patterns",
    },
    {
      title: "Conversing Forest / Living Museum",
      description:
        "Embodied AI agents simulate philosophical conversations about nature harmony. When visitors speak, agents pause and respond contextually.",
      link: "#prototype5",
      tags: ["Embodied AI", "Museum", "Interaction"],
      status: "Concept",
      theme: "interactive-learning-patterns",
    },
    {
      title: "Story Tags: QR Characters in the Wild",
      description:
        "Tourists scan QR codes at locations to chat with site-specific AI characters who tell stories and answer questions with growing memory.",
      link: "#prototype6",
      tags: ["Location-based", "Storytelling", "Tourism"],
      status: "Concept",
      theme: "interactive-learning-patterns",
    },
    {
      title: "AI Development Team Simulation",
      description:
        "A lightweight, always-on development team of AI agents that creates tickets, works on features, and presents demos with continuous collaboration.",
      link: "#prototype7",
      tags: ["Dev Team", "Automation", "Collaboration"],
      status: "Concept",
      theme: "enabling-ai-agents",
    },
    {
      title: "IAM Governance: Path to Production",
      description:
        "Infrastructure management that validates AWS IAM policies automatically, ensuring sandbox environments follow guidelines without ops bottlenecks.",
      link: "#prototype8",
      tags: ["Infrastructure", "Security", "Automation"],
      status: "Concept",
      theme: "enterprise-ai",
    },
    {
      title: "InfraOracle: Cost-Aware Architecture",
      description:
        "Analyzes cloud infrastructure and offers cost-saving suggestions using AI agents, with visual dashboards and memory of past decisions.",
      link: "#prototype9",
      tags: ["Cloud", "Cost Optimization", "AI Analysis"],
      status: "Concept",
      theme: "enabling-ai-agents",
    },
  ];

  const allPrototypes: ReadonlyArray<Prototype> = [
    ...implementedPrototypes,
    ...prototypeIdeas,
  ];

  const railItems: ReadonlyArray<ThemeRailItem> = THEMES.map((t) => ({
    id: t.id,
    label: t.railLabel,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          className="absolute inset-0 min-w-full min-h-full w-auto h-auto object-cover opacity-45"
          style={{
            // design-token-lint-ignore — average color of the hero video's first frame, sampled from the binary asset
            backgroundColor: "#767784",
            backgroundImage: `url("${HERO_LQIP}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          poster={heroPoster}
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="bg-background/20 backdrop-blur-sm rounded-lg px-6 py-8 mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent leading-tight pb-2">
              The Future is AI Native
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Build on your strenghts. Bring people together.<br />
              Create AI-powered interactions. Grow and access opportunities.
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

      {/* Themed Prototypes Section */}
      <section id="prototypes-section" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Explore by Theme
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              In her book "Exophony: Voyages Outside The Mother Tongue" by Yoko Tawada, Yoko presents a series of beautiful and witty essays.
              In one she describes how a thesaurus is unique from a dictionary, organizing words by meaning rather than spelling.
              These prototypes are part of my explorations of AI capabilities, platforms to organize people's personal discovery and growth, and design. 
              They are grouped Thesauratically by the questions they explore.
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
            <PortfolioThemeRail items={railItems} />
            <div className="mt-8 lg:mt-0">
              {THEMES.map((t) => (
                <PortfolioThemeSection
                  key={t.id}
                  id={t.id}
                  title={t.title}
                  blurb={t.blurb}
                  prototypes={allPrototypes.filter((p) => p.theme === t.id)}
                />
              ))}
            </div>
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
                I'm passionate about helping others learn and grow, and building things that matter. 
                I explore how AI can create meaningful interactions for people and communities.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I see immersive storytelling that bridges digital and physical worlds
                to create real opportunity for people and their communities as the future of learning.
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
            Interested in exploring how AI can enhance human connection and the future of learning, education, and creation?<br />
            Let's collaborate!
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
