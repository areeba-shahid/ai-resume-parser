# python-service/main.py - Enhanced with better resume parsing
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import PyPDF2
import os
from dotenv import load_dotenv
import io
import json
import re
import httpx
from typing import List, Dict, Any
from collections import Counter

load_dotenv()

app = FastAPI(title="Resume Analysis Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HAS_GROQ_KEY = GROQ_API_KEY and GROQ_API_KEY != "your-groq-api-key-here" and GROQ_API_KEY != ""
DEFAULT_MODEL = "llama-3.1-8b-instant"

if HAS_GROQ_KEY:
    print("✅ Groq API key found, using real AI analysis (super fast!)")
    print(f"   Using model: {DEFAULT_MODEL}")
else:
    print("⚠️ No Groq API key found, using mock analysis")

class AnalysisRequest(BaseModel):
    resume_text: str
    job_title: str
    job_description: str
    required_skills: List[str]

@app.get("/")
async def root():
    return {
        "message": "Enhanced Resume Analysis Service with Groq AI",
        "groq_available": HAS_GROQ_KEY,
        "model": DEFAULT_MODEL if HAS_GROQ_KEY else "mock"
    }

def parse_resume_advanced(text: str) -> Dict[str, Any]:
    """Advanced resume parsing to extract structured information"""
    
    parsed = {
        "skills": [],
        "projects": [],
        "experience_years": 0,
        "education": [],
        "certifications": [],
        "languages": [],
        "technologies": [],
        "key_achievements": []
    }
    
    text_lower = text.lower()
    
    # Common tech skills to look for
    tech_skills = [
        "python", "javascript", "java", "c++", "c#", "ruby", "php", "swift", "kotlin",
        "react", "angular", "vue", "node.js", "express", "django", "flask", "spring",
        "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "graphql", "rest api",
        "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "ci/cd",
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "machine learning",
        "html", "css", "tailwind", "bootstrap", "typescript", "next.js", "nuxt.js"
    ]
    
    # Extract skills
    for skill in tech_skills:
        if skill in text_lower:
            parsed["skills"].append(skill)
    
    # Extract experience years
    exp_patterns = [
        r'(\d+)\+?\s*years?',
        r'(\d+)\s*\+\s*years?',
        r'experience.*?(\d+)\s*years?',
        r'(\d+)\s*years?\s+of\s+experience',
        r'(\d+)\s*\+\s*years?\s+experience'
    ]
    
    for pattern in exp_patterns:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            parsed["experience_years"] = int(match.group(1))
            break
    
    # Extract projects (look for "project" sections)
    project_pattern = r'(?:project|developed|built|created|implemented|launched)\s*:?\s*(.*?)(?=\n\n|\n[A-Z]|$)'
    projects = re.findall(project_pattern, text, re.IGNORECASE)
    parsed["projects"] = [p.strip() for p in projects[:3] if len(p.strip()) > 10]
    
    # Extract technologies from project descriptions
    tech_in_projects = []
    for project in parsed["projects"]:
        for skill in tech_skills:
            if skill in project.lower():
                tech_in_projects.append(skill)
    parsed["technologies"] = list(set(tech_in_projects))
    
    # Extract education
    edu_patterns = [
        r'(?:bachelor|master|phd|bs|ms|b\.sc|m\.sc|b\.tech|m\.tech).*?(?:in|of)\s+(\w+)',
        r'(?:degree|diploma).*?(?:in|of)\s+(\w+)'
    ]
    for pattern in edu_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            parsed["education"] = matches[:2]
            break
    
    # Extract certifications
    cert_pattern = r'(?:certified|certification|certificate).*?(\w+(?:\s+\w+){0,3})'
    parsed["certifications"] = re.findall(cert_pattern, text, re.IGNORECASE)[:3]
    
    # Extract key achievements
    achievement_patterns = [
        r'(?:achieved|accomplished|won|recognized|awarded).*?(?=\.)',
        r'(?:increased|improved|reduced|saved|generated).*?(?=\.)'
    ]
    for pattern in achievement_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        parsed["key_achievements"].extend(matches[:2])
    
    # Remove duplicates
    parsed["skills"] = list(set(parsed["skills"]))
    
    return parsed

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text and parse resume structure"""
    try:
        print(f"📄 Extracting text from {file.filename}")
        
        if not file.filename.endswith('.pdf'):
            return {"text": "Sample resume text for testing\nExperienced developer with 5 years in Node.js, React, and MongoDB", "pages": 1}
        
        contents = await file.read()
        
        if not contents:
            return {"text": "Sample resume text for testing\nExperienced developer with 5 years in Node.js, React, and MongoDB", "pages": 1}
        
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        except Exception as e:
            print(f"⚠️ PDF parsing error: {e}")
            return {"text": "Sample resume text for testing\nExperienced developer with 5 years in Node.js, React, and MongoDB", "pages": 1}
        
        text = ""
        for page_num, page in enumerate(pdf_reader.pages, 1):
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            except Exception as e:
                continue
        
        if not text.strip():
            return {"text": "Sample resume text for testing\nExperienced developer with 5 years in Node.js, React, and MongoDB", "pages": len(pdf_reader.pages)}
        
        # Advanced parsing
        parsed_info = parse_resume_advanced(text)
        
        print(f"✅ Extracted {len(text)} characters")
        print(f"📊 Parsed Info:")
        print(f"   Skills found: {len(parsed_info['skills'])}")
        print(f"   Projects: {len(parsed_info['projects'])}")
        print(f"   Experience: {parsed_info['experience_years']} years")
        print(f"   Technologies: {parsed_info['technologies']}")
        
        return {
            "text": text,
            "pages": len(pdf_reader.pages),
            "parsed_info": parsed_info
        }
        
    except Exception as e:
        print(f"❌ Error extracting text: {e}")
        return {
            "text": "Sample resume text for testing\nExperienced developer with 5 years in Node.js, React, and MongoDB",
            "pages": 1,
            "parsed_info": {"skills": [], "projects": [], "experience_years": 3}
        }

# Find this section in the analyze-resume endpoint and replace it:

@app.post("/analyze-resume")
async def analyze_resume(request: AnalysisRequest):
    """Analyze resume against job requirements using Groq AI"""
    try:
        print(f"🤖 Analyzing resume for job: {request.job_title}")
        
        if not HAS_GROQ_KEY:
            print("⚠️ Using mock analysis (no API key)")
            return get_enhanced_mock_analysis(request)
        
        try:
            # First, parse the resume to get structured info
            parsed = parse_resume_advanced(request.resume_text)
            
            prompt = f"""
You are an expert ATS (Applicant Tracking System) and senior HR recruiter.

Your task is to STRICTLY evaluate how well the resume matches the job.

========================
JOB DETAILS
========================
Job Title: {request.job_title}

Job Description:
{request.job_description[:1000]}

Required Skills:
{', '.join(request.required_skills)}

========================
RESUME
========================
{request.resume_text[:2500]}

========================
SCORING RULES (VERY IMPORTANT)
========================
- Score must be between 0 and 100
- DO NOT give random scores
- Calculate score based on:

1. Skills Match (50%)
   - % of required skills found in resume

2. Experience Relevance (30%)
   - Years + relevance to job

3. Job Description Alignment (20%)
   - Responsibilities + keywords match

FINAL SCORE = weighted combination of above

========================
STRICT INSTRUCTIONS
========================
- Be STRICT like a real ATS (do NOT inflate scores)
- If many required skills are missing → score must be LOW (<60)
- If strong match → score can be HIGH (>80)
- Do NOT default to 70–80 range
- Think step-by-step internally, but DO NOT show reasoning

========================
OUTPUT FORMAT (JSON ONLY)
========================
Return ONLY this JSON:

{{
  "score": <number between 0-100>,
  "matched_skills": [],
  "missing_skills": [],
  "experience_years": <number>,
  "strengths": [],
  "weaknesses": [],
  "recommendation": ""
}}
"""
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": DEFAULT_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an expert HR recruiter. You must ALWAYS return ONLY valid JSON. No explanations, no markdown, just the JSON object."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,  # Lower temperature for more consistent JSON
                        "max_tokens": 800
                    },
                    timeout=45.0
                )
                
                print(f"Groq API response status: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"⚠️ Groq API error: {response.status_code}")
                    return get_enhanced_mock_analysis(request, parsed)
                
                result = response.json()
                
                if "choices" not in result or not result["choices"]:
                    return get_enhanced_mock_analysis(request, parsed)
                
                text_response = result["choices"][0]["message"]["content"]
                print(f"Groq response received: {text_response[:200]}...")
                
                # Clean the response - remove markdown code blocks if present
                text_response = text_response.strip()
                if text_response.startswith('```json'):
                    text_response = text_response[7:]
                if text_response.startswith('```'):
                    text_response = text_response[3:]
                if text_response.endswith('```'):
                    text_response = text_response[:-3]
                text_response = text_response.strip()
                
                # Find JSON object
                json_start = text_response.find('{')
                json_end = text_response.rfind('}') + 1
                
                if json_start == -1 or json_end == 0:
                    print("⚠️ No JSON found in response")
                    return get_enhanced_mock_analysis(request, parsed)
                
                json_str = text_response[json_start:json_end]
                print(f"Extracted JSON: {json_str[:200]}...")
                
                # Try to parse JSON with error handling
                try:
                    analysis = json.loads(json_str)
                except json.JSONDecodeError as e:
                    print(f"⚠️ JSON parse error: {e}")
                    # Try to fix common JSON issues
                    import re
                    # Fix missing quotes around keys
                    json_str = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', json_str)
                    # Fix trailing commas
                    json_str = re.sub(r',\s*}', '}', json_str)
                    json_str = re.sub(r',\s*]', ']', json_str)
                    try:
                        analysis = json.loads(json_str)
                        print("✅ Fixed JSON after cleaning")
                    except:
                        print("❌ Could not parse JSON, using mock analysis")
                        return get_enhanced_mock_analysis(request, parsed)
                
                # Validate required fields
                required_fields = ['score', 'matched_skills', 'missing_skills', 'experience_years', 'strengths', 'weaknesses', 'recommendation']
                for field in required_fields:
                    if field not in analysis:
                        print(f"⚠️ Missing field: {field}")
                        analysis[field] = [] if field in ['matched_skills', 'missing_skills', 'strengths', 'weaknesses'] else (0 if field == 'score' or field == 'experience_years' else "Not specified")
                
                # Ensure numeric fields are numbers
                analysis['score'] = float(analysis['score']) if isinstance(analysis['score'], (int, float)) else 50
                analysis['experience_years'] = float(analysis['experience_years']) if isinstance(analysis['experience_years'], (int, float)) else 3
                
                print(f"✅ Analysis complete: Score {analysis.get('score', 0)}")
                return analysis
            
        except Exception as e:
            print(f"❌ Groq API error: {e}")
            return get_enhanced_mock_analysis(request, parse_resume_advanced(request.resume_text))
        
    except Exception as e:
        print(f"❌ Error in analyze_resume: {e}")
        return get_enhanced_mock_analysis(request)
    
    
    
def get_enhanced_mock_analysis(request: AnalysisRequest, parsed=None):
    """Enhanced mock analysis with better skill detection"""
    if parsed is None:
        parsed = parse_resume_advanced(request.resume_text)
    
    print("📊 Using enhanced mock analysis")
    
    required_skills = request.required_skills
    text_lower = request.resume_text.lower()
    
    # Enhanced skill matching - look in both explicit skills and project descriptions
    matched_skills = []
    inferred_skills = []
    
    for skill in required_skills:
        # Direct match
        if skill.lower() in text_lower:
            matched_skills.append(skill)
        # Check if skill is implied in projects or technologies
        elif skill.lower() in [t.lower() for t in parsed["technologies"]]:
            inferred_skills.append(skill)
            matched_skills.append(skill)
        # Check for related technologies
        elif skill.lower() == "javascript" and "js" in text_lower:
            inferred_skills.append(skill)
            matched_skills.append(skill)
        elif skill.lower() == "react" and ("reactjs" in text_lower or "react.js" in text_lower):
            inferred_skills.append(skill)
            matched_skills.append(skill)
    
    # Calculate score with bonus for inferred skills
    base_score = (len(matched_skills) / len(required_skills)) * 100 if required_skills else 50
    bonus = min(15, len(inferred_skills) * 5)
    score = min(100, base_score + bonus)
    
    # Experience extraction
    experience_years = parsed["experience_years"] if parsed["experience_years"] > 0 else 3
    
    # Project relevance assessment
    if parsed["projects"]:
        project_relevance = f"Candidate has {len(parsed['projects'])} relevant projects"
    else:
        project_relevance = "Limited project information available"
    
    # Missing skills
    missing_skills = [s for s in required_skills if s not in matched_skills]
    
    # Strengths and weaknesses
    strengths = []
    if matched_skills:
        strengths.append(f"Has {len(matched_skills)} relevant skills ({len(inferred_skills)} inferred from projects)")
    if experience_years >= 3:
        strengths.append(f"{experience_years} years of experience")
    if parsed["projects"]:
        strengths.append(f"Experience with {len(parsed['projects'])} projects")
    
    weaknesses = []
    if missing_skills:
        weaknesses.append(f"Missing: {', '.join(missing_skills[:3])}")
    if len(matched_skills) < len(required_skills) / 2:
        weaknesses.append("Needs to develop more required skills")
    
    # Recommendation
    if score > 70:
        recommendation = f"Strong candidate! Their {len(parsed['projects'])} projects demonstrate relevant experience. Highly recommend interview."
    elif score > 50:
        recommendation = f"Good candidate with {len(matched_skills)} matching skills. Consider interview to assess deeper technical knowledge."
    else:
        recommendation = "Candidate shows potential but lacks key required skills. Consider for junior positions or skill development programs."
    
    return {
        "score": round(score, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "inferred_skills": inferred_skills,
        "experience_years": experience_years,
        "project_relevance": project_relevance,
        "strengths": strengths[:4],
        "weaknesses": weaknesses[:3],
        "recommendation": recommendation,
        "parsed_skills": parsed["skills"][:10],
        "parsed_projects": parsed["projects"][:3]
    }

@app.post("/score-candidate")
async def score_candidate(
    resume_text: str,
    job_title: str,
    job_description: str,
    required_skills: list
):
    """Quick scoring endpoint with enhanced parsing"""
    try:
        parsed = parse_resume_advanced(resume_text)
        
        text_lower = resume_text.lower()
        matched_skills = []
        
        for skill in required_skills:
            if skill.lower() in text_lower:
                matched_skills.append(skill)
            elif skill.lower() in [t.lower() for t in parsed["technologies"]]:
                matched_skills.append(skill)
        
        score = (len(matched_skills) / len(required_skills)) * 100 if required_skills else 50
        
        return {
            "score": score,
            "matched_skills": matched_skills,
            "missing_skills": [s for s in required_skills if s not in matched_skills],
            "inferred_skills": [s for s in parsed["technologies"] if s in required_skills],
            "projects_found": len(parsed["projects"]),
            "match_percentage": score
        }
    except Exception as e:
        return {"error": str(e), "score": 0}

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("🚀 Starting Enhanced Resume Analysis Service with Groq AI...")
    print(f"   Groq Available: {HAS_GROQ_KEY}")
    if HAS_GROQ_KEY:
        print(f"   API Key: {GROQ_API_KEY[:15]}...")
        print(f"   Model: {DEFAULT_MODEL}")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)