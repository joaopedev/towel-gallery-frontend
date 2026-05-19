import type {
  AdminCatalogResponse,
  AdminStatsResponse,
  Feedback,
  PublicCatalogResponse,
} from "@/types/catalog";
import type { LoginInput } from "./schemas";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000/api" : "");

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

async function request<T>(
  path: string,
  init?: RequestInit & { token?: string | null },
) {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL nao foi configurada para este ambiente.",
    );
  }

  const headers = new Headers(init?.headers);
  const method = init?.method?.toUpperCase() ?? "GET";

  if (
    init?.body &&
    method !== "GET" &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Nao foi possivel concluir a requisicao.");
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (!API_ORIGIN) {
    throw new Error(
      "NEXT_PUBLIC_API_URL nao foi configurada para resolver arquivos remotos.",
    );
  }

  return `${API_ORIGIN}${path}`;
}

export function getPublicCatalog() {
  return request<PublicCatalogResponse>("/public/catalog");
}

export function recordPublicClick(targetType: string, targetId: string) {
  return request<{ ok: true }>("/public/clicks", {
    method: "POST",
    body: JSON.stringify({ targetType, targetId }),
  });
}

export function createPublicFeedback(input: {
  readyMadeItemId: string;
  authorName: string;
  message: string;
  rating: number;
}) {
  return request<Feedback>("/public/feedbacks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function adminLogin(input: LoginInput) {
  return request<{ accessToken: string; user: { username: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getAdminCatalog(token: string) {
  return request<AdminCatalogResponse>("/admin/catalog", { token });
}

export function getAdminStats(token: string) {
  return request<AdminStatsResponse>("/admin/catalog/stats", { token });
}

export function getPendingFeedbacks(token: string) {
  return request<
    Array<
      Feedback & {
        readyMadeItem: { id: string; title: string };
      }
    >
  >("/admin/catalog/feedbacks/pending", { token });
}

export function approveFeedback(
  token: string,
  id: string,
  approved: boolean,
) {
  return request(`/admin/catalog/feedbacks/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ approved }),
  });
}

export function uploadAdminImage(token: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<{ url: string }>("/admin/uploads/image", {
    method: "POST",
    token,
    body: formData,
  });
}

export function createAdminLetter(
  token: string,
  input: {
    name: string;
    description?: string;
    previewText?: string;
    imageUrl?: string;
    accentColor?: string;
  },
) {
  return request("/admin/catalog/letters", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function createAdminColor(
  token: string,
  input: { name: string; hexCode: string; imageUrl?: string },
) {
  return request("/admin/catalog/colors", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function createAdminTowelType(
  token: string,
  input: {
    name: string;
    description?: string;
    imageUrl?: string;
    colorIds: string[];
  },
) {
  return request("/admin/catalog/towel-types", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function createAdminTowelModel(
  token: string,
  input: {
    name: string;
    description?: string;
    imageUrl?: string;
    towelTypeId: string;
    colorIds: string[];
  },
) {
  return request("/admin/catalog/towel-models", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function createAdminReadyMadeItem(
  token: string,
  input: {
    title: string;
    description?: string;
    imageUrl: string;
    priceLabel?: string;
    towelTypeId: string;
    towelModelId?: string;
    letterStyleId?: string;
    colorIds: string[];
  },
) {
  return request("/admin/catalog/ready-made-items", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function removeAdminResource(
  token: string,
  path:
    | "letters"
    | "colors"
    | "towel-types"
    | "towel-models"
    | "ready-made-items",
  id: string,
) {
  return request(`/admin/catalog/${path}/${id}`, {
    method: "DELETE",
    token,
  });
}
