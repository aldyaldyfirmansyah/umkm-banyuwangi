import { queryOptions } from "@tanstack/react-query";
import {
  getCategories,
  getCatalogCategoryCounts,
  getDistricts,
  getHomeData,
  getMapPoints,
  getProduct,
  getSiteSettings,
  getUmkm,
  listUmkm,
  searchProducts,
  type CatalogSearch,
  type DirectorySearch,
} from "./public.functions";

export const siteSettingsQuery = () =>
  queryOptions({ queryKey: ["site-settings"], queryFn: () => getSiteSettings(), staleTime: 60_000 });

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => getCategories(), staleTime: 60_000 });

export const catalogCategoryCountsQuery = (kec?: string) =>
  queryOptions({ queryKey: ["catalog-category-counts", kec], queryFn: () => getCatalogCategoryCounts({ data: { kec } }), staleTime: 15_000 });

export const districtsQuery = () =>
  queryOptions({ queryKey: ["districts"], queryFn: () => getDistricts(), staleTime: 60_000 });

export const homeQuery = () =>
  queryOptions({ queryKey: ["home"], queryFn: () => getHomeData(), staleTime: 30_000 });

export const catalogQuery = (search: CatalogSearch) =>
  queryOptions({ queryKey: ["catalog", search], queryFn: () => searchProducts({ data: search }), staleTime: 15_000 });

export const productQuery = (id: string) =>
  queryOptions({ queryKey: ["product", id], queryFn: () => getProduct({ data: { id } }) });

export const umkmListQuery = (params: DirectorySearch) =>
  queryOptions({ queryKey: ["umkm-list", params], queryFn: () => listUmkm({ data: params }) });

export const umkmQuery = (id: string) =>
  queryOptions({ queryKey: ["umkm", id], queryFn: () => getUmkm({ data: { id } }) });

export const mapPointsQuery = () =>
  queryOptions({ queryKey: ["map-points"], queryFn: () => getMapPoints(), staleTime: 30_000 });
