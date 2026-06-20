export type BloomLevel =
  | "Remember"
  | "Understand"
  | "Apply"
  | "Analyze"
  | "Evaluate"
  | "Create";

export interface Question {
  id: string;
  number: number;
  marks: 2 | 13 | 16;
  bloom: BloomLevel;
  text: string;
  hasAnswer?: boolean;
  modelAnswer?: string;
}

export interface HistoryEntry {
  id: string;
  pdfName: string;
  date: string;
  questions: number;
  status: "Completed" | "Processing" | "Failed";
}

export const bloomColors: Record<BloomLevel, string> = {
  Remember: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  Understand: "bg-primary/12 text-primary border-primary/25",
  Apply: "bg-success/15 text-success border-success/30",
  Analyze: "bg-brand-purple/15 text-brand-purple border-brand-purple/30",
  Evaluate: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  Create: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30",
};

export const sampleQuestions: Question[] = [
  {
    id: "q1",
    number: 1,
    marks: 2,
    bloom: "Remember",
    text: "Define normalization in the context of relational databases and list its primary objectives.",
    hasAnswer: true,
  },
  {
    id: "q2",
    number: 2,
    marks: 2,
    bloom: "Understand",
    text: "Explain the difference between a primary key and a foreign key with a suitable example.",
    hasAnswer: true,
  },
  {
    id: "q3",
    number: 3,
    marks: 2,
    bloom: "Apply",
    text: "Write an SQL query to retrieve the names of all students who scored above 75 in the 'Marks' table.",
    hasAnswer: true,
  },
  {
    id: "q4",
    number: 4,
    marks: 13,
    bloom: "Analyze",
    text: "Analyze the trade-offs between the second normal form (2NF) and third normal form (3NF). Illustrate with a worked example showing how anomalies are removed at each stage.",
    hasAnswer: true,
  },
  {
    id: "q5",
    number: 5,
    marks: 13,
    bloom: "Understand",
    text: "Describe the ACID properties of database transactions. For each property, give a real-world scenario where its violation would cause data inconsistency.",
    hasAnswer: false,
  },
  {
    id: "q6",
    number: 6,
    marks: 16,
    bloom: "Evaluate",
    text: "Evaluate the suitability of relational versus NoSQL databases for a large-scale e-commerce platform. Justify your recommendation with respect to scalability, consistency, and query flexibility.",
    hasAnswer: true,
  },
  {
    id: "q7",
    number: 7,
    marks: 16,
    bloom: "Create",
    text: "Design a complete normalized database schema for a university course-registration system. Include entities, relationships, keys, and at least three sample queries the system would require.",
    hasAnswer: false,
  },
  {
    id: "q8",
    number: 8,
    marks: 2,
    bloom: "Remember",
    text: "State the purpose of an index in a database and name two common index structures.",
    hasAnswer: true,
  },
];

export const sampleHistory: HistoryEntry[] = [
  {
    id: "h1",
    pdfName: "DBMS_Unit3_Normalization.pdf",
    date: "Jun 14, 2026",
    questions: 24,
    status: "Completed",
  },
  {
    id: "h2",
    pdfName: "Operating_Systems_Scheduling.pdf",
    date: "Jun 12, 2026",
    questions: 18,
    status: "Completed",
  },
  {
    id: "h3",
    pdfName: "Computer_Networks_OSI_Model.pdf",
    date: "Jun 10, 2026",
    questions: 30,
    status: "Processing",
  },
  {
    id: "h4",
    pdfName: "Data_Structures_Trees.pdf",
    date: "Jun 08, 2026",
    questions: 22,
    status: "Completed",
  },
  {
    id: "h5",
    pdfName: "Machine_Learning_Intro.pdf",
    date: "Jun 05, 2026",
    questions: 16,
    status: "Failed",
  },
  {
    id: "h6",
    pdfName: "Software_Engineering_SDLC.pdf",
    date: "Jun 02, 2026",
    questions: 28,
    status: "Completed",
  },
];

export const questionDistribution = [
  { name: "2 Marks", value: 42, fill: "var(--color-chart-1)" },
  { name: "13 Marks", value: 31, fill: "var(--color-chart-2)" },
  { name: "16 Marks", value: 27, fill: "var(--color-chart-3)" },
];

export const bloomDistribution = [
  { level: "Remember", count: 38 },
  { level: "Understand", count: 52 },
  { level: "Apply", count: 44 },
  { level: "Analyze", count: 33 },
  { level: "Evaluate", count: 21 },
  { level: "Create", count: 14 },
];

export const usageTrend = [
  { month: "Jan", banks: 12 },
  { month: "Feb", banks: 19 },
  { month: "Mar", banks: 27 },
  { month: "Apr", banks: 34 },
  { month: "May", banks: 41 },
  { month: "Jun", banks: 58 },
];