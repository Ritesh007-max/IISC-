import { useState } from 'react';
import {
  Upload,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Target,
  Activity,
  Building2,
  Sparkles,
} from 'lucide-react';
import './App.css';

const SKILL_CATALOG = [
  { name: 'JavaScript', aliases: ['javascript', 'js'], roadmap: 'Build interactive browser projects and practice async patterns.' },
  { name: 'TypeScript', aliases: ['typescript', 'ts'], roadmap: 'Add type-safe components and API contracts in a small app.' },
  { name: 'React', aliases: ['react', 'react.js', 'reactjs'], roadmap: 'Create reusable UI flows and state-driven components.' },
  { name: 'Node.js', aliases: ['node.js', 'nodejs', 'node'], roadmap: 'Build REST APIs and middleware with real validation.' },
  { name: 'Express', aliases: ['express', 'express.js'], roadmap: 'Learn routing, middleware, and request lifecycle design.' },
  { name: 'MongoDB', aliases: ['mongodb', 'mongo'], roadmap: 'Model collections, indexes, and CRUD-heavy backend features.' },
  { name: 'SQL', aliases: ['sql', 'mysql', 'postgresql', 'postgres'], roadmap: 'Practice joins, aggregates, and schema design for applications.' },
  { name: 'Python', aliases: ['python'], roadmap: 'Solve automation tasks and backend exercises with clean modular code.' },
  { name: 'Java', aliases: ['java'], roadmap: 'Strengthen OOP, collections, and backend fundamentals.' },
  { name: 'C++', aliases: ['c++', 'cpp'], roadmap: 'Use DSA problems to improve low-level reasoning and performance.' },
  { name: 'HTML', aliases: ['html'], roadmap: 'Refine semantic layout and structured content authoring.' },
  { name: 'CSS', aliases: ['css'], roadmap: 'Practice responsive layouts, spacing systems, and component styling.' },
  { name: 'Git', aliases: ['git', 'github'], roadmap: 'Use branches, pull requests, and clean commit history on every project.' },
  { name: 'AWS', aliases: ['aws', 'ec2', 's3', 'lambda', 'cloudwatch'], roadmap: 'Deploy one backend and one frontend with logging and storage.' },
  { name: 'Docker', aliases: ['docker', 'container'], roadmap: 'Containerize an app and run local multi-service environments.' },
  { name: 'REST APIs', aliases: ['rest api', 'restful api', 'api development', 'backend api'], roadmap: 'Design endpoints with validation, error handling, and auth basics.' },
  { name: 'GraphQL', aliases: ['graphql'], roadmap: 'Build a schema and compare resolver patterns with REST.' },
  { name: 'Data Structures', aliases: ['data structures', 'dsa', 'algorithms'], roadmap: 'Practice arrays, trees, graphs, and problem-solving speed.' },
  { name: 'Problem Solving', aliases: ['problem solving'], roadmap: 'Solve timed coding problems and explain your reasoning clearly.' },
  { name: 'Communication', aliases: ['communication'], roadmap: 'Summarize technical work clearly in demos, docs, and discussions.' },
  { name: 'Teamwork', aliases: ['teamwork', 'collaboration'], roadmap: 'Work on shared projects with reviews and task breakdowns.' },
  { name: 'Leadership', aliases: ['leadership'], roadmap: 'Own a feature end to end and communicate scope, risk, and status.' },
];

