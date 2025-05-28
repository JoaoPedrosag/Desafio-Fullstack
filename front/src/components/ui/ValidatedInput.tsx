import { Field, Input, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { z } from "zod";

interface ValidatedInputProps {
  label: string;
  placeholder?: string;
  value: string;
  type?: string;
  schema: z.ZodSchema;
  onChange: (value: string) => void;
}

export function ValidatedInput({
  label,
  placeholder,
  value,
  type = "text",
  schema,
  onChange,
}: ValidatedInputProps) {
  const validationResult = useMemo(() => {
    if (!value) return { isValid: true, error: null };

    const result = schema.safeParse(value);
    return {
      isValid: result.success,
      error: result.success
        ? null
        : result.error.errors[0]?.message || "Erro de validação",
    };
  }, [value, schema]);

  const hasError = !validationResult.isValid;

  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        borderColor={hasError ? "red.500" : "gray.300"}
        _placeholder={{ color: "muted" }}
        _dark={{
          borderColor: hasError ? "red.500" : "gray.600",
          bg: "gray.800",
          color: "white",
        }}
        _focus={{
          borderColor: hasError ? "red.500" : "brand.500",
          boxShadow: hasError
            ? "0 0 0 1px var(--chakra-colors-red-500)"
            : "0 0 0 1px var(--chakra-colors-brand-500)",
        }}
      />
      {hasError && (
        <Text fontSize="sm" color="red.500" mt={1}>
          {validationResult.error}
        </Text>
      )}
    </Field.Root>
  );
}
