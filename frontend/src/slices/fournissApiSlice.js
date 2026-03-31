// src/slices/fournissApiSlice.js
import { apiSlice } from "./apiSlice";

const FOURNISSEURS_URL = "/api/fournisseurs";

export const fournissApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Liste des fournisseurs avec pagination
    getFournisseurs: builder.query({
      query: ({ nomDossierDBF, page, limit, search }) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}`,
        params: {
          page,
          limit,
          ...(search && { search }),
        },
      }),
      providesTags: ["Fournisseur"],
      keepUnusedDataFor: 60,
    }),

    // Stats bulk : actif/déprécié/arrêté/réappro/valeur pour TOUS les fournisseurs
    getFournisseursStats: builder.query({
      query: (nomDossierDBF) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/stats`,
      }),
      providesTags: ["FournisseurStats"],
      keepUnusedDataFor: 120, // Cache 2 min
    }),

    // Détail d'un fournisseur par code
    getFournisseurByCode: builder.query({
      query: ({ nomDossierDBF, fourn }) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/code/${fourn}`,
      }),
      providesTags: (result, error, arg) => [
        { type: "Fournisseur", id: arg.fourn },
      ],
    }),

    // Articles liés à un fournisseur
    getArticlesByFournisseur: builder.query({
      query: ({ nomDossierDBF, fourn, page, limit }) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/code/${fourn}/articles`,
        params: { page, limit },
      }),
      providesTags: (result, error, arg) => [
        { type: "Article", id: `LIST_FOURN_${arg.fourn}` },
      ],
    }),

    // Recherche rapide
    searchFournisseurs: builder.query({
      query: ({ nomDossierDBF, q, limit }) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/search`,
        params: { q, limit },
      }),
      providesTags: ["Fournisseur"],
    }),

    // Structure
    getFournisseursStructure: builder.query({
      query: (nomDossierDBF) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/structure`,
      }),
      keepUnusedDataFor: 600,
    }),

    // Invalider cache
    invalidateFournissCache: builder.mutation({
      query: (nomDossierDBF) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/invalidate-cache`,
        method: "POST",
      }),
      invalidatesTags: ["Fournisseur", "FournisseurStats"],
    }),
  }),
});

export const {
  useGetFournisseursQuery,
  useGetFournisseursStatsQuery,
  useGetFournisseurByCodeQuery,
  useGetArticlesByFournisseurQuery,
  useSearchFournisseursQuery,
  useGetFournisseursStructureQuery,
  useInvalidateFournissCacheMutation,
} = fournissApiSlice;