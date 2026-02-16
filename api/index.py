import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

@app.route('/api/suggestions', methods=['POST'])
def get_suggestions():
    if not api_key:
        return jsonify({"error": "OpenAI API key not found. Please set OPENAI_API_KEY in .env file."}), 500

    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    resume_data = data.get('resume')
    job_description = data.get('jobDescription')
    
    messages = data.get('messages', [])
    
    if not resume_data:
        return jsonify({"error": "Missing resume data"}), 400

    system_prompt = """You are an expert resume optimizer and career coach. Your goal is to analyze a resume against a specific job description (if provided) or general best practices and suggest concrete, targeted improvements.
    
    Focus on:
    1. Experience bullet points: rewrite them to be more impactful, quantifying results where possible.
    2. Skills: Suggest adding relevant skills. 
       CRITICAL CONSTRAINT FOR SKILLS:
       - You must organize skills into EXACTLY 3 categories if you suggest a full skill overhaul.
       - If editing existing skills, ensure the final count adheres to:
         * MAX 8 skills in the first category.
         * MAX 8 skills in the second category.
         * MAX 5 skills in the third category.
       - Do NOT exceed these limits.

    Do NOT fabricate experiences. Do NOT change Personal Info or Education.
    Ensure the length of suggested bullet points is similar to the original to maintain formatting.
    
    Output strictly valid JSON in the following format:
    {
        "suggestions": [
            {
                "id": "unique_id",
                "type": "experience" | "skill" | "summary" | "skill_reorg",
                "title": "Short title of suggestion",
                "description": "Reasoning for the suggestion",
                "original": "Original text (if applicable)",
                "suggested": "The new suggested text or list of skills. FOR 'skill_reorg', output MUST be an array of objects: [{'id': 'cat1', 'name': 'Category Name', 'skills': ['Skill 1', 'Skill 2']}]",
                "targetId": "ID of the experience item (if type is experience) or skill category ID (if type is skill)"
            }
        ]
    }
    """

    conversion_context = f"""
    CURRENT RESUME JSON:
    {json.dumps(resume_data)}
    
    JOB DESCRIPTION (if provided by user in chat):
    {job_description if job_description else "Not provided yet, infer from chat context."}
    """

    openai_messages = [{"role": "system", "content": system_prompt}]
    
    openai_messages.append({"role": "system", "content": conversion_context})

    for msg in messages:
        if msg.get('id') == 'welcome':
            continue
            
        role = msg.get('role')
        content = msg.get('content')
        if role and content:
            openai_messages.append({"role": role, "content": content})
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=openai_messages,
            temperature=0.7
        )

        content = response.choices[0].message.content
        if not content:
             return jsonify({"error": "Empty response from AI"}), 500
             
        try:
            suggestions_data = json.loads(content)
            return jsonify(suggestions_data)
        except json.JSONDecodeError:
            return jsonify({"error": "Failed to parse AI response"}), 500

    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
