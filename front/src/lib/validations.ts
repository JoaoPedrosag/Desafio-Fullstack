import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Digite um email válido")
  .min(1, "Email é obrigatório");

export const passwordSchema = z
  .string()
  .min(6, "A senha deve ter pelo menos 6 caracteres")
  .max(100, "A senha deve ter no máximo 100 caracteres");

export const usernameSchema = z
  .string()
  .min(3, "O nome de usuário deve ter pelo menos 3 caracteres")
  .max(30, "O nome de usuário deve ter no máximo 30 caracteres")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "O nome de usuário pode conter apenas letras, números, _ e -"
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
