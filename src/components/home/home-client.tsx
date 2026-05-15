"use client";

import Link from "next/link";
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
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { startTransition, useEffect, useRef, useState } from "react";
import {
  LuArrowUpRight,
  LuMessageCircle,
  LuShield,
  LuSparkles,
} from "react-icons/lu";
import { FeedbackForm } from "@/components/home/feedback-form";
import {
  getPublicCatalog,
  recordPublicClick,
  resolveAssetUrl,
} from "@/lib/api";
import type {
  CatalogColor,
  LetterStyle,
  PublicCatalogResponse,
  TowelModel,
  TowelType,
} from "@/types/catalog";

type OrderState = {
  towelTypeId: string;
  towelModelId: string;
  colorId: string;
  letterStyleId: string;
  embroideredName: string;
  extraDetails: string;
};

const initialOrder: OrderState = {
  towelTypeId: "",
  towelModelId: "",
  colorId: "",
  letterStyleId: "",
  embroideredName: "",
  extraDetails: "",
};

function createWhatsappUrl(params: {
  whatsappNumber: string;
  towelType?: TowelType;
  towelModel?: TowelModel;
  color?: CatalogColor;
  letterStyle?: LetterStyle;
  embroideredName: string;
  extraDetails: string;
}) {
  const lines = [
    "Ola! Quero encomendar uma toalha bordada.",
    `Tipo de toalha: ${params.towelType?.name ?? "-"}`,
    `Modelo: ${params.towelModel?.name ?? "-"}`,
    `Cor: ${params.color?.name ?? "-"}`,
    `Letra escolhida: ${params.letterStyle?.name ?? "-"}`,
    `Nome para bordar: ${params.embroideredName || "-"}`,
  ];

  if (params.extraDetails) {
    lines.push(`Observacoes: ${params.extraDetails}`);
  }

  return `https://wa.me/${params.whatsappNumber}?text=${encodeURIComponent(
    lines.join("\n"),
  )}`;
}

