import { query } from "./_generated/server";
import { v } from "convex/values";

export const CURATED_CATEGORIES = [
  { slug: "general", name: "General", description: "Anything on your mind", sortOrder: 0 },
  { slug: "relationships", name: "Relationships", description: "Love, friendship, and connection", sortOrder: 1 },
  { slug: "family", name: "Family", description: "Home, family, and belonging", sortOrder: 2 },
  { slug: "work", name: "Work & Career", description: "Work, ambition, and burnout", sortOrder: 3 },
  { slug: "mental_health", name: "Mental Health", description: "Feelings, stress, and wellbeing", sortOrder: 4 },
  { slug: "school", name: "School", description: "Study, education, and growing up", sortOrder: 5 },
  { slug: "creativity", name: "Creativity", description: "Art, ideas, and making things", sortOrder: 6 },
  { slug: "random", name: "Random", description: "The thoughts that do not fit elsewhere", sortOrder: 7 },
] as const;

export function isCuratedCategory(category: string) {
  return CURATED_CATEGORIES.some((item) => item.slug === category);
}

export const listCategories = query({
  args: {},
  returns: v.array(v.object({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    sortOrder: v.number(),
  })),
  handler: async () => CURATED_CATEGORIES.map((category) => ({ ...category })),
});
