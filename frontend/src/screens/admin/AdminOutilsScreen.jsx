// src/screens/admin/AdminOutilsScreen.jsx
import React, { useState } from "react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiSearch,
  HiCheck,
  HiX,
  HiRefresh,
  HiDownload,
  HiDocumentText,
  HiPhotograph,
  HiFolder,
  HiChip,
  HiCube,
  HiEye,
  HiUsers,
  HiChartBar,
} from "react-icons/hi";
import {
  useGetOutilsQuery,
  useDeleteOutilMutation,
  useToggleOutilActiveMutation,
  useGetCategoriesQuery,
} from "../../slices/outilApiSlice";
import OutilModal from "../../components/Admin/OutilModal";
import OutilAccesModal from "../../components/Admin/OutilAccesModal";
import OutilDocumentationModal from "../../components/Admin/OutilDocumentationModal";
import "./AdminOutilsScreen.css";

const CATEGORIE_ICONS = {
  gestion_stock: HiCube,
  comptabilite: HiDocumentText,
  caisse: HiChip,
  utilitaire: HiFolder,
  reporting: HiChartBar,
  import_export: HiDownload,
  maintenance: HiRefresh,
  autre: HiFolder,
};

const AdminOutilsScreen = () => {
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [accesModalOpen, setAccesModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedOutil, setSelectedOutil] = useState(null);

  const {
    data: outilsData,
    isLoading,
    error,
    refetch,
  } = useGetOutilsQuery({
    categorie: filterCategorie,
    search: search || undefined,
    includeInactive: includeInactive ? "true" : undefined,
    limit: 100,
  });

  const { data: categories } = useGetCategoriesQuery();

  const [deleteOutil, { isLoading: isDeleting }] = useDeleteOutilMutation();
  const [toggleActive, { isLoading: isToggling }] =
    useToggleOutilActiveMutation();

  const outils = outilsData?.outils || [];

  // Filtrer côté client pour la recherche instantanée
  const filteredOutils = outils.filter((outil) => {
    const searchLower = search.toLowerCase();
    return (
      outil.titre?.toLowerCase().includes(searchLower) ||
      outil.description?.toLowerCase().includes(searchLower) ||
      outil.tags?.some((tag) => tag.includes(searchLower))
    );
  });

  const handleCreate = () => {
    setSelectedOutil(null);
    setModalOpen(true);
  };

  const handleEdit = (outil) => {
    setSelectedOutil(outil);
    setModalOpen(true);
  };

  const handleManageAcces = (outil) => {
    setSelectedOutil(outil);
    setAccesModalOpen(true);
  };

  const handleManageDoc = (outil) => {
    setSelectedOutil(outil);
    setDocModalOpen(true);
  };

  const handleDelete = async (outil) => {
    if (
      window.confirm(
        `Supprimer l'outil "${outil.titre}" ?\n\nCette action supprimera également tous les fichiers associés.`,
      )
    ) {
      try {
        await deleteOutil(outil._id).unwrap();
      } catch (err) {
        alert(err?.data?.message || "Erreur lors de la suppression");
      }
    }
  };

  const handleToggleActive = async (outil) => {
    try {
      await toggleActive(outil._id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Erreur lors de la modification");
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOutil(null);
  };

  const handleCloseAccesModal = () => {
    setAccesModalOpen(false);
    setSelectedOutil(null);
  };

  const handleCloseDocModal = () => {
    setDocModalOpen(false);
    setSelectedOutil(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Statistiques
  const stats = {
    total: outils.length,
    actifs: outils.filter((o) => o.isActive).length,
    totalTelechargements: outils.reduce(
      (sum, o) => sum + (o.nombreTelechargements || 0),
      0,
    ),
    avecDoc: outils.filter((o) => o.documentation?.length > 0).length,
  };

  if (isLoading) {
    return <div className="admin-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="admin-error">Erreur: {error?.data?.message}</div>;
  }

  return (
    <div className="admin-outils">
      <div className="admin-outils-header">
        <h1>
          <HiCube /> Gestion des Outils
        </h1>
        <div className="admin-outils-actions">
          <div className="search-box">
            <HiSearch />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
          >
            <option value="">Toutes catégories</option>
            {categories?.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label} ({cat.count})
              </option>
            ))}
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span>Inactifs</span>
          </label>
          <button className="btn-icon" onClick={refetch} title="Rafraîchir">
            <HiRefresh />
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            <HiPlus />
            <span>Nouvel outil</span>
          </button>
        </div>
      </div>

      <div className="admin-outils-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.actifs}</span>
          <span className="stat-label">Actifs</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalTelechargements}</span>
          <span className="stat-label">Téléchargements</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.avecDoc}</span>
          <span className="stat-label">Avec Doc</span>
        </div>
      </div>

      <div className="admin-outils-grid">
        {filteredOutils.length === 0 ? (
          <div className="no-data">
            <HiCube />
            <p>Aucun outil trouvé</p>
          </div>
        ) : (
          filteredOutils.map((outil) => {
            const CategorieIcon = CATEGORIE_ICONS[outil.categorie] || HiFolder;
            return (
              <div
                key={outil._id}
                className={`outil-card ${!outil.isActive ? "inactive" : ""}`}
              >
                <div className="outil-card-header">
                  <div className="outil-icon">
                    {outil.imagePath ? (
                      <img
                        src={`/api/outils/${outil._id}/image`}
                        alt={outil.titre}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="outil-icon-fallback"
                      style={{ display: outil.imagePath ? "none" : "flex" }}
                    >
                      <CategorieIcon />
                    </div>
                  </div>
                  <div className="outil-header-info">
                    <span
                      className={`status-badge ${outil.isActive ? "active" : "inactive"}`}
                    >
                      {outil.isActive ? "Actif" : "Inactif"}
                    </span>
                    {outil.accesPublic && (
                      <span className="access-badge public">Public</span>
                    )}
                  </div>
                </div>

                <div className="outil-card-body">
                  <h3 className="outil-titre">{outil.titre}</h3>
                  <span className="outil-version">v{outil.version}</span>

                  <p className="outil-description">
                    {outil.descriptionCourte ||
                      outil.description?.slice(0, 100)}
                    {outil.description?.length > 100 && "..."}
                  </p>

                  <div className="outil-meta">
                    <span className="meta-item">
                      <CategorieIcon />
                      {categories?.find((c) => c.value === outil.categorie)
                        ?.label || outil.categorie}
                    </span>
                    <span className="meta-item">
                      <HiDownload />
                      {outil.nombreTelechargements || 0}
                    </span>
                    <span className="meta-item">
                      <HiDocumentText />
                      {outil.documentation?.length || 0} docs
                    </span>
                  </div>

                  <div className="outil-file-info">
                    <span className="file-name">{outil.executableNom}</span>
                    <span className="file-size">
                      {formatFileSize(outil.executableTaille)}
                    </span>
                  </div>

                  {outil.tags?.length > 0 && (
                    <div className="outil-tags">
                      {outil.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag">
                          {tag}
                        </span>
                      ))}
                      {outil.tags.length > 3 && (
                        <span className="tag more">
                          +{outil.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="outil-access-info">
                    <HiUsers />
                    <span>
                      {outil.accesPublic
                        ? "Tous les utilisateurs"
                        : outil.utilisateursAutorises?.length > 0
                          ? `${outil.utilisateursAutorises.length} utilisateur(s)`
                          : "Admins uniquement"}
                    </span>
                  </div>
                </div>

                <div className="outil-card-footer">
                  <div className="card-actions">
                    <button
                      className="btn-action btn-view"
                      onClick={() => handleManageDoc(outil)}
                      title="Documentation"
                    >
                      <HiDocumentText />
                    </button>
                    <button
                      className="btn-action btn-users"
                      onClick={() => handleManageAcces(outil)}
                      title="Gérer les accès"
                    >
                      <HiUsers />
                    </button>
                    <button
                      className="btn-action btn-toggle"
                      onClick={() => handleToggleActive(outil)}
                      disabled={isToggling}
                      title={outil.isActive ? "Désactiver" : "Activer"}
                    >
                      {outil.isActive ? <HiX /> : <HiCheck />}
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(outil)}
                      title="Modifier"
                    >
                      <HiPencil />
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(outil)}
                      disabled={isDeleting}
                      title="Supprimer"
                    >
                      <HiTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <OutilModal outil={selectedOutil} onClose={handleCloseModal} />
      )}

      {accesModalOpen && selectedOutil && (
        <OutilAccesModal
          outil={selectedOutil}
          onClose={handleCloseAccesModal}
        />
      )}

      {docModalOpen && selectedOutil && (
        <OutilDocumentationModal
          outil={selectedOutil}
          onClose={handleCloseDocModal}
        />
      )}
    </div>
  );
};

export default AdminOutilsScreen;
