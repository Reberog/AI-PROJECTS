#!/usr/bin/env node

/**
 * Update Script - Checks GitHub for new commits and updates project rankings
 * Run with: node update-projects.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables if .env file exists
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key.trim()] = value;
      }
    });
  }
} catch (e) {
  // Ignore if .env doesn't exist
}

// Configuration
const GH_OWNER = 'Reberog';
const GH_REPO = 'AI-PROJECTS';
const RANKINGS_PATH = path.join(__dirname, 'public/api/project_rankings.json');
const SKILLS_PATH = path.join(__dirname, 'public/api/skills.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Skill categories with common technologies
const SKILL_CATEGORIES = {
  'Languages': ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'SQL', 'R', 'Julia'],
  'AI/ML': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'OpenAI', 'LangChain', 'Hugging Face', 'NLTK', 'spaCy', 'Transformers', 'LLM', 'Gemini', 'GPT', 'Claude'],
  'Web Frameworks': ['React', 'Next.js', 'Vue', 'Angular', 'FastAPI', 'Flask', 'Django', 'Express', 'Node.js', 'Vite'],
  'Databases': ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Neo4j', 'Cassandra', 'DynamoDB'],
  'Cloud & DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins'],
  'Data Tools': ['Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Plotly', 'Apache Spark', 'Airflow', 'Kafka'],
  'Other': []
};

function categorizeSkill(skill) {
  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (category === 'Other') continue;
    
    // Check for exact match or partial match
    if (skills.some(s => s.toLowerCase() === skill.toLowerCase() || 
                         skill.toLowerCase().includes(s.toLowerCase()) ||
                         s.toLowerCase().includes(skill.toLowerCase()))) {
      return category;
    }
  }
  return 'Other';
}

/**
 * Aggregate skills from all projects and update global skills.json
 */
function updateGlobalSkills(projects) {
  console.log('\n🔧 Aggregating global skills...');
  
  // Initialize categories with empty arrays
  const skillsByCategory = {};
  Object.keys(SKILL_CATEGORIES).forEach(category => {
    skillsByCategory[category] = [];
  });
  
  // Collect all unique skills from all projects
  const allSkills = new Set();
  projects.forEach(project => {
    if (project.tech_stack && Array.isArray(project.tech_stack)) {
      project.tech_stack.forEach(skill => allSkills.add(skill));
    }
  });
  
  // Categorize each skill
  allSkills.forEach(skill => {
    const category = categorizeSkill(skill);
    if (!skillsByCategory[category].includes(skill)) {
      skillsByCategory[category].push(skill);
    }
  });
  
  // Sort skills within each category
  Object.keys(skillsByCategory).forEach(category => {
    skillsByCategory[category].sort();
  });
  
  // Create the skills object
  const skillsData = {
    last_updated: new Date().toISOString(),
    total_skills: allSkills.size,
    categories: skillsByCategory
  };
  
  // Save to skills.json
  fs.writeFileSync(SKILLS_PATH, JSON.stringify(skillsData, null, 2));
  
  console.log(`   ✅ Global skills updated!`);
  console.log(`   📊 Total skills: ${allSkills.size}`);
  Object.entries(skillsByCategory).forEach(([category, skills]) => {
    if (skills.length > 0) {
      console.log(`      - ${category}: ${skills.length} skill(s)`);
    }
  });
  console.log(`   💾 Saved to: ${SKILLS_PATH}`);
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Portfolio-Updater' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

async function getLatestCommit(projectPath) {
  const encodedPath = projectPath.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/commits?path=${encodedPath}&per_page=1`;
  
  try {
    const commits = await httpsGet(url);
    if (commits && commits.length > 0) {
      return {
        sha: commits[0].sha,
        date: commits[0].commit.author.date,
        message: commits[0].commit.message
      };
    }
  } catch (error) {
    console.error(`   ❌ Error fetching commits: ${error.message}`);
  }
  
  return null;
}

async function fetchReadme(projectPath) {
  const readmeVariants = ['README.md', 'readme.md', 'Readme.md'];
  
  for (const variant of readmeVariants) {
    const encodedPath = `${projectPath}/${variant}`.split('/').map(encodeURIComponent).join('/');
    const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${encodedPath}`;
    
    try {
      const readme = await new Promise((resolve, reject) => {
        https.get(url, (res) => {
          if (res.statusCode === 200) {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
          } else {
            resolve(null);
          }
        }).on('error', () => resolve(null));
      });
      
      if (readme) {
        console.log(`   📄 Found README.md (${readme.length} chars)`);
        return readme;
      }
    } catch (e) {
      continue;
    }
  }
  
  console.log(`   ⚠️  No README found`);
  return null;
}

