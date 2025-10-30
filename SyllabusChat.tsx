"use client";

import { useState, useEffect, useRef } from "react";

/**
 * 💬 Beyond Syllabus – AI Chat Interface
 * --------------------------------------
 * This component is part of the Beyond Syllabus front-end project.
 * It provides an interactive chat experience where users can ask
 * syllabus-related questions and receive AI-style contextual responses.
 *
 * Features:
 *  - Real-time message updates
 *  - Simulated AI responses
 *  - Smooth auto-scroll behavior
 *  - Typing indicator animation
 *  - Simple modern UI with inline styles
 *
 * Author: @anjanarajesh-00
 * Project: Beyond Syllabus
 * License: MIT
 */

export default function SyllabusChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi there! I’m your Beyond Syllabus AI companion. Ask me anything about your course, modules, or real-world use cases!",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response with delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      setMessages((prev) => [...prev, { sender: "bot", text: aiResponse }]);
      setIsTyping(false);
    }, 1300);
  };

  // Function to simulate different AI responses
  const generateAIResponse = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes("why") || q.includes("purpose"))
      return "✨ Great question! The purpose of this topic is to help students understand *why* concepts matter in real-world systems — not just in exams.";

    if (q.includes("where") || q.includes("application"))
      return "🧠 This concept finds use in many areas — like machine learning, data processing, and automation in modern software.";

    if (q.includes("project") || q.includes("mini"))
      return "💡 You could create a mini-project like *‘AI-powered note summarizer’* or *‘Syllabus chatbot’* to apply what you learn!";

    if (q.includes("career") || q.includes("job"))
      return "💼 Career-wise, this area connects to roles such as AI engineer, data scientist, and research assistant.";

    if (q.includes("who") || q.includes("invented"))
      return "📚 Many pioneers have shaped this field — including researchers from MIT, Stanford, and OpenAI!";

    return "🌍 That’s a wonderful query! This topic helps bridge theory with practice — empowering you to think beyond the syllabus.";
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "30px auto",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#1f2937",
      }}
    >
      {/* Header Section */}
      <h1 style={{ textAlign: "center", color: "#6b21a8", fontSize: 26 }}>
        💬 Beyond Syllabus – AI Chat
      </h1>
      <p style={{ textAlign: "center", color: "#4b5563" }}>
        Ask “Why, Where, or How” about your syllabus topics and explore real-world context 🚀
      </p>

      {/* Chat Box */}
      <div
        style={{
          height: 420,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: 12,
          overflowY: "auto",
          background: "#fafafa",
          marginTop: 15,
          boxShadow: "0 0 10px rgba(0,0,0,0.05)",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.sender === "user" ? "right" : "left",
              margin: "10px 0",
            }}
          >
            <span
              style={{
                background: m.sender === "user" ? "#6b21a8" : "#e5e7eb",
                color: m.sender === "user" ? "white" : "#111827",
                padding: "10px 14px",
                borderRadius: 14,
                display: "inline-block",
                maxWidth: "80%",
                lineHeight: 1.5,
              }}
            >
              {m.text}
            </span>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={{ textAlign: "left", margin: "6px 0" }}>
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div style={{ display: "flex", marginTop: 15 }}>
        <input
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 15,
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something like 'Why learn Operating Systems?'..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          style={{
            marginLeft: 8,
            background: "#6b21a8",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: 13,
          textAlign: "center",
          color: "#6b7280",
          marginTop: 18,
        }}
      >
        Built with 💜 by the Purple Movement • Learn. Question. Go Beyond 🚀
      </p>
    </div>
  );
}

/** Animated typing dots */
function TypingIndicator() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return (
    <span
      style={{
        background: "#e5e7eb",
        padding: "8px 14px",
        borderRadius: 12,
        color: "#6b7280",
        fontStyle: "italic",
      }}
    >
      AI is thinking{dots}
    </span>
  );
              }
