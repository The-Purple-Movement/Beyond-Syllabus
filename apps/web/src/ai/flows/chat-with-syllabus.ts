"use server";

import { ai } from "@/ai/ai";
import { createStandardizedPrompt, validateStandardizedFormat } from "@/ai/utils/prompt-builder";
import { type WikiSyllabusAIFormat } from "@/ai/types/standardized-format";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatWithSyllabusInput {
  history: Message[];
  message: string;
  model?: string;
  syllabusContext?: string;
  subjectArea?: string;
}

export interface ChatWithSyllabusOutput {
  response: string;
  suggestions?: string[];
}

const chatWithSyllabusFlow = async (
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> => {
  
  // Expanded filtering for entertainment, pop culture, and other non-educational content
  const isEntertainmentQuery = (message: string): boolean => {
    const nonEducationalKeywords = [
      'celebrity gossip', 'movie review', 'tv show recap', 'entertainment news',
      'social media drama', 'fashion trends', 'lifestyle blog', 'dating advice',
      'party planning', 'vacation photos', 'restaurant review', 'music album review',
      'sports scores', 'game recap', 'player stats', 'celebrity news', 'artist gossip',
      'ronaldo', 'messi', 'beyonce', 'kardashian', // Example celebrity names
      'horoscope', 'astrology', 'daily horoscope'
    ];

    const messageLower = message.toLowerCase();
    return nonEducationalKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
  };

  // Only block obvious entertainment queries
  if (isEntertainmentQuery(input.message)) {
    return {
      response: "I'm here to help with educational topics and academic discussions. Whether you have questions about your coursework, want to explore concepts from your syllabus, or need clarification on academic topics, I'm ready to provide detailed explanations and support your learning journey.",
      suggestions: [
        "Ask about a concept from your syllabus",
        "Explore a technical or academic topic",
        "Get help with course material"
      ]
    };
  }

  const conversationHistory = input.history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // Analyze user request to determine appropriate response style
  const analyzeUserRequest = (message: string) => {
    const messageLower = message.toLowerCase();
    
    // Detect if user wants detailed explanation
    const detailKeywords = ['detailed', 'comprehensive', 'thorough', 'in-depth', 'elaborate', 'explain thoroughly', 'break down', 'step by step'];
    const wantsDetailed = detailKeywords.some(keyword => messageLower.includes(keyword));
    
    // Detect if user wants simple explanation
    const simpleKeywords = ['simple', 'basic', 'easy', 'beginner', 'eli5', 'explain like', 'quick', 'briefly'];
    const wantsSimple = simpleKeywords.some(keyword => messageLower.includes(keyword));
    
    // Detect if user wants examples
    const exampleKeywords = ['example', 'examples', 'show me', 'demonstrate', 'instance', 'case study'];
    const wantsExamples = exampleKeywords.some(keyword => messageLower.includes(keyword));
    
    // Detect if user wants practical/real-world focus
    const practicalKeywords = ['practical', 'real-world', 'application', 'use case', 'how to use', 'implementation'];
    const wantsPractical = practicalKeywords.some(keyword => messageLower.includes(keyword));
    
    return { wantsDetailed, wantsSimple, wantsExamples, wantsPractical };
  };
  
  const requestAnalysis = analyzeUserRequest(input.message);
  
  // Create dynamic standardized AI interaction format
  const aiFormat: WikiSyllabusAIFormat = {
    persona: {
      role: requestAnalysis.wantsSimple 
        ? "You are a friendly educational AI assistant who excels at breaking down complex topics into simple, easy-to-understand explanations"
        : requestAnalysis.wantsDetailed
        ? "You are an expert educational AI assistant who provides comprehensive, thorough explanations with deep insights"
        : "You are a conversational educational AI assistant with a natural ChatGPT-like style, adapting your explanations to the user's needs",
      expertise: [
        "Adapting explanations to user's knowledge level",
        "Natural conversational communication",
        "Making complex concepts accessible",
        "Providing relevant examples and analogies",
        "Strictly avoiding non-educational topics"
      ],
      tone: requestAnalysis.wantsSimple ? "casual" : requestAnalysis.wantsDetailed ? "professor" : "mentor",
      audienceLevel: requestAnalysis.wantsSimple ? "beginner" : requestAnalysis.wantsDetailed ? "advanced" : "mixed"
    },
    task: {
      action: requestAnalysis.wantsSimple
        ? "Explain the concept in the simplest possible terms, like ChatGPT would for a beginner"
        : requestAnalysis.wantsDetailed
        ? "Provide a comprehensive, detailed explanation with thorough coverage of the topic"
        : "Provide a natural, conversational explanation that feels engaging and informative",
      objectives: [
        ...(requestAnalysis.wantsSimple ? ["Use everyday language and simple terms", "Avoid jargon and complex terminology"] : []),
        ...(requestAnalysis.wantsDetailed ? ["Provide thorough coverage with multiple perspectives", "Include technical details and nuanced explanations"] : []),
        ...(requestAnalysis.wantsExamples ? ["Include multiple relevant examples", "Use concrete illustrations"] : ["Include at least one relevant example"]),
        ...(requestAnalysis.wantsPractical ? ["Focus on real-world applications", "Show practical implementation"] : []),
        "Maintain natural conversation flow",
        "Integrate syllabus context appropriately"
      ],
      deliverables: [
        requestAnalysis.wantsSimple ? "Simple, clear explanation in everyday language" : "Comprehensive educational response",
        ...(requestAnalysis.wantsExamples ? ["Multiple concrete examples"] : ["Relevant examples"]),
        "Natural, engaging communication style"
      ]
    },
    format: {
      structure: "paragraph",
      requirements: [
        "Write in natural, conversational style like ChatGPT",
        "Use flowing paragraphs with smooth transitions",
        requestAnalysis.wantsSimple ? "Use simple language and short sentences" : "Use appropriate complexity for the topic",
        "Sound natural and engaging, not robotic or overly structured"
      ],
      length: {
        min: requestAnalysis.wantsSimple ? 80 : requestAnalysis.wantsDetailed ? 200 : 120,
        max: requestAnalysis.wantsSimple ? 150 : requestAnalysis.wantsDetailed ? 400 : 280,
        target: requestAnalysis.wantsSimple ? 120 : requestAnalysis.wantsDetailed ? 300 : 200,
        unit: "words"
      },
      specialFormatting: {
        useCodeBlocks: false,
        includeHeaders: false,
        useEmphasis: true
      }
    },
    context: {
      academic: {
        syllabus: input.syllabusContext || "Educational content"
      },
      subject: {
        area: input.subjectArea || "Academic topics",
        level: requestAnalysis.wantsSimple ? "Beginner-friendly" : "Higher Education"
      },
      student: {
        priorKnowledge: requestAnalysis.wantsSimple ? "Minimal - explain from basics" : requestAnalysis.wantsDetailed ? "Good foundation - can handle complexity" : "Variable",
        learningStyle: requestAnalysis.wantsExamples ? "Visual and example-driven" : "Conversational",
        goals: [
          requestAnalysis.wantsSimple ? "Understand basic concepts clearly" : "Understand concepts thoroughly",
          ...(requestAnalysis.wantsPractical ? ["Apply knowledge in real situations"] : []),
          "Feel confident about the topic"
        ]
      }
    },
    references: {
      includeReferences: false,
      citationStyle: "simple"
    }
  };

  // Validate the format
  const validation = validateStandardizedFormat(aiFormat);
  if (!validation.isValid) {
    console.warn('Standardized format validation failed:', validation.errors);
  }

  try {
    // Create standardized prompts with dynamic messaging
    let dynamicUserMessage = `**CONVERSATION HISTORY:**\n${conversationHistory}\n\n**STUDENT QUESTION:** "${input.message}"\n\n`;
    
    if (requestAnalysis.wantsSimple) {
      dynamicUserMessage += `The student is asking for a simple explanation. Please respond in a friendly, easy-to-understand way like ChatGPT would. Use everyday language, avoid jargon, and break things down into basic concepts that anyone can understand.`;
    } else if (requestAnalysis.wantsDetailed) {
      dynamicUserMessage += `The student wants a detailed, comprehensive explanation. Please provide thorough coverage with depth, multiple perspectives, and technical details as appropriate.`;
    } else if (requestAnalysis.wantsExamples) {
      dynamicUserMessage += `The student is specifically asking for examples. Please focus on providing multiple concrete, relevant examples to illustrate the concepts clearly.`;
    } else if (requestAnalysis.wantsPractical) {
      dynamicUserMessage += `The student wants to understand practical applications. Please focus on real-world uses, implementations, and how this knowledge applies in practice.`;
    } else {
      dynamicUserMessage += `Please provide a natural, conversational response like ChatGPT would - engaging, informative, and adapted to what the student is asking for.`;
    }
    
    dynamicUserMessage += `\n\nRemember to:\n- Sound natural and conversational, not robotic\n- Integrate any relevant syllabus context naturally\n- Use encouraging, supportive language\n- Make the explanation feel like a helpful conversation with a knowledgeable friend`;
    
    const standardizedPrompt = createStandardizedPrompt({
      format: aiFormat,
      userMessage: dynamicUserMessage
    });

    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: standardizedPrompt.systemPrompt
        },
        {
          role: "user", 
          content: standardizedPrompt.userPrompt
        }
      ],
      model: input.model || "llama-3.1-8b-instant",
      temperature: 0.5, // Higher for more natural, conversational responses
      max_completion_tokens: 1536, // Increased for comprehensive responses
      top_p: 0.9,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Use the same robust check for the AI's output
    if (isEntertainmentQuery(outputText)) {
      return {
        response: "I'm here to provide detailed explanations on educational and academic topics. What concept or topic from your coursework would you like me to explore with you? I'm ready to break down complex ideas and help you understand them through clear, comprehensive explanations.",
        suggestions: [
          "Ask about a specific concept from your syllabus",
          "Explore a technical or theoretical topic",
          "Get detailed explanations of course material"
        ]
      };
    }

    // Generate natural, conversation-continuing suggestions
    const generateSuggestions = (subjectArea?: string, syllabusContext?: string): string[] => {
      // If we have syllabus context, make suggestions more specific to the course
      if (syllabusContext && syllabusContext.trim() !== "General educational content - provide comprehensive explanations for any academic topic") {
        return [
          "Can you explain how this connects to other topics in the syllabus?",
          "What are some practical applications of this concept?",
          "Could you walk me through a specific example?"
        ];
      }

      // Subject-specific suggestions that encourage deeper exploration
      if (subjectArea) {
        const subjectSuggestions: Record<string, string[]> = {
          'computer science': [
            "Can you show me how this works with a practical example?",
            "What are the real-world applications of this concept?",
            "How does this relate to other programming concepts?"
          ],
          'mathematics': [
            "Could you walk through a step-by-step example?",
            "How is this concept used in practical applications?",
            "What's the intuition behind this mathematical idea?"
          ],
          'physics': [
            "Can you explain the physical intuition behind this?",
            "What are some real-world examples of this phenomenon?",
            "How does this concept connect to other physics topics?"
          ],
          'chemistry': [
            "What's happening at the molecular level here?",
            "Can you give me some practical examples of this?",
            "How does this relate to other chemical processes?"
          ],
          'biology': [
            "How does this process work in living organisms?",
            "What are some specific examples of this in nature?",
            "How does this connect to other biological systems?"
          ]
        };
        
        return subjectSuggestions[subjectArea.toLowerCase()] || [
          "Can you provide more specific examples?",
          "How does this apply in real-world situations?",
          "What are the key takeaways I should remember?"
        ];
      }
      
      return [
        "Could you elaborate on this topic further?",
        "What are some practical examples of this?",
        "How can I apply this knowledge?"
      ];
    };

    return {
      response: outputText,
      suggestions: generateSuggestions(input.subjectArea, input.syllabusContext)
    };

  } catch (e) {
    console.error("Error in educational chat flow:", e);
    return {
      response: "I'm here to help you explore and understand any educational topic you're curious about! Whether you're working through concepts from your syllabus, trying to grasp complex theories, or just want to deepen your understanding of academic subjects, I'm ready to provide detailed, comprehensive explanations. What would you like to learn about today?",
      suggestions: [
        "Ask for detailed explanations of concepts",
        "Request examples and practical applications",
        "Explore topics from your coursework"
      ]
    };
  }
};

export async function chatWithSyllabus(
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}
