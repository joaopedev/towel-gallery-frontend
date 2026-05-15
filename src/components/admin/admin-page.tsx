"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  chakra,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  adminLogin,
  approveFeedback,
  createAdminColor,
  createAdminLetter,
  createAdminReadyMadeItem,
  createAdminTowelModel,
  createAdminTowelType,
  getAdminCatalog,
  getAdminStats,
  getPendingFeedbacks,
  removeAdminResource,
  resolveAssetUrl,
} from "@/lib/api";
import { type LoginInput, loginSchema } from "@/lib/schemas";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import type { AdminCatalogResponse, AdminStatsResponse } from "@/types/catalog";
import { ImageUploadField } from "./image-upload-field";

function readMultiValue(select: HTMLSelectElement) {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

export function AdminPage() {
  const { token, username, setSession, clearSession } = useAdminAuthStore();
  const [catalog, setCatalog] = useState<AdminCatalogResponse | null>(null);
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [pendingFeedbacks, setPendingFeedbacks] = useState<
    Array<{
      id: string;
      authorName: string;
      message: string;
      rating: number;
      readyMadeItem: { id: string; title: string };
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [feedbackActionId, setFeedbackActionId] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "admin", password: "admin123456" },
  });

  const [letterForm, setLetterForm] = useState({
    name: "",
    description: "",
    previewText: "Maria",
    accentColor: "#8c4b5a",
    imageUrl: "",
  });
  const [colorForm, setColorForm] = useState({
    name: "",
    hexCode: "#f7d9d0",
    imageUrl: "",
  });
  const [towelTypeForm, setTowelTypeForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    colorIds: [] as string[],
  });
  const [towelModelForm, setTowelModelForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    towelTypeId: "",
    colorIds: [] as string[],
  });
  const [readyItemForm, setReadyItemForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    priceLabel: "",
    towelTypeId: "",
    towelModelId: "",
    letterStyleId: "",
    colorIds: [] as string[],
  });

  async function refreshAll(authToken: string) {
    try {
      setLoading(true);
      setPanelError(null);
      const [catalogData, statsData, feedbackData] = await Promise.all([
        getAdminCatalog(authToken),
        getAdminStats(authToken),
        getPendingFeedbacks(authToken),
      ]);
      setCatalog(catalogData);
      setStats(statsData);
      setPendingFeedbacks(feedbackData);
    } catch (error) {
      setPanelError(
        error instanceof Error ? error.message : "Nao foi possivel carregar o painel.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      queueMicrotask(() => {
        void refreshAll(token);
      });
    }
  }, [token]);

  async function onLogin(values: LoginInput) {
    const response = await adminLogin(values);
    setSession(response.accessToken, response.user.username);
  }

  async function withRefresh(action: () => Promise<unknown>) {
    if (!token) {
      return;
    }

    await action();
    await refreshAll(token);
  }

  if (!token) {
    return (
      <Flex minH="100vh" align="center" justify="center" px={5} py={10}>
        <Box
          as="form"
          onSubmit={loginForm.handleSubmit(onLogin)}
          w="full"
          maxW="540px"
          borderRadius="40px"
          bg="var(--card)"
          border="1px solid var(--line)"
          boxShadow="var(--shadow)"
          p={{ base: 7, md: 9 }}
        >
          <Stack gap={6}>
            <Stack gap={2}>
              <Text color="var(--rose-deep)" fontWeight="700">
                Painel administrativo
              </Text>
              <Heading fontFamily="var(--font-display)" fontSize={{ base: "4xl", md: "5xl" }}>
                Entrar em /adm
              </Heading>
              <Text color="var(--muted)">
                Use este acesso para cadastrar novos tipos de toalha, modelos,
                cores, letras e imagens.
              </Text>
            </Stack>
            <Stack gap={2}>
              <Text fontWeight="700">Usuario</Text>
              <Input bg="white" h="52px" {...loginForm.register("username")} />
              {loginForm.formState.errors.username ? (
                <Text color="red.600" fontSize="sm">
                  {loginForm.formState.errors.username.message}
                </Text>
              ) : null}
            </Stack>
            <Stack gap={2}>
              <Text fontWeight="700">Senha</Text>
              <Input
                type="password"
                bg="white"
                h="52px"
                {...loginForm.register("password")}
              />
              {loginForm.formState.errors.password ? (
                <Text color="red.600" fontSize="sm">
                  {loginForm.formState.errors.password.message}
                </Text>
              ) : null}
            </Stack>
            <Button
              type="submit"
              bg="var(--rose-deep)"
              color="white"
              h="54px"
              borderRadius="full"
              loading={loginForm.formState.isSubmitting}
            >
              Entrar
            </Button>
          </Stack>
        </Box>
      </Flex>
    );
  }

  const towelModelsForReadyItem =
    catalog?.towelModels.filter(
      (item) => item.towelType.id === readyItemForm.towelTypeId,
    ) ?? [];

  return (
    <Box py={10}>
      <Container maxW="7xl" px={{ base: 5, md: 8 }}>
        <Stack gap={8}>
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            <Stack gap={2}>
              <Text color="var(--rose-deep)" fontWeight="700">
                Administracao do atelie
              </Text>
              <Heading pt={4} fontFamily="var(--font-display)" fontSize={{ base: "4xl", md: "6xl" }}>
                Painel de cadastro e moderacao
              </Heading>
              <Text pt={4} color="var(--muted)">Logado como {username ?? "admin"}.</Text>
            </Stack>
            <Button pt={3} variant="outline" borderRadius="full" onClick={clearSession}>
              Sair
            </Button>
          </Flex>

          {loading && !catalog ? (
            <Flex minH="260px" align="center" justify="center">
              <Spinner color="var(--rose-deep)" size="xl" />
            </Flex>
          ) : null}

          {panelError ? <Text color="red.600">{panelError}</Text> : null}

          {stats ? (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={5}>
              <StatCard
                label="Feedbacks pendentes"
                value={String(stats.pendingFeedbacks)}
              />
              <StatCard
                label="Letra mais clicada"
                value={stats.topLetters[0]?.name ?? "-"}
              />
              <StatCard
                label="Toalha mais clicada"
                value={stats.topTowelTypes[0]?.name ?? "-"}
              />
              <StatCard
                label="Modelo mais clicado"
                value={stats.topTowelModels[0]?.name ?? "-"}
              />
            </SimpleGrid>
          ) : null}

          {catalog ? (
            <>
              <SectionCard
                title="Feedbacks para aprovar"
                description="Somente o feedback aprovado aparece na galeria publica."
              >
                <Stack gap={4}>
                  {pendingFeedbacks.length ? (
                    pendingFeedbacks.map((feedback) => (
                      <Stack
                        key={feedback.id}
                        borderRadius="24px"
                        border="1px solid rgba(75,49,47,0.08)"
                        bg="rgba(255,255,255,0.76)"
                        p={5}
                        gap={3}
                      >
                        <HStack justify="space-between" align="flex-start">
                          <Stack gap={1}>
                            <Text fontWeight="800">
                              {feedback.authorName} • {feedback.rating}/5
                            </Text>
                            <Text color="var(--muted)">
                              Peça: {feedback.readyMadeItem.title}
                            </Text>
                          </Stack>
                          <Badge borderRadius="full" bg="rgba(208,161,90,0.16)" color="var(--ink)">
                            Pendente
                          </Badge>
                        </HStack>
                        <Text>{feedback.message}</Text>
                        <HStack gap={3}>
                          <Button
                            bg="var(--rose-deep)"
                            color="white"
                            loading={feedbackActionId === feedback.id}
                            onClick={async () => {
                              setFeedbackActionId(feedback.id);
                              await withRefresh(() =>
                                approveFeedback(token, feedback.id, true),
                              );
                              setFeedbackActionId(null);
                            }}
                          >
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            loading={feedbackActionId === feedback.id}
                            onClick={async () => {
                              setFeedbackActionId(feedback.id);
                              await withRefresh(() =>
                                approveFeedback(token, feedback.id, false),
                              );
                              setFeedbackActionId(null);
                            }}
                          >
                            Manter oculto
                          </Button>
                        </HStack>
                      </Stack>
                    ))
                  ) : (
                    <Text color="var(--muted)">Nenhum feedback pendente.</Text>
                  )}
                </Stack>
              </SectionCard>

              <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6}>
                <SectionCard
                  title="Cadastrar estilo de letra"
                  description="Cada estilo recebe rastreamento de clique."
                >
                  <Stack gap={4}>
                    <Input
                      placeholder="Nome"
                      bg="white"
                      value={letterForm.name}
                      onChange={(event) =>
                        setLetterForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <Textarea
                      placeholder="Descricao"
                      bg="white"
                      value={letterForm.description}
                      onChange={(event) =>
                        setLetterForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Texto de preview"
                      bg="white"
                      value={letterForm.previewText}
                      onChange={(event) =>
                        setLetterForm((current) => ({
                          ...current,
                          previewText: event.target.value,
                        }))
                      }
                    />
                    <Input
                      type="color"
                      bg="white"
                      value={letterForm.accentColor}
                      onChange={(event) =>
                        setLetterForm((current) => ({
                          ...current,
                          accentColor: event.target.value,
                        }))
                      }
                    />
                    <ImageUploadField
                      token={token}
                      value={letterForm.imageUrl}
                      onUploaded={(url) =>
                        setLetterForm((current) => ({ ...current, imageUrl: url }))
                      }
                    />
                    <Button
                      bg="var(--rose-deep)"
                      color="white"
                      onClick={async () => {
                        await withRefresh(() => createAdminLetter(token, letterForm));
                        setLetterForm({
                          name: "",
                          description: "",
                          previewText: "Maria",
                          accentColor: "#8c4b5a",
                          imageUrl: "",
                        });
                      }}
                    >
                      Salvar letra
                    </Button>
                    <ResourceList
                      items={catalog.letterStyles.map((item) => ({
                        id: item.id,
                        title: item.name,
                        subtitle: `${item.clickCount} cliques`,
                      }))}
                      onDelete={(id) =>
                        withRefresh(() => removeAdminResource(token, "letters", id))
                      }
                    />
                  </Stack>
                </SectionCard>

                <SectionCard
                  title="Cadastrar cor"
                  description="As cores podem ser associadas a tipos e modelos."
                >
                  <Stack gap={4}>
                    <Input
                      placeholder="Nome da cor"
                      bg="white"
                      value={colorForm.name}
                      onChange={(event) =>
                        setColorForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <Input
                      type="color"
                      bg="white"
                      value={colorForm.hexCode}
                      onChange={(event) =>
                        setColorForm((current) => ({
                          ...current,
                          hexCode: event.target.value,
                        }))
                      }
                    />
                    <ImageUploadField
                      token={token}
                      value={colorForm.imageUrl}
                      onUploaded={(url) =>
                        setColorForm((current) => ({ ...current, imageUrl: url }))
                      }
                    />
                    <Button
                      bg="var(--rose-deep)"
                      color="white"
                      onClick={async () => {
                        await withRefresh(() => createAdminColor(token, colorForm));
                        setColorForm({
                          name: "",
                          hexCode: "#f7d9d0",
                          imageUrl: "",
                        });
                      }}
                    >
                      Salvar cor
                    </Button>
                    <ResourceList
                      items={catalog.colorOptions.map((item) => ({
                        id: item.id,
                        title: item.name,
                        subtitle: item.hexCode,
                        previewColor: item.hexCode,
                      }))}
                      onDelete={(id) =>
                        withRefresh(() => removeAdminResource(token, "colors", id))
                      }
                    />
                  </Stack>
                </SectionCard>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6}>
                <SectionCard
                  title="Cadastrar tipo de toalha"
                  description="Define a base principal exibida na vitrine."
                >
                  <Stack gap={4}>
                    <Input
                      placeholder="Nome do tipo"
                      bg="white"
                      value={towelTypeForm.name}
                      onChange={(event) =>
                        setTowelTypeForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <Textarea
                      placeholder="Descricao"
                      bg="white"
                      value={towelTypeForm.description}
                      onChange={(event) =>
                        setTowelTypeForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                    <ImageUploadField
                      token={token}
                      value={towelTypeForm.imageUrl}
                      onUploaded={(url) =>
                        setTowelTypeForm((current) => ({ ...current, imageUrl: url }))
                      }
                    />
                    <Text fontWeight="700">Cores disponiveis</Text>
                    <chakra.select
                      multiple
                      minH="180px"
                      borderRadius="20px"
                      bg="white"
                      border="1px solid rgba(141, 77, 91, 0.18)"
                      p={3}
                      onChange={(event) =>
                        setTowelTypeForm((current) => ({
                          ...current,
                          colorIds: readMultiValue(event.target),
                        }))
                      }
                    >
                      {catalog.colorOptions.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </chakra.select>
                    <Button
                      bg="var(--rose-deep)"
                      color="white"
                      onClick={async () => {
                        await withRefresh(() =>
                          createAdminTowelType(token, towelTypeForm),
                        );
                        setTowelTypeForm({
                          name: "",
                          description: "",
                          imageUrl: "",
                          colorIds: [],
                        });
                      }}
                    >
                      Salvar tipo de toalha
                    </Button>
                    <ResourceList
                      items={catalog.towelTypes.map((item) => ({
                        id: item.id,
                        title: item.name,
                        subtitle: `${item.availableColors.length} cores`,
                        imageUrl: item.imageUrl ?? undefined,
                      }))}
                      onDelete={(id) =>
                        withRefresh(() => removeAdminResource(token, "towel-types", id))
                      }
                    />
                  </Stack>
                </SectionCard>

                <SectionCard
                  title="Cadastrar modelo"
                  description="Cada modelo pertence a um tipo de toalha."
                >
                  <Stack gap={4}>
                    <Input
                      placeholder="Nome do modelo"
                      bg="white"
                      value={towelModelForm.name}
                      onChange={(event) =>
                        setTowelModelForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <Textarea
                      placeholder="Descricao"
                      bg="white"
                      value={towelModelForm.description}
                      onChange={(event) =>
                        setTowelModelForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                    <chakra.select
                      bg="white"
                      h="52px"
                      borderRadius="18px"
                      px={4}
                      value={towelModelForm.towelTypeId}
                      onChange={(event) =>
                        setTowelModelForm((current) => ({
                          ...current,
                          towelTypeId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Escolha o tipo</option>
                      {catalog.towelTypes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </chakra.select>
                    <ImageUploadField
                      token={token}
                      value={towelModelForm.imageUrl}
                      onUploaded={(url) =>
                        setTowelModelForm((current) => ({ ...current, imageUrl: url }))
                      }
                    />
                    <Text fontWeight="700">Cores do modelo</Text>
                    <chakra.select
                      multiple
                      minH="180px"
                      borderRadius="20px"
                      bg="white"
                      border="1px solid rgba(141, 77, 91, 0.18)"
                      p={3}
                      onChange={(event) =>
                        setTowelModelForm((current) => ({
                          ...current,
                          colorIds: readMultiValue(event.target),
                        }))
                      }
                    >
                      {catalog.colorOptions.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </chakra.select>
                    <Button
                      bg="var(--rose-deep)"
                      color="white"
                      onClick={async () => {
                        await withRefresh(() =>
                          createAdminTowelModel(token, towelModelForm),
                        );
                        setTowelModelForm({
                          name: "",
                          description: "",
                          imageUrl: "",
                          towelTypeId: "",
                          colorIds: [],
                        });
                      }}
                    >
                      Salvar modelo
                    </Button>
                    <ResourceList
                      items={catalog.towelModels.map((item) => ({
                        id: item.id,
                        title: item.name,
                        subtitle: item.towelType.name,
                        imageUrl: item.imageUrl ?? undefined,
                      }))}
                      onDelete={(id) =>
                        withRefresh(() => removeAdminResource(token, "towel-models", id))
                      }
                    />
                  </Stack>
                </SectionCard>
              </SimpleGrid>

              <SectionCard
                title="Cadastrar toalha pronta"
                description="As imagens cadastradas aqui aparecem na galeria publica."
              >
                <SimpleGrid columns={{ base: 1, xl: 2 }} gap={8}>
                  <Stack gap={4}>
                    <Input
                      placeholder="Titulo"
                      bg="white"
                      value={readyItemForm.title}
                      onChange={(event) =>
                        setReadyItemForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                    <Textarea
                      placeholder="Descricao"
                      bg="white"
                      value={readyItemForm.description}
                      onChange={(event) =>
                        setReadyItemForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Faixa de preco ou observacao"
                      bg="white"
                      value={readyItemForm.priceLabel}
                      onChange={(event) =>
                        setReadyItemForm((current) => ({
                          ...current,
                          priceLabel: event.target.value,
                        }))
                      }
                    />
                    <chakra.select
                      bg="white"
                      h="52px"
                      borderRadius="18px"
                      px={4}
                      value={readyItemForm.towelTypeId}
                      onChange={(event) =>
                        setReadyItemForm((current) => ({
                          ...current,
                          towelTypeId: event.target.value,
                          towelModelId: "",
                        }))
                      }
                    >
                      <option value="">Tipo de toalha</option>
                      {catalog.towelTypes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </chakra.select>
                    <chakra.select
                      bg="white"
                      h="52px"
                      borderRadius="18px"
                      px={4}
                      value={readyItemForm.towelModelId}
                      onChange={(event) =>
                        setReadyItemForm((current) => ({
                          ...current,
                          towelModelId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Modelo opcional</option>
                      {towelModelsForReadyItem.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </chakra.select>
                    <chakra.select
                      bg="white"
                      h="52px"
                      borderRadius="18px"
                      px={4}
                      value={readyItemForm.letterStyleId}
                      onChange={(event) =>
                        setReadyItemForm((current) => ({
                          ...current,
                          letterStyleId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Letra opcional</option>
                      {catalog.letterStyles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </chakra.select>
                    <Text fontWeight="700">Cores da peca</Text>
                    <chakra.select
                      multiple
                      minH="180px"
                      borderRadius="20px"
                      bg="white"
                      border="1px solid rgba(141, 77, 91, 0.18)"
                      p={3}
                      onChange={(event) =>
                        setReadyItemForm((current) => ({
                          ...current,
                          colorIds: readMultiValue(event.target),
                        }))
                      }
                    >
                      {catalog.colorOptions.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </chakra.select>
                  </Stack>
                  <Stack gap={4}>
                    <ImageUploadField
                      token={token}
                      value={readyItemForm.imageUrl}
                      onUploaded={(url) =>
                        setReadyItemForm((current) => ({ ...current, imageUrl: url }))
                      }
                    />
                    <Button
                      bg="var(--rose-deep)"
                      color="white"
                      onClick={async () => {
                        await withRefresh(() =>
                          createAdminReadyMadeItem(token, {
                            ...readyItemForm,
                            towelModelId: readyItemForm.towelModelId || undefined,
                            letterStyleId: readyItemForm.letterStyleId || undefined,
                          }),
                        );
                        setReadyItemForm({
                          title: "",
                          description: "",
                          imageUrl: "",
                          priceLabel: "",
                          towelTypeId: "",
                          towelModelId: "",
                          letterStyleId: "",
                          colorIds: [],
                        });
                      }}
                    >
                      Salvar toalha pronta
                    </Button>
                    <ResourceList
                      items={catalog.readyMadeItems.map((item) => ({
                        id: item.id,
                        title: item.title,
                        subtitle: item.towelType.name,
                        imageUrl: item.imageUrl,
                      }))}
                      onDelete={(id) =>
                        withRefresh(() =>
                          removeAdminResource(token, "ready-made-items", id),
                        )
                      }
                    />
                  </Stack>
                </SimpleGrid>
              </SectionCard>
            </>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      borderRadius="28px"
      border="1px solid var(--line)"
      bg="var(--card)"
      boxShadow="var(--shadow)"
      p={6}
      gap={2}
    >
      <Text color="var(--muted)">{label}</Text>
      <Heading fontFamily="var(--font-display)" fontSize="3xl">
        {value}
      </Heading>
    </Stack>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Stack
      borderRadius="32px"
      border="1px solid var(--line)"
      bg="var(--card)"
      boxShadow="var(--shadow)"
      p={{ base: 6, md: 7 }}
      gap={6}
    >
      <Stack gap={2}>
        <Heading fontFamily="var(--font-display)" fontSize="4xl">
          {title}
        </Heading>
        <Text color="var(--muted)">{description}</Text>
      </Stack>
      {children}
    </Stack>
  );
}

function ResourceList({
  items,
  onDelete,
}: {
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    imageUrl?: string;
    previewColor?: string;
  }>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  return (
    <Stack gap={3}>
      {items.map((item) => (
        <HStack
          key={item.id}
          justify="space-between"
          align="center"
          borderRadius="22px"
          border="1px solid rgba(75,49,47,0.08)"
          bg="rgba(255,255,255,0.78)"
          p={4}
        >
          <HStack gap={3}>
            {item.previewColor ? (
              <Box h="16px" w="16px" borderRadius="full" bg={item.previewColor} />
            ) : null}
            {item.imageUrl ? (
              <Image
                src={resolveAssetUrl(item.imageUrl)}
                alt={item.title}
                h="48px"
                w="48px"
                objectFit="cover"
                borderRadius="16px"
              />
            ) : null}
            <Stack gap={0}>
              <Text fontWeight="700">{item.title}</Text>
              <Text color="var(--muted)" fontSize="sm">
                {item.subtitle}
              </Text>
            </Stack>
          </HStack>
          <Button variant="outline" onClick={() => void onDelete(item.id)}>
            Excluir
          </Button>
        </HStack>
      ))}
    </Stack>
  );
}
