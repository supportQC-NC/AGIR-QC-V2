// src/slices/reapproApiSlice.js
import { apiSlice } from "./apiSlice";

export const reapproApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createReappro: builder.mutation({
      query: (data) => ({ url: "/api/reappros", method: "POST", body: data }),
      invalidatesTags: ["Reappro"],
    }),

    getReapproEnCours: builder.query({
      query: (entrepriseId) => `/api/reappros/en-cours/${entrepriseId}`,
      providesTags: ["Reappro"],
    }),

    getReapproById: builder.query({
      query: (reapproId) => `/api/reappros/${reapproId}`,
      providesTags: ["Reappro"],
    }),

    scanArticleReappro: builder.mutation({
      query: ({ reapproId, code }) => ({
        url: `/api/reappros/${reapproId}/scan`,
        method: "POST",
        body: { code },
      }),
    }),

    addLigneReappro: builder.mutation({
      query: ({ reapproId, ...data }) => ({
        url: `/api/reappros/${reapproId}/lignes`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Reappro"],
    }),

    updateLigneReappro: builder.mutation({
      query: ({ reapproId, ligneId, quantite }) => ({
        url: `/api/reappros/${reapproId}/lignes/${ligneId}`,
        method: "PUT",
        body: { quantite },
      }),
      invalidatesTags: ["Reappro"],
    }),

    deleteLigneReappro: builder.mutation({
      query: ({ reapproId, ligneId }) => ({
        url: `/api/reappros/${reapproId}/lignes/${ligneId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reappro"],
    }),

    exportReappro: builder.mutation({
      query: ({ reapproId, nomReappro, cheminDestination }) => ({
        url: `/api/reappros/${reapproId}/export`,
        method: "POST",
        body: { nomReappro, cheminDestination },
      }),
      invalidatesTags: ["Reappro"],
    }),

    downloadReappro: builder.mutation({
      query: ({ reapproId, nomReappro }) => ({
        url: `/api/reappros/${reapproId}/download`,
        method: "POST",
        body: { nomReappro },
        responseHandler: (response) => response.text(),
      }),
      invalidatesTags: ["Reappro"],
    }),

    deleteReappro: builder.mutation({
      query: (reapproId) => ({
        url: `/api/reappros/${reapproId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reappro"],
    }),

    getHistoriqueReappro: builder.query({
      query: (entrepriseId) =>
        `/api/reappros/historique${entrepriseId ? `?entrepriseId=${entrepriseId}` : ""}`,
      providesTags: ["Reappro"],
    }),

    // ─── NOUVEAUX ENDPOINTS ───

    // Mettre à jour le titre
    updateTitreReappro: builder.mutation({
      query: ({ reapproId, titre }) => ({
        url: `/api/reappros/${reapproId}/titre`,
        method: "PUT",
        body: { titre },
      }),
      invalidatesTags: ["Reappro"],
    }),

    // Partager un réappro (passe en status "partage")
    partagerReappro: builder.mutation({
      query: ({ reapproId, titre }) => ({
        url: `/api/reappros/${reapproId}/partager`,
        method: "PUT",
        body: { titre },
      }),
      invalidatesTags: ["Reappro"],
    }),

    // Lister les réappros partagés
    getReapproPartages: builder.query({
      query: (entrepriseId) => `/api/reappros/partages/${entrepriseId}`,
      providesTags: ["Reappro"],
    }),

    // Reprendre un réappro partagé
    reprendreReappro: builder.mutation({
      query: (reapproId) => ({
        url: `/api/reappros/${reapproId}/reprendre`,
        method: "PUT",
      }),
      invalidatesTags: ["Reappro"],
    }),
  }),
});

export const {
  useCreateReapproMutation,
  useGetReapproEnCoursQuery,
  useGetReapproByIdQuery,
  useScanArticleReapproMutation,
  useAddLigneReapproMutation,
  useUpdateLigneReapproMutation,
  useDeleteLigneReapproMutation,
  useExportReapproMutation,
  useDownloadReapproMutation,
  useDeleteReapproMutation,
  useGetHistoriqueReapproQuery,
  // Nouveaux
  useUpdateTitreReapproMutation,
  usePartagerReapproMutation,
  useGetReapproPartagesQuery,
  useReprendreReapproMutation,
} = reapproApiSlice;