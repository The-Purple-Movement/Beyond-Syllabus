import {
  WikiSyllabusAIFormat,
  CreateStandardizedPromptInput,
  StandardizedPromptOutput,
  AIPersona,
  AITask,
  AIFormat,
  AIContext,
  AIReferences,
} from "@/types";


function buildSystemPrompt(persona: AIPersona, format: AIFormat): string {
  const sections: string[] = [];

  // Persona section - make it more natural
  sections.push(persona.role);

  if (persona.expertise && persona.expertise.length > 0) {
    sections.push(`\nYour key strengths: ${persona.expertise.join(", ")}.`);
  }

  if (persona.tone) {
    const toneDescriptions = {
      formal:
        "Keep your response professional and academic, but still clear and accessible.",
      casual:
        "Be friendly and conversational - think of how ChatGPT would explain this to a friend.",
      mentor:
        "Be supportive and encouraging, like a helpful teacher guiding someone through learning.",
      peer: "Explain like you're talking to a classmate - relatable and down-to-earth.",
      professor:
        "Share your deep knowledge in an authoritative yet approachable way.",
      tutor:
        "Be patient and clear, breaking things down step-by-step with helpful examples.",
    };
    sections.push(`\n${toneDescriptions[persona.tone]}`);
  }

  if (persona.audienceLevel) {
    const audienceLevelDescriptions = {
      beginner:
        "The user is new to this topic, so start from basics and avoid assuming prior knowledge.",
      intermediate:
        "The user has some foundation - you can build on basic concepts but explain new ideas clearly.",
      advanced:
        "The user is knowledgeable, so you can discuss sophisticated concepts and nuanced details.",
      mixed:
        "Adapt to the user's level - start accessible but be ready to go deeper if needed.",
    };
    sections.push(`\n${audienceLevelDescriptions[persona.audienceLevel]}`);
  }

  sections.push("");

  // Format section - more natural
  sections.push(`\n**RESPONSE STYLE:**`);

  const structureDescriptions = {
    "bulleted-list":
      "Organize your response with clear bullet points - make it easy to scan and understand.",
    "numbered-list":
      "Use a numbered list format to walk through points logically.",
    "step-by-step":
      "Break it down step-by-step, like you're guiding someone through a process.",
    table:
      "Present the information in a clean table format if that makes it clearer.",
    markdown:
      "Use markdown formatting naturally - headers, emphasis, code blocks where they help.",
    paragraph:
      "Write in natural, flowing paragraphs like you're having a conversation.",
    dialogue: "Structure this as a conversation or Q&A style.",
    json: "Return your response in valid JSON format.",
    custom: "Follow the specific formatting needs mentioned.",
  };

  sections.push(structureDescriptions[format.structure]);

  if (format.requirements && format.requirements.length > 0) {
    sections.push(`\nKey things to keep in mind:`);
    format.requirements.forEach((req) => {
      sections.push(`• ${req}`);
    });
  }

  if (format.length) {
    const lengthDesc = `Target length: ${format.length.target || "flexible"}${
      format.length.min ? ` (minimum ${format.length.min}` : ""
    }${format.length.max ? ` maximum ${format.length.max}` : ""}${
      format.length.min || format.length.max ? `)` : ""
    } ${format.length.unit}.`;
    sections.push(lengthDesc);
  }

  if (format.specialFormatting) {
    const specialFormatRequirements = [];
    if (format.specialFormatting.useCodeBlocks)
      specialFormatRequirements.push("Use code blocks for technical content");
    if (format.specialFormatting.includeTables)
      specialFormatRequirements.push("Include tables where appropriate");
    if (format.specialFormatting.includeHeaders)
      specialFormatRequirements.push("Use clear section headers");
    if (format.specialFormatting.useEmphasis)
      specialFormatRequirements.push("Use bold/italic text for emphasis");

    if (specialFormatRequirements.length > 0) {
      sections.push(
        `Special formatting: ${specialFormatRequirements.join(", ")}.`
      );
    }
  }

  return sections.join("\n");
}