export function HomeClient() {
  const [catalog, setCatalog] = useState<PublicCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderState>(initialOrder);
  const orderRef = useRef<HTMLDivElement | null>(null);

  async function loadCatalog(isRefresh = false) {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      const data = await getPublicCatalog();
      startTransition(() => {
        setCatalog(data);
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar o catalogo.",
      );
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadCatalog();
    });
  }, []);

  const selectedTowelType =
    catalog?.towelTypes.find((item) => item.id === order.towelTypeId) ?? null;
  const availableModels =
    catalog?.towelModels.filter(
      (model) => model.towelType.id === order.towelTypeId,
    ) ?? [];
  const activeModelId = availableModels.some((item) => item.id === order.towelModelId)
    ? order.towelModelId
    : "";
  const selectedTowelModel =
    availableModels.find((item) => item.id === activeModelId) ?? null;
  const availableColors =
    selectedTowelModel?.availableColors.length
      ? selectedTowelModel.availableColors
      : selectedTowelType?.availableColors ?? [];
  const activeColorId = availableColors.some((item) => item.id === order.colorId)
    ? order.colorId
    : availableColors[0]?.id ?? "";
  const selectedColor =
    availableColors.find((item) => item.id === activeColorId) ?? null;
  const selectedLetterStyle =
    catalog?.letterStyles.find((item) => item.id === order.letterStyleId) ?? null;

  function selectTowelType(item: TowelType) {
    void recordPublicClick("towel-type", item.id).catch(() => undefined);

    setOrder((current) => ({
      ...current,
      towelTypeId: item.id,
      towelModelId: "",
      colorId: item.availableColors[0]?.id ?? "",
    }));

    orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectLetterStyle(item: LetterStyle) {
    void recordPublicClick("letter-style", item.id).catch(() => undefined);
    setOrder((current) => ({
      ...current,
      letterStyleId: item.id,
    }));
  }

  function selectModel(modelId: string) {
    const chosenModel = availableModels.find((item) => item.id === modelId) ?? null;

    if (chosenModel) {
      void recordPublicClick("towel-model", chosenModel.id).catch(() => undefined);
    }

    setOrder((current) => ({
      ...current,
      towelModelId: modelId,
      colorId:
        chosenModel?.availableColors[0]?.id ??
        selectedTowelType?.availableColors[0]?.id ??
        "",
    }));
  }

  function openWhatsApp() {
    if (
      !catalog ||
      !selectedTowelType ||
      !selectedTowelModel ||
      !selectedColor ||
      !selectedLetterStyle ||
      !order.embroideredName
    ) {
      return;
    }

    const link = createWhatsappUrl({
      whatsappNumber: catalog.whatsappNumber,
      towelType: selectedTowelType,
      towelModel: selectedTowelModel,
      color: selectedColor,
      letterStyle: selectedLetterStyle,
      embroideredName: order.embroideredName,
      extraDetails: order.extraDetails,
    });

    window.open(link, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" direction="column" gap={4}>
        <Spinner color="var(--rose-deep)" size="xl" />
        <Text color="var(--muted)">Carregando a vitrine do atelie...</Text>
      </Flex>
    );
  }

  if (error || !catalog) {
    return (
      <Flex minH="100vh" align="center" justify="center" p={6}>
        <Stack
          maxW="640px"
          borderRadius="36px"
          bg="var(--card)"
          border="1px solid var(--line)"
          boxShadow="var(--shadow)"
          p={8}
          gap={4}
          textAlign="center"
        >
          <Heading fontFamily="var(--font-display)" fontSize="4xl">
            Nao foi possivel abrir o catalogo
          </Heading>
          <Text color="var(--muted)">{error}</Text>
          <Button bg="var(--rose-deep)" color="white" onClick={() => void loadCatalog()}>
            Tentar novamente
          </Button>
        </Stack>
      </Flex>
    );
  }

  return (
    <Box pb={20}>
      <Container maxW="7xl" px={{ base: 5, md: 8 }} pt={{ base: 6, md: 10 }}>
        <Stack
          border="1px solid var(--line)"
          borderRadius={{ base: "32px", md: "48px" }}
          bg="linear-gradient(135deg, rgba(255,255,255,0.92), rgba(249,241,234,0.86))"
          boxShadow="var(--shadow)"
          overflow="hidden"
        >
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={0}>
            <Stack p={{ base: 7, md: 10 }} gap={7} justify="center">
              <HStack gap={3} flexWrap="wrap">
                <Badge borderRadius="full" px={4} py={2} bg="rgba(208,161,90,0.16)" color="var(--ink)">
                  Bordado artesanal
                </Badge>
                <Badge borderRadius="full" px={4} py={2} bg="rgba(184,106,120,0.12)" color="var(--rose-deep)">
                  Pedido finalizado no WhatsApp
                </Badge>
              </HStack>
              <Heading
                fontFamily="var(--font-display)"
                fontSize={{ base: "4xl", md: "6xl" }}
                lineHeight="0.98"
                maxW="14ch"
              >
                Toalhas bordadas para presentear, decorar e guardar memoria.
              </Heading>
              <Text maxW="56ch" color="var(--muted)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                Escolha o tipo de toalha, a cor, o modelo e a letra. O site organiza
                o pedido e a conversa final segue direto para o WhatsApp da sua mae.
              </Text>
              <HStack gap={4} flexWrap="wrap">
                <Button
                  bg="var(--rose-deep)"
                  color="white"
                  borderRadius="full"
                  px={7}
                  onClick={() => orderRef.current?.scrollIntoView({ behavior: "smooth" })}
                >
                  <Flex align="center" gap={2}>
                    <LuMessageCircle />
                    Montar pedido
                  </Flex>
                </Button>
                <Link href="/adm">
                  <Button
                    variant="outline"
                    borderColor="rgba(141, 77, 91, 0.3)"
                    borderRadius="full"
                    px={7}
                  >
                    <Flex align="center" gap={2}>
                      <LuShield />
                      Area admin
                    </Flex>
                  </Button>
                </Link>
              </HStack>
              <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
                {[
                  `${catalog.letterStyles.length} estilos de letra`,
                  `${catalog.towelTypes.length} tipos de toalha`,
                  `${catalog.readyMadeItems.length} pecas prontas`,
                ].map((item) => (
                  <Box
                    key={item}
                    borderRadius="24px"
                    bg="rgba(255,255,255,0.75)"
                    border="1px solid rgba(75,49,47,0.08)"
                    p={4}
                  >
                    <Text fontWeight="700">{item}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
            <Box
              minH={{ base: "320px", lg: "100%" }}
              bg="linear-gradient(180deg, rgba(184,106,120,0.12), rgba(208,161,90,0.18))"
              position="relative"
            >
              <Box
                position="absolute"
                inset={{ base: "28px", md: "40px" }}
                borderRadius="36px"
                bg="rgba(255,255,255,0.72)"
                border="1px solid rgba(255,255,255,0.9)"
                backdropFilter="blur(8px)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={8}
              >
                {catalog.readyMadeItems[0]?.imageUrl ? (
                  <Image
                    src={resolveAssetUrl(catalog.readyMadeItems[0].imageUrl)}
                    alt={catalog.readyMadeItems[0].title}
                    borderRadius="28px"
                    objectFit="cover"
                    boxShadow="0 22px 45px rgba(91,49,42,0.16)"
                  />
                ) : (
                  <Stack gap={4} textAlign="center" maxW="320px">
                    <Text letterSpacing="0.18em" textTransform="uppercase" color="var(--rose-deep)" fontWeight="700">
                      Atelie familiar
                    </Text>
                    <Heading fontFamily="var(--font-display)" fontSize="5xl">
                      Cada detalhe pensado no capricho.
                    </Heading>
                  </Stack>
                )}
              </Box>
            </Box>
          </SimpleGrid>
        </Stack>
      </Container>

      <Container maxW="7xl" px={{ base: 5, md: 8 }} pt={16}>
        <Stack gap={4} mb={8}>
          <HStack color="var(--rose-deep)" fontWeight="700">
            <LuSparkles />
            <Text>Estilos de letra</Text>
          </HStack>
          <Heading fontFamily="var(--font-display)" fontSize={{ base: "3xl", md: "5xl" }}>
            Escolha a personalidade do bordado.
          </Heading>
          <Text color="var(--muted)" maxW="56ch">
            Cada letra pode ser monitorada por clique para ajudar a identificar as
            opcoes com mais saida.
          </Text>
        </Stack>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={6}>
          {catalog.letterStyles.map((item) => {
            const selected = item.id === order.letterStyleId;

            return (
              <Button
                key={item.id}
                onClick={() => selectLetterStyle(item)}
                h="auto"
                p={0}
                bg="transparent"
                _hover={{ bg: "transparent" }}
              >
                <Stack
                  w="full"
                  align="stretch"
                  textAlign="left"
                  borderRadius="32px"
                  border={selected ? "1px solid rgba(141,77,91,0.36)" : "1px solid var(--line)"}
                  bg={selected ? "rgba(255,255,255,0.94)" : "var(--card)"}
                  boxShadow={selected ? "0 24px 60px rgba(91,49,42,0.16)" : "none"}
                  p={6}
                  gap={4}
                >
                  <Badge alignSelf="flex-start" borderRadius="full" px={3} py={1.5} bg="rgba(184,106,120,0.12)" color="var(--rose-deep)">
                    {item.clickCount} cliques
                  </Badge>
                  <Text
                    fontFamily="var(--font-display)"
                    fontSize="4xl"
                    color={item.accentColor}
                  >
                    {item.previewText}
                  </Text>
                  <Stack gap={1}>
                    <Text fontWeight="800" fontSize="lg">
                      {item.name}
                    </Text>
                    <Text color="var(--muted)" fontSize="sm" lineHeight="1.7">
                      {item.description || "Leve, delicada e pronta para nomes bordados."}
                    </Text>
                  </Stack>
                </Stack>
              </Button>
            );
          })}
        </SimpleGrid>
      </Container>

      <Container maxW="7xl" px={{ base: 5, md: 8 }} pt={16}>
        <Stack gap={4} mb={8}>
          <Text color="var(--rose-deep)" fontWeight="700">
            Tipos de toalha + cores
          </Text>
          <Heading fontFamily="var(--font-display)" fontSize={{ base: "3xl", md: "5xl" }}>
            Clique em uma toalha para continuar o pedido.
          </Heading>
          <Text color="var(--muted)" maxW="56ch">
            Aqui sua mae consegue mostrar os tipos disponiveis e as cores ja na
            mesma vitrine.
          </Text>
        </Stack>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
          {catalog.towelTypes.map((item) => {
            const selected = item.id === order.towelTypeId;
            const linkedModels = catalog.towelModels.filter(
              (model) => model.towelType.id === item.id,
            );

            return (
              <Stack
                key={item.id}
                borderRadius="32px"
                border={selected ? "1px solid rgba(141,77,91,0.36)" : "1px solid var(--line)"}
                bg={selected ? "rgba(255,255,255,0.94)" : "var(--card)"}
                boxShadow={selected ? "0 24px 60px rgba(91,49,42,0.16)" : "none"}
                overflow="hidden"
              >
                <Box h="250px" bg="rgba(208,161,90,0.12)">
                  {item.imageUrl ? (
                    <Image
                      src={resolveAssetUrl(item.imageUrl)}
                      alt={item.name}
                      h="full"
                      w="full"
                      objectFit="cover"
                    />
                  ) : null}
                </Box>
                <Stack p={6} gap={5}>
                  <Stack gap={2}>
                    <HStack justify="space-between" align="flex-start">
                      <Heading fontFamily="var(--font-display)" fontSize="3xl">
                        {item.name}
                      </Heading>
                      <Badge borderRadius="full" px={3} py={1.5} bg="rgba(208,161,90,0.18)" color="var(--ink)">
                        {item.clickCount} cliques
                      </Badge>
                    </HStack>
                    <Text color="var(--muted)" lineHeight="1.8">
                      {item.description || "Base pronta para personalizacao com bordado."}
                    </Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text fontWeight="700">Cores disponiveis</Text>
                    <HStack gap={3} flexWrap="wrap">
                      {item.availableColors.map((color) => (
                        <HStack
                          key={color.id}
                          gap={2}
                          borderRadius="full"
                          bg="rgba(255,255,255,0.8)"
                          border="1px solid rgba(75,49,47,0.1)"
                          px={3}
                          py={2}
                        >
                          <Box
                            h="12px"
                            w="12px"
                            borderRadius="full"
                            bg={color.hexCode}
                            border="1px solid rgba(0,0,0,0.08)"
                          />
                          <Text fontSize="sm">{color.name}</Text>
                        </HStack>
                      ))}
                    </HStack>
                  </Stack>
                  <Text color="var(--muted)" fontSize="sm">
                    {linkedModels.length} modelos ligados a essa toalha
                  </Text>
                  <Button
                    bg="var(--rose-deep)"
                    color="white"
                    borderRadius="full"
                    onClick={() => selectTowelType(item)}
                  >
                    <Flex align="center" gap={2}>
                      Selecionar toalha
                      <LuArrowUpRight />
                    </Flex>
                  </Button>
                </Stack>
              </Stack>
            );
          })}
        </SimpleGrid>
      </Container>

      <Container maxW="7xl" px={{ base: 5, md: 8 }} pt={16}>
        <Box
          ref={orderRef}
          borderRadius={{ base: "32px", md: "40px" }}
          border="1px solid var(--line)"
          bg="linear-gradient(135deg, rgba(255,255,255,0.96), rgba(242,226,212,0.8))"
          boxShadow="var(--shadow)"
          p={{ base: 6, md: 8 }}
        >
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={10}>
            <Stack gap={5}>
              <Text color="var(--rose-deep)" fontWeight="700">
                Montagem do pedido
              </Text>
              <Heading fontFamily="var(--font-display)" fontSize={{ base: "3xl", md: "5xl" }}>
                O site prepara o texto e abre o WhatsApp.
              </Heading>
              <Text color="var(--muted)" lineHeight="1.9">
                A venda ainda nao fecha aqui. A ideia desta etapa e reduzir atrito:
                a pessoa escolhe, o pedido ja vai formatado e sua mae continua o
                atendimento no WhatsApp.
              </Text>
              <Stack
                borderRadius="28px"
                bg="rgba(255,255,255,0.76)"
                border="1px solid rgba(75,49,47,0.08)"
                p={5}
                gap={3}
              >
                <Text fontWeight="800">Resumo atual</Text>
                <Text color="var(--muted)">Toalha: {selectedTowelType?.name ?? "Selecione uma toalha"}</Text>
                <Text color="var(--muted)">Modelo: {selectedTowelModel?.name ?? "Selecione um modelo"}</Text>
                <Text color="var(--muted)">Cor: {selectedColor?.name ?? "Selecione uma cor"}</Text>
                <Text color="var(--muted)">Letra: {selectedLetterStyle?.name ?? "Selecione uma letra"}</Text>
              </Stack>
            </Stack>

            <Stack gap={4}>
              <Stack gap={2}>
                <Text fontWeight="700">Tipo de toalha</Text>
                <chakra.select
                  h="52px"
                  borderRadius="18px"
                  border="1px solid rgba(141, 77, 91, 0.18)"
                  bg="white"
                  px={4}
                  value={order.towelTypeId}
                  onChange={(event) => {
                    const item =
                      catalog.towelTypes.find(
                        (towelType) => towelType.id === event.target.value,
                      ) ?? null;
                    if (item) {
                      selectTowelType(item);
                    }
                  }}
                >
                  <option value="">Selecione</option>
                  {catalog.towelTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </chakra.select>
              </Stack>

              <Stack gap={2}>
                <Text fontWeight="700">Modelo</Text>
                <chakra.select
                  h="52px"
                  borderRadius="18px"
                  border="1px solid rgba(141, 77, 91, 0.18)"
                  bg="white"
                  px={4}
                  value={activeModelId}
                  onChange={(event) => selectModel(event.target.value)}
                >
                  <option value="">Selecione</option>
                  {availableModels.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </chakra.select>
              </Stack>

              <Stack gap={2}>
                <Text fontWeight="700">Cor</Text>
                <chakra.select
                  h="52px"
                  borderRadius="18px"
                  border="1px solid rgba(141, 77, 91, 0.18)"
                  bg="white"
                  px={4}
                  value={activeColorId}
                  onChange={(event) =>
                    setOrder((current) => ({ ...current, colorId: event.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  {availableColors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </chakra.select>
              </Stack>

              <Stack gap={2}>
                <Text fontWeight="700">Letra</Text>
                <chakra.select
                  h="52px"
                  borderRadius="18px"
                  border="1px solid rgba(141, 77, 91, 0.18)"
                  bg="white"
                  px={4}
                  value={order.letterStyleId}
                  onChange={(event) =>
                    setOrder((current) => ({
                      ...current,
                      letterStyleId: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {catalog.letterStyles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </chakra.select>
              </Stack>

              <Stack gap={2}>
                <Text fontWeight="700">Nome para bordar</Text>
                <chakra.input
                  value={order.embroideredName}
                  onChange={(event) =>
                    setOrder((current) => ({
                      ...current,
                      embroideredName: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Helena"
                  h="52px"
                  borderRadius="18px"
                  border="1px solid rgba(141, 77, 91, 0.18)"
                  bg="white"
                  px={4}
                />
              </Stack>

              <Stack gap={2}>
                <Text fontWeight="700">Observacoes</Text>
                <chakra.textarea
                  value={order.extraDetails}
                  onChange={(event) =>
                    setOrder((current) => ({
                      ...current,
                      extraDetails: event.target.value,
                    }))
                  }
                  placeholder="Ex.: quero um bordado delicado para presente de maternidade."
                  minH="128px"
                  borderRadius="18px"
                  border="1px solid rgba(141, 77, 91, 0.18)"
                  bg="white"
                  px={4}
                  py={3}
                />
              </Stack>

              <Button
                bg="var(--rose-deep)"
                color="white"
                borderRadius="full"
                h="56px"
                _hover={{ bg: "var(--rose)" }}
                disabled={
                  !selectedTowelType ||
                  !selectedTowelModel ||
                  !selectedColor ||
                  !selectedLetterStyle ||
                  !order.embroideredName
                }
                onClick={openWhatsApp}
              >
                <Flex align="center" gap={2}>
                  <LuMessageCircle />
                  Enviar pedido no WhatsApp
                </Flex>
              </Button>
            </Stack>
          </SimpleGrid>
        </Box>
      </Container>

      <Container maxW="7xl" px={{ base: 5, md: 8 }} pt={16}>
        <Stack gap={4} mb={8}>
          <Text color="var(--rose-deep)" fontWeight="700">
            Toalhas ja prontas
          </Text>
          <Heading fontFamily="var(--font-display)" fontSize={{ base: "3xl", md: "5xl" }}>
            Pecas finalizadas com espaco para aprovacao de feedback.
          </Heading>
          <Text color="var(--muted)" maxW="56ch">
            Os comentarios entram como pendentes e so aparecem aqui quando a
            administracao aprovar.
          </Text>
        </Stack>
        <SimpleGrid columns={{ base: 1, xl: 2 }} gap={8}>
          {catalog.readyMadeItems.map((item) => (
            <Stack
              key={item.id}
              borderRadius="32px"
              overflow="hidden"
              border="1px solid var(--line)"
              bg="var(--card)"
              boxShadow="var(--shadow)"
            >
              <Box h={{ base: "280px", md: "360px" }} bg="rgba(208,161,90,0.12)">
                <Image
                  src={resolveAssetUrl(item.imageUrl)}
                  alt={item.title}
                  h="full"
                  w="full"
                  objectFit="cover"
                />
              </Box>
              <Stack p={6} gap={5}>
                <Stack gap={2}>
                  <Heading fontFamily="var(--font-display)" fontSize="3xl">
                    {item.title}
                  </Heading>
                  <Text color="var(--muted)" lineHeight="1.8">
                    {item.description || "Peça pronta para inspirar novas encomendas."}
                  </Text>
                </Stack>
                <HStack gap={3} flexWrap="wrap">
                  <Badge borderRadius="full" px={3} py={1.5} bg="rgba(184,106,120,0.12)">
                    {item.towelType.name}
                  </Badge>
                  {item.towelModel ? (
                    <Badge borderRadius="full" px={3} py={1.5} bg="rgba(208,161,90,0.16)">
                      {item.towelModel.name}
                    </Badge>
                  ) : null}
                  {item.letterStyle ? (
                    <Badge borderRadius="full" px={3} py={1.5} bg="rgba(255,255,255,0.88)">
                      {item.letterStyle.name}
                    </Badge>
                  ) : null}
                </HStack>
                {item.feedbacks.length ? (
                  <Stack
                    borderRadius="28px"
                    bg="rgba(255,255,255,0.72)"
                    border="1px solid rgba(75,49,47,0.08)"
                    p={5}
                    gap={3}
                  >
                    <Text fontWeight="800">Feedbacks aprovados</Text>
                    {item.feedbacks.map((feedback) => (
                      <Stack
                        key={feedback.id}
                        gap={1}
                        borderTop="1px solid rgba(75,49,47,0.08)"
                        pt={3}
                      >
                        <Text fontWeight="700">
                          {feedback.authorName} • {feedback.rating}/5
                        </Text>
                        <Text color="var(--muted)">{feedback.message}</Text>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Text color="var(--muted)">
                    Ainda nao ha feedback aprovado para esta peca.
                  </Text>
                )}
                <FeedbackForm
                  readyMadeItemId={item.id}
                  onSubmitted={() => loadCatalog(true)}
                />
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
