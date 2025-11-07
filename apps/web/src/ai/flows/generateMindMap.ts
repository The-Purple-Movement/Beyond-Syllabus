"use server";

import { ai } from "@/ai/ai";
import { MindMapInput, MindMapOutput } from "@/types";

const generateMindMapFlow = async (
  input: MindMapInput
): Promise<MindMapOutput> => {
  const promptText = `
You are a syllabus-to-mind-map converter.
Convert the given syllabus into a hierarchical mind map structure.

Rules:
1. Each major heading becomes a top-level node.
2. Subheadings and bullet points become child nodes linked to their parent.
3. Use short, clear labels for nodes (max 50 characters).
4. Return only valid JSON that matches the schema below.

JSON Schema:
{
  "nodes": [
    { "id": "1", "label": "Root Node" },
    { "id": "2", "label": "Child Node", "parentId": "1" }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" }
  ]
}

Syllabus:
"""${input.syllabus}"""
`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [{ role: "user", content: promptText }],
      model: "qwen/qwen3-32b",
      temperature: 0.5,
      max_completion_tokens: 2048,
      top_p: 0.95,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Safely parse JSON output
    try {
      const output = JSON.parse(outputText);
      if (!output?.nodes || !output?.edges) {
        throw new Error("Invalid AI output structure");
      }
      return output as MindMapOutput;
    } catch (parseError) {
      console.error("Failed to parse AI output as JSON:", parseError);
      return {
        nodes: [
          { id: "1", label: "Mind Map Generation Failed" },
          { id: "2", label: "Please try again later", parentId: "1" },
        ],
        edges: [{ id: "e1-2", source: "1", target: "2" }],
      };
    }
  } catch (e) {
    console.error("Error generating mind map:", e);
    return {
      nodes: [
        { id: "1", label: "Mind Map Generation Failed" },
        { id: "2", label: "Please try again later", parentId: "1" },
      ],
      edges: [{ id: "e1-2", source: "1", target: "2" }],
    };
  }
};

export async function generateMindMap(
  input: MindMapInput
): Promise<MindMapOutput> {
  return generateMindMapFlow(input);
}
