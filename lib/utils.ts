import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'USDC'): string {
  return `$${price.toFixed(2)} ${currency}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'S':
      return 'bg-purple-600 text-white';
    case 'A+':
    case 'A':
      return 'bg-green-600 text-white';
    case 'B+':
    case 'B':
      return 'bg-blue-600 text-white';
    case 'C':
      return 'bg-yellow-600 text-white';
    case 'D':
      return 'bg-orange-600 text-white';
    case 'F':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 80) return 'text-blue-400';
  if (score >= 70) return 'text-yellow-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
}
