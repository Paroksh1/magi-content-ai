import { syllable } from "syllable";

export interface ContentScore {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  readabilityScore: number;
  readabilityLabel: string;
  qualityScore: number;
  qualityLabel: string;
  readingTimeMinutes: number;
  passiveVoice: { percentage: number; count: number; total: number };
  keywordDensity: { keyword: string; density: number }[] | null;
}

const WORDS_PER_MINUTE = 238;

const IRREGULAR_PAST_PARTICIPLES = new Set([
  "been", "born", "broken", "built", "bought", "caught", "chosen",
  "done", "drawn", "driven", "eaten", "fallen", "felt", "found",
  "given", "gone", "grown", "heard", "held", "hidden", "hit",
  "kept", "known", "laid", "led", "left", "lost", "made", "meant",
  "met", "paid", "put", "read", "run", "said", "seen", "sent",
  "set", "shown", "sold", "spent", "spoken", "stood", "taken",
  "taught", "thought", "told", "understood", "won", "worn", "written",
]);

const PASSIVE_AUX = /\b(is|am|are|was|were|been|being|be|get|gets|got|gotten)\b/i;

function countWordSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return 0;
  return Math.max(syllable(clean), 1);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Co)\./g, "$1\u0000")
    .split(/[.!?]+(?:\s|$)|\n+/)
    .map((s) => s.replace(/\u0000/g, ".").trim())
    .filter((s) => s.length > 2);
}

function isPassiveSentence(sentence: string): boolean {
  const words = sentence.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    if (PASSIVE_AUX.test(words[i])) {
      for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
        const w = words[j].toLowerCase().replace(/[^a-z]/g, "");
        if (IRREGULAR_PAST_PARTICIPLES.has(w)) return true;
        if (w.endsWith("ed") || w.endsWith("en")) return true;
      }
    }
  }
  return false;
}

function getReadabilityLabel(score: number): string {
  if (score >= 70) return "Easy";
  if (score >= 50) return "Standard";
  if (score >= 30) return "Moderate";
  return "Difficult";
}

function computeQualityScore(
  fleschScore: number,
  avgSentenceLength: number,
  passivePercent: number,
  wordCount: number,
  keywordDensity: ContentScore["keywordDensity"]
): number {
  // Readability component (40% weight): map Flesch 0-100 to 0-40
  // Normalize: 30+ is acceptable for professional content, 70+ is ideal
  const readabilityPart = Math.min(40, Math.round((Math.min(fleschScore, 80) / 80) * 40));

  // Sentence length component (20% weight): ideal is 12-20 words
  let sentencePart = 20;
  if (avgSentenceLength < 5) sentencePart = 10;
  else if (avgSentenceLength < 10) sentencePart = 15;
  else if (avgSentenceLength > 30) sentencePart = 5;
  else if (avgSentenceLength > 25) sentencePart = 10;
  else if (avgSentenceLength > 20) sentencePart = 15;

  // Passive voice component (15% weight): under 15% is good
  let passivePart = 15;
  if (passivePercent > 30) passivePart = 3;
  else if (passivePercent > 20) passivePart = 7;
  else if (passivePercent > 15) passivePart = 10;
  else if (passivePercent > 10) passivePart = 12;

  // Word count component (10% weight): enough content?
  let wordPart = 10;
  if (wordCount < 50) wordPart = 3;
  else if (wordCount < 100) wordPart = 6;
  else if (wordCount < 150) wordPart = 8;

  // Keyword usage component (15% weight)
  let keywordPart = 15;
  if (keywordDensity && keywordDensity.length > 0) {
    const usedCount = keywordDensity.filter((k) => k.density > 0).length;
    const inRangeCount = keywordDensity.filter((k) => k.density >= 0.5 && k.density <= 4).length;
    const usageRatio = usedCount / keywordDensity.length;
    const rangeRatio = inRangeCount / keywordDensity.length;
    keywordPart = Math.round(usageRatio * 8 + rangeRatio * 7);
  }

  return Math.min(100, readabilityPart + sentencePart + passivePart + wordPart + keywordPart);
}

function getQualityLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

export function analyzeContent(text: string, keywords?: string): ContentScore {
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (!cleanText) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      avgSentenceLength: 0,
      readabilityScore: 0,
      readabilityLabel: "—",
      qualityScore: 0,
      qualityLabel: "—",
      readingTimeMinutes: 0,
      passiveVoice: { percentage: 0, count: 0, total: 0 },
      keywordDensity: null,
    };
  }

  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const sentences = splitSentences(cleanText);
  const sentenceCount = Math.max(sentences.length, 1);
  const avgSentenceLength = wordCount / sentenceCount;

  let totalSyllables = 0;
  for (const word of words) {
    totalSyllables += countWordSyllables(word);
  }

  const asl = wordCount / sentenceCount;
  const asw = totalSyllables / Math.max(wordCount, 1);
  const rawScore = 206.835 - 1.015 * asl - 84.6 * asw;
  const readabilityScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

  let passiveCount = 0;
  for (const sentence of sentences) {
    if (isPassiveSentence(sentence)) passiveCount++;
  }
  const passivePercentage = sentenceCount > 0 ? Math.round((passiveCount / sentenceCount) * 100) : 0;

  let keywordDensity: ContentScore["keywordDensity"] = null;
  if (keywords && keywords.trim()) {
    const kws = keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
    const textLower = cleanText.toLowerCase();
    keywordDensity = kws.map((kw) => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const matches = textLower.match(regex);
      const count = matches ? matches.length : 0;
      return { keyword: kw, density: Math.round((count / Math.max(wordCount, 1)) * 1000) / 10 };
    });
  }

  const qualityScore = computeQualityScore(readabilityScore, avgSentenceLength, passivePercentage, wordCount, keywordDensity);

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    readabilityScore,
    readabilityLabel: getReadabilityLabel(readabilityScore),
    qualityScore,
    qualityLabel: getQualityLabel(qualityScore),
    readingTimeMinutes,
    passiveVoice: { percentage: passivePercentage, count: passiveCount, total: sentenceCount },
    keywordDensity,
  };
}
