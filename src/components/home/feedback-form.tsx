"use client";

import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createPublicFeedback } from "@/lib/api";
import { type FeedbackInput, feedbackSchema } from "@/lib/schemas";

type FeedbackFormProps = {
  readyMadeItemId: string;
  onSubmitted: () => Promise<void>;
};

export function FeedbackForm({
  readyMadeItemId,
  onSubmitted,
}: FeedbackFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      authorName: "",
      message: "",
      rating: 5,
    },
  });
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(values: FeedbackInput) {
    await createPublicFeedback({
      readyMadeItemId,
      authorName: values.authorName,
      message: values.message,
      rating: values.rating,
    });

    setStatus("Feedback enviado para aprovacao da administracao.");
    reset();
    await onSubmitted();
  }

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      borderRadius="28px"
      border="1px solid var(--line)"
      bg="rgba(255,255,255,0.72)"
      p={{ base: 4, md: 5 }}
    >
      <Stack gap={3}>
        <Text fontWeight="700" color="var(--ink)">
          Deixe um feedback sobre esta peca
        </Text>
        <Input
          placeholder="Seu nome"
          bg="white"
          borderColor="rgba(141, 77, 91, 0.18)"
          {...register("authorName")}
        />
        {errors.authorName ? (
          <Text color="red.600" fontSize="sm">
            {errors.authorName.message}
          </Text>
        ) : null}
        <Textarea
          placeholder="Conte como ficou o bordado, o capricho, o acabamento..."
          bg="white"
          minH="120px"
          borderColor="rgba(141, 77, 91, 0.18)"
          {...register("message")}
        />
        {errors.message ? (
          <Text color="red.600" fontSize="sm">
            {errors.message.message}
          </Text>
        ) : null}
        <chakra.select
          bg="white"
          border="1px solid rgba(141, 77, 91, 0.18)"
          borderRadius="16px"
          h="48px"
          px={4}
          {...register("rating", { valueAsNumber: true })}
        >
          <option value={5}>5 estrelas</option>
          <option value={4}>4 estrelas</option>
          <option value={3}>3 estrelas</option>
          <option value={2}>2 estrelas</option>
          <option value={1}>1 estrela</option>
        </chakra.select>
        <Button
          type="submit"
          bg="var(--rose-deep)"
          color="white"
          _hover={{ bg: "var(--rose)" }}
          loading={isSubmitting}
        >
          Enviar feedback
        </Button>
        {status ? (
          <Text fontSize="sm" color="var(--muted)">
            {status}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
