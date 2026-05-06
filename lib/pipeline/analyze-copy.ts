const PROBLEMATIC_WORDS = [
  "indolor",
  "sem dor",
  "melhor clinica",
  "melhor clínica",
  "melhor implante",
  "melhor dentista",
  "promocao",
  "promoção",
  "desconto",
  "oferta especial",
  "garantido",
  "garantia de",
  "100% seguro",
];

export interface CopyAnalysis {
  violations: string[];
}

export function analyzeCopy(text: string): CopyAnalysis {
  const lower = text.toLowerCase();
  const violations = PROBLEMATIC_WORDS.filter((w) =>
    lower.includes(w.toLowerCase())
  );
  return { violations };
}
