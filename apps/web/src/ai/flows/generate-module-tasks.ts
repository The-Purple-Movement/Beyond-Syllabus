"use server";

import { ai } from "@/ai/ai";
import {
  createStandardizedPrompt,
  validateStandardizedFormat,
} from "@/ai/utils/prompt-builder";
import {
  PersonaTemplates,
} from "@/ai/utils/standardized-format";
import { GenerateModuleTasksInput, GenerateModuleTasksOutput, WikiSyllabusAIFormat } from "@/types";

// Flow Logic
const generateModuleTasksFlow = async (
  input: GenerateModuleTasksInput
): Promise<GenerateModuleTasksOutput> => {
  // Create standardized AI interaction format
  const aiFormat: WikiSyllabusAIFormat = {
    persona: {
      ...PersonaTemplates.TUTOR,
      role: "You are an expert curriculum assistant specializing in generating engaging learning activities and real-world applications for educational modules",
      expertise: [
        "Curriculum design",
        "Learning activity development",
        "Real-world application mapping",
        "Educational engagement strategies",
      ],
    },
    task: {
      action:
        "Generate a welcoming introductory message for a syllabus module with structured learning components",
      objectives: [
        "Create a friendly, welcoming introduction",
        "Generate curriculum-specific learning tasks",
        "Identify relevant real-world applications",
        "Develop follow-up discussion questions",
        "Provide additional teaching tips and extension activities",
      ],
      deliverables: [
        "Introductory message with three subsections (Learning Tasks, Real-World Applications, Follow-Up Questions)",
        "2-3 unique teaching tips or extension activities as suggestions",
      ],
      successCriteria: [
        "All fields are present and correctly formatted",
        "Markdown lists are properly structured within strings",
        "Suggestions are unique and non-overlapping with main content",
        "Content is engaging and educationally valuable",
      ],
    },
    format: {
      structure: "json",
      requirements: [
        "Return valid JSON object with introductoryMessage and suggestions fields",
        "Use markdown formatting within strings for lists",
        "Ensure suggestions is a string array of 2-3 items",
        "Include all required subsections in introductoryMessage",
      ],
      specialFormatting: {
        useCodeBlocks: false,
        includeHeaders: false,
        useEmphasis: true,
      },
    },
    context: {
      academic: {
        module: input.moduleTitle,
      },
      subject: {
        area: "Module-based Learning",
        level: "Higher Education",
      },
      student: {
        priorKnowledge: "Basic understanding of the subject area",
        learningStyle: "Interactive and practical learning",
        goals: [
          "Understand module concepts",
          "Apply knowledge practically",
          "Engage in meaningful discussions",
        ],
      },
    },
    references: {
      includeReferences: false,
      citationStyle: "simple",
    },
  };

  // Validate the format
  const validation = validateStandardizedFormat(aiFormat);
  if (!validation.isValid) {
    console.warn("Standardized format validation failed:", validation.errors);
  }

  try {
    // Create standardized prompts
    const standardizedPrompt = createStandardizedPrompt({
      format: aiFormat,
      userMessage: `Generate learning activities and real-world applications for the following module:

**Module Title:** "${input.moduleTitle}"
**Module Content:** "${input.moduleContent}"

Return a JSON object structured as follows:
{
  "introductoryMessage": "<Intro text>\n\n**Learning Tasks:**\n- ...\n- ...\n\n**Real-World Applications:**\n- ...\n- ...\n\n**Follow-Up Questions:**\n- ...\n- ...\n...",
  "suggestions": ["<Teaching tip 1>", "<Teaching tip 2>", ...]
}

The introductoryMessage should include:
1. A friendly, welcoming introduction
2. **Learning Tasks:** 2-4 curriculum-specific tasks as markdown bullet points
3. **Real-World Applications:** 2-3 relevant applications as markdown bullet points
4. **Follow-Up Questions:** 3-4 discussion or reflection questions as markdown bullet points

The suggestions should be 2-3 additional, unique teaching tips or extension activities that do not overlap with the items in the main sections.`,
    });

    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: standardizedPrompt.systemPrompt,
        },
        {
          role: "user",
          content: standardizedPrompt.userPrompt,
        },
      ],
      model: input.model || "openai/gpt-oss-20b",
      temperature: 0.5,
      max_completion_tokens: 2048,
      top_p: 0.95,
    });

    let outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // clean the AI output: remove ```json or ``` wrappers
    outputText = outputText
      .trim()
      .replace(/^```json\s*/, "")
      .replace(/^```/, "")
      .replace(/```$/, "");

    const output = JSON.parse(outputText);
    return output as GenerateModuleTasksOutput;
  } catch (e) {
    console.error(
      `Error generating tasks for module "${input.moduleTitle}":`,
      e
    );

    return {
      introductoryMessage: `Hello! I ran into some issues generating the introduction for "${input.moduleTitle}". You can try again or change the AI model if needed.`,
      suggestions: [
        `Try using a different AI model for "${input.moduleTitle}"`,
        "Rephrase your module content and try again",
        `What are the key topics in "${input.moduleTitle}"?`,
        "Can you provide a brief overview of this module?",
      ],
    };
  }
};

export async function generateModuleTasks(
  input: GenerateModuleTasksInput
): Promise<GenerateModuleTasksOutput> {
  return generateModuleTasksFlow(input);
}
