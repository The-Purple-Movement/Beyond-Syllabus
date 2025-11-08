"use server";

import { ai } from "@/ai/ai";
import {
  createStandardizedPrompt,
  validateStandardizedFormat,
} from "@/ai/utils/prompt-builder";
import { WikiSyllabusAIFormat } from "@/types";
import { ChatWithSyllabusInput, ChatWithSyllabusOutput } from "@/types";

const chatWithSyllabusFlow = async (
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> => {
  // Expanded filtering for entertainment, pop culture, and other non-educational content
  const isEntertainmentQuery = (message: string): boolean => {
    const nonEducationalKeywords = [
      "celebrity gossip",
      "movie review",
      "tv show recap",
      "entertainment news",
      "social media drama",
      "fashion trends",
      "lifestyle blog",
      "dating advice",
      "party planning",
      "vacation photos",
      "restaurant review",
      "music album review",
      "sports scores",
      "game recap",
      "player stats",
      "celebrity news",
      "artist gossip",
      "ronaldo",
      "cristiano ronaldo",
      "messi",
      "lionel messi",
      "virat kohli",
      "kohli",
      "beyonce",
      "kardashian",
      "taylor swift",
      "selena gomez",
      "srk",
      "shahrukh khan",
      "salman khan",
      "priyanka chopra",
      "alia bhatt",
      "ranveer singh",
      "horoscope",
      "astrology",
      "daily horoscope",
      // broader pop/entertainment distractions
      "k-pop",
      "bollywood",
      "hollywood",
      "netflix",
      "hbo",
      "disney+",
      "tiktok",
      "instagram",
      "youtube drama",
      "memes",
      "gossip",
      "celebrity",
    ];

    const messageLower = message.toLowerCase();
    return nonEducationalKeywords.some((keyword) =>
      messageLower.includes(keyword)
    );
  };

  // Strict on-topic pre-gate using syllabus/subject keywords and off-topic tech/pop-culture
  const isOffTopicForSyllabus = (
    message: string,
    syllabusContext?: string,
    subjectArea?: string
  ): boolean => {
    const text = (syllabusContext || "") + " " + (subjectArea || "");
    const normalizedContext = text.toLowerCase();
    const messageLower = message.toLowerCase();

    // quick allow if explicit context keywords appear in message
    const contextTokens = normalizedContext
      .split(/[^a-z0-9+.#-]+/)
      .filter((w) => w && w.length > 2);

    const messageTokens = messageLower
      .split(/[^a-z0-9+.#-]+/)
      .filter((w) => w && w.length > 2);

    const contextSet = new Set(contextTokens);
    const overlap = messageTokens.filter((w) => contextSet.has(w));

    // Off-topic tech/pop-culture markers that often indicate topic shift
    const offTopicTech = [
      // web frameworks and stacks
      "next.js",
      "nextjs",
      "next js",
      "react",
      "react.js",
      "react js",
      "vue",
      "vue.js",
      "vue js",
      "svelte",
      "angular",
      "tailwind",
      "bootstrap",
      "redux",
      "webpack",
      "vite",
      "astro",
      "nuxt",
      "sveltekit",
      "graphql",
      // platforms, infra
      "firebase",
      "supabase",
      "docker",
      "kubernetes",
      "aws",
      "gcp",
      "azure",
      // tooling
      "linux distro",
      "arch linux",
      "neovim",
      "vimrc",
      "emacs",
      "eslint",
      "prettier",
    ];

    // If syllabus/subject contains any of these, treat them as in-scope
    const allowedFromContext = offTopicTech.filter((k) =>
      normalizedContext.includes(k)
    );
    const messageHasOffTopicTech = offTopicTech.some((k) =>
      messageLower.includes(k)
    );
    const offTopicTechButNotAllowed =
      messageHasOffTopicTech &&
      !allowedFromContext.some((k) => messageLower.includes(k));

    // Heuristics:
    // - If we have specific context and there's no token overlap and message triggers off-topic tech/pop, it's off-topic
    // - If we have specific context and there is zero overlap at all, treat as off-topic
    if ((subjectArea || syllabusContext) && overlap.length === 0) {
      return true;
    }

    // Always block off-topic tech even if no context is provided
    if (offTopicTechButNotAllowed) {
      return true;
    }

    return false;
  };

  // Only block obvious entertainment queries
  if (isEntertainmentQuery(input.message)) {
    const refusal = input.subjectArea
      ? `This is outside our current topic. I cannot discuss that and will not switch topics. Let's stay focused on ${input.subjectArea}. Please ask about concepts covered in the syllabus.`
      : "This is outside the current syllabus topic. I cannot discuss that and will not switch topics. Please ask about the module's content.";

    return {
      response: refusal,
      suggestions: input.subjectArea
        ? [
            `Explain a key concept from ${input.subjectArea}`,
            "Summarize a section from the syllabus",
            "Ask for an example related to the module",
          ]
        : [
            "Ask about a concept from the module",
            "Request a summary of a syllabus section",
            "Ask for a practical example from the topic",
          ],
    };
  }

  // Hard on-topic gate before invoking the model
  if (
    isOffTopicForSyllabus(
      input.message,
      input.syllabusContext,
      input.subjectArea
    )
  ) {
    return {
      response: input.subjectArea
        ? `This is outside our current topic. I cannot discuss that and will not switch topics. Let's stay focused on ${input.subjectArea}. Please ask about concepts covered in the syllabus.`
        : "This is outside the current syllabus topic. I cannot discuss that and will not switch topics. Please ask about the module's content.",
      suggestions: input.subjectArea
        ? [
            `Explain a key concept from ${input.subjectArea}`,
            "Summarize a section from the syllabus",
            "Ask for an example related to the module",
          ]
        : [
            "Ask about a concept from the module",
            "Request a summary of a syllabus section",
            "Ask for a practical example from the topic",
          ],
    };
  }

  const conversationHistory = input.history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // Analyze user request to determine appropriate response style
  const analyzeUserRequest = (message: string) => {
    const messageLower = message.toLowerCase();

    const detailKeywords = [
      "detailed",
      "comprehensive",
      "thorough",
      "in-depth",
      "elaborate",
      "explain thoroughly",
      "break down",
      "step by step",
    ];
    const wantsDetailed = detailKeywords.some((keyword) =>
      messageLower.includes(keyword)
    );

    const simpleKeywords = [
      "simple",
      "basic",
      "easy",
      "beginner",
      "eli5",
      "explain like",
      "quick",
      "briefly",
    ];
    const wantsSimple = simpleKeywords.some((keyword) =>
      messageLower.includes(keyword)
    );

    const exampleKeywords = [
      "example",
      "examples",
      "show me",
      "demonstrate",
      "instance",
      "case study",
    ];
    const wantsExamples = exampleKeywords.some((keyword) =>
      messageLower.includes(keyword)
    );

    const practicalKeywords = [
      "practical",
      "real-world",
      "application",
      "use case",
      "how to use",
      "implementation",
    ];
    const wantsPractical = practicalKeywords.some((keyword) =>
      messageLower.includes(keyword)
    );

    return { wantsDetailed, wantsSimple, wantsExamples, wantsPractical };
  };

  const requestAnalysis = analyzeUserRequest(input.message);

  // Create dynamic standardized AI interaction format
  const hasSpecificContext =
    !!input.subjectArea ||
    (!!input.syllabusContext &&
      input.syllabusContext !== "Educational content");

  const aiFormat: WikiSyllabusAIFormat = {
    persona: {
      role: requestAnalysis.wantsSimple
        ? "You are a friendly educational AI assistant who excels at breaking down complex topics into simple, easy-to-understand explanations and you act as a focused academic tutor"
        : requestAnalysis.wantsDetailed
        ? "You are an expert educational AI assistant who provides comprehensive, thorough explanations with deep insights"
        : "You are a conversational educational AI assistant who acts as a focused academic tutor",
      expertise: [
        "Strictly adhering to the established academic topic.",
        "Identifying and redirecting off-topic or out-of-scope questions.",
        "Adapting explanations to user's knowledge level",
        "Making complex concepts accessible",
        "Providing relevant examples and analogies",
      ],
      tone: requestAnalysis.wantsSimple
        ? "casual"
        : requestAnalysis.wantsDetailed
        ? "professor"
        : "mentor",
      audienceLevel: requestAnalysis.wantsSimple
        ? "beginner"
        : requestAnalysis.wantsDetailed
        ? "advanced"
        : "mixed",
    },
    task: {
      action: hasSpecificContext
        ? `You are a Retrieval-Augmented Generation (RAG) assistant. Your knowledge is strictly limited to the provided context. Your task is to answer the user's question **only using the information from the 'CONTEXT' section below**.
1. First, analyze the user's question: "${input.message}".
2. Next, review the provided context: **Subject: ${
            input.subjectArea
          }** and **Syllabus: ${input.syllabusContext}**.
3. If the question can be answered directly using this context, provide a helpful and comprehensive answer based *only* on that information.
4. If the question is outside the scope of the provided context, you **MUST NOT** answer it. Instead, you must state that the question is outside the current topic and politely guide the user back. For example: "That's an interesting question, but it falls outside our current focus on ${
            input.subjectArea || "the topic"
          }. I can only provide information based on the established subject matter. Shall we continue our discussion?"`
        : "Provide a natural, conversational explanation that feels engaging and informative, adapting to the user's needs.",
      objectives: [
        ...(requestAnalysis.wantsSimple
          ? [
              "Use everyday language and simple terms",
              "Avoid jargon and complex terminology",
            ]
          : []),
        ...(requestAnalysis.wantsDetailed
          ? [
              "Provide thorough coverage with multiple perspectives",
              "Include technical details and nuanced explanations",
            ]
          : []),
        ...(requestAnalysis.wantsExamples
          ? ["Include multiple relevant examples", "Use concrete illustrations"]
          : ["Include at least one relevant example"]),
        ...(requestAnalysis.wantsPractical
          ? [
              "Focus on real-world applications",
              "Show practical implementation",
            ]
          : []),
        ...(hasSpecificContext
          ? [
              "Base your answer *exclusively* on the provided context.",
              "Do not use general knowledge to answer questions.",
              "If the user's question is off-topic, state that you cannot answer and redirect them.",
            ]
          : [
              "Maintain natural conversation flow",
              "Integrate syllabus context appropriately",
            ]),
      ],
      deliverables: [
        requestAnalysis.wantsSimple
          ? "Simple, clear explanation in everyday language"
          : "Comprehensive educational response",
        ...(requestAnalysis.wantsExamples
          ? ["Multiple concrete examples"]
          : ["Relevant examples"]),
        "Natural, engaging communication style",
      ],
    },
    format: {
      structure: "paragraph",
      requirements: [
        "Write in natural, conversational style like ChatGPT",
        "Use flowing paragraphs with smooth transitions",
        requestAnalysis.wantsSimple
          ? "Use simple language and short sentences"
          : "Use appropriate complexity for the topic",
        "Sound natural and engaging, not robotic or overly structured",
      ],
      length: {
        min: requestAnalysis.wantsSimple
          ? 80
          : requestAnalysis.wantsDetailed
          ? 200
          : 120,
        max: requestAnalysis.wantsSimple
          ? 150
          : requestAnalysis.wantsDetailed
          ? 400
          : 280,
        target: requestAnalysis.wantsSimple
          ? 120
          : requestAnalysis.wantsDetailed
          ? 300
          : 200,
        unit: "words",
      },
      specialFormatting: {
        useCodeBlocks: false,
        includeHeaders: false,
        useEmphasis: true,
      },
    },
    context: {
      academic: {
        syllabus: input.syllabusContext || "Educational content",
      },
      subject: {
        area: input.subjectArea || "Academic topics",
        level: requestAnalysis.wantsSimple
          ? "Beginner-friendly"
          : "Higher Education",
      },
      student: {
        priorKnowledge: requestAnalysis.wantsSimple
          ? "Minimal - explain from basics"
          : requestAnalysis.wantsDetailed
          ? "Good foundation - can handle complexity"
          : "Variable",
        learningStyle: requestAnalysis.wantsExamples
          ? "Visual and example-driven"
          : "Conversational",
        goals: [
          requestAnalysis.wantsSimple
            ? "Understand basic concepts clearly"
            : "Understand concepts thoroughly",
          ...(requestAnalysis.wantsPractical
            ? ["Apply knowledge in real situations"]
            : []),
          "Feel confident about the topic",
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

    // Add strict anti-hallucination and topic-drift constraints
    const topicConstraints = hasSpecificContext
      ? `\n\n**CRITICAL CONSTRAINTS - YOU MUST FOLLOW THESE RULES:**
1. **TOPIC BOUNDARY ENFORCEMENT**: You are ONLY allowed to discuss ${
          input.subjectArea || "the established academic topic"
        }. If the student's question mentions ANY topic outside this scope, you MUST:
   - Acknowledge their question briefly
   - State clearly that it falls outside the current subject area
   - Redirect them back to ${input.subjectArea || "the course material"}
   - Do NOT attempt to answer the off-topic question, even partially

2. **SYLLABUS ADHERENCE**: Your responses must be derived EXCLUSIVELY from: "${
          input.syllabusContext
        }"
   - If information is NOT in the syllabus context, say "This specific detail isn't covered in our course material"
   - Never supplement with external knowledge that isn't in the provided context
   - If asked about related but out-of-scope topics, redirect to what IS covered

3. **ANTI-HALLUCINATION PROTOCOLS**:
   - NEVER make up examples, dates, names, statistics, or technical details that aren't in the provided context
   - If you're uncertain about ANY detail, explicitly state "I'm not certain about this specific detail from the course material"
   - Do NOT infer or extrapolate beyond what's explicitly stated in the syllabus context
   - If a concept isn't adequately covered in the context, say so rather than fabricating information

4. **KEYWORD-TRIGGERED TOPIC SHIFT PREVENTION**:
   - Even if the student's question contains keywords that could lead to tangential topics, ALWAYS verify the question relates to ${
     input.subjectArea || "the subject area"
   }
   - Example: If discussing "Python programming" and student mentions "snake," recognize they likely mean the programming language, not the animal
   - If genuinely ambiguous, ask for clarification: "Are you asking about [Topic A in our subject] or something else?"

5. **SCOPE VERIFICATION CHECK**: Before answering ANY question, mentally verify:
   - Is this question about ${input.subjectArea || "the subject area"}? 
   - Is the answer found in "${input.syllabusContext}"?
   - If NO to either, politely decline and redirect

**EXAMPLE REDIRECTS**:
- "That's an interesting question about [off-topic], but it falls outside our focus on ${
          input.subjectArea
        }. Let's stay focused on [relevant topic]. Would you like to explore [related in-scope topic] instead?"
- "I notice your question touches on [tangent topic], which isn't covered in our current material on ${
          input.subjectArea
        }. What I can tell you about [related in-scope concept] is..."
- "That specific detail about [X] isn't covered in our syllabus. However, what we do cover about [related topic] is..."

If you violate any of these constraints, you are failing in your primary responsibility as an educational assistant.`
      : `\n\n**TOPIC COHERENCE GUIDELINES:**
1. **STAY ON TRACK**: Ensure your response directly addresses the educational question asked
2. **NO UNSOLICITED TANGENTS**: Don't introduce unrelated topics even if they contain similar keywords
3. **VERIFY RELEVANCE**: If the question seems to shift topics or asks about entertainment/celebrity/controversy, refuse briefly and ask them to provide an educational topic instead
4. **FACTUAL ACCURACY**: Only state facts you're confident about. If uncertain, say "I'm not completely certain about this" rather than guessing
5. **EXAMPLE RELEVANCE**: All examples must directly relate to the concept being explained - no tangential stories`;

    dynamicUserMessage += topicConstraints;

    const standardizedPrompt = createStandardizedPrompt({
      format: aiFormat,
      userMessage: dynamicUserMessage,
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
      model: input.model || "llama-3.1-8b-instant",
      temperature: hasSpecificContext ? 0.2 : 0.5,
      max_completion_tokens: 1536,
      top_p: hasSpecificContext ? 0.6 : 0.9,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Post-processing: Validate AI response for topic adherence
    const validateResponseRelevance = (
      response: string
    ): { isValid: boolean; reason?: string } => {
      const responseLower = response.toLowerCase();

      // Check if AI is refusing/redirecting (which is good)
      const refusalPatterns = [
        "falls outside",
        "not covered",
        "outside the scope",
        "outside our focus",
        "redirect",
        "isn't in our syllabus",
        "beyond the scope",
        "outside this topic",
        "not part of",
      ];
      const isRefusingOffTopic = refusalPatterns.some((pattern) =>
        responseLower.includes(pattern)
      );
      if (isRefusingOffTopic) {
        return { isValid: true }; // AI correctly refused off-topic
      }

      // If we have specific context, verify response relates to it
      if (hasSpecificContext && input.subjectArea) {
        const subjectKeywords = input.subjectArea.toLowerCase().split(" ");
        const syllabusKeywords =
          input.syllabusContext
            ?.toLowerCase()
            .split(" ")
            .filter((w) => w.length > 3) || [];
        const relevantKeywords = [...subjectKeywords, ...syllabusKeywords];

        // Check if response contains subject-related keywords
        const hasRelevantKeywords = relevantKeywords.some((keyword) =>
          responseLower.includes(keyword)
        );

        // Check for common hallucination patterns
        const hallucinationPatterns = [
          /as (?:a|an) .{3,30}(?:expert|professor|specialist)/i,
          /in my (?:experience|opinion|view)/i,
          /(?:studies show|research indicates|scientists have found)/i, // Unless specifically in syllabus
          /according to (?:recent|latest)/i,
        ];
        const containsHallucinationMarkers = hallucinationPatterns.some(
          (pattern) => pattern.test(response)
        );

        if (!hasRelevantKeywords && response.length > 100) {
          return {
            isValid: false,
            reason: "Response appears to drift from the specified subject area",
          };
        }

        if (
          containsHallucinationMarkers &&
          !input.syllabusContext?.toLowerCase().includes("research")
        ) {
          return {
            isValid: false,
            reason: "Response contains potential hallucination markers",
          };
        }
      }

      // Check for entertainment content slipping through
      if (isEntertainmentQuery(response)) {
        return {
          isValid: false,
          reason: "Response contains non-educational content",
        };
      }

      return { isValid: true };
    };

    const responseValidation = validateResponseRelevance(outputText);

    if (!responseValidation.isValid) {
      console.warn(
        `AI response validation failed: ${responseValidation.reason}`
      );
      console.warn(`Filtered response: ${outputText.substring(0, 200)}...`);

      return {
        response: hasSpecificContext
          ? `This is outside our current topic. I cannot discuss that and will not switch topics. Let's stay focused on ${input.subjectArea}. Please ask about concepts covered in the syllabus.`
          : "I cannot discuss entertainment, celebrity, or unrelated topics. Please ask about an educational concept or coursework topic.",
        suggestions: hasSpecificContext
          ? [
              `Explain a key concept from ${input.subjectArea}`,
              "Summarize a section from the syllabus",
              "Ask for an example related to the module",
            ]
          : [
              "Ask about a specific educational concept",
              "Request an explanation of a technical or academic topic",
              "Ask for a practical example from a subject area",
            ],
      };
    }

    // Generate natural, conversation-continuing suggestions
    const generateSuggestions = (
      subjectArea?: string,
      syllabusContext?: string
    ): string[] => {
      // If we have syllabus context, make suggestions more specific to the course
      if (
        syllabusContext &&
        syllabusContext.trim() !==
          "General educational content - provide comprehensive explanations for any academic topic"
      ) {
        return [
          "Can you explain how this connects to other topics in the syllabus?",
          "What are some practical applications of this concept?",
          "Could you walk me through a specific example?",
        ];
      }

      // Subject-specific suggestions that encourage deeper exploration
      if (subjectArea) {
        const subjectSuggestions: Record<string, string[]> = {
          "computer science": [
            "Can you show me how this works with a practical example?",
            "What are the real-world applications of this concept?",
            "How does this relate to other programming concepts?",
          ],
          mathematics: [
            "Could you walk through a step-by-step example?",
            "How is this concept used in practical applications?",
            "What's the intuition behind this mathematical idea?",
          ],
          physics: [
            "Can you explain the physical intuition behind this?",
            "What are some real-world examples of this phenomenon?",
            "How does this concept connect to other physics topics?",
          ],
          chemistry: [
            "What's happening at the molecular level here?",
            "Can you give me some practical examples of this?",
            "How does this relate to other chemical processes?",
          ],
          biology: [
            "How does this process work in living organisms?",
            "What are some specific examples of this in nature?",
            "How does this connect to other biological systems?",
          ],
        };

        return (
          subjectSuggestions[subjectArea.toLowerCase()] || [
            "Can you provide more specific examples?",
            "How does this apply in real-world situations?",
            "What are the key takeaways I should remember?",
          ]
        );
      }

      return [
        "Could you elaborate on this topic further?",
        "What are some practical examples of this?",
        "How can I apply this knowledge?",
      ];
    };

    return {
      response: outputText,
      suggestions: generateSuggestions(
        input.subjectArea,
        input.syllabusContext
      ),
    };
  } catch (e) {
    console.error("Error in educational chat flow:", e);
    return {
      response:
        "I'm here to help you explore and understand any educational topic you're curious about! Whether you're working through concepts from your syllabus, trying to grasp complex theories, or just want to deepen your understanding of academic subjects, I'm ready to provide detailed, comprehensive explanations. What would you like to learn about today?",
      suggestions: [
        "Ask for detailed explanations of concepts",
        "Request examples and practical applications",
        "Explore topics from your coursework",
      ],
    };
  }
};

export async function chatWithSyllabus(
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}
