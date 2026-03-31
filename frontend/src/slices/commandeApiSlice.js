// src/slices/commandeApiSlice.js
import { apiSlice } from "./apiSlice";
import { COMMANDES_URL } from "../constants";

export const commandeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // ENTÊTES DE COMMANDES (cmdref.dbf)
    // ==========================================

    getCommandes: builder.query({
      query: ({
        nomDossierDBF,
        page,
        limit,
        search, numcde, fourn, bateau, cdvise,
        verrou, hasFacture, groupage,
        etat,
        dateDebut, dateFin,
      }) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}`,
        params: {
          page,
          limit,
          ...(search && { search }),
          ...(numcde && { numcde }),
          ...(fourn && { fourn }),
          ...(bateau && { bateau }),
          ...(cdvise && { cdvise }),
          ...(verrou === "OUI" && { verrou: "true" }),
          ...(hasFacture === "OUI" && { hasFacture: "true" }),
          ...(groupage === "OUI" && { groupage: "true" }),
          ...(etat !== undefined && etat !== "" && etat !== "TOUT" && { etat }),
          ...(dateDebut && { dateDebut }),
          ...(dateFin && { dateFin }),
        },
      }),
      providesTags: ["Commande"],
      keepUnusedDataFor: 60,
    }),

    // Commande par numéro (entête + détails + cmdplus)
    getCommandeByNumcde: builder.query({
      query: ({ nomDossierDBF, numcde }) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/code/${numcde}`,
      }),
      providesTags: ["Commande"],
    }),

    getCommandesByFournisseur: builder.query({
      query: ({ nomDossierDBF, fourn, page, limit }) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/fournisseur/${fourn}`,
        params: {
          ...(page && { page }),
          ...(limit && { limit }),
        },
      }),
      providesTags: ["Commande"],
    }),

    getCommandesByArticle: builder.query({
      query: ({ nomDossierDBF, nart, page, limit }) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/article/${nart}`,
        params: {
          ...(page && { page }),
          ...(limit && { limit }),
        },
      }),
      providesTags: ["Commande"],
    }),

    getAdjacentCommandes: builder.query({
      query: ({ nomDossierDBF, numcde }) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/adjacent/${numcde}`,
      }),
      providesTags: ["Commande"],
      keepUnusedDataFor: 60,
    }),

    searchCommandes: builder.query({
      query: ({ nomDossierDBF, q, field, limit }) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/search`,
        params: { q, field, limit },
      }),
      providesTags: ["Commande"],
    }),

    // ==========================================
    // DÉTAILS DE COMMANDES (cmdetail.dbf)
    // ==========================================

    getCommandeDetails: builder.query({
      query: ({ nomDossierDBF, numcde }) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/details/${numcde}`,
      }),
      providesTags: ["CommandeDetail"],
    }),

    // ==========================================
    // CMDPLUS (cmdplus.dbf)
    // ==========================================

    getCommandePlus: builder.query({
      query: ({ nomDossierDBF, numcde }) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/plus/${numcde}`,
      }),
      providesTags: ["Commande"],
    }),

    // ==========================================
    // LISTES / UTILITAIRES
    // ==========================================

    getFournisseursCommandes: builder.query({
      query: (nomDossierDBF) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/fournisseurs`,
      }),
      providesTags: ["Commande"],
      keepUnusedDataFor: 300,
    }),

    getBateaux: builder.query({
      query: (nomDossierDBF) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/bateaux`,
      }),
      providesTags: ["Commande"],
      keepUnusedDataFor: 300,
    }),

    getEtatsCommandes: builder.query({
      query: (nomDossierDBF) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/etats`,
      }),
      providesTags: ["Commande"],
      keepUnusedDataFor: 300,
    }),

    getCommandesStructure: builder.query({
      query: (nomDossierDBF) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/structure`,
      }),
      providesTags: ["Commande"],
      keepUnusedDataFor: 600,
    }),

    // ==========================================
    // ADMIN
    // ==========================================

    invalidateCommandeCache: builder.mutation({
      query: (nomDossierDBF) => ({
        url: `${COMMANDES_URL}/${nomDossierDBF}/invalidate-cache`,
        method: "POST",
      }),
      invalidatesTags: ["Commande", "CommandeDetail"],
    }),

    getCommandeCacheStats: builder.query({
      query: () => ({
        url: `${COMMANDES_URL}/cache-stats`,
      }),
      keepUnusedDataFor: 30,
    }),
  }),
});

export const {
  useGetCommandesQuery,
  useGetCommandeByNumcdeQuery,
  useGetCommandesByFournisseurQuery,
  useGetCommandesByArticleQuery,
  useGetAdjacentCommandesQuery,
  useSearchCommandesQuery,
  useGetCommandeDetailsQuery,
  useGetCommandePlusQuery,
  useGetFournisseursCommandesQuery,
  useGetBateauxQuery,
  useGetEtatsCommandesQuery,
  useGetCommandesStructureQuery,
  useInvalidateCommandeCacheMutation,
  useGetCommandeCacheStatsQuery,
} = commandeApiSlice;