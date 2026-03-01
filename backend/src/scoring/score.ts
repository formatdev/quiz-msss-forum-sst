export function scoreSingle(selected: string[], correct: string[]): number {
  if (selected.length !== 1 || correct.length !== 1) {
    return 0;
  }
  return selected[0] === correct[0] ? 1 : 0;
}

export function scoreMultiple(selected: string[], correct: string[]): number {
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);

  let positive = 0;
  for (const key of selectedSet) {
    if (correctSet.has(key)) {
      positive += 1;
    } else {
      positive -= 1;
    }
  }
  const bounded = Math.max(0, Math.min(correctSet.size, positive));
  if (correctSet.size === 0) {
    return 0;
  }
  return bounded / correctSet.size;
}

export function scoreQuestion(
  mode: 'single' | 'multiple',
  selected: string[],
  correct: string[]
): number {
  if (mode === 'single') {
    return scoreSingle(selected, correct);
  }
  return scoreMultiple(selected, correct);
}
