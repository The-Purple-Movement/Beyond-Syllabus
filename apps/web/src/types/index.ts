export interface Module {
  title: string;
  content: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category?: 'Code' | 'Math' | 'Physics' | 'Core';
  modules: Module[];
  fullSyllabus: string;
}

export interface Semester {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Scheme {
  id: string;
  name: string;
  semesters: Semester[];
}

export interface Program {
  id: string;
  name: string;
  schemes: Scheme[];
}

export interface University {
  id: string;
  name: string;
  programs: Program[];
}

export interface SubjectsPageProps {
  params: Promise<{
    university: string;
    program: string;
    scheme: string;
    semester: string;
  }>;
}

export interface DirectoryStructure {
  [key: string]: any;
}

export interface SubjectPageProps {
  params: Promise<{
    university: string;
    program: string;
    scheme: string;
    semester: string;
    subject: string;
  }>;
}

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

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

export interface GenerateModuleTasksInput {
  moduleContent: string;
  moduleTitle: string;
  model?: string;
}

export interface GenerateModuleTasksOutput {
  introductoryMessage: string;
  suggestions: string[];
}

export interface MindMapInput {
  syllabus: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  parentId?: string;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface MindMapOutput {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface SuggestResourcesInput {
  syllabusSection: string;
}

export interface Resource {
  title: string;
  url: string;
  description: string;
}

export interface SuggestResourcesOutput {
  resources: Resource[];
}

export interface SummarizeSyllabusInput {
  syllabusText: string;
}

export interface SummarizeSyllabusOutput {
  summary: string;
}


export interface AIPersona {
  role: string;
  expertise?: string[];
  tone?: "formal" | "casual" | "mentor" | "peer" | "professor" | "tutor";
  audienceLevel?: "beginner" | "intermediate" | "advanced" | "mixed";
}

export interface AITask {
  action: string;
  objectives?: string[];
  deliverables?: string[];
  successCriteria?: string[];
}


export interface AIFormat {
  structure:
    | "bulleted-list"
    | "numbered-list"
    | "step-by-step"
    | "table"
    | "markdown"
    | "paragraph"
    | "dialogue"
    | "json"
    | "custom";
  requirements?: string[];
  length?: {
    min?: number;
    max?: number;
    target?: number;
    unit: "words" | "characters" | "sentences" | "paragraphs";
  };
  specialFormatting?: {
    useCodeBlocks?: boolean;
    includeTables?: boolean;
    includeHeaders?: boolean;
    useEmphasis?: boolean;
  };
}


export interface AIContext {
  academic?: {
    course?: string;
    semester?: string;
    university?: string;
    syllabus?: string;
    module?: string;
  };
  subject?: {
    area: string;
    level: string;
    prerequisites?: string[];
    focus?: string;
  };
  student?: {
    priorKnowledge?: string;
    learningStyle?: string;
    difficulties?: string[];
    goals?: string[];
  };
  additional?: {
    timeConstraints?: string;
    resources?: string[];
    constraints?: string[];
  };
}

export interface AIReferences {
  preferredSources?: string[];
  citationStyle?: "APA" | "MLA" | "IEEE" | "Chicago" | "Harvard" | "simple";
  includeReferences: boolean;
  specificSources?: {
    name: string;
    type:
      | "textbook"
      | "research-paper"
      | "documentation"
      | "course-material"
      | "online-resource";
    url?: string;
    author?: string;
  }[];
}


export interface WikiSyllabusAIFormat {
  persona: AIPersona;
  task: AITask;
  format: AIFormat;
  context: AIContext;
  references: AIReferences;
  metadata?: {
    version: string;
    createdAt: Date;
    lastModified: Date;
    tags?: string[];
  };
}

export interface CreateStandardizedPromptInput {
  format: WikiSyllabusAIFormat;
  userMessage: string;
  systemMessage?: string;
}

export interface StandardizedPromptOutput {
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    formatVersion: string;
    components: (keyof WikiSyllabusAIFormat)[];
    timestamp: Date;
  };
}

export interface Module {
  title: string;
  content: string;
}

export interface CourseModulesProps {
  subjectId: string;
  modules: Module[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastModified: Date;
  markdown: string;
  messages: Message[];
  suggestions: string[];
}

export interface ErrorDisplayProps {
  errorMessage: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export type Modules = { title: string; content: string };

export interface MindMapProps {
  subjectCode: string;
  subjectName: string;
  modules: Modules[];
}

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onCopy?: () => void;
}

export interface Model {
  id: string;
  name: string;
}

export interface ModelSelectorProps {
  value?: string;
  onChange: (modelId: string) => void;
}

export interface SyllabusSummaryProps {
  fullSyllabus: string;
}

export interface ChatInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  className?: string;
  disabled?: boolean;
  onModelChange?: (modelId: string) => void;
}