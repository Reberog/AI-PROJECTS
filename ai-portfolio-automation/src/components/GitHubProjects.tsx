import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import { ArrowUpRight, FolderGit2, Github, Loader2, Star, Calendar, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GH_OWNER = "Reberog";
const GH_REPO = "AI-PROJECTS";
const GH_BRANCH = "main";

// Initialize Mermaid with minimal styling (keep original diagram colors)
mermaid.initialize({
  startOnLoad: true,
  theme: 'default', // Use default theme to preserve original colors
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
});

// Mermaid diagram component with zoom and pan
function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (ref.current && chart) {
      // Generate a unique ID for this diagram
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      mermaid.render(id, chart).then(({ svg }) => {
        setSvg(svg);
      }).catch((error) => {
        console.error('Mermaid rendering error:', error);
      });
    }
  }, [chart]);

  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(1.5); // Zoom in
    } else {
      setZoom(1); // Zoom out
      setPosition({ x: 0, y: 0 }); // Reset position
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={ref} 
      className="mermaid-diagram rounded-2xl border border-border bg-white p-6 overflow-hidden relative"
      style={{ 
        cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'pointer'),
        userSelect: 'none',
      }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.3s ease',
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {zoom === 1 && (
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          Double-click to zoom
        </div>
      )}
      {zoom > 1 && (
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          Drag to pan • Double-click to reset
        </div>
      )}
    </div>
  );
}

type Folder = { name: string; path: string };

type RankedProject = {
  name: string;
  path: string;
  score: number;
  summary: string;
  highlights: string[];
  tech_stack: string[];
  strengths: string;
  use_case: string;
  last_commit?: string;
  analyzed_at: string;
};

async function fetchRankedProjects(): Promise<RankedProject[]> {
  // Try to fetch from local JSON file (if using static approach)
  try {
    const res = await fetch("/api/project_rankings.json");
    if (res.ok) {
      const data = await res.json();
      return data.top_3 || [];
    }
  } catch (e) {
    console.log("Local rankings not found, falling back to API or empty");
  }

  // Fallback: return empty array (you'll need to run the Python script first)
  return [];
}

async function checkForUpdates(): Promise<{ updated: boolean; rankings?: any }> {
  try {
    console.log('🔍 Checking for repository updates...');
    const res = await fetch("/api/check-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      console.error(`Failed to check updates: ${res.status}`);
      return { updated: false };
    }
    
    const data = await res.json();
    console.log('✅ Update check complete:', data.message);
    
    if (data.updated && data.rankings) {
      console.log('🎉 New rankings available, updating local data...');
      // In a real app, you'd update the JSON file here
      // For now, we'll just return the data to refresh the UI
      return { updated: true, rankings: data.rankings };
    }
    
    return { updated: false };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { updated: false };
  }
}

