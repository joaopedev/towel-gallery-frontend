import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Informe o usuario."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

export const feedbackSchema = z.object({
  authorName: z.string().min(2, "Informe seu nome."),
  message: z.string().min(8, "Escreva um feedback com pelo menos 8 caracteres."),
  rating: z.number().min(1).max(5),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
