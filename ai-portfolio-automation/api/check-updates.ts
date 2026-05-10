/**
 * API Endpoint: Check for new commits and re-rank projects if needed
 * 
 * This endpoint:
 * 1. Fetches latest commit SHAs for all projects
 * 2. Compares with stored SHAs in project_rankings.json
 * 3. If commits are new, fetches README and calls Gemini LLM
 * 4. Updates rankings and returns fresh data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GH_OWNER = 'Reberog';
const GH_REPO = 'AI-PROJECTS';
const GH_BRANCH = 'main';

interface ProjectCommitInfo {
  path: string;
  sha: string;
  date: string;
}

interface RankedProject {
  name: string;
  path: string;
  score: number;
  summary: string;
  highlights: string[];
  tech_stack: string[];
  strengths: string;
  use_case: string;
  last_commit: string;
  last_commit_sha: string;
  analyzed_at: string;
}

interface RankingsData {
  last_updated: string;
  last_check: string;
  total_projects: number;
  projects: RankedProject[];
  top_3: RankedProject[];
}

/**
 * Fetch latest commit for a specific project folder
 */
async function fetchLatestCommit(path: string): Promise<ProjectCommitInfo | null> {
  try {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/commits?path=${encodedPath}&per_page=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-App',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch commits for ${path}: ${response.status}`);
      return null;
    }

    const commits = await response.json();
    if (commits.length === 0) return null;

    const latestCommit = commits[0];
    return {
      path,
      sha: latestCommit.sha,
      date: latestCommit.commit.author.date,
    };
  } catch (error) {
    console.error(`Error fetching commit for ${path}:`, error);
    return null;
  }
}

/**
 * Fetch README content from GitHub
 */
async function fetchReadme(path: string): Promise<string | null> {
  const readmeVariants = ['README.md', 'readme.md', 'Readme.md'];
  
  for (const variant of readmeVariants) {
    try {
      const encodedPath = `${path}/${variant}`.split('/').map(encodeURIComponent).join('/');
      const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${encodedPath}`;
      
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Analyze project using Gemini LLM
 */
async function analyzeProjectWithGemini(projectName: string, readme: string): Promise<Partial<RankedProject> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Analyze this GitHub project and provide a detailed assessment.

Project Name: ${projectName}
README Content:
${readme}

Please provide your analysis in the following JSON format (return ONLY valid JSON, no markdown):
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "highlights": ["<key feature 1>", "<key feature 2>", "<key feature 3>"],
  "tech_stack": ["<technology 1>", "<technology 2>", ...],
  "strengths": "<what makes this project stand out>",
  "use_case": "<primary use cases>"
}

Scoring criteria:
- Technical complexity & innovation (30 points)
- Code quality & documentation (25 points)
- Real-world applicability (25 points)
- LLM/AI integration depth (20 points)
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response');
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing with Gemini:', error);
    return null;
  }
}

/**
 * Main handler function
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Load current rankings
    const rankingsResponse = await fetch(`${req.url.split('/api/')[0]}/api/project_rankings.json`);
    const currentRankings: RankingsData = await rankingsResponse.json();

    console.log('🔍 Checking for updates...');
    console.log(`Last check: ${currentRankings.last_check}`);

    // Fetch all project folders from GitHub
    const foldersResponse = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Portfolio-App',
        },
      }
    );

    if (!foldersResponse.ok) {
      throw new Error('Failed to fetch repository contents');
    }

    const contents = await foldersResponse.json();
    const projectFolders = contents
      .filter((item: any) => item.type === 'dir' && !item.name.startsWith('.'))
      .map((item: any) => item.path);

    console.log(`Found ${projectFolders.length} project folders`);

    // Check commits for each project
    const commitChecks = await Promise.all(
      projectFolders.map((path: string) => fetchLatestCommit(path))
    );

    const validCommits = commitChecks.filter(c => c !== null) as ProjectCommitInfo[];

    // Identify projects with new commits
    const projectsNeedingUpdate: string[] = [];
    
    for (const commitInfo of validCommits) {
      const existingProject = currentRankings.projects.find(p => p.path === commitInfo.path);
      
      if (!existingProject) {
        // New project discovered
        console.log(`🆕 New project found: ${commitInfo.path}`);
        projectsNeedingUpdate.push(commitInfo.path);
      } else if (existingProject.last_commit_sha !== commitInfo.sha) {
        // Existing project with new commit
        console.log(`🔄 New commit in: ${commitInfo.path}`);
        console.log(`  Old SHA: ${existingProject.last_commit_sha}`);
        console.log(`  New SHA: ${commitInfo.sha}`);
        projectsNeedingUpdate.push(commitInfo.path);
      }
    }

    if (projectsNeedingUpdate.length === 0) {
      console.log('✅ No updates needed');
      return new Response(
        JSON.stringify({
          updated: false,
          message: 'No new commits detected',
          last_check: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`📝 Analyzing ${projectsNeedingUpdate.length} project(s)...`);

    // Re-analyze projects with new commits
    const updatedProjects: RankedProject[] = [...currentRankings.projects];

    for (const projectPath of projectsNeedingUpdate) {
      console.log(`\n🤖 Analyzing: ${projectPath}`);
      
      const readme = await fetchReadme(projectPath);
      if (!readme) {
        console.log(`⚠️  No README found for ${projectPath}`);
        continue;
      }

      const commitInfo = validCommits.find(c => c.path === projectPath);
      if (!commitInfo) continue;

      const analysis = await analyzeProjectWithGemini(projectPath, readme);
      if (!analysis) {
        console.log(`⚠️  Analysis failed for ${projectPath}`);
        continue;
      }

      const updatedProject: RankedProject = {
        name: projectPath,
        path: projectPath,
        score: analysis.score || 0,
        summary: analysis.summary || '',
        highlights: analysis.highlights || [],
        tech_stack: analysis.tech_stack || [],
        strengths: analysis.strengths || '',
        use_case: analysis.use_case || '',
        last_commit: commitInfo.date,
        last_commit_sha: commitInfo.sha,
        analyzed_at: new Date().toISOString(),
      };

      // Update or add project
      const existingIndex = updatedProjects.findIndex(p => p.path === projectPath);
      if (existingIndex >= 0) {
        updatedProjects[existingIndex] = updatedProject;
      } else {
        updatedProjects.push(updatedProject);
      }

      console.log(`✅ ${projectPath}: Score ${updatedProject.score}/100`);
    }

    // Sort by score and get top 3
    updatedProjects.sort((a, b) => b.score - a.score);
    const top3 = updatedProjects.slice(0, 3);

    const newRankings: RankingsData = {
      last_updated: new Date().toISOString(),
      last_check: new Date().toISOString(),
      total_projects: updatedProjects.length,
      projects: updatedProjects,
      top_3: top3,
    };

    console.log(`\n🎉 Rankings updated! Top 3:`);
    top3.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.score}/100)`);
    });

    return new Response(
      JSON.stringify({
        updated: true,
        message: `Re-analyzed ${projectsNeedingUpdate.length} project(s)`,
        rankings: newRankings,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in check-updates handler:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to check for updates',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
