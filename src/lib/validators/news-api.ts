import { z } from "zod";

export const newsApiArticleSchema = z.object({
  t: z.string().min(1),
  u: z.string().url(),
  site: z.string().min(1),
  img: z.string().optional(),
  pubt: z.string().min(1),
  cat: z.string().min(1),
});

export const newsApiResponseSchema = z.object({
  status: z.number(),
  md: z
    .object({
      ver: z.string().optional(),
    })
    .optional(),
  resultSet: z.array(newsApiArticleSchema),
});

export type NewsApiArticleInput = z.infer<typeof newsApiArticleSchema>;
export type NewsApiResponseInput = z.infer<typeof newsApiResponseSchema>;
