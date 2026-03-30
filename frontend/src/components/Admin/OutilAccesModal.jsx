// src/components/Admin/OutilAccesModal.jsx
import React, { useState, useEffect } from "react";
import {
  HiX,
  HiUsers,
  HiOfficeBuilding,
  HiCheck,
  HiSearch,
  HiUserAdd,
  HiUserRemove,
  HiGlobe,
} from "react-icons/hi";
import {
  useUpdateAccesOutilMutation,
  useGetUsersForSelectionQuery,
} from "../../slices/outilApiSlice";
import { useGetEntreprisesQuery } from "../../slices/entrepriseApiSlice";
import "./OutilAccesModal.css";

const OutilAccesModal = ({ outil, onClose }) => {
  const [accesPublic, setAccesPublic] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedEntreprises, setSelectedEntreprises] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchEntreprise, setSearchEntreprise] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const { data: users, isLoading: loadingUsers } =
    useGetUsersForSelectionQuery();
  const { data: entreprises, isLoading: loadingEntreprises } =
    useGetEntreprisesQuery();
  const [updateAcces, { isLoading: isUpdating }] =
    useUpdateAccesOutilMutation();

  useEffect(() => {
    if (outil) {
      setAccesPublic(outil.accesPublic || false);
      setSelectedUsers(
        outil.utilisateursAutorises?.map((u) => u._id || u) || [],
      );
      setSelectedEntreprises(
        outil.entreprisesAutorisees?.map((e) => e._id || e) || [],
      );
    }
  }, [outil]);

  const filteredUsers = users?.filter((user) => {
    const search = searchUser.toLowerCase();
    return (
      user.nom?.toLowerCase().includes(search) ||
      user.prenom?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const filteredEntreprises = entreprises?.filter((ent) => {
    const search = searchEntreprise.toLowerCase();
    return (
      ent.nomComplet?.toLowerCase().includes(search) ||
      ent.trigramme?.toLowerCase().includes(search)
    );
  });

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleEntreprise = (entId) => {
    setSelectedEntreprises((prev) =>
      prev.includes(entId)
        ? prev.filter((id) => id !== entId)
        : [...prev, entId],
    );
  };

  const handleSelectAllUsers = () => {
    const allUserIds = filteredUsers?.map((u) => u._id) || [];
    setSelectedUsers(allUserIds);
  };

  const handleDeselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const handleSelectAllEntreprises = () => {
    const allEntIds = filteredEntreprises?.map((e) => e._id) || [];
    setSelectedEntreprises(allEntIds);
  };

  const handleDeselectAllEntreprises = () => {
    setSelectedEntreprises([]);
  };

  const handleSubmit = async () => {
    try {
      await updateAcces({
        id: outil._id,
        accesPublic,
        utilisateursAutorises: selectedUsers,
        entreprisesAutorisees: selectedEntreprises,
      }).unwrap();
      onClose();
    } catch (err) {
      alert(err?.data?.message || "Erreur lors de la mise à jour des accès");
    }
  };

  const getUserInfo = (userId) => {
    return users?.find((u) => u._id === userId);
  };

  const getEntrepriseInfo = (entId) => {
    return entreprises?.find((e) => e._id === entId);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content acces-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <HiUsers /> Gérer les accès - {outil.titre}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Option accès public */}
          <div className="acces-public-section">
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={accesPublic}
                onChange={(e) => setAccesPublic(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">
                <HiGlobe />
                Accès public (tous les utilisateurs actifs)
              </span>
            </label>
            {accesPublic && (
              <p className="info-text">
                Tous les utilisateurs actifs pourront télécharger cet outil.
              </p>
            )}
          </div>

          {!accesPublic && (
            <>
              {/* Tabs */}
              <div className="acces-tabs">
                <button
                  className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                  onClick={() => setActiveTab("users")}
                >
                  <HiUsers />
                  Utilisateurs ({selectedUsers.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === "entreprises" ? "active" : ""}`}
                  onClick={() => setActiveTab("entreprises")}
                >
                  <HiOfficeBuilding />
                  Entreprises ({selectedEntreprises.length})
                </button>
              </div>

              {/* Tab content - Users */}
              {activeTab === "users" && (
                <div className="tab-content">
                  <div className="list-header">
                    <div className="search-box">
                      <HiSearch />
                      <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                      />
                    </div>
                    <div className="list-actions">
                      <button
                        className="btn-small"
                        onClick={handleSelectAllUsers}
                      >
                        <HiUserAdd /> Tout sélectionner
                      </button>
                      <button
                        className="btn-small"
                        onClick={handleDeselectAllUsers}
                      >
                        <HiUserRemove /> Tout désélectionner
                      </button>
                    </div>
                  </div>

                  {/* Selected users */}
                  {selectedUsers.length > 0 && (
                    <div className="selected-items">
                      <span className="selected-label">Sélectionnés:</span>
                      <div className="selected-chips">
                        {selectedUsers.slice(0, 5).map((userId) => {
                          const user = getUserInfo(userId);
                          return (
                            <span key={userId} className="chip">
                              {user ? `${user.prenom} ${user.nom}` : userId}
                              <button onClick={() => toggleUser(userId)}>
                                <HiX />
                              </button>
                            </span>
                          );
                        })}
                        {selectedUsers.length > 5 && (
                          <span className="chip more">
                            +{selectedUsers.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Users list */}
                  <div className="items-list">
                    {loadingUsers ? (
                      <div className="loading">Chargement...</div>
                    ) : filteredUsers?.length === 0 ? (
                      <div className="no-items">Aucun utilisateur trouvé</div>
                    ) : (
                      filteredUsers?.map((user) => (
                        <div
                          key={user._id}
                          className={`item-row ${selectedUsers.includes(user._id) ? "selected" : ""}`}
                          onClick={() => toggleUser(user._id)}
                        >
                          <div className="item-checkbox">
                            {selectedUsers.includes(user._id) && <HiCheck />}
                          </div>
                          <div className="item-avatar">
                            {user.prenom?.charAt(0)}
                            {user.nom?.charAt(0)}
                          </div>
                          <div className="item-info">
                            <span className="item-name">
                              {user.prenom} {user.nom}
                            </span>
                            <span className="item-detail">{user.email}</span>
                          </div>
                          <span
                            className={`item-badge ${user.role === "admin" ? "admin" : "user"}`}
                          >
                            {user.role}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab content - Entreprises */}
              {activeTab === "entreprises" && (
                <div className="tab-content">
                  <div className="list-header">
                    <div className="search-box">
                      <HiSearch />
                      <input
                        type="text"
                        placeholder="Rechercher une entreprise..."
                        value={searchEntreprise}
                        onChange={(e) => setSearchEntreprise(e.target.value)}
                      />
                    </div>
                    <div className="list-actions">
                      <button
                        className="btn-small"
                        onClick={handleSelectAllEntreprises}
                      >
                        <HiUserAdd /> Tout sélectionner
                      </button>
                      <button
                        className="btn-small"
                        onClick={handleDeselectAllEntreprises}
                      >
                        <HiUserRemove /> Tout désélectionner
                      </button>
                    </div>
                  </div>

                  {/* Selected entreprises */}
                  {selectedEntreprises.length > 0 && (
                    <div className="selected-items">
                      <span className="selected-label">Sélectionnées:</span>
                      <div className="selected-chips">
                        {selectedEntreprises.slice(0, 5).map((entId) => {
                          const ent = getEntrepriseInfo(entId);
                          return (
                            <span key={entId} className="chip">
                              {ent ? ent.trigramme : entId}
                              <button onClick={() => toggleEntreprise(entId)}>
                                <HiX />
                              </button>
                            </span>
                          );
                        })}
                        {selectedEntreprises.length > 5 && (
                          <span className="chip more">
                            +{selectedEntreprises.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Entreprises list */}
                  <div className="items-list">
                    {loadingEntreprises ? (
                      <div className="loading">Chargement...</div>
                    ) : filteredEntreprises?.length === 0 ? (
                      <div className="no-items">Aucune entreprise trouvée</div>
                    ) : (
                      filteredEntreprises?.map((ent) => (
                        <div
                          key={ent._id}
                          className={`item-row ${selectedEntreprises.includes(ent._id) ? "selected" : ""}`}
                          onClick={() => toggleEntreprise(ent._id)}
                        >
                          <div className="item-checkbox">
                            {selectedEntreprises.includes(ent._id) && (
                              <HiCheck />
                            )}
                          </div>
                          <div className="item-avatar entreprise">
                            {ent.trigramme}
                          </div>
                          <div className="item-info">
                            <span className="item-name">{ent.nomComplet}</span>
                            <span className="item-detail">
                              {ent.nomDossierDBF}
                            </span>
                          </div>
                          <span
                            className={`item-badge ${ent.isActive ? "active" : "inactive"}`}
                          >
                            {ent.isActive ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <p className="info-text">
                Les utilisateurs des entreprises sélectionnées auront également
                accès à cet outil.
              </p>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={isUpdating}
          >
            {isUpdating ? "Enregistrement..." : "Enregistrer les accès"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutilAccesModal;