async function generateSummaryWithGemini(projectName, readmeContent) {
  if (!GEMINI_API_KEY) {
    console.log(`   ⚠️  No GEMINI_API_KEY found, skipping AI analysis`);
    return null;
  }

  const prompt = `Analyze this README for the project "${projectName}" and provide a JSON response with:
1. A concise 2-3 sentence summary
2. Three key highlights/features (brief bullet points)
3. List of technologies/skills used (programming languages, frameworks, libraries, databases, cloud services, etc.)

README Content:
${readmeContent.substring(0, 4000)}

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "summary": "2-3 sentence description here",
  "highlights": ["Feature 1", "Feature 2", "Feature 3"],
  "tech_stack": ["Technology1", "Technology2", "Technology3", ...]
}`;

  try {
    console.log(`   🤖 Analyzing project with Gemini AI...`);
    
    const postData = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              const text = response.candidates[0].content.parts[0].text.trim();
              
              // Extract JSON from response (handle potential markdown wrapping)
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                resolve(analysis);
              } else {
                reject(new Error('No JSON found in response'));
              }
            } catch (e) {
              reject(new Error('Failed to parse Gemini response: ' + e.message));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log(`   ✅ Analysis complete:`);
    console.log(`      - Summary: ${result.summary.substring(0, 60)}...`);
    console.log(`      - Highlights: ${result.highlights.length} items`);
    console.log(`      - Tech stack: ${result.tech_stack.length} technologies`);
    
    return result;
  } catch (error) {
    console.error(`   ❌ Error calling Gemini API: ${error.message}`);
    return null;
  }
}

async function updateProjects() {
  // Read current rankings
  if (!fs.existsSync(RANKINGS_PATH)) {
    console.error('❌ Rankings file not found:', RANKINGS_PATH);
    process.exit(1);
  }

  const rankings = JSON.parse(fs.readFileSync(RANKINGS_PATH, 'utf8'));
  let hasUpdates = false;
  const updatedProjects = [];

  console.log(`📊 Checking ${rankings.projects.length} project(s)...\n`);

  for (const project of rankings.projects) {
    console.log(`🔍 ${project.name}`);
    console.log(`   Path: ${project.path}`);
    
    const latestCommit = await getLatestCommit(project.path);
    
    if (!latestCommit) {
      console.log(`   ⚠️  Could not fetch commit info\n`);
      continue;
    }

    const currentSHA = project.last_commit_sha;
    const latestSHA = latestCommit.sha;

    console.log(`   Current SHA: ${currentSHA ? currentSHA.substring(0, 8) : 'none'}`);
    console.log(`   Latest SHA:  ${latestSHA.substring(0, 8)}`);
    
    if (currentSHA !== latestSHA) {
      console.log(`   ✅ NEW COMMIT DETECTED!`);
      console.log(`   📝 Message: "${latestCommit.message}"`);
      console.log(`   📅 Date: ${new Date(latestCommit.date).toLocaleString()}`);
      
      // Fetch README and generate new analysis
      const readme = await fetchReadme(project.path);
      
      if (readme) {
        const analysis = await generateSummaryWithGemini(project.name, readme);
        
        if (analysis) {
          // Update summary
          project.summary = analysis.summary;
          console.log(`   📝 Summary updated!`);
          
          // Update highlights
          if (analysis.highlights && analysis.highlights.length > 0) {
            project.highlights = analysis.highlights;
            console.log(`   ✨ Highlights updated (${analysis.highlights.length} items)`);
          }
          
          // Merge tech stack (add new, keep existing)
          if (analysis.tech_stack && analysis.tech_stack.length > 0) {
            const existingTech = new Set(project.tech_stack || []);
            const newTech = [];
            
            analysis.tech_stack.forEach(tech => {
              if (!existingTech.has(tech)) {
                existingTech.add(tech);
                newTech.push(tech);
              }
            });
            
            project.tech_stack = Array.from(existingTech);
            
            if (newTech.length > 0) {
              console.log(`   🔧 Tech stack updated! Added: ${newTech.join(', ')}`);
            } else {
              console.log(`   🔧 Tech stack unchanged (no new technologies)`);
            }
          }
        }
      }
      
      // Update commit info
      project.last_commit = latestCommit.date;
      project.last_commit_sha = latestSHA;
      
      updatedProjects.push(project.name);
      hasUpdates = true;
    } else {
      console.log(`   ℹ️  No changes`);
    }
    console.log('');
  }

  if (hasUpdates) {
    // Update last_check timestamp
    rankings.last_check = new Date().toISOString();
    rankings.last_updated = new Date().toISOString();
    
    // Update top_3 array to match the updated projects
    if (rankings.top_3) {
      rankings.top_3 = rankings.projects.slice(0, 3);
    }
    
    // Save updated rankings
    fs.writeFileSync(RANKINGS_PATH, JSON.stringify(rankings, null, 2));
    
    // Update global skills from all projects
    updateGlobalSkills(rankings.projects);
    
    console.log('\n' + '━'.repeat(50));
    console.log('✅ UPDATE COMPLETE!');
    console.log('━'.repeat(50));
    console.log(`📦 Updated projects (${updatedProjects.length}):`);
    updatedProjects.forEach(name => console.log(`   • ${name}`));
    console.log(`\n💾 Saved to: ${RANKINGS_PATH}`);
    console.log(`🕐 Last check: ${rankings.last_check}`);
    console.log('\n🎉 Refresh your browser to see the changes!\n');
  } else {
    // Still update global skills even if no new commits (in case skills file doesn't exist)
    updateGlobalSkills(rankings.projects);
    
    console.log('━'.repeat(50));
    console.log('✅ All projects are up to date!');
    console.log('━'.repeat(50));
    console.log(`🕐 Last check: ${new Date().toISOString()}\n`);
  }

  return {
    success: true,
    hasUpdates,
    updatedProjects,
    timestamp: new Date().toISOString()
  };
}

// Run the update
updateProjects()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  });
