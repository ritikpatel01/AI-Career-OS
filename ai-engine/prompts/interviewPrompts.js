const buildInterviewEvaluationPrompt = ({
    role,
    category,
    difficulty,
    topic,
    question,
    expectedConcepts = [],
    criticalConcepts = [],
    commonMistakes = [],
    answer
}) => {
    return `
You are a strict but fair technical interview evaluator.

Evaluate the candidate's answer ONLY against the interview question and the expected concepts.

Candidate role:
${role || "Not specified"}

Category:
${category || "Technical"}

Difficulty:
${difficulty || "Intermediate"}

Topic:
${topic || "General"}

Question:
${question}

Expected concepts:
${expectedConcepts.join(", ") || "Not specified"}

Critical concepts:
${criticalConcepts.join(", ") || "Not specified"}

Common mistakes:
${commonMistakes.join(", ") || "Not specified"}

Candidate answer:
${answer}

Evaluation rules:

1. Do NOT reward an answer merely because it is long.
2. Do NOT reward keyword stuffing.
3. If the answer is nonsense, random text, unreadable, or unrelated to the question, score it very low.
4. If the answer contains technically incorrect claims, identify them.
5. Do not assume concepts that the candidate did not actually explain.
6. Distinguish partial knowledge from a correct answer.
7. A concise but technically correct answer can score highly.
8. Evaluate the answer against the question, not against generic interview expectations.
9. Never invent facts about what the candidate said.
10. Be conservative when evidence is insufficient.

Score these five dimensions from 1 to 5:

- accuracy
- relevance
- completeness
- technicalDepth
- clarity

Use these weights for the final score:

Accuracy: 20%
Relevance: 20%
Completeness: 20%
Technical depth: 25%
Clarity: 15%

The final score must be an integer from 0 to 100.

Return:
- overall score
- verdict
- five dimension scores
- short explanation
- strengths
- weaknesses
- missing concepts
- incorrect claims
- improvement advice
- ideal answer

Verdict must be one of:
"Excellent"
"Good"
"Partial"
"Weak"
"Incorrect"

Return ONLY valid JSON.
`;
};

module.exports = {
    buildInterviewEvaluationPrompt
};