const ROLE_SKILL_HINTS = [
  { trigger: ['frontend', 'front end', 'ui'], skills: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Git'] },
  { trigger: ['backend', 'api', 'server'], skills: ['Node.js', 'Express', 'SQL', 'REST APIs', 'Docker', 'Git'] },
  { trigger: ['full stack', 'fullstack'], skills: ['React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Git'] },
  { trigger: ['data', 'ml', 'ai'], skills: ['Python', 'SQL', 'Problem Solving'] },
  { trigger: ['cloud', 'devops'], skills: ['AWS', 'Docker', 'Git', 'Node.js'] },
];

function extractSkillsFromText(text) {
  const normalized = text.toLowerCase();

  return SKILL_CATALOG
    .filter((skill) => skill.aliases.some((alias) => normalized.includes(alias)))
    .map((skill) => skill.name);
}

function inferGoalSkills(goalText) {
  const normalized = goalText.toLowerCase();
  const inferred = new Set(extractSkillsFromText(goalText));

  ROLE_SKILL_HINTS.forEach((roleHint) => {
    if (roleHint.trigger.some((term) => normalized.includes(term))) {
      roleHint.skills.forEach((skill) => inferred.add(skill));
    }
  });

  return [...inferred];
}

function unique(list) {
  return [...new Set(list)];
}

function formatGoalSummary(goalRole, goalCompany, goalSkills) {
  const parts = [];

  if (goalRole.trim()) {
    parts.push(`Target role: ${goalRole.trim()}`);
  }

  if (goalCompany.trim()) {
    parts.push(`Target company: ${goalCompany.trim()}`);
  }

  if (goalSkills.trim()) {
    parts.push(`Priority skills: ${goalSkills.trim()}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'No career goal provided. Dashboard is based on resume and job description only.';
}

function buildRoadmap(gapSkills, resumeSkills, goalRole, goalCompany) {
  if (gapSkills.length === 0) {
    return [
      {
        title: 'Consolidate strengths',
        description: `Your current profile already overlaps well with the target. Build one polished project and tailor it for ${goalCompany || 'your target companies'}.`,
      },
      {
        title: 'Sharpen interview evidence',
        description: `Turn ${resumeSkills.slice(0, 3).join(', ') || 'your core skills'} into portfolio stories tied to ${goalRole || 'the target role'}.`,
      },
    ];
  }

  return gapSkills.slice(0, 4).map((skill, index) => {
    const skillMeta = SKILL_CATALOG.find((item) => item.name === skill);
    return {
      title: `Phase ${index + 1}: ${skill}`,
      description: skillMeta?.roadmap || `Build proof of work in ${skill} and connect it to your target role.`,
    };
  });
}

function analyzeProfile({ resumeText, jobDescriptionText, goalRole, goalCompany, goalSkills }) {
  const resumeSkills = unique(extractSkillsFromText(resumeText));
  const jdSkills = unique(extractSkillsFromText(jobDescriptionText));
  const aspirationalSkills = unique(inferGoalSkills(`${goalRole} ${goalCompany} ${goalSkills}`));
  const targetSkills = unique([...jdSkills, ...aspirationalSkills]);
  const matchedSkills = targetSkills.filter((skill) => resumeSkills.includes(skill));
  const gapSkills = targetSkills.filter((skill) => !resumeSkills.includes(skill));

  return {
    summary: formatGoalSummary(goalRole, goalCompany, goalSkills),
    resumeSkills,
    targetSkills,
    matchedSkills,
    gapSkills,
    roadmap: buildRoadmap(gapSkills, resumeSkills, goalRole, goalCompany),
  };
}

function App() {
  const [resume, setResume] = useState(null);
  const [uploadType, setUploadType] = useState('text');
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [goalRole, setGoalRole] = useState('');
  const [goalCompany, setGoalCompany] = useState('');
  const [goalSkills, setGoalSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleJobDescFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJobDescriptionFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
      setError('Please upload a resume.');
      return;
    }

    if (uploadType === 'text' && !jobDescriptionText) {
      setError('Please enter job description text.');
      return;
    }

    if (uploadType === 'file' && !jobDescriptionFile) {
      setError('Please upload a job description file.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setExtractedData(null);

    const formData = new FormData();
    formData.append('resume', resume);

    if (uploadType === 'file') {
      formData.append('jobDescription', jobDescriptionFile);
    } else {
      formData.append('jobDescriptionText', jobDescriptionText);
    }

    try {
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      const rawBody = await res.text();
      let data = {};

      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          throw new Error(`Server returned an invalid response: ${rawBody}`);
        }
      }

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      if (!data.message) {
        throw new Error('Server returned an empty response.');
      }

      const analysis = analyzeProfile({
        resumeText: data.resumeText,
        jobDescriptionText: data.jobDescriptionText,
        goalRole,
        goalCompany,
        goalSkills,
      });

      setResponse(data.message);
      setExtractedData({
        resumeText: data.resumeText,
        jobDescriptionText: data.jobDescriptionText,
        analysis,
      });
    } catch (err) {
      setError(err.message || 'Failed to upload files. Please make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const analysis = extractedData?.analysis;

  return (
    <div className="app-container">
      <header>
        <h1>AI Adaptive Onboarding Engine</h1>
        <p className="subtitle">Upload your resume, job description, and optional career goal to generate a focused onboarding plan.</p>
      </header>

      <main className="main-content">
        <div className="card">
          <h2><Upload className="icon" /> Upload Data</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Upload Resume (PDF/DOCX)</label>
              <div className="file-input-wrapper">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <FileText size={24} color="var(--primary-color)" />
                  <span>{resume ? resume.name : 'Click to browse or drag & drop'}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Job Description Options</label>
              <div className="choice-row">
                <label className="radio-option">
                  <input type="radio" checked={uploadType === 'text'} onChange={() => setUploadType('text')} /> Text Input
                </label>
                <label className="radio-option">
                  <input type="radio" checked={uploadType === 'file'} onChange={() => setUploadType('file')} /> File Upload
                </label>
              </div>

              {uploadType === 'text' ? (
                <textarea
                  className="text-input"
                  placeholder="Paste the job requirements or description here..."
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                />
              ) : (
                <div className="file-input-wrapper">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleJobDescFileChange} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <FileText size={24} color="var(--primary-color)" />
                    <span>{jobDescriptionFile ? jobDescriptionFile.name : 'Click to browse or drag & drop'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="goal-block">
              <div className="goal-header">
                <Sparkles size={18} />
                <span>Optional Career Goal</span>
              </div>

              <div className="goal-grid">
                <div className="form-group">
                  <label>Target Role</label>
                  <input
                    className="text-field"
                    type="text"
                    placeholder="Frontend Developer, Backend Engineer, Full Stack Developer..."
                    value={goalRole}
                    onChange={(e) => setGoalRole(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Target Company</label>
                  <input
                    className="text-field"
                    type="text"
                    placeholder="Google, Microsoft, Flipkart..."
                    value={goalCompany}
                    onChange={(e) => setGoalCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Skills You Ultimately Want To Build</label>
                <textarea
                  className="text-input"
                  placeholder="Example: React, system design, AWS, backend APIs, DSA"
                  value={goalSkills}
                  onChange={(e) => setGoalSkills(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Send size={18} /> Generate Analysis
                </>
              )}
            </button>

            {error && (
              <div className="response-message error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {response && (
              <div className="response-message">
                <CheckCircle size={20} />
                <span>{response}</span>
              </div>
            )}
          </form>
        </div>

        <div className="card">
          <h2><Activity className="icon" /> Analysis Dashboard</h2>
          {extractedData ? (
            <div className="dashboard-stack">
              <div className="summary-panel">
                <div className="summary-title">
                  <Building2 size={18} />
                  Goal Context
                </div>
                <p>{analysis.summary}</p>
              </div>

              <div className="insight-grid">
                <div className="insight-card">
                  <h3><Target size={18} /> Extracted Skills From Resume</h3>
                  <div className="tag-list">
                    {analysis.resumeSkills.length > 0 ? (
                      analysis.resumeSkills.map((skill) => <span className="tag" key={skill}>{skill}</span>)
                    ) : (
                      <span className="muted-copy">No recognizable skills were extracted from the resume text.</span>
                    )}
                  </div>
                </div>

                <div className="insight-card">
                  <h3><CheckCircle size={18} /> Skills Already Matching Target</h3>
                  <div className="tag-list">
                    {analysis.matchedSkills.length > 0 ? (
                      analysis.matchedSkills.map((skill) => <span className="tag tag-success" key={skill}>{skill}</span>)
                    ) : (
                      <span className="muted-copy">No clear overlap yet between current profile and target requirements.</span>
                    )}
                  </div>
                </div>

                <div className="insight-card">
                  <h3><AlertCircle size={18} color="#d97706" /> Skill Gap</h3>
                  <div className="tag-list">
                    {analysis.gapSkills.length > 0 ? (
                      analysis.gapSkills.map((skill) => <span className="tag tag-gap" key={skill}>{skill}</span>)
                    ) : (
                      <span className="muted-copy">No major skill gaps detected from the supplied inputs.</span>
                    )}
                  </div>
                </div>

                <div className="insight-card">
                  <h3><BookOpen size={18} /> Learning Roadmap</h3>
                  <div className="roadmap-list">
                    {analysis.roadmap.map((item) => (
                      <div className="roadmap-item" key={item.title}>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="extracted-text-section">
                <div className="text-container">
                  <div className="text-container-header">
                    <FileText size={18} /> Resume Text
                  </div>
                  <div className="text-container-body">
                    {extractedData.resumeText}
                  </div>
                </div>

                <div className="text-container">
                  <div className="text-container-header">
                    <FileText size={18} /> Job Description Text
                  </div>
                  <div className="text-container-body">
                    {extractedData.jobDescriptionText}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="placeholder-section">
              <div className="placeholder-item">
                <h3><Sparkles size={18} /> Career Goal Support</h3>
                <p>Add an optional target role, company, and future skills. The dashboard will use that context to shape the analysis.</p>
              </div>

              <div className="placeholder-item">
                <h3><Target size={18} /> Extracted Skills</h3>
                <p>Resume skills will be detected from the uploaded text after submission.</p>
              </div>

              <div className="placeholder-item">
                <h3><BookOpen size={18} /> Learning Roadmap</h3>
                <p>Roadmap steps will be generated from the gap between your current profile and the target role.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
