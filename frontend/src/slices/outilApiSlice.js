// frontend/src/slices/outilApiSlice.js
import { apiSlice } from "./apiSlice";

const OUTILS_URL = "/api/outils";

export const outilApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // ROUTES UTILISATEURS
    // ==========================================

    // Obtenir tous les outils accessibles
    getOutils: builder.query({
      query: ({ categorie, search, page, limit, includeInactive } = {}) => ({
        url: OUTILS_URL,
        params: {
          ...(categorie && categorie !== "tous" && { categorie }),
          ...(search && { search }),
          ...(page && { page }),
          ...(limit && { limit }),
          ...(includeInactive && { includeInactive: "true" }),
        },
      }),
      providesTags: ["Outil"],
      keepUnusedDataFor: 60,
    }),

    // Obtenir un outil par ID
    getOutilById: builder.query({
      query: (id) => `${OUTILS_URL}/${id}`,
      providesTags: ["Outil"],
    }),

    // Obtenir les catégories
    getCategories: builder.query({
      query: () => `${OUTILS_URL}/categories`,
      keepUnusedDataFor: 300,
    }),

    // Télécharger un outil (retourne le blob)
    downloadOutil: builder.mutation({
      query: (id) => ({
        url: `${OUTILS_URL}/${id}/download`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erreur lors du téléchargement");
          }
          const blob = await response.blob();
          const contentDisposition = response.headers.get(
            "content-disposition",
          );
          let filename = "outil.exe";
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) filename = match[1];
          }
          return { blob, filename };
        },
        cache: "no-cache",
      }),
    }),

    // Obtenir l'URL de l'image d'un outil
    getOutilImageUrl: builder.query({
      query: (id) => ({
        url: `${OUTILS_URL}/${id}/image`,
        responseHandler: async (response) => {
          if (response.ok) {
            return { exists: true, url: `${OUTILS_URL}/${id}/image` };
          }
          return { exists: false, url: null };
        },
      }),
      keepUnusedDataFor: 3600,
    }),

    // Obtenir un document de documentation
    getDocumentation: builder.query({
      query: ({ outilId, docId }) =>
        `${OUTILS_URL}/${outilId}/documentation/${docId}`,
      providesTags: ["Outil"],
    }),

    // ==========================================
    // ROUTES ADMIN
    // ==========================================

    // Créer un outil (avec fichiers)
    createOutil: builder.mutation({
      query: (formData) => ({
        url: OUTILS_URL,
        method: "POST",
        body: formData,
        // Ne pas définir Content-Type, le navigateur le fait automatiquement pour FormData
        formData: true,
      }),
      invalidatesTags: ["Outil"],
    }),

    // Modifier un outil
    updateOutil: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${OUTILS_URL}/${id}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Outil"],
    }),

    // Supprimer un outil
    deleteOutil: builder.mutation({
      query: (id) => ({
        url: `${OUTILS_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Outil"],
    }),

    // Activer/Désactiver un outil
    toggleOutilActive: builder.mutation({
      query: (id) => ({
        url: `${OUTILS_URL}/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["Outil"],
    }),

    // Mettre à jour les accès d'un outil
    updateAccesOutil: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${OUTILS_URL}/${id}/acces`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Outil"],
    }),

    // Ajouter de la documentation
    addDocumentation: builder.mutation({
      query: ({ outilId, formData }) => ({
        url: `${OUTILS_URL}/${outilId}/documentation`,
        method: "POST",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Outil"],
    }),

    // Modifier un document
    updateDocumentation: builder.mutation({
      query: ({ outilId, docId, formData }) => ({
        url: `${OUTILS_URL}/${outilId}/documentation/${docId}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Outil"],
    }),

    // Supprimer un document
    deleteDocumentation: builder.mutation({
      query: ({ outilId, docId }) => ({
        url: `${OUTILS_URL}/${outilId}/documentation/${docId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Outil"],
    }),

    // Historique des téléchargements d'un outil
    getTelechargements: builder.query({
      query: ({ outilId, page, limit } = {}) => ({
        url: `${OUTILS_URL}/${outilId}/telechargements`,
        params: {
          ...(page && { page }),
          ...(limit && { limit }),
        },
      }),
      keepUnusedDataFor: 60,
    }),

    // Statistiques globales
    getOutilsStats: builder.query({
      query: () => `${OUTILS_URL}/admin/stats`,
      keepUnusedDataFor: 60,
    }),

    // Liste des utilisateurs pour sélection
    getUsersForSelection: builder.query({
      query: () => `${OUTILS_URL}/admin/users-list`,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  // Hooks utilisateurs
  useGetOutilsQuery,
  useGetOutilByIdQuery,
  useGetCategoriesQuery,
  useDownloadOutilMutation,
  useGetOutilImageUrlQuery,
  useGetDocumentationQuery,
  // Hooks admin
  useCreateOutilMutation,
  useUpdateOutilMutation,
  useDeleteOutilMutation,
  useToggleOutilActiveMutation,
  useUpdateAccesOutilMutation,
  useAddDocumentationMutation,
  useUpdateDocumentationMutation,
  useDeleteDocumentationMutation,
  useGetTelechargmentsQuery,
  useGetOutilsStatsQuery,
  useGetUsersForSelectionQuery,
} = outilApiSlice;

// Helper pour construire l'URL de l'image
export const getOutilImageUrl = (outilId) => {
  if (!outilId) return null;
  return `${OUTILS_URL}/${outilId}/image`;
};

// Helper pour télécharger un fichier
export const downloadOutilFile = async (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
