
import { GoogleGenAI, Type } from "@google/genai";
import { Task, ParaCategory, Project, CalendarEvent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const categorizeTask = async (taskTitle: string): Promise<ParaCategory> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Categorize the following task into one of the PARA categories:
    - Projects: Active efforts with a specific deadline.
    - Areas: Ongoing responsibilities (Health, Finance, Work).
    - Resources: Topics of interest or reference materials.
    - Archives: Completed or no longer active.
    
    Task: "${taskTitle}"
    
    Return ONLY the category name.`,
  });
  
  const result = response.text.trim();
  if (result.includes('Projects')) return 'Projects';
  if (result.includes('Areas')) return 'Areas';
  if (result.includes('Resources')) return 'Resources';
  return 'Archives';
};

export const summarizeLink = async (url: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this URL and provide a very short, clean title (max 5 words) that represents its content.
      URL: ${url}
      
      Example: "https://github.com/openai/gpt-3" -> "GitHub: OpenAI GPT-3 Repo"
      Return ONLY the title.`,
    });
    return response.text.trim();
  } catch (e) {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  }
};

/**
 * URL이나 텍스트를 기반으로 짧고 감각적인 URL 슬러그를 생성합니다.
 */
export const generateShortSlug = async (input: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, lowercase, hyphenated URL slug (max 3 words) representing this input.
      Input: ${input}
      
      Examples:
      "Learning Korean Master Class" -> "ko-master"
      "https://www.notion.so/workspace/design-guide" -> "design-guide"
      "Research for Quantum Physics" -> "quantum-res"
      
      Return ONLY the slug.`,
    });
    return response.text.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  } catch (e) {
    return input.substring(0, 10).toLowerCase().replace(/\s+/g, '-');
  }
};

export const breakdownProject = async (project: Project): Promise<string[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a senior project manager. Break down the following ${project.term}-term project into 5-7 actionable steps.
    Project: ${project.title}
    Description: ${project.description}
    Deadline: ${project.deadline}
    
    Return as a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return ["Research more about the topic", "Define initial milestones", "Set a clear timeline", "Gather necessary resources", "Start initial implementation"];
  }
};

export const smartMapEventsToPara = async (events: CalendarEvent[]): Promise<Array<{ id: string, category: ParaCategory, reason: string }>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Map these calendar events to PARA categories (Projects, Areas, Resources, Archives).
    Events: ${JSON.stringify(events.map(e => ({ title: e.summary, location: e.location })))}
    
    Return a JSON array of objects with:
    - id: matching the event index
    - category: The PARA category
    - reason: A short 1-sentence reason why.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return events.map((_, i) => ({ id: String(i + 1), category: 'Areas', reason: 'Defaulting to Areas' }));
  }
};

export const generateSmartMockEvents = async (email: string, projects: Project[]): Promise<CalendarEvent[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 4 realistic calendar events for today for a user with the email ${email}. 
    Consider their active projects: ${projects.map(p => p.title).join(', ')}.
    
    Return a JSON array of objects with: summary, start (e.g. "09:00 AM"), end (e.g. "10:30 AM"), location (optional).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            start: { type: Type.STRING },
            end: { type: Type.STRING },
            location: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text.trim());
    return data.map((d: any, i: number) => ({ ...d, id: String(i + 1) }));
  } catch (e) {
    return [];
  }
};
