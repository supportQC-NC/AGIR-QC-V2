// src/pages/Profile/ProfileScreen.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  HiUser,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiRefresh,
  HiClipboardCopy,
  HiCheckCircle,
  HiExclamationCircle,
  HiShieldCheck,
  HiArrowLeft,
  HiMail,
  HiPhone,
  HiOfficeBuilding,
  HiCheck,
  HiX,
} from "react-icons/hi";
import { useUpdateProfileMutation } from "../../slices/userApiSlice";
import { setCredentials } from "../../slices/authSlice";
import { useNavigate } from "react-router-dom";
import "./ProfileScreen.css";

// ─── Password strength calculator ──────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "", percent: 0 };

  let score = 0;
  const checks = {
    length8: password.length >= 8,
    length12: password.length >= 12,
    length16: password.length >= 16,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
    noRepeat: !/(.)\1{2,}/.test(password),
  };

  if (checks.length8) score += 1;
  if (checks.length12) score += 1;
  if (checks.length16) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.numbers) score += 1;
  if (checks.symbols) score += 1;
  if (checks.noRepeat) score += 1;

  const levels = [
    { min: 0, max: 2, label: "Très faible", color: "#ef4444", percent: 15 },
    { min: 3, max: 3, label: "Faible", color: "#f97316", percent: 30 },
    { min: 4, max: 5, label: "Moyen", color: "#eab308", percent: 55 },
    { min: 6, max: 6, label: "Fort", color: "#22c55e", percent: 75 },
    { min: 7, max: 8, label: "Très fort", color: "#10b981", percent: 100 },
  ];

  const level = levels.find((l) => score >= l.min && score <= l.max) || levels[0];

  return { score, ...level, checks };
};

