import React, { useState } from "react";
import { HiX, HiPlay, HiTerminal, HiLightningBolt } from "react-icons/hi";
import { useExecuterTacheCronMutation } from "../../slices/tacheCronApiSlice";

const TacheCronExecuterModal = ({ tache, onClose, onLaunched }) => {
  // Initialiser avec les arguments actifs par défaut
  const [selectedArgs, setSelectedArgs] = useState(() => {
    return (tache.arguments || [])
      .filter((a) => a.actifParDefaut)
      .map((a) => a._id);
  });

  const [executerTache, { isLoading }] = useExecuterTacheCronMutation();

  const toggleArg = (argId) => {
    setSelectedArgs((prev) =>
      prev.includes(argId) ? prev.filter((id) => id !== argId) : [...prev, argId],
    );
  };

  const buildCommandPreview = () => {
    const argsStr = (tache.arguments || [])
      .filter((a) => selectedArgs.includes(a._id))
      .sort((a, b) => a.ordre - b.ordre)
      .map((a) => a.valeur)
      .join(" ");
    return argsStr ? `${tache.commande} ${argsStr}` : tache.commande;
  };

  const handleExecuter = async () => {
    try {
      await executerTache({ id: tache._id, argumentsActives: selectedArgs }).unwrap();
      onLaunched?.();
      onClose();
    } catch (err) {
      alert(err?.data?.message || "Erreur lors du lancement");
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2><HiPlay /> Lancer — {tache.titre}</h2>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>

        <div className="modal-body">
          {/* Sélection des arguments */}
          {tache.arguments?.length > 0 ? (
            <div className="form-group">
              <label><HiLightningBolt style={{ marginRight: 4 }} /> Sélectionnez les arguments à activer</label>
              <div className="args-selector">
                {tache.arguments
                  .sort((a, b) => a.ordre - b.ordre)
                  .map((arg) => {
                    const isSelected = selectedArgs.includes(arg._id);
                    return (
                      <div
                        key={arg._id}
                        className={`arg-chip ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleArg(arg._id)}
                      >
                        <div className="arg-chip-header">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleArg(arg._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="arg-chip-nom">{arg.nom}</span>
                          <code className="arg-chip-valeur">{arg.valeur}</code>
                        </div>
                        {arg.description && (
                          <p className="arg-chip-desc">{arg.description}</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Cette tâche n'a pas d'arguments configurables. Elle sera lancée telle quelle.
            </p>
          )}

          {/* Aperçu de la commande */}
          <div className="form-group">
            <label><HiTerminal style={{ marginRight: 4 }} /> Commande qui sera exécutée</label>
            <div className="tache-commande" style={{ background: "#0d1117", color: "#c9d1d9", padding: 12 }}>
              <code style={{ fontSize: 12 }}>{buildCommandPreview()}</code>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleExecuter} disabled={isLoading} style={{ background: "var(--accent)" }}>
            <HiPlay /> <span>{isLoading ? "Lancement..." : "Exécuter maintenant"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TacheCronExecuterModal;