// Builds a standardized user prompt including task, context, and references
function buildUserPrompt(
  task: AITask,
  context: AIContext,
  references: AIReferences,
  userMessage: string
): string {
  const sections: string[] = [];

  // Task section
  sections.push(`**TASK:**`);
  sections.push(task.action);

  if (task.objectives && task.objectives.length > 0) {
    sections.push(`\n**OBJECTIVES:**`);
    task.objectives.forEach((obj) => {
      sections.push(`- ${obj}`);
    });
  }

  if (task.deliverables && task.deliverables.length > 0) {
    sections.push(`\n**EXPECTED DELIVERABLES:**`);
    task.deliverables.forEach((deliverable) => {
      sections.push(`- ${deliverable}`);
    });
  }

  // Context section
  if (
    context.academic ||
    context.subject ||
    context.student ||
    context.additional
  ) {
    sections.push(`\n**CONTEXT:**`);

    if (context.academic) {
      sections.push(`Academic Context:`);
      if (context.academic.course)
        sections.push(`- Course: ${context.academic.course}`);
      if (context.academic.semester)
        sections.push(`- Semester: ${context.academic.semester}`);
      if (context.academic.university)
        sections.push(`- University: ${context.academic.university}`);
      if (context.academic.module)
        sections.push(`- Module: ${context.academic.module}`);
      if (context.academic.syllabus)
        sections.push(`- Syllabus Context: ${context.academic.syllabus}`);
    }

    if (context.subject) {
      sections.push(`Subject Context:`);
      sections.push(`- Area: ${context.subject.area}`);
      sections.push(`- Level: ${context.subject.level}`);
      if (context.subject.prerequisites)
        sections.push(
          `- Prerequisites: ${context.subject.prerequisites.join(", ")}`
        );
      if (context.subject.focus)
        sections.push(`- Focus: ${context.subject.focus}`);
    }

    if (context.student) {
      sections.push(`Student Context:`);
      if (context.student.priorKnowledge)
        sections.push(`- Prior Knowledge: ${context.student.priorKnowledge}`);
      if (context.student.learningStyle)
        sections.push(`- Learning Style: ${context.student.learningStyle}`);
      if (context.student.difficulties)
        sections.push(
          `- Known Difficulties: ${context.student.difficulties.join(", ")}`
        );
      if (context.student.goals)
        sections.push(`- Learning Goals: ${context.student.goals.join(", ")}`);
    }

    if (context.additional) {
      if (context.additional.timeConstraints)
        sections.push(
          `- Time Constraints: ${context.additional.timeConstraints}`
        );
      if (context.additional.resources)
        sections.push(
          `- Available Resources: ${context.additional.resources.join(", ")}`
        );
      if (context.additional.constraints)
        sections.push(
          `- Additional Constraints: ${context.additional.constraints.join(
            ", "
          )}`
        );
    }
  }

  // References section
  if (references.includeReferences) {
    sections.push(`\n**REFERENCES:**`);

    if (references.citationStyle) {
      sections.push(`Use ${references.citationStyle} citation style.`);
    }

    if (references.preferredSources && references.preferredSources.length > 0) {
      sections.push(
        `Preferred sources: ${references.preferredSources.join(", ")}.`
      );
    }

    if (references.specificSources && references.specificSources.length > 0) {
      sections.push(`Specific sources to consider:`);
      references.specificSources.forEach((source) => {
        let sourceText = `- ${source.name} (${source.type})`;
        if (source.author) sourceText += ` by ${source.author}`;
        if (source.url) sourceText += ` - ${source.url}`;
        sections.push(sourceText);
      });
    }

    sections.push(
      `Please include relevant references and citations in your response.`
    );
  }

  // User's actual message/question
  sections.push(`\n**USER REQUEST:**`);
  sections.push(userMessage);

  if (task.successCriteria && task.successCriteria.length > 0) {
    sections.push(`\n**SUCCESS CRITERIA:**`);
    task.successCriteria.forEach((criteria) => {
      sections.push(`- ${criteria}`);
    });
  }

  return sections.join("\n");
}

// Main function to create a standardized prompt from the WikiSyllabus format
export function createStandardizedPrompt(
  input: CreateStandardizedPromptInput
): StandardizedPromptOutput {
  const { format, userMessage, systemMessage } = input;

  // Build system prompt
  let systemPrompt = buildSystemPrompt(format.persona, format.format);

  // Add custom system message if provided
  if (systemMessage) {
    systemPrompt = `${systemMessage}\n\n${systemPrompt}`;
  }

  // Build user prompt
  const userPrompt = buildUserPrompt(
    format.task,
    format.context,
    format.references,
    userMessage
  );

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      formatVersion: "1.0.0",
      components: Object.keys(format) as (keyof WikiSyllabusAIFormat)[],
      timestamp: new Date(),
    },
  };
}

// Validates a WikiSyllabusAIFormat object
export function validateStandardizedFormat(format: WikiSyllabusAIFormat): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!format.persona?.role) {
    errors.push("Persona role is required");
  }

  if (!format.task?.action) {
    errors.push("Task action is required");
  }

  if (!format.format?.structure) {
    errors.push("Format structure is required");
  }

  if (!format.context?.subject?.area) {
    warnings.push("Subject area in context is recommended for better results");
  }

  if (typeof format.references?.includeReferences !== "boolean") {
    errors.push("References includeReferences field must be a boolean");
  }

  // Content validation
  if (format.persona?.role && format.persona.role.length < 10) {
    warnings.push(
      "Persona role description seems too short for optimal results"
    );
  }

  if (format.task?.action && format.task.action.length < 10) {
    warnings.push(
      "Task action description seems too short for optimal results"
    );
  }

  // Format-specific validation
  if (format.format?.structure === "json" && !format.format?.requirements) {
    warnings.push("JSON format should include specific structure requirements");
  }

  if (
    format.format?.length &&
    format.format.length.min &&
    format.format.length.max
  ) {
    if (format.format.length.min > format.format.length.max) {
      errors.push("Minimum length cannot be greater than maximum length");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper function to create a quick standardized format using templates
export function createQuickFormat(
  personaTemplate: keyof typeof import("./standardized-format").PersonaTemplates,
  taskTemplate: keyof typeof import("./standardized-format").TaskTemplates,
  formatTemplate: keyof typeof import("./standardized-format").FormatTemplates,
  context: AIContext,
  includeReferences: boolean = false
): WikiSyllabusAIFormat {
  const {
    PersonaTemplates,
    TaskTemplates,
    FormatTemplates,
  } = require("./standardized-format");

  return {
    persona: PersonaTemplates[personaTemplate],
    task: TaskTemplates[taskTemplate],
    format: FormatTemplates[formatTemplate],
    context,
    references: {
      includeReferences,
      citationStyle: "simple",
      preferredSources: ["MIT OCW", "Stanford", "Official Documentation"],
    },
    metadata: {
      version: "1.0.0",
      createdAt: new Date(),
      lastModified: new Date(),
      tags: ["quickFormat"],
    },
  };
}
