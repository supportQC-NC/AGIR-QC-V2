// src/components/Admin/TacheCronDocumentationModal.jsx
import React, { useState, useMemo } from "react";
import {
  HiX,
  HiPlus,
  HiPencil,
  HiTrash,
  HiDocumentText,
  HiPhotograph,
  HiLink,
  HiFilm,
  HiDocument,
  HiUpload,
  HiEye,
} from "react-icons/hi";
import {
  useAddDocumentationTacheCronMutation,
  useUpdateDocumentationTacheCronMutation,
  useDeleteDocumentationTacheCronMutation,
  useGetTacheCronByIdQuery,
  getTacheCronDocumentationUrl,
} from "../../slices/tacheCronApiSlice";
import "./TacheCronDocumentationModal.css";

const TYPE_ICONS = {
  texte: HiDocumentText,
  image: HiPhotograph,
  pdf: HiDocument,
  video: HiFilm,
  lien: HiLink,
};

const TYPE_LABELS = {
  texte: "Texte",
  image: "Image",
  pdf: "PDF",
  video: "Vidéo",
  lien: "Lien externe",
};

const TacheCronDocumentationModal = ({ tache, onClose }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({
    titre: "",
    type: "texte",
    contenu: "",
    url: "",
  });
  const [file, setFile] = useState(null);

  const { data: tacheData, refetch } = useGetTacheCronByIdQuery(tache._id);
  const [addDoc, { isLoading: isAdding }] = useAddDocumentationTacheCronMutation();
  const [updateDoc, { isLoading: isUpdating }] = useUpdateDocumentationTacheCronMutation();
  const [deleteDoc, { isLoading: isDeleting }] = useDeleteDocumentationTacheCronMutation();

  const documentation = tacheData?.documentation || tache.documentation || [];

  const sortedDocumentation = useMemo(
    () => [...documentation].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)),
    [documentation]
  );

  const resetForm = () => {
    setFormData({ titre: "", type: "texte", contenu: "", url: "" });
    setFile(null);
    setEditingDoc(null);
    setShowAddForm(false);
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      titre: doc.titre,
      type: doc.type,
      contenu: doc.contenu || "",
      url: doc.url || "",
    });
    setFile(null);
    setShowAddForm(true);
  };

  const handleDelete = async (docId) => {
    if (window.confirm("Supprimer ce document ?")) {
      try {
        await deleteDoc({ tacheId: tache._id, docId }).unwrap();
        refetch();
      } catch (err) {
        alert(err?.data?.message || "Erreur lors de la suppression");
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) {
      alert("Le titre est requis");
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("titre", formData.titre);
      submitData.append("type", formData.type);

      if (formData.type === "texte") submitData.append("contenu", formData.contenu);
      else if (formData.type === "lien") submitData.append("url", formData.url);
      else if (file) submitData.append("document", file);

      if (editingDoc) {
        await updateDoc({
          tacheId: tache._id,
          docId: editingDoc._id,
          formData: submitData,
        }).unwrap();
      } else {
        await addDoc({ tacheId: tache._id, formData: submitData }).unwrap();
      }

      resetForm();
      refetch();
    } catch (err) {
      alert(err?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const openDocument = (doc) => {
    if (doc.type === "lien") {
      window.open(doc.url, "_blank");
    } else if (["image", "pdf", "video"].includes(doc.type)) {
      const apiUrl = "http://localhost:5000";
      window.open(
        `${apiUrl}${getTacheCronDocumentationUrl(tache._id, doc._id)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content doc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <HiDocumentText /> Documentation - {tache.titre}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Liste des documents */}
          <div className="doc-list">
            <div className="doc-list-header">
              <span>{documentation.length} document(s)</span>
              {!showAddForm && (
                <button className="btn-add-doc" onClick={() => setShowAddForm(true)}>
                  <HiPlus /> Ajouter
                </button>
              )}
            </div>

            {documentation.length === 0 && !showAddForm ? (
              <div className="no-docs">
                <HiDocumentText />
                <p>Aucune documentation</p>
                <button className="btn-add-first" onClick={() => setShowAddForm(true)}>
                  <HiPlus /> Ajouter un document
                </button>
              </div>
            ) : (
              <div className="doc-items">
                {sortedDocumentation.map((doc) => {
                  const TypeIcon = TYPE_ICONS[doc.type] || HiDocument;
                  return (
                    <div key={doc._id} className="doc-item">
                      <div className="doc-item-icon">
                        <TypeIcon />
                      </div>
                      <div className="doc-item-info">
                        <span className="doc-item-title">{doc.titre}</span>
                        <span className="doc-item-meta">
                          {TYPE_LABELS[doc.type]}
                          {doc.fichierTaille && ` • ${formatFileSize(doc.fichierTaille)}`}
                        </span>
                      </div>
                      <div className="doc-item-actions">
                        {doc.type !== "texte" && (
                          <button
                            className="btn-doc-action"
                            onClick={() => openDocument(doc)}
                            title="Voir"
                          >
                            <HiEye />
                          </button>
                        )}
                        <button
                          className="btn-doc-action"
                          onClick={() => handleEdit(doc)}
                          title="Modifier"
                        >
                          <HiPencil />
                        </button>
                        <button
                          className="btn-doc-action delete"
                          onClick={() => handleDelete(doc._id)}
                          disabled={isDeleting}
                          title="Supprimer"
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulaire d'ajout/modification */}
          {showAddForm && (
            <div className="doc-form">
              <div className="doc-form-header">
                <h3>{editingDoc ? "Modifier le document" : "Nouveau document"}</h3>
                <button className="btn-cancel-form" onClick={resetForm}>
                  <HiX />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group flex-2">
                    <label>Titre *</label>
                    <input
                      type="text"
                      value={formData.titre}
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                      placeholder="Titre du document"
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      disabled={!!editingDoc}
                    >
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.type === "texte" && (
                  <div className="form-group">
                    <label>Contenu</label>
                    <textarea
                      value={formData.contenu}
                      onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                      placeholder="Contenu du document..."
                      rows={6}
                    />
                  </div>
                )}

                {formData.type === "lien" && (
                  <div className="form-group">
                    <label>URL</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {["image", "pdf", "video"].includes(formData.type) && (
                  <div className="form-group">
                    <label>Fichier {!editingDoc && "*"}</label>
                    <div className="file-upload-zone">
                      <input
                        type="file"
                        id="tache-doc-file"
                        accept={
                          formData.type === "image"
                            ? "image/*"
                            : formData.type === "pdf"
                            ? ".pdf"
                            : "video/*"
                        }
                        onChange={handleFileChange}
                        className="file-input"
                      />
                      <label htmlFor="tache-doc-file" className="file-upload-btn">
                        <HiUpload />
                        <span>
                          {file
                            ? file.name
                            : editingDoc?.fichierNom
                            ? `Actuel: ${editingDoc.fichierNom}`
                            : "Sélectionner un fichier"}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={resetForm}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-submit" disabled={isAdding || isUpdating}>
                    {isAdding || isUpdating
                      ? "Enregistrement..."
                      : editingDoc
                      ? "Mettre à jour"
                      : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TacheCronDocumentationModal;