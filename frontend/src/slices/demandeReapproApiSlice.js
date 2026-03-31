// src/slices/demandeReapproApiSlice.js
import { apiSlice } from "./apiSlice";
const DEMANDES_URL = "/api/demandes-reappro";

export const demandeReapproApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createDemandeReappro: builder.mutation({
      query: (data) => ({ url: DEMANDES_URL, method: "POST", body: data }),
      invalidatesTags: ["DemandeReappro"],
    }),
    getDemandesReappro: builder.query({
      query: ({ entrepriseId, status, priorite, page, limit } = {}) => ({
        url: DEMANDES_URL,
        params: { ...(entrepriseId && { entrepriseId }), ...(status && { status }), ...(priorite && { priorite }), ...(page && { page }), ...(limit && { limit }) },
      }),
      providesTags: ["DemandeReappro"],
      keepUnusedDataFor: 30,
    }),
    getDemandeReapproById: builder.query({
      query: (id) => `${DEMANDES_URL}/${id}`,
      providesTags: (result, error, id) => [{ type: "DemandeReappro", id }],
    }),
    countPendingDemandes: builder.query({
      query: (entrepriseId) => ({ url: `${DEMANDES_URL}/count-pending`, params: entrepriseId ? { entrepriseId } : {} }),
      providesTags: ["DemandeReappro"],
      keepUnusedDataFor: 15,
    }),
    countCompletedDemandes: builder.query({
      query: (entrepriseId) => ({ url: `${DEMANDES_URL}/count-completed`, params: entrepriseId ? { entrepriseId } : {} }),
      providesTags: ["DemandeReappro"],
      keepUnusedDataFor: 15,
    }),
    prendreEnChargeDemande: builder.mutation({
      query: (id) => ({ url: `${DEMANDES_URL}/${id}/prendre-en-charge`, method: "PUT" }),
      invalidatesTags: ["DemandeReappro", "Reappro"],
    }),
    scanLigneDemande: builder.mutation({
      query: ({ demandeId, ligneId, code, quantiteTraitee }) => ({
        url: `${DEMANDES_URL}/${demandeId}/lignes/${ligneId}/scan`,
        method: "PUT",
        body: { code, quantiteTraitee },
      }),
      invalidatesTags: ["DemandeReappro", "Reappro"],
    }),
    relacherDemande: builder.mutation({
      query: (id) => ({ url: `${DEMANDES_URL}/${id}/relacher`, method: "PUT" }),
      invalidatesTags: ["DemandeReappro", "Reappro"],
    }),
    traiterLigneDemande: builder.mutation({
      query: ({ demandeId, ligneId, quantiteTraitee, noteAgent, action }) => ({
        url: `${DEMANDES_URL}/${demandeId}/lignes/${ligneId}/traiter`,
        method: "PUT",
        body: { quantiteTraitee, noteAgent, action },
      }),
      invalidatesTags: ["DemandeReappro"],
    }),
    markDemandeAsRead: builder.mutation({
      query: (id) => ({ url: `${DEMANDES_URL}/${id}/mark-read`, method: "PUT" }),
      invalidatesTags: ["DemandeReappro"],
    }),
    annulerDemande: builder.mutation({
      query: (id) => ({ url: `${DEMANDES_URL}/${id}/annuler`, method: "PUT" }),
      invalidatesTags: ["DemandeReappro"],
    }),
    // Suppression définitive — admin uniquement
    deleteDemande: builder.mutation({
      query: (id) => ({ url: `${DEMANDES_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: ["DemandeReappro"],
    }),
  }),
});

export const {
  useCreateDemandeReapproMutation,
  useGetDemandesReapproQuery,
  useGetDemandeReapproByIdQuery,
  useCountPendingDemandesQuery,
  useCountCompletedDemandesQuery,
  usePrendreEnChargeDemandeMutation,
  useScanLigneDemandeMutation,
  useRelacherDemandeMutation,
  useTraiterLigneDemandeMutation,
  useMarkDemandeAsReadMutation,
  useAnnulerDemandeMutation,
  useDeleteDemandeMutation,
} = demandeReapproApiSlice;