// ─── Password generator ────────────────────────────────────────
const generatePassword = (length = 16, options = {}) => {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let chars = "";
  let required = [];

  if (lowercase) {
    chars += "abcdefghijkmnopqrstuvwxyz";
    required.push("abcdefghijkmnopqrstuvwxyz");
  }
  if (uppercase) {
    chars += "ABCDEFGHJKLMNPQRSTUVWXYZ";
    required.push("ABCDEFGHJKLMNPQRSTUVWXYZ");
  }
  if (numbers) {
    chars += "23456789";
    required.push("23456789");
  }
  if (symbols) {
    chars += "!@#$%&*?+-=";
    required.push("!@#$%&*?+-=");
  }

  if (!chars) chars = "abcdefghijkmnopqrstuvwxyz";

  let password = "";

  required.forEach((set) => {
    password += set[Math.floor(Math.random() * set.length)];
  });

  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

// ─── Component ─────────────────────────────────────────────────
const ProfileScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Notification intégrée (pas de toastify)
  const [notification, setNotification] = useState(null);

  // Infos profil
  const [nom, setNom] = useState(userInfo?.nom || "");
  const [prenom, setPrenom] = useState(userInfo?.prenom || "");
  const [email, setEmail] = useState(userInfo?.email || "");
  const [telephone, setTelephone] = useState(userInfo?.telephone || "");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Generator
  const [genLength, setGenLength] = useState(16);
  const [genUppercase, setGenUppercase] = useState(true);
  const [genLowercase, setGenLowercase] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("infos");

  // API
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  // ─── Notification helper ───────────────
  const showNotif = (type, message) => {
    setNotification({ type, message });
  };

  // Auto-dismiss après 4s
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // ─── Handlers ──────────────────────────
  const handleUpdateInfos = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({ nom, prenom, email, telephone }).unwrap();
      dispatch(setCredentials(res));
      showNotif("success", "Profil mis à jour avec succès");
    } catch (err) {
      showNotif("error", err?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotif("error", "Les mots de passe ne correspondent pas");
      return;
    }
    if (strength.score < 4) {
      showNotif("error", "Le mot de passe est trop faible");
      return;
    }
    try {
      const res = await updateProfile({
        currentPassword,
        password: newPassword,
      }).unwrap();
      dispatch(setCredentials(res));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showNotif("success", "Mot de passe modifié avec succès");
    } catch (err) {
      showNotif(
        "error",
        err?.data?.message || "Erreur lors du changement de mot de passe"
      );
    }
  };

  const handleGenerate = () => {
    const pwd = generatePassword(genLength, {
      uppercase: genUppercase,
      lowercase: genLowercase,
      numbers: genNumbers,
      symbols: genSymbols,
    });
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setCopied(false);
  };

  const handleCopyPassword = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      showNotif("success", "Mot de passe copié !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="profile-screen">
      {/* ─── Inline Notification ─── */}
      {notification && (
        <div className={`ps-notif ps-notif-${notification.type}`}>
          {notification.type === "success" ? (
            <HiCheckCircle className="ps-notif-icon" />
          ) : (
            <HiExclamationCircle className="ps-notif-icon" />
          )}
          <span>{notification.message}</span>
          <button
            className="ps-notif-close"
            onClick={() => setNotification(null)}
          >
            <HiX />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="ps-header">
        <button className="ps-back" onClick={() => navigate(-1)}>
          <HiArrowLeft />
        </button>
        <div className="ps-header-text">
          <h1 className="ps-title">Mon Profil</h1>
          <p className="ps-subtitle">
            Gérez vos informations et votre sécurité
          </p>
        </div>
      </div>

      {/* Avatar card */}
      <div className="ps-avatar-card">
        <div className="ps-avatar">
          <span>
            {(userInfo?.prenom?.[0] || "U").toUpperCase()}
            {(userInfo?.nom?.[0] || "").toUpperCase()}
          </span>
        </div>
        <div className="ps-avatar-info">
          <h2>
            {userInfo?.prenom} {userInfo?.nom}
          </h2>
          <span className="ps-role-badge">
            {userInfo?.role === "admin" ? "Administrateur" : "Utilisateur"}
          </span>
          {userInfo?.entreprise?.nom && (
            <span className="ps-entreprise">
              <HiOfficeBuilding /> {userInfo.entreprise.nom}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="ps-tabs">
        <button
          className={`ps-tab ${activeTab === "infos" ? "active" : ""}`}
          onClick={() => setActiveTab("infos")}
        >
          <HiUser />
          <span>Informations</span>
        </button>
        <button
          className={`ps-tab ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          <HiLockClosed />
          <span>Mot de passe</span>
        </button>
      </div>

      {/* ─── TAB: Infos ─── */}
      {activeTab === "infos" && (
        <form className="ps-form" onSubmit={handleUpdateInfos}>
          <div className="ps-form-group">
            <label className="ps-label">
              <HiUser className="ps-label-icon" />
              Prénom
            </label>
            <input
              type="text"
              className="ps-input"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Votre prénom"
            />
          </div>

          <div className="ps-form-group">
            <label className="ps-label">
              <HiUser className="ps-label-icon" />
              Nom
            </label>
            <input
              type="text"
              className="ps-input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
            />
          </div>

          <div className="ps-form-group">
            <label className="ps-label">
              <HiMail className="ps-label-icon" />
              Email
            </label>
            <input
              type="email"
              className="ps-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>



          <button
            type="submit"
            className="ps-btn ps-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="ps-spinner" />
            ) : (
              <>
                <HiCheck /> Enregistrer
              </>
            )}
          </button>
        </form>
      )}

      {/* ─── TAB: Password ─── */}
      {activeTab === "password" && (
        <form className="ps-form" onSubmit={handleUpdatePassword}>
          {/* Current password */}
          <div className="ps-form-group">
            <label className="ps-label">
              <HiLockClosed className="ps-label-icon" />
              Mot de passe actuel
            </label>
            <div className="ps-input-wrap">
              <input
                type={showCurrent ? "text" : "password"}
                className="ps-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="ps-eye"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="ps-form-group">
            <div className="ps-label-row">
              <label className="ps-label">
                <HiLockClosed className="ps-label-icon" />
                Nouveau mot de passe
              </label>
              <button
                type="button"
                className="ps-gen-toggle"
                onClick={() => setShowGenerator(!showGenerator)}
              >
                <HiRefresh />
                Générateur
              </button>
            </div>
            <div className="ps-input-wrap">
              <input
                type={showNew ? "text" : "password"}
                className="ps-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="ps-eye"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>

            {/* Strength bar */}
            {newPassword && (
              <div className="ps-strength">
                <div className="ps-strength-bar">
                  <div
                    className="ps-strength-fill"
                    style={{
                      width: `${strength.percent}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <div className="ps-strength-info">
                  <span
                    className="ps-strength-label"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                  <span className="ps-strength-score">{strength.score}/8</span>
                </div>

                {strength.checks && (
                  <div className="ps-checks">
                    <div
                      className={`ps-check ${
                        strength.checks.length8 ? "ok" : ""
                      }`}
                    >
                      <span className="ps-check-dot" />8 caractères min.
                    </div>
                    <div
                      className={`ps-check ${
                        strength.checks.lowercase ? "ok" : ""
                      }`}
                    >
                      <span className="ps-check-dot" />
                      Minuscule
                    </div>
                    <div
                      className={`ps-check ${
                        strength.checks.uppercase ? "ok" : ""
                      }`}
                    >
                      <span className="ps-check-dot" />
                      Majuscule
                    </div>
                    <div
                      className={`ps-check ${
                        strength.checks.numbers ? "ok" : ""
                      }`}
                    >
                      <span className="ps-check-dot" />
                      Chiffre
                    </div>
                    <div
                      className={`ps-check ${
                        strength.checks.symbols ? "ok" : ""
                      }`}
                    >
                      <span className="ps-check-dot" />
                      Symbole
                    </div>
                    <div
                      className={`ps-check ${
                        strength.checks.noRepeat ? "ok" : ""
                      }`}
                    >
                      <span className="ps-check-dot" />
                      Pas de répétition
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generator panel */}
            {showGenerator && (
              <div className="ps-generator">
                <div className="ps-gen-header">
                  <HiShieldCheck />
                  <span>Générateur de mot de passe</span>
                </div>

                <div className="ps-gen-length">
                  <label>
                    Longueur : <strong>{genLength}</strong>
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={genLength}
                    onChange={(e) => setGenLength(Number(e.target.value))}
                    className="ps-range"
                  />
                  <div className="ps-range-labels">
                    <span>8</span>
                    <span>32</span>
                  </div>
                </div>

                <div className="ps-gen-options">
                  <label className="ps-gen-opt">
                    <input
                      type="checkbox"
                      checked={genUppercase}
                      onChange={() => setGenUppercase(!genUppercase)}
                    />
                    <span>Majuscules</span>
                  </label>
                  <label className="ps-gen-opt">
                    <input
                      type="checkbox"
                      checked={genLowercase}
                      onChange={() => setGenLowercase(!genLowercase)}
                    />
                    <span>Minuscules</span>
                  </label>
                  <label className="ps-gen-opt">
                    <input
                      type="checkbox"
                      checked={genNumbers}
                      onChange={() => setGenNumbers(!genNumbers)}
                    />
                    <span>Chiffres</span>
                  </label>
                  <label className="ps-gen-opt">
                    <input
                      type="checkbox"
                      checked={genSymbols}
                      onChange={() => setGenSymbols(!genSymbols)}
                    />
                    <span>Symboles</span>
                  </label>
                </div>

                <div className="ps-gen-actions">
                  <button
                    type="button"
                    className="ps-btn ps-btn-generate"
                    onClick={handleGenerate}
                  >
                    <HiRefresh /> Générer
                  </button>
                  {newPassword && (
                    <button
                      type="button"
                      className="ps-btn ps-btn-copy"
                      onClick={handleCopyPassword}
                    >
                      {copied ? <HiCheckCircle /> : <HiClipboardCopy />}
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="ps-form-group">
            <label className="ps-label">
              <HiLockClosed className="ps-label-icon" />
              Confirmer le mot de passe
            </label>
            <div className="ps-input-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                className={`ps-input ${
                  passwordsMatch ? "ps-input-success" : ""
                } ${passwordsMismatch ? "ps-input-error" : ""}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="ps-eye"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
            {passwordsMatch && (
              <span className="ps-match-msg ps-match-ok">
                <HiCheckCircle /> Les mots de passe correspondent
              </span>
            )}
            {passwordsMismatch && (
              <span className="ps-match-msg ps-match-err">
                <HiExclamationCircle /> Les mots de passe ne correspondent pas
              </span>
            )}
          </div>

          <button
            type="submit"
            className="ps-btn ps-btn-primary"
            disabled={isLoading || !passwordsMatch || strength.score < 4}
          >
            {isLoading ? (
              <span className="ps-spinner" />
            ) : (
              <>
                <HiShieldCheck /> Changer le mot de passe
              </>
            )}
          </button>
        </form>
      )}

      {/* Security notice */}
      <div className="ps-notice">
        <HiLockClosed className="ps-notice-icon" />
        <p>
          <strong>Sécurité :</strong> Utilisez un mot de passe unique que vous
          n'utilisez sur aucun autre site. Ne partagez jamais vos identifiants.
        </p>
      </div>
    </div>
  );
};

export default ProfileScreen;