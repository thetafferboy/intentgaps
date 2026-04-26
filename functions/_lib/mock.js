export const mockQuestions = [
  "What are search intent gaps?",
  "How do you find content gaps in SEO?",
  "Why are People Also Ask questions useful?",
  "How can you improve content quality at scale?",
  "Does answering related questions help rankings?",
  "What tools can identify unanswered questions?"
];

export function mockScores(questions) {
  return questions.map((question, index) => ({
    question,
    status: index % 3 === 0 ? "full" : index % 3 === 1 ? "partial" : "not"
  }));
}
