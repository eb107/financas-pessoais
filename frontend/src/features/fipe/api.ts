import { api } from "../../lib/api";
import type { FipeBrand, FipeModel, FipePrice, FipeYear } from "./types";

export async function listFipeBrands() {
  const { data } = await api.get<FipeBrand[]>("/api/fipe/brands/");
  return data;
}

export async function listFipeModels(brandCode: string) {
  const { data } = await api.get<FipeModel[]>(
    `/api/fipe/brands/${brandCode}/models/`,
  );
  return data;
}

export async function listFipeYears(brandCode: string, modelCode: string) {
  const { data } = await api.get<FipeYear[]>(
    `/api/fipe/brands/${brandCode}/models/${modelCode}/years/`,
  );
  return data;
}

export async function getFipePrice(
  brandCode: string,
  modelCode: string,
  yearCode: string,
) {
  const { data } = await api.get<FipePrice>(
    `/api/fipe/brands/${brandCode}/models/${modelCode}/years/${yearCode}/`,
  );
  return data;
}
