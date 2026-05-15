"use client";

import { Button, Image, Stack, Text, chakra } from "@chakra-ui/react";
import { useState } from "react";
import { resolveAssetUrl, uploadAdminImage } from "@/lib/api";

type ImageUploadFieldProps = {
  token: string;
  value?: string;
  onUploaded: (url: string) => void;
};

export function ImageUploadField({
  token,
  value,
  onUploaded,
}: ImageUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setStatus(null);
      const response = await uploadAdminImage(token, file);
      onUploaded(response.url);
      setStatus("Imagem enviada.");
      setFile(null);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Stack gap={3}>
      <chakra.input
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <Button
        type="button"
        onClick={handleUpload}
        bg="rgba(141, 77, 91, 0.12)"
        color="var(--rose-deep)"
        disabled={!file}
        loading={uploading}
      >
        Enviar imagem
      </Button>
      {value ? (
        <chakra.div
          borderRadius="20px"
          overflow="hidden"
          border="1px solid rgba(75,49,47,0.1)"
          bg="rgba(255,255,255,0.76)"
        >
          <Image
            src={resolveAssetUrl(value)}
            alt="Preview"
            h="180px"
            w="full"
            objectFit="cover"
          />
        </chakra.div>
      ) : null}
      {status ? (
        <Text fontSize="sm" color="var(--muted)">
          {status}
        </Text>
      ) : null}
    </Stack>
  );
}
