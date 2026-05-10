import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Mail, Github, Linkedin, MapPin, ArrowUpRight, Sparkles,
  Brain, Database, Cloud, Award, GraduationCap, Trophy,
  Plane, Globe2, Crown, Tv, Music, Mountain,
} from "lucide-react";
import profilePic from "@/assets/profile.jpeg";
import GitHubProjects from "@/components/GitHubProjects";
import Skills from "@/components/Skills";

export const Route = createFileRoute("/")({
  component: Portfolio,
  head: () => ({
    meta: [
      { title: "Arpan Anand — AI/ML Engineer & Data Scientist" },
      {
        name: "description",
        content:
          "Portfolio of Arpan Anand — Data Scientist & Gen AI Engineer building production LLM, NL-to-SQL, and ML systems.",
      },
    ],
  }),
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Section({
  id, eyebrow, title, children,
}: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
      <motion.div {...fadeUp} className="mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-4xl font-bold md:text-6xl">{title}</h2>
      </motion.div>
      {children}
    </section>
  );
}

function Portfolio() {
  return (
    <main className="min-h-screen">
      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="font-display text-lg font-bold tracking-tight">
            arpan<span className="text-primary">.</span>
          </a>
          <div className="hidden gap-8 md:flex">
            {["about", "experience", "projects", "certificates", "hobbies", "contact"].map((s) => (
              <a key={s} href={`#${s}`} className="text-sm capitalize text-muted-foreground hover:text-foreground transition">
                {s}
              </a>
            ))}
          </div>
          <a
            href="mailto:arpananand1903@gmail.com"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Let's talk <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section id="top" className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Open to AI / ML Engineer roles
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] md:text-7xl lg:text-8xl">
              Arpan <span className="text-primary">Anand</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
              Data Scientist & Gen AI Engineer shipping production LLM,
              NL-to-SQL, and ML systems at <span className="text-foreground font-medium">Societe Generale</span>.
              Obsessed with turning messy enterprise data into measurable impact.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#projects" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 transition">
                See my work <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-5 py-3 font-medium hover:bg-card transition">
                Get in touch
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Bengaluru, India</span>
              <a href="https://github.com/arpananand" target="_blank" rel="noreferrer" className="hover:text-foreground"><Github className="h-5 w-5" /></a>
              <a href="https://linkedin.com/in/arpananand" target="_blank" rel="noreferrer" className="hover:text-foreground"><Linkedin className="h-5 w-5" /></a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="absolute -inset-6 rounded-3xl bg-primary/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
              <img src={profilePic} alt="Arpan Anand" className="aspect-[4/5] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-5">
                <p className="font-mono text-xs uppercase tracking-widest text-primary">currently</p>
                <p className="mt-1 font-display text-lg">Building Gen AI @ SocGen</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* impact strip */}
        <motion.div {...fadeUp} className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {[
            { v: "95%", l: "manual effort cut" },
            { v: "100+", l: "ETL workflows monitored" },
            { v: "8+ hrs", l: "saved / activity" },
            { v: "2+ yrs", l: "production ML / GenAI" },
          ].map((s) => (
            <div key={s.l} className="bg-card p-6">
              <p className="font-display text-3xl font-bold text-primary md:text-4xl">{s.v}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ABOUT */}
      <Section id="about" eyebrow="01 — about" title="Builder of intelligent data systems.">
        <div className="grid gap-10 md:grid-cols-3">
          <motion.p {...fadeUp} className="text-lg leading-relaxed text-muted-foreground md:col-span-2">
            I'm a Data Scientist and Gen AI Engineer with 2+ years at Societe Generale building
            production ML systems, Gen AI pipelines, and large-scale ETL automation in a global
            banking environment. I've shipped work that cut manual effort by up to{" "}
            <span className="text-foreground font-semibold">95%</span> and saved thousands of
            operational hours. I love working at the intersection of LLMs, retrieval, and real
            enterprise data — where the model is only half the problem.
          </motion.p>
          <motion.div {...fadeUp}>
            <Skills />
          </motion.div>
        </div>
      </Section>

      {/* EXPERIENCE */}
      <Section id="experience" eyebrow="02 — experience" title="Where I've shipped.">
        <motion.div {...fadeUp} className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-bold md:text-3xl">Societe Generale</h3>
              <p className="mt-1 text-primary">Software Engineer — Data, ML & Gen AI</p>
            </div>
            <p className="font-mono text-sm text-muted-foreground">Jul 2023 — Present · Bengaluru</p>
          </div>
          <ul className="mt-8 space-y-5 text-muted-foreground">
            {[
              <>Built a production <span className="text-foreground font-medium">NL-to-SQL system</span> (LangChain + OpenAI GPT + SQLAlchemy) translating natural language to live DB results — enabling non-technical stakeholders to query data with zero SQL knowledge.</>,
              <>Developed a <span className="text-foreground font-medium">hybrid ML + rule-based reconciliation engine</span> combining XGBoost with deterministic logic — significantly reducing reconciliation cycle time in production banking.</>,
              <>Engineered a <span className="text-foreground font-medium">centralized monitoring framework</span> for 100+ Informatica workflows — reducing manual debugging by 80%, saving 3+ hrs/day.</>,
              <>Built a <span className="text-foreground font-medium">weekend operations automation system</span> in Python — reducing manual effort by 95% and saving 8+ hrs/activity.</>,
              <>Designed a <span className="text-foreground font-medium">unified execution dashboard</span> for real-time distributed script monitoring — saving 30+ min/day across the team.</>,
              <>Built scalable <span className="text-foreground font-medium">Informatica ETL pipelines</span> with Jenkins + GitHub CI/CD across staging and production.</>,
              <>Contributed to a company-wide <span className="text-foreground font-medium">cyber resiliency initiative</span> across critical banking systems.</>,
            ].map((item, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Education */}
        <motion.div {...fadeUp} className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { school: "VIT University, Vellore", deg: "B.Tech, Information Technology", meta: "2019 – 2023 · CGPA 8.97/10" },
            { school: "Lal Bahadur Shastri School, Delhi", deg: "Senior Secondary — Science (Math)", meta: "2019 · 91.8%" },
          ].map((e) => (
            <div key={e.school} className="rounded-2xl border border-border bg-card p-6">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h4 className="mt-3 font-display text-lg font-semibold">{e.school}</h4>
              <p className="text-sm text-muted-foreground">{e.deg}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{e.meta}</p>
            </div>
          ))}
        </motion.div>
      </Section>

      {/* PROJECTS */}
      <Section id="projects" eyebrow="03 — projects" title="Selected work.">
        <motion.p {...fadeUp} className="mb-10 max-w-2xl text-muted-foreground">
          Projects pulled live from my{" "}
          <a
            href="https://github.com/Reberog/AI-PROJECTS"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            AI-PROJECTS
          </a>{" "}
          GitHub repo. Click any project to read its README and architecture docs.
        </motion.p>
        <GitHubProjects />
      </Section>

      {/* CERTIFICATES & AWARDS */}
      <Section id="certificates" eyebrow="04 — credentials" title="Certificates & awards.">
        <div className="grid gap-8 md:grid-cols-2">
          <motion.div {...fadeUp}>
            <h3 className="mb-5 flex items-center gap-2 font-display text-xl"><Award className="h-5 w-5 text-primary" /> Certifications</h3>
            <div className="space-y-3">
              {[
                ["DeepLearning.AI", "Generative AI with LLMs"],
                ["Microsoft Azure", "Data Fundamentals (DP-900)"],
                ["HuggingFace", "NLP with Transformers"],
                ["Kaggle", "ML & Feature Engineering"],
              ].map(([org, name]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{org}</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp}>
            <h3 className="mb-5 flex items-center gap-2 font-display text-xl"><Trophy className="h-5 w-5 text-primary" /> Awards & Recognition</h3>
            <div className="space-y-3">
              {[
                ["Spot Award — Responsibility", "Recognised by SocGen for ownership of critical deliverables."],
                ["1st Prize — ML Hackathon", "Winner of company-wide internal ML Hackathon at SocGen."],
                ["Newbie Award", "Strong onboarding, rapid ramp-up, early team contributions."],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* HOBBIES */}
      <Section id="hobbies" eyebrow="05 — off the clock" title="Beyond the terminal.">
        <motion.p {...fadeUp} className="mb-10 max-w-2xl text-muted-foreground">
          Outside of work I chase mountains, board planes, study geopolitics, and lose
          chess games gracefully. A space for pictures and videos from the trail —
          coming soon.
        </motion.p>
        <motion.div {...fadeUp} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { Icon: Plane, label: "Travel" },
            { Icon: Globe2, label: "Geopolitics" },
            { Icon: Crown, label: "Chess" },
            { Icon: Tv, label: "Anime" },
            { Icon: Music, label: "Music" },
            { Icon: Mountain, label: "Adventure" },
          ].map(({ Icon, label }) => (
            <div key={label} className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:bg-card/80">
              <Icon className="h-8 w-8 text-primary transition group-hover:scale-110" />
              <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </motion.div>
        <motion.div {...fadeUp} className="mt-6 flex h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
          Drop in your travel & adventure photos here.
        </motion.div>
      </Section>

      {/* CONTACT */}
      <Section id="contact" eyebrow="06 — contact" title="Let's build something.">
        <motion.div {...fadeUp} className="rounded-3xl border border-border bg-gradient-to-br from-card to-background p-10 md:p-16">
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            I'm currently exploring AI / ML Engineer roles where I can ship production
            Gen AI and ML systems. If that sounds like your team — let's talk.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="mailto:arpananand1903@gmail.com"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 transition"
            >
              <Mail className="h-4 w-4" />
              <span>arpananand1903@gmail.com</span>
            </a>
            <a href="https://linkedin.com/in/arpananand" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-medium hover:border-primary/40 transition">
              <Linkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </a>
            <a href="https://github.com/arpananand" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-medium hover:border-primary/40 transition">
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <a href="tel:+916202906508" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-medium hover:border-primary/40 transition">
              +91 6202906508
            </a>
          </div>
        </motion.div>
      </Section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Arpan Anand. Built with intent.</p>
      </footer>
    </main>
  );
}