async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/`,
  );
  if (!res.ok) throw new Error("Failed to load repo");
  const data: Array<{ type: string; name: string; path: string }> = await res.json();
  return data.filter((x) => x.type === "dir" && !x.name.startsWith(".")).map((x) => ({
    name: x.name,
    path: x.path,
  }));
}

async function fetchRawFile(path: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  
  console.log(`🌐 Fetching: ${url}`);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`❌ Failed to fetch (${res.status}): ${url}`);
      return null;
    }
    const text = await res.text();
    console.log(`✅ Successfully fetched (${text.length} chars)`);
    return text;
  } catch (error) {
    console.error(`❌ Error fetching: ${url}`, error);
    return null;
  }
}

async function fetchProjectDocs(folder: string) {
  console.log(`\n📥 ========================================`);
  console.log(`📥 Fetching docs for folder: "${folder}"`);
  console.log(`📥 ========================================`);
  
  // Try common casings for each doc
  const tries = async (names: string[]) => {
    for (const n of names) {
      console.log(`🔍 Trying: ${folder}/${n}`);
      const t = await fetchRawFile(`${folder}/${n}`);
      if (t) {
        console.log(`✅ Found: ${n}`);
        return t;
      }
    }
    console.log(`❌ None of the variants found`);
    return null;
  };
  
  const [readme, architecture] = await Promise.all([
    tries(["README.md", "readme.md", "Readme.md"]),
    tries(["architecture.md", "ARCHITECTURE.md", "Architecture.md"]),
  ]);
  
  console.log(`\n📊 Results:`);
  console.log(`📄 README found: ${readme ? 'YES (' + readme.length + ' chars)' : 'NO'}`);
  console.log(`🏗️  Architecture found: ${architecture ? 'YES (' + architecture.length + ' chars)' : 'NO'}`);
  console.log(`========================================\n`);
  
  return { readme, architecture };
}

function prettify(name: string) {
  return name.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return "Unknown";
  }
}

// Function to extract image URL from architecture markdown
function extractArchitectureImage(markdown: string | null): string | null {
  if (!markdown) return null;
  
  // Match markdown image syntax: ![alt](url) or ![alt](url "title")
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [...markdown.matchAll(imageRegex)];
  
  if (matches.length > 0) {
    // Return the first image URL found
    return matches[0][2].trim().split(/\s+/)[0]; // Remove optional title
  }
  
  return null;
}

// Function to extract Mermaid diagrams from markdown
function extractMermaidDiagrams(markdown: string | null): string[] {
  if (!markdown) return [];
  
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  const diagrams: string[] = [];
  let match;
  
  while ((match = mermaidRegex.exec(markdown)) !== null) {
    diagrams.push(match[1].trim());
  }
  
  return diagrams;
}

// Function to remove Mermaid diagrams from markdown (to avoid duplicate rendering)
function removeMermaidFromMarkdown(markdown: string | null): string {
  if (!markdown) return "";
  return markdown.replace(/```mermaid\n[\s\S]*?```/g, "");
}

export default function GitHubProjects() {
  const [active, setActive] = useState<RankedProject | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  const rankedProjects = useQuery({ 
    queryKey: ["gh-ranked-projects"], 
    queryFn: fetchRankedProjects,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const folders = useQuery({ 
    queryKey: ["gh-folders"], 
    queryFn: fetchFolders,
    enabled: !rankedProjects.data || rankedProjects.data.length === 0, // Only fetch if no ranked data
  });

  const docs = useQuery({
    queryKey: ["gh-docs", active?.path],
    queryFn: () => {
      console.log('🚀 STARTING FETCH - Active project path:', active?.path);
      return fetchProjectDocs(active!.path);
    },
    enabled: !!active,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache (formerly cacheTime in v5)
  });

  // Check for updates on component mount
  useEffect(() => {
    const checkUpdates = async () => {
      setIsCheckingUpdates(true);
      const result = await checkForUpdates();
      setIsCheckingUpdates(false);
      
      if (result.updated) {
        // Refetch projects to show updated rankings
        rankedProjects.refetch();
      }
    };

    // Only check for updates if we have existing rankings
    if (rankedProjects.data && rankedProjects.data.length > 0) {
      checkUpdates();
    }
  }, []); // Run once on mount

  // Use ranked projects if available, otherwise fall back to regular folders
  const projectsToDisplay = rankedProjects.data && rankedProjects.data.length > 0
    ? rankedProjects.data
    : folders.data?.slice(0, 3) || [];

  const isLoading = rankedProjects.isLoading || (projectsToDisplay.length === 0 && folders.isLoading);
  const hasError = rankedProjects.error || folders.error;
  const usingRankedData = rankedProjects.data && rankedProjects.data.length > 0;

  return (
    <>
      {/* Update check indicator */}
      {isCheckingUpdates && (
        <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <div className="flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-accent animate-spin mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                🔄 Checking for repository updates...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Comparing commit SHAs and re-analyzing projects if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      {!usingRankedData && projectsToDisplay.length > 0 && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                💡 Want AI-powered project rankings?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Run the Python analyzer in the <code className="px-1.5 py-0.5 rounded bg-background/50">/api</code> folder to let Gemini AI analyze and rank your top 3 projects!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading && (
          <div className="col-span-full flex items-center gap-3 rounded-2xl border border-border bg-card p-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading projects from GitHub…
          </div>
        )}
        {hasError && (
          <div className="col-span-full rounded-2xl border border-destructive/40 bg-card p-8 text-sm text-muted-foreground">
            Couldn't reach GitHub right now. Try again in a moment.
          </div>
        )}
        {projectsToDisplay.map((project, i) => {
          const isRanked = 'score' in project;
          const rankedProject = isRanked ? project as RankedProject : null;
          const projectName = isRanked ? project.name : (project as Folder).name;
          const projectPath = isRanked ? project.path : (project as Folder).path;

          return (
            <motion.button
              key={projectPath}
              onClick={() => {
                if (isRanked) {
                  setActive(rankedProject);
                } else {
                  // Convert Folder to RankedProject format for consistency
                  setActive({
                    name: projectName,
                    path: projectPath,
                    score: 0,
                    summary: "Click to view the project architecture diagram.",
                    highlights: [],
                    tech_stack: [],
                    strengths: "",
                    use_case: "",
                    analyzed_at: new Date().toISOString(),
                  });
                }
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-left transition hover:border-primary/40"
            >
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FolderGit2 className="h-8 w-8 text-primary" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>

                <h3 className="mt-6 font-display text-2xl font-bold capitalize">
                  {prettify(projectName)}
                </h3>

                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {isRanked ? rankedProject!.summary : "Click to view the project architecture diagram."}
                </p>

                {isRanked && rankedProject!.tech_stack.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {rankedProject!.tech_stack.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-border bg-background/50 px-3 py-1 font-mono text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {!isRanked && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-full border border-border bg-background/50 px-3 py-1 font-mono text-xs">
                      architecture.md
                    </span>
                  </div>
                )}

                {isRanked && rankedProject!.last_commit && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Updated {formatDate(rankedProject!.last_commit)}</span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open('https://github.com/Reberog/AI-PROJECTS', '_blank', 'noopener,noreferrer');
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:border-primary/40 transition cursor-pointer"
        >
          <Github className="h-4 w-4" /> View full repo on GitHub
        </button>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-card border-border">
          <DialogHeader className="border-b border-border px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-display text-2xl capitalize">
                  {active && prettify(active.name)}
                </DialogTitle>
                {active && active.last_commit && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Updated {formatDate(active.last_commit)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis Section */}
            {active && active.score > 0 && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-border bg-background/50 p-4">
                  <p className="text-sm text-muted-foreground">{active.summary}</p>
                </div>

                {active.highlights.length > 0 && (
                  <div className="rounded-xl border border-border bg-background/50 p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> Key Highlights
                    </h4>
                    <ul className="space-y-1.5">
                      {active.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-muted-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {active.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {active.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {active && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = `https://github.com/${GH_OWNER}/${GH_REPO}/tree/${GH_BRANCH}/${encodeURIComponent(active.path)}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs hover:border-primary/40 transition cursor-pointer"
                >
                  <Github className="h-3 w-3" /> View on GitHub
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
            {docs.isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching architecture from GitHub…
              </div>
            )}
            
            {docs.data && docs.data.architecture && (
              <>
                {/* Extract and render Mermaid diagrams */}
                {(() => {
                  const mermaidDiagrams = extractMermaidDiagrams(docs.data.architecture);
                  
                  if (mermaidDiagrams.length > 0) {
                    console.log(`🎨 Found ${mermaidDiagrams.length} Mermaid diagram(s)`);
                    return (
                      <div className="space-y-6">
                        {mermaidDiagrams.map((diagram, idx) => (
                          <MermaidDiagram key={idx} chart={diagram} />
                        ))}
                      </div>
                    );
                  }
                  
                  // Fallback: Check for image URLs
                  const imageUrl = extractArchitectureImage(docs.data.architecture);
                  if (imageUrl) {
                    const fullImageUrl = imageUrl.startsWith('http') 
                      ? imageUrl 
                      : `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${active?.path}/${imageUrl}`;
                    
                    console.log('🖼️ Architecture image URL:', fullImageUrl);
                    
                    return (
                      <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden">
                        <img 
                          src={fullImageUrl} 
                          alt="Architecture Diagram" 
                          className="w-full h-auto"
                          onLoad={() => console.log('✅ Image loaded successfully')}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', fullImageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  }
                  
                  console.log('⚠️ No Mermaid diagram or image found in architecture.md');
                  return null;
                })()}
                
                {/* Architecture markdown content (with Mermaid removed) */}
                {(() => {
                  const markdownWithoutMermaid = removeMermaidFromMarkdown(docs.data.architecture);
                  if (markdownWithoutMermaid.trim()) {
                    return (
                      <article className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:font-display prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-background/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-background prose-pre:border prose-pre:border-border prose-img:rounded-xl prose-img:border prose-img:border-border">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {markdownWithoutMermaid}
                        </ReactMarkdown>
                      </article>
                    );
                  }
                  return null;
                })()}
              </>
            )}
            
            {docs.data && !docs.data.architecture && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  No architecture.md found in this project.
                </p>
                <a
                  href={`https://github.com/${GH_OWNER}/${GH_REPO}/tree/${GH_BRANCH}/${active?.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
                >
                  <Github className="h-4 w-4" />
                  View Project on GitHub
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
