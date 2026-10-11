export function calculateScore(
  correctCount: number,
  wrongCount: number,
  marksPerQuestion: number,
  negativeMarkingFraction: number
) {
  const correctMarks = correctCount * marksPerQuestion;
  const negativeMarks = wrongCount * (marksPerQuestion * negativeMarkingFraction);
  return correctMarks - negativeMarks;
}
