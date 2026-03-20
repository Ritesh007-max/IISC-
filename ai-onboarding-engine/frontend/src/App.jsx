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
    formData.append('goalRole', goalRole);
    formData.append('goalCompany', goalCompany);
    formData.append('goalSkills', goalSkills);

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

      if (!data.analysis) {
        throw new Error('Server did not return analysis data.');
      }

      setResponse(data.message);
      setExtractedData({
        resumeText: data.resumeText,
        jobDescriptionText: data.jobDescriptionText,
        analysis: data.analysis,
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

              <div className="scorecard-panel">
                <div className="scorecard-header">
                  <div>
                    <div className="summary-title">
                      <CheckCircle size={18} />
                      Resume Score
                    </div>
                    <p className="scorecard-copy">This score is based on skills overlap, role alignment, project evidence, and communication signals.</p>
                  </div>
                  <div className="score-badge">
                    <strong>{analysis.scorecard.total}/100</strong>
                    <span>{analysis.scorecard.band}</span>
                  </div>
                </div>

                <div className="score-breakdown">
                  {analysis.scorecard.breakdown.map((item) => (
                    <div className="score-item" key={item.label}>
                      <div className="score-item-head">
                        <span>{item.label}</span>
                        <strong>{item.score}</strong>
                      </div>
                      <div className="score-bar-track">
                        <div className="score-bar-fill" style={{ width: `${item.score}%` }} />
                      </div>
                      <p>{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="company-panel">
                <div className="company-panel-header">
                  <div className="summary-title">
                    <Building2 size={18} />
                    Company-Specific Preparation
                  </div>
                  <span className="company-name-chip">{analysis.companyPreparation.companyName}</span>
                </div>

                <p className="company-style-copy">{analysis.companyPreparation.interviewStyle}</p>

                <div className="company-focus-list">
                  {analysis.companyPreparation.focusAreas.map((area) => (
                    <span className="tag" key={area}>{area}</span>
                  ))}
                </div>

                <div className="company-columns">
                  <div className="company-column">
                    <h3>Preparation Checklist</h3>
                    <div className="company-list">
                      {analysis.companyPreparation.prepChecklist.map((item) => (
                        <div className="company-list-item" key={item}>{item}</div>
                      ))}
                    </div>
                  </div>

                  <div className="company-column">
                    <h3>Readiness Note</h3>
                    <div className="company-note">{analysis.companyPreparation.readinessNote}</div>
                  </div>
                </div>
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
