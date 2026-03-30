// src/components/Admin/OutilModal.jsx
import React, { useState, useEffect } from "react";
import {
  HiX,
  HiUpload,
  HiPhotograph,
  HiDocument,
  HiTag,
  HiInformationCircle,
} from "react-icons/hi";
import {
  useCreateOutilMutation,
  useUpdateOutilMutation,
  useGetCategoriesQuery,
} from "../../slices/outilApiSlice";
import "./OutilModal.css";

const OutilModal = ({ outil, onClose }) => {
  const isEdit = !!outil;

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    descriptionCourte: "",
    version: "1.0.0",
    categorie: "autre",
    tags: "",
    configurationRequise: "",
    changelog: "",
    accesPublic: false,
  });

  const [executableFile, setExecutableFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { data: categories } = useGetCategoriesQuery();
  const [createOutil, { isLoading: isCreating }] = useCreateOutilMutation();
  const [updateOutil, { isLoading: isUpdating }] = useUpdateOutilMutation();

  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (outil) {
      setFormData({
        titre: outil.titre || "",
        description: outil.description || "",
        descriptionCourte: outil.descriptionCourte || "",
        version: outil.version || "1.0.0",
        categorie: outil.categorie || "autre",
        tags: outil.tags?.join(", ") || "",
        configurationRequise: outil.configurationRequise || "",
        changelog: outil.changelog || "",
        accesPublic: outil.accesPublic || false,
      });
      if (outil.imagePath) {
        setImagePreview(`/api/outils/${outil._id}/image`);
      }
    }
  }, [outil]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleExecutableChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExecutableFile(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEdit && !executableFile) {
      alert("Le fichier exécutable est requis");
      return;
    }

    try {
      const submitData = new FormData();

      // Ajouter les champs texte
      Object.keys(formData).forEach((key) => {
        if (key === "accesPublic") {
          submitData.append(key, formData[key] ? "true" : "false");
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Ajouter les fichiers
      if (executableFile) {
        submitData.append("executable", executableFile);
      }
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      if (isEdit) {
        await updateOutil({ id: outil._id, formData: submitData }).unwrap();
      } else {
        await createOutil(submitData).unwrap();
      }

      onClose();
    } catch (err) {
      alert(err?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content outil-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{isEdit ? "Modifier l'outil" : "Nouvel outil"}</h2>
          <button className="modal-close" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group flex-2">
              <label>Titre *</label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                placeholder="Nom de l'outil"
                required
              />
            </div>
            <div className="form-group flex-1">
              <label>Version</label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description courte</label>
            <input
              type="text"
              name="descriptionCourte"
              value={formData.descriptionCourte}
              onChange={handleChange}
              placeholder="Résumé en une ligne (max 200 car.)"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Description complète *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description détaillée de l'outil..."
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Catégorie</label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
              >
                {categories?.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>
                <HiTag /> Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="stock, inventaire, gestion"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>
              <HiDocument /> Fichier exécutable {!isEdit && "*"}
            </h3>
            <div className="file-upload-area">
              <input
                type="file"
                id="executable-upload"
                accept=".exe,.msi,.zip,.rar,.7z"
                onChange={handleExecutableChange}
                className="file-input"
              />
              <label htmlFor="executable-upload" className="file-upload-label">
                <HiUpload />
                <span>
                  {executableFile
                    ? executableFile.name
                    : isEdit
                      ? `Actuel: ${outil.executableNom}`
                      : "Cliquez pour sélectionner un fichier"}
                </span>
                {executableFile && (
                  <span className="file-size">
                    {formatFileSize(executableFile.size)}
                  </span>
                )}
              </label>
              {isEdit && !executableFile && (
                <p className="file-hint">
                  Fichier actuel: {outil.executableNom} (
                  {formatFileSize(outil.executableTaille)})
                </p>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>
              <HiPhotograph /> Image / Icône
            </h3>
            <div className="image-upload-area">
              <div className="image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : (
                  <div className="image-placeholder">
                    <HiPhotograph />
                    <span>Aucune image</span>
                  </div>
                )}
              </div>
              <div className="image-upload-controls">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
                <label htmlFor="image-upload" className="btn-upload">
                  <HiUpload /> Choisir une image
                </label>
                <p className="file-hint">PNG, JPG, WebP (max 5MB)</p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>
              <HiInformationCircle /> Configuration requise
            </label>
            <textarea
              name="configurationRequise"
              value={formData.configurationRequise}
              onChange={handleChange}
              placeholder="Windows 10+, .NET Framework 4.8..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Changelog / Notes de version</label>
            <textarea
              name="changelog"
              value={formData.changelog}
              onChange={handleChange}
              placeholder="v1.0.0 - Version initiale..."
              rows={3}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="accesPublic"
                checked={formData.accesPublic}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">
                Accès public (tous les utilisateurs actifs peuvent télécharger)
              </span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading
                ? "Enregistrement..."
                : isEdit
                  ? "Mettre à jour"
                  : "Créer l'outil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OutilModal;
