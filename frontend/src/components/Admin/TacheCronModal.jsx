import React, { useState, useEffect, useRef } from "react";
import { HiX, HiTerminal, HiSave, HiClock, HiCode, HiTag, HiPhotograph, HiTrash, HiFolder, HiPlus } from "react-icons/hi";
import { useCreateTacheCronMutation, useUpdateTacheCronMutation, getTacheCronImageUrl } from "../../slices/tacheCronApiSlice";

const CATEGORIES = [
  { value: "sauvegarde", label: "Sauvegarde" }, { value: "synchronisation", label: "Synchronisation" },
  { value: "nettoyage", label: "Nettoyage" }, { value: "import_export", label: "Import/Export" },
  { value: "reporting", label: "Reporting" }, { value: "maintenance", label: "Maintenance" },
  { value: "monitoring", label: "Monitoring" }, { value: "autre", label: "Autre" },
];

const TacheCronModal = ({ tache, onClose }) => {
  const isEditing = !!tache;
  const imageInputRef = useRef(null);

  const [formData, setFormData] = useState({
    titre: "", description: "", descriptionCourte: "", commande: "",
    repertoireTravail: "", variablesEnvironnement: "", timeoutSecondes: 300,
    dossierSortie: "", expressionCron: "", frequenceDescription: "",
    categorie: "autre", tags: "", notes: "",
  });

  const [args, setArgs] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [createTache, { isLoading: isCreating }] = useCreateTacheCronMutation();
  const [updateTache, { isLoading: isUpdating }] = useUpdateTacheCronMutation();
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (tache) {
      setFormData({
        titre: tache.titre || "", description: tache.description || "",
        descriptionCourte: tache.descriptionCourte || "", commande: tache.commande || "",
        repertoireTravail: tache.repertoireTravail || "",
        variablesEnvironnement: tache.variablesEnvironnement || "",
        timeoutSecondes: tache.timeoutSecondes || 300,
        dossierSortie: tache.dossierSortie || "",
        expressionCron: tache.expressionCron || "",
        frequenceDescription: tache.frequenceDescription || "",
        categorie: tache.categorie || "autre",
        tags: tache.tags?.join(", ") || "", notes: tache.notes || "",
      });
      setArgs(tache.arguments?.map((a) => ({ ...a })) || []);
      if (tache.imagePath) setImagePreview(getTacheCronImageUrl(tache._id));
    }
  }, [tache]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // === Gestion des arguments ===
  const addArg = () => {
    setArgs((prev) => [...prev, { valeur: "", nom: "", description: "", actifParDefaut: false, ordre: prev.length }]);
  };

  const updateArg = (index, field, value) => {
    setArgs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeArg = (index) => {
    setArgs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.titre.trim()) return alert("Le titre est requis");
    if (!formData.description.trim()) return alert("La description est requise");
    if (!formData.commande.trim()) return alert("La commande est requise");

    // Valider les arguments
    for (const arg of args) {
      if (!arg.valeur.trim() || !arg.nom.trim()) {
        return alert("Chaque argument doit avoir un nom et une valeur (flag)");
      }
    }

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, key === "timeoutSecondes" ? parseInt(value) || 300 : value);
    });
    fd.append("arguments", JSON.stringify(args));
    if (imageFile) fd.append("image", imageFile);

    try {
      if (isEditing) {
        await updateTache({ id: tache._id, formData: fd }).unwrap();
      } else {
        await createTache(fd).unwrap();
      }
      onClose();
    } catch (err) {
      alert(err?.data?.message || "Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content large">
        <div className="modal-header">
          <h2><HiTerminal /> {isEditing ? "Modifier la tâche" : "Nouvelle tâche cron"}</h2>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>

        <div className="modal-body">
          {/* Image */}
          <div className="form-group">
            <label><HiPhotograph style={{ marginRight: 4 }} /> Image d'illustration</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {imagePreview && (
                <div style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                  <img src={imagePreview} alt="Aperçu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: 12 }} />
                {imagePreview && <button type="button" className="btn-secondary" onClick={handleRemoveImage} style={{ padding: "4px 8px", fontSize: 11 }}><HiTrash /> Retirer</button>}
              </div>
            </div>
          </div>

          {/* Titre + Catégorie */}
          <div className="form-row">
            <div className="form-group">
              <label>Titre <span className="required">*</span></label>
              <input type="text" name="titre" value={formData.titre} onChange={handleChange} placeholder="Ex: Sauvegarde quotidienne BDD" />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select name="categorie" value={formData.categorie} onChange={handleChange}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description <span className="required">*</span></label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description détaillée..." rows={3} />
          </div>

          <div className="form-group">
            <label>Description courte</label>
            <input type="text" name="descriptionCourte" value={formData.descriptionCourte} onChange={handleChange} placeholder="Résumé (max 200 car.)" maxLength={200} />
          </div>

          {/* Commande */}
          <div className="form-group">
            <label><HiCode style={{ marginRight: 4 }} /> Commande <span className="required">*</span></label>
            <input type="text" name="commande" value={formData.commande} onChange={handleChange} placeholder="Ex: /opt/scripts/backup_db.sh" className="mono" />
            <span className="form-hint">Chemin absolu vers le script (sans arguments)</span>
          </div>

          {/* Arguments dynamiques */}
          <div className="form-group">
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><HiTag style={{ marginRight: 4 }} /> Arguments configurables</span>
              <button type="button" className="btn-secondary" onClick={addArg} style={{ padding: "3px 8px", fontSize: 11 }}><HiPlus /> Ajouter</button>
            </label>
            {args.length === 0 && <span className="form-hint">Aucun argument. Cliquez sur "Ajouter" pour en créer.</span>}
            {args.map((arg, i) => (
              <div key={i} className="arg-row">
                <div className="arg-fields">
                  <input type="text" value={arg.nom} onChange={(e) => updateArg(i, "nom", e.target.value)} placeholder="Nom (ex: Mode complet)" className="arg-input" />
                  <input type="text" value={arg.valeur} onChange={(e) => updateArg(i, "valeur", e.target.value)} placeholder="Flag (ex: --full)" className="arg-input mono" />
                  <input type="text" value={arg.description} onChange={(e) => updateArg(i, "description", e.target.value)} placeholder="Description courte..." className="arg-input arg-desc" />
                  <label className="arg-default-toggle" title="Actif par défaut">
                    <input type="checkbox" checked={arg.actifParDefaut} onChange={(e) => updateArg(i, "actifParDefaut", e.target.checked)} />
                    <span>Défaut</span>
                  </label>
                  <button type="button" className="btn-action btn-delete" onClick={() => removeArg(i)} title="Supprimer" style={{ flexShrink: 0 }}><HiTrash /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Répertoire de travail</label>
              <input type="text" name="repertoireTravail" value={formData.repertoireTravail} onChange={handleChange} placeholder="/opt/scripts" className="mono" />
            </div>
            <div className="form-group">
              <label><HiFolder style={{ marginRight: 4 }} /> Dossier de sortie</label>
              <input type="text" name="dossierSortie" value={formData.dossierSortie} onChange={handleChange} placeholder="/opt/scripts/output" className="mono" />
              <span className="form-hint">Scanné après chaque exécution</span>
            </div>
          </div>

          <div className="form-group">
            <label>Variables d'environnement</label>
            <textarea name="variablesEnvironnement" value={formData.variablesEnvironnement} onChange={handleChange} placeholder={"DB_HOST=localhost\nDB_NAME=production"} className="mono" rows={3} />
            <span className="form-hint">Une variable par ligne : CLE=valeur</span>
          </div>

          {/* Planification */}
          <div className="form-row">
            <div className="form-group">
              <label><HiClock style={{ marginRight: 4 }} /> Expression cron</label>
              <input type="text" name="expressionCron" value={formData.expressionCron} onChange={handleChange} placeholder="0 2 * * *" className="mono" />
              <span className="form-hint">min heure jour mois jour_semaine</span>
            </div>
            <div className="form-group">
              <label>Fréquence (description)</label>
              <input type="text" name="frequenceDescription" value={formData.frequenceDescription} onChange={handleChange} placeholder="Tous les jours à 2h" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Timeout (secondes)</label>
              <input type="number" name="timeoutSecondes" value={formData.timeoutSecondes} onChange={handleChange} min={0} />
              <span className="form-hint">0 = pas de timeout</span>
            </div>
            <div className="form-group">
              <label>Tags</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="backup, database, prod" />
              <span className="form-hint">Séparés par des virgules</span>
            </div>
          </div>

          <div className="form-group">
            <label>Notes techniques</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Prérequis, dépendances..." rows={2} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={isLoading}>
            <HiSave /> <span>{isLoading ? "..." : isEditing ? "Modifier" : "Créer"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TacheCronModal;