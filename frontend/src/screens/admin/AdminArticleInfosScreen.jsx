// // export default AdminArticleInfosScreen;
// // import default React and hooks
// import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";

// // Icons
// import {
//   HiArrowLeft,
//   HiChevronLeft,
//   HiChevronRight,
//   HiCube,
//   HiOfficeBuilding,
//   HiPhotograph,
//   HiTag,
//   HiExclamation,
//   HiGlobe,
//   HiQrcode,
//   HiCurrencyDollar,
//   HiTrendingUp,
//   HiTrendingDown,
//   HiChartBar,
//   HiLocationMarker,
//   HiCalendar,
//   HiClipboardList,
//   HiRefresh,
//   HiExternalLink,
//   HiSwitchHorizontal,
//   HiShieldCheck,
//   HiCog,
//   HiArchive,
//   HiCollection,
//   HiDocumentText,
//   HiChevronDown,
//   HiPrinter,
//   HiLink,
//   HiCheckCircle,
//   HiXCircle,
//   HiTruck,
//   HiClock,
//   HiCurrencyEuro,
//   HiSparkles,
//   HiFire,
//   HiDownload,
//   HiEye,
//   HiPlus,
//   HiTrash,
//   HiX,
// } from "react-icons/hi";

// // APIs
// import { useGetEntreprisesQuery } from "../../slices/entrepriseApiSlice";
// import {
//   useGetArticleByNartQuery,
//   useGetAdjacentArticlesQuery,
//   useInvalidateArticleCacheMutation,
//   getPhotoUrl,
// } from "../../slices/articleApiSlice";
// import { useGetArticleFilialeDataQuery } from "../../slices/fillialeApiSlice";

// // PDF Generation
// import jsPDF from "jspdf";
// import JsBarcode from "jsbarcode";

// // CSS
// import "./AdminArticleInfosScreen.css";

// // ─────────────────────────────────────────────────────────────────────────────
// // Helper : construire l'URL du PDF à partir du trigramme et du NART
// // ─────────────────────────────────────────────────────────────────────────────
// const getPdfUrl = (trigramme, nart) => {
//   if (!trigramme || !nart) return null;
//   const cleanNart = String(nart).trim();
//   return `/photos/${trigramme}/${cleanNart}.pdf`;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Couleurs de la charte PDF
// // ─────────────────────────────────────────────────────────────────────────────
// const PDF_COLORS = {
//   BLACK: [26, 26, 26],
//   YELLOW: [255, 200, 0],
//   YELLOW_LIGHT: [255, 230, 120],
//   WHITE: [255, 255, 255],
//   GRAY_DARK: [80, 80, 80],
//   GRAY: [120, 120, 120],
//   GRAY_LIGHT: [200, 200, 200],
//   GRAY_BG: [245, 245, 245],
//   PROMO_RED: [220, 38, 38],
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Sous-composant : MediaCard (inchangé)
// // ─────────────────────────────────────────────────────────────────────────────
// const MediaCard = ({
//   photoUrl,
//   pdfUrl,
//   hasPhotosConfigured,
//   articleDesign,
//   hasActivePromo,
//   promoDiscount,
// }) => {
//   const [photoStatus, setPhotoStatus] = useState(hasPhotosConfigured ? "loading" : "error");
//   const [pdfStatus, setPdfStatus] = useState("checking");
//   const [pdfModalOpen, setPdfModalOpen] = useState(false);

//   useEffect(() => {
//     setPhotoStatus(hasPhotosConfigured && photoUrl ? "loading" : "error");
//   }, [photoUrl, hasPhotosConfigured]);

//   useEffect(() => {
//     if (!pdfUrl) { setPdfStatus("unavailable"); return; }
//     let cancelled = false;
//     setPdfStatus("checking");
//     fetch(pdfUrl, { method: "HEAD" })
//       .then((res) => { if (!cancelled) setPdfStatus(res.ok ? "available" : "unavailable"); })
//       .catch(() => { if (!cancelled) setPdfStatus("unavailable"); });
//     return () => { cancelled = true; };
//   }, [pdfUrl]);

//   const photoOk = hasPhotosConfigured && photoStatus === "ok";
//   const pdfOk = pdfStatus === "available";
//   const checking = pdfStatus === "checking";

//   return (
//     <>
//       <div className="photo-card">
//         {hasPhotosConfigured && photoStatus !== "error" ? (
//           <div className={`photo-wrapper ${photoStatus === "ok" ? "loaded" : ""}`}>
//             <img src={photoUrl} alt={articleDesign} onError={() => setPhotoStatus("error")} onLoad={() => setPhotoStatus("ok")} />
//             {photoStatus === "loading" && (<div className="photo-loading"><div className="loading-spinner small" /></div>)}
//             {hasActivePromo && (<div className="photo-badge promo">-{promoDiscount}%</div>)}
//           </div>
//         ) : (
//           <div className={`no-photo ${pdfOk ? "no-photo--has-pdf" : ""}`}>
//             <HiPhotograph /><span>Photo indisponible</span>
//           </div>
//         )}
//         <div className="media-status-bar">
//           <div className={`media-status-pill ${photoOk ? "pill--ok" : "pill--ko"}`}>
//             <HiPhotograph className="pill-icon" />
//             <span className="pill-label">{photoStatus === "loading" ? "Photo…" : photoOk ? "Photo disponible" : "Photo indisponible"}</span>
//             {photoStatus === "loading" ? <div className="pill-spinner" /> : photoOk ? <HiCheckCircle className="pill-check" /> : <HiXCircle className="pill-cross" />}
//           </div>
//           <div className={`media-status-pill ${checking ? "pill--checking" : pdfOk ? "pill--ok" : "pill--ko"}`}>
//             <HiDocumentText className="pill-icon" />
//             <span className="pill-label">{checking ? "Fiche technique…" : pdfOk ? "Fiche technique disponible" : "Fiche technique indisponible"}</span>
//             {checking ? <div className="pill-spinner" /> : pdfOk ? <HiCheckCircle className="pill-check" /> : <HiXCircle className="pill-cross" />}
//           </div>
//         </div>
//         {pdfOk && (
//           <div className="pdf-actions">
//             <button className="btn-pdf btn-pdf--view" onClick={() => setPdfModalOpen(true)} title="Voir la fiche technique"><HiEye /><span>Voir la fiche</span></button>
//             <a className="btn-pdf btn-pdf--download" href={pdfUrl} download target="_blank" rel="noopener noreferrer" title="Télécharger la fiche technique"><HiDownload /><span>Télécharger</span></a>
//           </div>
//         )}
//       </div>
//       {pdfModalOpen && (
//         <div className="pdf-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPdfModalOpen(false); }}>
//           <div className="pdf-modal">
//             <div className="pdf-modal-header">
//               <h3><HiDocumentText /> Fiche technique — {articleDesign}</h3>
//               <div className="pdf-modal-actions">
//                 <a href={pdfUrl} download className="btn-pdf btn-pdf--download small" title="Télécharger"><HiDownload /><span>Télécharger</span></a>
//                 <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-pdf btn-pdf--view small" title="Ouvrir dans un nouvel onglet"><HiExternalLink /><span>Nouvel onglet</span></a>
//                 <button className="pdf-modal-close" onClick={() => setPdfModalOpen(false)} title="Fermer"><HiXCircle /></button>
//               </div>
//             </div>
//             <div className="pdf-modal-body">
//               <iframe src={`${pdfUrl}#toolbar=1&navpanes=0`} title="Fiche technique" width="100%" height="100%" />
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Sous-composant : PrintModal
// // Modale pré-génération PDF avec sélection template, description,
// // caractéristiques dynamiques et lien web optionnel (QR code)
// // ─────────────────────────────────────────────────────────────────────────────
// const PrintModal = ({ isOpen, onClose, onGenerate, articleDesign, nart }) => {
//   const [template, setTemplate] = useState("complete"); // "complete" | "vitrine" | "etiquette"
//   const [description, setDescription] = useState("");
//   const [characteristics, setCharacteristics] = useState([]);
//   const [webUrl, setWebUrl] = useState("");
//   const [generating, setGenerating] = useState(false);

//   const handleAddCharacteristic = () => {
//     setCharacteristics((prev) => [...prev, { label: "", value: "", id: Date.now() }]);
//   };

//   const handleRemoveCharacteristic = (id) => {
//     setCharacteristics((prev) => prev.filter((c) => c.id !== id));
//   };

//   const handleCharChange = (id, field, val) => {
//     setCharacteristics((prev) =>
//       prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
//     );
//   };

//   const handleGenerate = async () => {
//     setGenerating(true);
//     try {
//       await onGenerate({
//         template,
//         description: description.trim(),
//         characteristics: characteristics.filter((c) => c.label.trim() || c.value.trim()),
//         webUrl: webUrl.trim(),
//       });
//     } finally {
//       setGenerating(false);
//     }
//   };

//   const handleClose = () => {
//     if (!generating) {
//       setDescription("");
//       setCharacteristics([]);
//       setWebUrl("");
//       setTemplate("complete");
//       onClose();
//     }
//   };

//   if (!isOpen) return null;

//   const templates = [
//     {
//       id: "complete",
//       label: "Fiche complète",
//       desc: "Toutes les informations : prix d'achat, marges, stocks, détails complets",
//       icon: "📋",
//     },
//     {
//       id: "vitrine",
//       label: "Fiche vitrine",
//       desc: "Version client : prix TTC, promo, photo, sans marges ni prix d'achat",
//       icon: "🏪",
//     },
//     {
//       id: "etiquette",
//       label: "Étiquette prix",
//       desc: "Format compact A6 : NART, désignation, code-barres, prix TTC & promo",
//       icon: "🏷️",
//     },
//   ];

//   return (
//     <div className="print-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
//       <div className="print-modal">
//         {/* Header */}
//         <div className="print-modal-header">
//           <div className="print-modal-title">
//             <HiPrinter />
//             <div>
//               <h3>Générer une fiche PDF</h3>
//               <span className="print-modal-subtitle">{nart} — {articleDesign}</span>
//             </div>
//           </div>
//           <button className="print-modal-close" onClick={handleClose} disabled={generating}>
//             <HiX />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="print-modal-body">

//           {/* Template selector */}
//           <div className="print-section">
//             <label className="print-section-label">Type de fiche</label>
//             <div className="template-selector">
//               {templates.map((t) => (
//                 <button
//                   key={t.id}
//                   className={`template-option ${template === t.id ? "active" : ""}`}
//                   onClick={() => setTemplate(t.id)}
//                 >
//                   <span className="template-icon">{t.icon}</span>
//                   <span className="template-label">{t.label}</span>
//                   <span className="template-desc">{t.desc}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Description (pas pour étiquette) */}
//           {template !== "etiquette" && (
//             <div className="print-section">
//               <label className="print-section-label">Description (optionnel)</label>
//               <textarea
//                 className="print-textarea"
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 placeholder="Ajoutez une description libre pour cet article..."
//                 rows={3}
//               />
//             </div>
//           )}

//           {/* Caractéristiques dynamiques (pas pour étiquette) */}
//           {template !== "etiquette" && (
//             <div className="print-section">
//               <label className="print-section-label">Caractéristiques supplémentaires (optionnel)</label>
//               <div className="chars-list">
//                 {characteristics.map((c) => (
//                   <div key={c.id} className="char-row">
//                     <input
//                       type="text"
//                       className="char-input label"
//                       placeholder="Label (ex: Poids)"
//                       value={c.label}
//                       onChange={(e) => handleCharChange(c.id, "label", e.target.value)}
//                     />
//                     <input
//                       type="text"
//                       className="char-input value"
//                       placeholder="Valeur (ex: 2.5 kg)"
//                       value={c.value}
//                       onChange={(e) => handleCharChange(c.id, "value", e.target.value)}
//                     />
//                     <button
//                       className="char-remove"
//                       onClick={() => handleRemoveCharacteristic(c.id)}
//                       title="Supprimer"
//                     >
//                       <HiTrash />
//                     </button>
//                   </div>
//                 ))}
//                 <button className="char-add" onClick={handleAddCharacteristic}>
//                   <HiPlus /> Ajouter une caractéristique
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* URL web optionnel (QR code) */}
//           <div className="print-section">
//             <label className="print-section-label">
//               Lien page web (optionnel)
//               <span className="print-section-hint">Un QR code sera ajouté sur la fiche</span>
//             </label>
//             <input
//               type="url"
//               className="print-input"
//               value={webUrl}
//               onChange={(e) => setWebUrl(e.target.value)}
//               placeholder="https://www.exemple.com/article/..."
//             />
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="print-modal-footer">
//           <button className="print-btn cancel" onClick={handleClose} disabled={generating}>
//             Annuler
//           </button>
//           <button className="print-btn generate" onClick={handleGenerate} disabled={generating}>
//             {generating ? (
//               <><div className="btn-spinner" /> Génération...</>
//             ) : (
//               <><HiPrinter /> Générer le PDF</>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Fonctions utilitaires PDF
// // ─────────────────────────────────────────────────────────────────────────────

// /** Charge une image (URL) en base64 data URL. Retourne null si échec. */
// const loadImageAsBase64 = (url) => {
//   return new Promise((resolve) => {
//     const img = new Image();
//     img.crossOrigin = "anonymous";
//     img.onload = () => {
//       try {
//         const canvas = document.createElement("canvas");
//         canvas.width = img.naturalWidth;
//         canvas.height = img.naturalHeight;
//         const ctx = canvas.getContext("2d");
//         ctx.drawImage(img, 0, 0);
//         resolve(canvas.toDataURL("image/jpeg", 0.85));
//       } catch {
//         resolve(null);
//       }
//     };
//     img.onerror = () => resolve(null);
//     img.src = url;
//   });
// };

// /** Génère un code-barres en base64 data URL. */
// const generateBarcodeBase64 = (value, options = {}) => {
//   try {
//     const canvas = document.createElement("canvas");
//     JsBarcode(canvas, value, {
//       format: "CODE128",
//       width: 1,
//       height: 22,
//       displayValue: true,
//       fontSize: 9,
//       margin: 2,
//       background: "#FFFFFF",
//       lineColor: "#000000",
//       ...options,
//     });
//     return canvas.toDataURL("image/png");
//   } catch {
//     return null;
//   }
// };

// /** Génère un QR code en base64 data URL via import dynamique. Retourne null si lib absente. */
// const generateQRCodeBase64 = async (url) => {
//   try {
//     const QRCode = await import("qrcode");
//     const toDataURL = QRCode.toDataURL || QRCode.default?.toDataURL;
//     if (!toDataURL) return null;
//     return await toDataURL(url, {
//       width: 200,
//       margin: 1,
//       color: { dark: "#1a1a1a", light: "#ffffff" },
//     });
//   } catch {
//     console.warn("QR code generation failed. Install qrcode: npm install qrcode");
//     return null;
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Classe helper pour dessiner le PDF avec gestion auto du saut de page
// // ─────────────────────────────────────────────────────────────────────────────
// class PdfBuilder {
//   constructor(doc, { margin = 15, footerHeight = 18, headerRepeatHeight = 0 } = {}) {
//     this.doc = doc;
//     this.margin = margin;
//     this.footerHeight = footerHeight;
//     this.headerRepeatHeight = headerRepeatHeight;
//     this.pageWidth = doc.internal.pageSize.getWidth();
//     this.pageHeight = doc.internal.pageSize.getHeight();
//     this.contentWidth = this.pageWidth - margin * 2;
//     this.y = margin;
//     this.pageNumber = 1;
//     this._footerFn = null;
//     this._headerRepeatFn = null;
//   }

//   get usableBottom() {
//     return this.pageHeight - this.footerHeight;
//   }

//   setFooter(fn) { this._footerFn = fn; }
//   setHeaderRepeat(fn) { this._headerRepeatFn = fn; }

//   /** Vérifie s'il y a assez de place, sinon ajoute une page */
//   ensureSpace(neededMm) {
//     if (this.y + neededMm > this.usableBottom) {
//       this.addPage();
//     }
//   }

//   addPage() {
//     // Dessiner le footer de la page courante
//     if (this._footerFn) this._footerFn(this.doc, this.pageNumber);
//     this.doc.addPage();
//     this.pageNumber++;
//     this.y = this.margin;
//     // Dessiner le header répété
//     if (this._headerRepeatFn) {
//       this._headerRepeatFn(this.doc);
//       this.y = this.margin + this.headerRepeatHeight;
//     }
//   }

//   /** Dessine le footer sur la dernière page */
//   finalize() {
//     if (this._footerFn) this._footerFn(this.doc, this.pageNumber);
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Composant principal
// // ─────────────────────────────────────────────────────────────────────────────
// const AdminArticleInfosScreen = () => {
//   const { nomDossierDBF, nart } = useParams();
//   const navigate = useNavigate();

//   // États
//   const [selectedEntreprise, setSelectedEntreprise] = useState(nomDossierDBF || "");
//   const [selectedEntrepriseData, setSelectedEntrepriseData] = useState(null);
//   const [activeTab, setActiveTab] = useState("general");
//   const [showPrintModal, setShowPrintModal] = useState(false);

//   // State pour les taux de change
//   const [exchangeRates, setExchangeRates] = useState(null);
//   const [exchangeRatesLoading, setExchangeRatesLoading] = useState(false);
//   const [exchangeRatesError, setExchangeRatesError] = useState(null);

//   const XPF_EUR_RATE = 119.332;

//   const DEVISE_MAPPING = {
//     EUR: "EUR", EURO: "EUR", E: "EUR", "€": "EUR",
//     USD: "USD", US: "USD", $: "USD", DOLLAR: "USD",
//     AUD: "AUD", NZD: "NZD", JPY: "JPY", YEN: "JPY",
//     CNY: "CNY", YUAN: "CNY", GBP: "GBP", CHF: "CHF",
//     CAD: "CAD", SGD: "SGD", HKD: "HKD",
//     XPF: "XPF", CFP: "XPF", F: "XPF",
//   };

//   const fetchExchangeRates = useCallback(async () => {
//     setExchangeRatesLoading(true);
//     setExchangeRatesError(null);
//     try {
//       const response = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR");
//       if (!response.ok) throw new Error("Erreur lors de la récupération des taux de change");
//       const data = await response.json();
//       setExchangeRates({ base: "EUR", date: data.date, rates: { ...data.rates, EUR: 1, XPF: XPF_EUR_RATE } });
//     } catch (error) {
//       setExchangeRatesError(error.message);
//       setExchangeRates({
//         base: "EUR", date: new Date().toISOString().split("T")[0],
//         rates: { EUR: 1, USD: 1.08, XPF: XPF_EUR_RATE, AUD: 1.65, NZD: 1.78, JPY: 162, GBP: 0.85, CHF: 0.95, CNY: 7.8, CAD: 1.47 },
//         isFallback: true,
//       });
//     } finally { setExchangeRatesLoading(false); }
//   }, []);

//   useEffect(() => { fetchExchangeRates(); }, [fetchExchangeRates]);

//   const convertToXPF = useCallback((amount, fromCurrency) => {
//     if (!amount || amount === 0) return { amountXPF: 0, rate: null, fromCurrency: "XPF", error: null };
//     if (!fromCurrency || fromCurrency.trim() === "") return { amountXPF: amount, rate: 1, fromCurrency: "XPF", error: null };
//     const normalizedCurrency = fromCurrency.trim().toUpperCase();
//     const isoCurrency = DEVISE_MAPPING[normalizedCurrency] || normalizedCurrency;
//     if (isoCurrency === "XPF") return { amountXPF: amount, rate: 1, fromCurrency: "XPF", error: null };
//     if (!exchangeRates?.rates) return { amountXPF: null, rate: null, fromCurrency: isoCurrency, error: "Taux de change non disponibles" };
//     const rateFromEUR = exchangeRates.rates[isoCurrency];
//     if (!rateFromEUR) return { amountXPF: null, rate: null, fromCurrency: isoCurrency, error: `Devise ${isoCurrency} non supportée` };
//     return {
//       amountXPF: Math.round((amount / rateFromEUR) * XPF_EUR_RATE),
//       rate: XPF_EUR_RATE / rateFromEUR, fromCurrency: isoCurrency, error: null,
//     };
//   }, [exchangeRates]);

//   // Queries
//   const { data: entreprises, isLoading: loadingEntreprises } = useGetEntreprisesQuery();
//   const { data: articleData, isLoading: loadingArticle, error: articleError, refetch, isFetching } =
//     useGetArticleByNartQuery({ nomDossierDBF: selectedEntreprise, nart }, { skip: !selectedEntreprise || !nart });
//   const { data: adjacentData, isLoading: loadingAdjacent } =
//     useGetAdjacentArticlesQuery({ nomDossierDBF: selectedEntreprise, nart }, { skip: !selectedEntreprise || !nart });
//   const [invalidateCache, { isLoading: invalidating }] = useInvalidateArticleCacheMutation();

//   const article = articleData?.article;
//   const previousArticle = adjacentData?.previous || null;
//   const nextArticle = adjacentData?.next || null;

//   const { data: filialeData, isLoading: loadingFiliales, isFetching: fetchingFiliales } =
//     useGetArticleFilialeDataQuery(
//       { nomDossierDBF: selectedEntreprise, nart: article?.NART?.trim() || "" },
//       { skip: !selectedEntreprise || !article?.NART },
//     );

//   useEffect(() => {
//     if (entreprises && nomDossierDBF) {
//       const entreprise = entreprises.find((e) => e.nomDossierDBF === nomDossierDBF);
//       if (entreprise) { setSelectedEntrepriseData(entreprise); setSelectedEntreprise(nomDossierDBF); }
//     }
//   }, [entreprises, nomDossierDBF]);

//   // Handlers
//   const handleEntrepriseChange = (e) => {
//     const newNomDossier = e.target.value;
//     const entreprise = entreprises?.find((ent) => ent.nomDossierDBF === newNomDossier);
//     setSelectedEntreprise(newNomDossier);
//     setSelectedEntrepriseData(entreprise);
//     navigate(`/admin/articles/${newNomDossier}/${nart}`, { replace: true });
//   };

//   const handleInvalidateCache = async () => {
//     if (selectedEntreprise) { await invalidateCache(selectedEntreprise); refetch(); }
//   };

//   const handleNavigatePrevious = () => {
//     if (previousArticle) navigate(`/admin/articles/${selectedEntreprise}/${previousArticle.NART.trim()}`);
//   };
//   const handleNavigateNext = () => {
//     if (nextArticle) navigate(`/admin/articles/${selectedEntreprise}/${nextArticle.NART.trim()}`);
//   };

//   // Helpers
//   const safeTrim = (value) => {
//     if (value === null || value === undefined) return "";
//     return typeof value === "string" ? value.trim() : String(value);
//   };

//   const formatPrice = (price) => {
//     if (!price && price !== 0) return "-";
//     return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XPF", minimumFractionDigits: 0 }).format(price);
//   };

//   const formatStock = (stock) => {
//     if (stock === null || stock === undefined) return "-";
//     return parseFloat(stock).toLocaleString("fr-FR");
//   };

//   const formatDate = (dateValue) => {
//     if (!dateValue) return "-";
//     if (dateValue instanceof Date) return isNaN(dateValue.getTime()) ? "-" : dateValue.toLocaleDateString("fr-FR");
//     if (typeof dateValue === "string") {
//       if (dateValue.length === 8 && /^\d{8}$/.test(dateValue)) {
//         const y = parseInt(dateValue.substring(0, 4));
//         const m = parseInt(dateValue.substring(4, 6));
//         const d = parseInt(dateValue.substring(6, 8));
//         if (y > 0 && m >= 1 && m <= 12 && d >= 1 && d <= 31)
//           return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
//         return "-";
//       }
//       const parsed = new Date(dateValue);
//       return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString("fr-FR") : "-";
//     }
//     if (typeof dateValue === "number") {
//       const parsed = new Date(dateValue);
//       return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString("fr-FR") : "-";
//     }
//     return "-";
//   };

//   const formatPercent = (value) => {
//     if (value === null || value === undefined) return "-";
//     return `${parseFloat(value).toFixed(1)}%`;
//   };

//   const isPromoActive = (art) => {
//     if (!art?.DPROMOD || !art?.DPROMOF || !art?.PVPROMO) return false;
//     const parsePromoDate = (v) => {
//       if (!v) return null;
//       if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
//       if (typeof v === "string" && v.length === 8 && /^\d{8}$/.test(v)) {
//         return new Date(parseInt(v.substring(0, 4)), parseInt(v.substring(4, 6)) - 1, parseInt(v.substring(6, 8)));
//       }
//       const parsed = new Date(v);
//       return isNaN(parsed.getTime()) ? null : parsed;
//     };
//     const dateDebut = parsePromoDate(art.DPROMOD);
//     const dateFin = parsePromoDate(art.DPROMOF);
//     if (!dateDebut || !dateFin) return false;
//     const today = new Date(); today.setHours(0, 0, 0, 0);
//     dateDebut.setHours(0, 0, 0, 0); dateFin.setHours(23, 59, 59, 999);
//     return today >= dateDebut && today <= dateFin;
//   };

//   const calculateDiscount = (originalPrice, promoPrice) => {
//     if (!originalPrice || !promoPrice || originalPrice <= 0) return 0;
//     return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
//   };

//   const calculateStockTotal = (art) => {
//     if (!art) return 0;
//     return (parseFloat(art.S1) || 0) + (parseFloat(art.S2) || 0) + (parseFloat(art.S3) || 0) + (parseFloat(art.S4) || 0) + (parseFloat(art.S5) || 0);
//   };

//   const getEnCommande = (art) => (!art ? 0 : parseFloat(art.ENCDE) || 0);

//   const getMonthsData = useMemo(() => {
//     const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
//     const shortMonthNames = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
//     const now = new Date();
//     const lastCompleteMonth = (now.getMonth() - 1 + 12) % 12;
//     return Array.from({ length: 12 }, (_, i) => {
//       const monthIndex = (lastCompleteMonth - (11 - i) + 12) % 12;
//       return { vKey: `V${i + 1}`, rupKey: `RUP${i + 1}`, name: monthNames[monthIndex], shortName: shortMonthNames[monthIndex], monthIndex };
//     });
//   }, []);

//   const salesData = useMemo(() => {
//     if (!articleData?.article) return [];
//     return getMonthsData.map((m) => ({ name: m.shortName, fullName: m.name, ventes: parseFloat(articleData.article[m.vKey]) || 0 }));
//   }, [articleData, getMonthsData]);

//   const ruptureData = useMemo(() => {
//     if (!articleData?.article) return [];
//     return getMonthsData.map((m) => ({ name: m.shortName, fullName: m.name, ruptures: parseFloat(articleData.article[m.rupKey]) || 0 }));
//   }, [articleData, getMonthsData]);

//   const totalSales = useMemo(() => salesData.reduce((s, i) => s + i.ventes, 0), [salesData]);
//   const totalRuptures = useMemo(() => ruptureData.reduce((s, i) => s + i.ruptures, 0), [ruptureData]);
//   const averageMonthlySales = useMemo(() => (totalSales === 0 ? 0 : totalSales / 12), [totalSales]);

//   const stockEnJours = useMemo(() => {
//     if (!article) return null;
//     const st = calculateStockTotal(article);
//     if (st === 0) return 0;
//     if (averageMonthlySales === 0) return Infinity;
//     return Math.round((st / averageMonthlySales) * 30);
//   }, [article, averageMonthlySales]);

//   const stockEnMois = useMemo(() => {
//     if (!article) return null;
//     const st = calculateStockTotal(article);
//     if (st === 0) return 0;
//     if (averageMonthlySales === 0) return Infinity;
//     return (st / averageMonthlySales).toFixed(1);
//   }, [article, averageMonthlySales]);

//   const formatStockEnJours = (j) => j === null || j === undefined ? "-" : j === Infinity ? "∞" : j === 0 ? "0 jour" : j === 1 ? "1 jour" : `${j} jours`;
//   const formatStockEnMois = (m) => m === null || m === undefined ? "-" : m === Infinity ? "∞" : `${m} mois`;

//   const calculateMarge = (art) => {
//     if (!art) return null;
//     const pvHT = parseFloat(art.PVTE) || 0;
//     const prixRevient = (parseFloat(art.DERPREV) || 0) > 0 ? parseFloat(art.DERPREV) : parseFloat(art.PREV) || 0;
//     if (pvHT <= 0 || prixRevient <= 0) return null;
//     return ((pvHT - prixRevient) / pvHT * 100).toFixed(1);
//   };

//   // Dérivés
//   const isRenvoi = articleData?.isRenvoi || false;
//   const articleOriginal = articleData?.articleOriginal;
//   const nombreRenvois = articleData?.nombreRenvois || 0;
//   const hasActivePromo = article ? isPromoActive(article) : false;
//   const hasPhotosConfigured = !!selectedEntrepriseData?.cheminPhotos;

//   const photoUrl = hasPhotosConfigured && article ? getPhotoUrl(selectedEntrepriseData?.trigramme, article.NART) : null;
//   const pdfUrl = hasPhotosConfigured && article ? getPdfUrl(selectedEntrepriseData?.trigramme, article.NART) : null;
//   const mappingEntrepots = selectedEntrepriseData?.mappingEntrepots || { S1: "Magasin", S2: "S2", S3: "S3", S4: "S4", S5: "S5" };

//   // ─────────────────────────────────────────────────────────────────────────
//   // PDF GENERATION — 3 templates
//   // ─────────────────────────────────────────────────────────────────────────
//   const handleGeneratePdf = useCallback(async (options) => {
//     if (!article) return;
//     const { template, description, characteristics, webUrl } = options;

//     // ── Préparer les assets ──
//     const gencod = safeTrim(article.GENCOD);
//     const barcodeImg = gencod ? generateBarcodeBase64(gencod, {
//       width: template === "etiquette" ? 1.5 : 1,
//       height: template === "etiquette" ? 30 : 22,
//       fontSize: template === "etiquette" ? 11 : 9,
//     }) : null;

//     const photoImg = photoUrl ? await loadImageAsBase64(photoUrl) : null;
//     const qrImg = webUrl ? await generateQRCodeBase64(webUrl) : null;

//     const entrepriseNom = selectedEntrepriseData?.nomComplet || "";
//     const dateStr = new Date().toLocaleDateString("fr-FR");
//     const promoActive = hasActivePromo;
//     const discount = calculateDiscount(article.PVTETTC, article.PVPROMO);

//     // ================================================================
//     //  ÉTIQUETTE PRIX — Format A6 paysage
//     // ================================================================
//     if (template === "etiquette") {
//       const doc = new jsPDF({ unit: "mm", format: [148, 105], orientation: "landscape" });
//       const m = 8;
//       const pw = 148;
//       const ph = 105;

//       // Fond
//       doc.setFillColor(...PDF_COLORS.BLACK);
//       doc.rect(0, 0, pw, ph, "F");

//       // Bandeau jaune en haut
//       doc.setFillColor(...PDF_COLORS.YELLOW);
//       doc.rect(0, 0, pw, 5, "F");

//       // NART
//       doc.setTextColor(...PDF_COLORS.YELLOW);
//       doc.setFontSize(11);
//       doc.setFont("helvetica", "bold");
//       doc.text(safeTrim(article.NART), m, 16);

//       // Désignation
//       doc.setTextColor(...PDF_COLORS.WHITE);
//       doc.setFontSize(14);
//       doc.setFont("helvetica", "bold");
//       const designLines = doc.splitTextToSize(safeTrim(article.DESIGN), pw - m * 2 - 55);
//       doc.text(designLines, m, 26);

//       // Code-barres
//       if (barcodeImg) {
//         // Fond blanc pour le code-barres
//         doc.setFillColor(...PDF_COLORS.WHITE);
//         doc.roundedRect(pw - 55, 8, 48, 22, 2, 2, "F");
//         doc.addImage(barcodeImg, "PNG", pw - 53, 9, 44, 20);
//       }

//       // Ligne de séparation jaune
//       const sepY = 40 + (designLines.length - 1) * 5;
//       doc.setDrawColor(...PDF_COLORS.YELLOW);
//       doc.setLineWidth(0.5);
//       doc.line(m, sepY, pw - m, sepY);

//       // Prix
//       let priceY = sepY + 15;

//       if (promoActive) {
//         // Ancien prix barré
//         doc.setTextColor(...PDF_COLORS.GRAY);
//         doc.setFontSize(16);
//         doc.setFont("helvetica", "normal");
//         const oldPriceText = formatPrice(article.PVTETTC);
//         doc.text(oldPriceText, pw / 2, priceY, { align: "center" });
//         // Barre
//         const oldPriceWidth = doc.getTextWidth(oldPriceText);
//         doc.setDrawColor(...PDF_COLORS.PROMO_RED);
//         doc.setLineWidth(0.8);
//         doc.line(pw / 2 - oldPriceWidth / 2, priceY - 1, pw / 2 + oldPriceWidth / 2, priceY - 1);

//         priceY += 12;

//         // Bandeau promo
//         doc.setFillColor(...PDF_COLORS.YELLOW);
//         doc.roundedRect(m, priceY - 8, pw - m * 2, 20, 3, 3, "F");

//         doc.setTextColor(...PDF_COLORS.BLACK);
//         doc.setFontSize(12);
//         doc.setFont("helvetica", "bold");
//         doc.text(`PROMO -${discount}%`, m + 8, priceY + 3);

//         doc.setFontSize(22);
//         doc.text(formatPrice(article.PVPROMO), pw - m - 8, priceY + 5, { align: "right" });

//         priceY += 16;

//         // Dates promo
//         doc.setTextColor(...PDF_COLORS.YELLOW_LIGHT);
//         doc.setFontSize(8);
//         doc.setFont("helvetica", "italic");
//         doc.text(`Du ${formatDate(article.DPROMOD)} au ${formatDate(article.DPROMOF)}`, pw / 2, priceY + 5, { align: "center" });
//       } else {
//         // Prix normal gros
//         doc.setTextColor(...PDF_COLORS.YELLOW);
//         doc.setFontSize(10);
//         doc.setFont("helvetica", "normal");
//         doc.text("PRIX TTC", pw / 2, priceY - 2, { align: "center" });

//         doc.setTextColor(...PDF_COLORS.WHITE);
//         doc.setFontSize(28);
//         doc.setFont("helvetica", "bold");
//         doc.text(formatPrice(article.PVTETTC), pw / 2, priceY + 12, { align: "center" });
//       }

//       // QR code si fourni
//       if (qrImg) {
//         doc.setFillColor(...PDF_COLORS.WHITE);
//         doc.roundedRect(pw - m - 22, ph - 28, 22, 22, 2, 2, "F");
//         doc.addImage(qrImg, "PNG", pw - m - 21, ph - 27, 20, 20);
//       }

//       // Bandeau jaune en bas
//       doc.setFillColor(...PDF_COLORS.YELLOW);
//       doc.rect(0, ph - 3, pw, 3, "F");

//       // Footer
//       doc.setTextColor(...PDF_COLORS.GRAY);
//       doc.setFontSize(6);
//       doc.text(`${entrepriseNom} • ${dateStr}`, m, ph - 5);

//       doc.save(`Etiquette_${safeTrim(article.NART)}.pdf`);
//       return;
//     }

//     // ================================================================
//     //  FICHE COMPLÈTE & FICHE VITRINE — Format A4
//     // ================================================================
//     const isVitrine = template === "vitrine";
//     const doc = new jsPDF({ unit: "mm", format: "a4" });
//     const margin = 15;
//     const pb = new PdfBuilder(doc, { margin, footerHeight: 18, headerRepeatHeight: 12 });

//     // ── Footer sur chaque page ──
//     pb.setFooter((d, pageNum) => {
//       d.setDrawColor(...PDF_COLORS.GRAY_LIGHT);
//       d.setLineWidth(0.3);
//       d.line(margin, pb.pageHeight - 14, pb.pageWidth - margin, pb.pageHeight - 14);
//       d.setFontSize(7);
//       d.setTextColor(...PDF_COLORS.GRAY);
//       d.text(`${entrepriseNom} • ${dateStr}`, margin, pb.pageHeight - 9);
//       d.text(`Page ${pageNum}`, pb.pageWidth - margin, pb.pageHeight - 9, { align: "right" });
//     });

//     // ── Header répété (petit bandeau noir) ──
//     pb.setHeaderRepeat((d) => {
//       d.setFillColor(...PDF_COLORS.BLACK);
//       d.rect(0, 0, pb.pageWidth, 10, "F");
//       d.setTextColor(...PDF_COLORS.YELLOW);
//       d.setFontSize(8);
//       d.setFont("helvetica", "bold");
//       d.text(`${safeTrim(article.NART)} — ${safeTrim(article.DESIGN).substring(0, 60)}`, margin, 7);
//     });

//     // ════════════════════════════════════════════════════════════════
//     //  PAGE 1 — HEADER PRINCIPAL
//     // ════════════════════════════════════════════════════════════════
//     doc.setFillColor(...PDF_COLORS.BLACK);
//     doc.rect(0, 0, pb.pageWidth, 38, "F");

//     // Bandeau jaune fin en haut
//     doc.setFillColor(...PDF_COLORS.YELLOW);
//     doc.rect(0, 0, pb.pageWidth, 2, "F");

//     // Label "Fiche Article"
//     doc.setTextColor(...PDF_COLORS.YELLOW);
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "normal");
//     doc.text(isVitrine ? "FICHE PRODUIT" : "FICHE ARTICLE", margin, 12);

//     // NART
//     doc.setFontSize(20);
//     doc.setFont("helvetica", "bold");
//     doc.text(safeTrim(article.NART), margin, 23);

//     // Désignation sous le NART
//     doc.setTextColor(...PDF_COLORS.WHITE);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     const headerDesign = doc.splitTextToSize(safeTrim(article.DESIGN), pb.pageWidth - margin - 70);
//     doc.text(headerDesign, margin, 30);

//     // Code-barres en haut à droite
//     if (barcodeImg) {
//       doc.setFillColor(...PDF_COLORS.WHITE);
//       doc.roundedRect(pb.pageWidth - 60, 6, 48, 20, 2, 2, "F");
//       doc.addImage(barcodeImg, "PNG", pb.pageWidth - 58, 7, 44, 18);
//     }

//     // GENCOD text sous le code-barres
//     if (gencod) {
//       doc.setTextColor(...PDF_COLORS.GRAY);
//       doc.setFontSize(7);
//       doc.text(gencod, pb.pageWidth - 36, 32, { align: "center" });
//     }

//     pb.y = 46;

//     // ════════════════════════════════════════════════════════════════
//     //  PHOTO + BLOC PRIX
//     // ════════════════════════════════════════════════════════════════
//     const photoBoxW = 75;
//     const photoBoxH = 65;
//     const priceBoxX = margin + photoBoxW + 8;
//     const priceBoxW = pb.contentWidth - photoBoxW - 8;

//     // Photo
//     doc.setDrawColor(...PDF_COLORS.GRAY_LIGHT);
//     doc.setFillColor(250, 250, 250);
//     doc.roundedRect(margin, pb.y, photoBoxW, photoBoxH, 2, 2, "FD");

//     if (photoImg) {
//       try {
//         doc.addImage(photoImg, "JPEG", margin + 2, pb.y + 2, photoBoxW - 4, photoBoxH - 4);
//       } catch {
//         doc.setTextColor(...PDF_COLORS.GRAY);
//         doc.setFontSize(10);
//         doc.text("Photo indisponible", margin + 12, pb.y + 35);
//       }
//     } else {
//       doc.setTextColor(...PDF_COLORS.GRAY);
//       doc.setFontSize(10);
//       doc.text("Photo indisponible", margin + 12, pb.y + 35);
//     }

//     // Bloc prix
//     doc.setFillColor(...PDF_COLORS.GRAY_BG);
//     doc.roundedRect(priceBoxX, pb.y, priceBoxW, photoBoxH, 2, 2, "F");

//     let priceY = pb.y + 10;

//     const drawPriceLine = (label, value, opts = {}) => {
//       const { bold = false, accent = false, strikethrough = false } = opts;
//       doc.setFontSize(9);
//       doc.setTextColor(...PDF_COLORS.GRAY_DARK);
//       doc.setFont("helvetica", "normal");
//       doc.text(label, priceBoxX + 8, priceY);

//       doc.setFontSize(bold ? 15 : 12);
//       doc.setTextColor(...(accent ? PDF_COLORS.YELLOW : PDF_COLORS.BLACK));
//       doc.setFont("helvetica", bold ? "bold" : "normal");
//       doc.text(value, priceBoxX + priceBoxW - 8, priceY, { align: "right" });

//       if (strikethrough) {
//         const tw = doc.getTextWidth(value);
//         doc.setDrawColor(...PDF_COLORS.PROMO_RED);
//         doc.setLineWidth(0.5);
//         doc.line(priceBoxX + priceBoxW - 8 - tw, priceY - 1.5, priceBoxX + priceBoxW - 8, priceY - 1.5);
//       }

//       priceY += 12;
//     };

//     if (!isVitrine) {
//       drawPriceLine("Prix HT", formatPrice(article.PVTE));
//       drawPriceLine("TGC", formatPercent(article.TAXES));
//     }
//     drawPriceLine("Prix TTC", formatPrice(article.PVTETTC), {
//       bold: true,
//       strikethrough: promoActive,
//     });

//     if (promoActive) {
//       drawPriceLine(`PROMO -${discount}%`, formatPrice(article.PVPROMO), { bold: true, accent: true });
//     }

//     // QR code dans le bloc prix (coin bas droit)
//     if (qrImg) {
//       const qrSize = 22;
//       const qrX = priceBoxX + priceBoxW - qrSize - 5;
//       const qrY2 = pb.y + photoBoxH - qrSize - 3;
//       doc.addImage(qrImg, "PNG", qrX, qrY2, qrSize, qrSize);
//       doc.setFontSize(5);
//       doc.setTextColor(...PDF_COLORS.GRAY);
//       doc.text("Voir en ligne", qrX + qrSize / 2, qrY2 + qrSize + 3, { align: "center" });
//     }

//     pb.y += photoBoxH + 8;

//     // ════════════════════════════════════════════════════════════════
//     //  BANDEAU PROMO (si actif)
//     // ════════════════════════════════════════════════════════════════
//     if (promoActive) {
//       pb.ensureSpace(22);
//       doc.setFillColor(...PDF_COLORS.YELLOW);
//       doc.roundedRect(margin, pb.y, pb.contentWidth, 16, 2, 2, "F");

//       doc.setTextColor(...PDF_COLORS.BLACK);
//       doc.setFontSize(11);
//       doc.setFont("helvetica", "bold");
//       doc.text(`PROMOTION  -${discount}%`, margin + 8, pb.y + 7);

//       doc.setFontSize(14);
//       doc.text(formatPrice(article.PVPROMO), pb.pageWidth - margin - 8, pb.y + 8, { align: "right" });

//       doc.setFontSize(7);
//       doc.setFont("helvetica", "italic");
//       doc.setTextColor(...PDF_COLORS.GRAY_DARK);
//       doc.text(`Du ${formatDate(article.DPROMOD)} au ${formatDate(article.DPROMOF)}`, margin + 8, pb.y + 13);

//       pb.y += 22;
//     }

//     // ════════════════════════════════════════════════════════════════
//     //  HELPER — Section titre
//     // ════════════════════════════════════════════════════════════════
//     const drawSectionTitle = (title) => {
//       pb.ensureSpace(14);
//       doc.setFillColor(...PDF_COLORS.BLACK);
//       doc.roundedRect(margin, pb.y, pb.contentWidth, 8, 1, 1, "F");
//       doc.setTextColor(...PDF_COLORS.YELLOW);
//       doc.setFontSize(9);
//       doc.setFont("helvetica", "bold");
//       doc.text(title, margin + 4, pb.y + 5.5);
//       pb.y += 12;
//     };

//     // ════════════════════════════════════════════════════════════════
//     //  HELPER — Ligne info (label / valeur)
//     // ════════════════════════════════════════════════════════════════
//     const drawInfoLine = (label, value, opts = {}) => {
//       const { indent = 0 } = opts;
//       pb.ensureSpace(6);
//       doc.setFontSize(8);
//       doc.setFont("helvetica", "normal");
//       doc.setTextColor(...PDF_COLORS.GRAY_DARK);
//       doc.text(label, margin + 4 + indent, pb.y);
//       doc.setTextColor(...PDF_COLORS.BLACK);
//       doc.setFont("helvetica", "bold");
//       doc.text(String(value || "-"), pb.pageWidth - margin - 4, pb.y, { align: "right" });
//       pb.y += 6;
//     };

//     // ════════════════════════════════════════════════════════════════
//     //  INFOS PRODUIT
//     // ════════════════════════════════════════════════════════════════
//     drawSectionTitle("INFORMATIONS PRODUIT");
//     drawInfoLine("Fournisseur", article.FOURN || "-");
//     drawInfoLine("Réf. fournisseur", safeTrim(article.REFER) || "-");
//     drawInfoLine("Groupe / Famille", safeTrim(article.GROUPE) || "-");
//     drawInfoLine("Unité", safeTrim(article.UNITE) || "-");
//     drawInfoLine("Conditionnement", article.CONDITNM || "-");
//     if (safeTrim(article.GENCOD)) drawInfoLine("Code barre (GENCOD)", safeTrim(article.GENCOD));
//     pb.y += 2;

//     // ════════════════════════════════════════════════════════════════
//     //  STOCKS (fiche complète uniquement)
//     // ════════════════════════════════════════════════════════════════
//     if (!isVitrine) {
//       drawSectionTitle("STOCKS");
//       drawInfoLine("Stock total", formatStock(calculateStockTotal(article)));
//       drawInfoLine("En commande", formatStock(getEnCommande(article)));
//       drawInfoLine("Stock en jours", formatStockEnJours(stockEnJours));

//       const stockKeys = ["S1", "S2", "S3", "S4", "S5"];
//       stockKeys.forEach((k) => {
//         const val = parseFloat(article[k]) || 0;
//         if (val > 0) drawInfoLine(`  ${mappingEntrepots[k]}`, formatStock(val), { indent: 6 });
//       });
//       pb.y += 2;
//     }

//     // ════════════════════════════════════════════════════════════════
//     //  PRIX DÉTAILLÉS (fiche complète uniquement)
//     // ════════════════════════════════════════════════════════════════
//     if (!isVitrine) {
//       drawSectionTitle("PRIX & MARGES");
//       drawInfoLine("Prix d'achat (PACHAT)", formatPrice(article.PACHAT));
//       drawInfoLine("Prix de revient (PREV)", formatPrice(article.PREV));
//       drawInfoLine("Dernier prix revient", formatPrice(article.DERPREV));
//       drawInfoLine("Prix HT (PVTE)", formatPrice(article.PVTE));
//       drawInfoLine("TGC", formatPercent(article.TAXES));
//       drawInfoLine("Prix TTC", formatPrice(article.PVTETTC));
//       const marge = calculateMarge(article);
//       if (marge) drawInfoLine("Marge calculée", `${marge}%`);
//       if (safeTrim(article.DEVISE)) drawInfoLine("Devise achat", safeTrim(article.DEVISE));
//       pb.y += 2;
//     }

//     // ════════════════════════════════════════════════════════════════
//     //  CARACTÉRISTIQUES PERSONNALISÉES
//     // ════════════════════════════════════════════════════════════════
//     if (characteristics && characteristics.length > 0) {
//       drawSectionTitle("CARACTÉRISTIQUES");
//       characteristics.forEach((c) => {
//         drawInfoLine(c.label, c.value);
//       });
//       pb.y += 2;
//     }

//     // ════════════════════════════════════════════════════════════════
//     //  DESCRIPTION
//     // ════════════════════════════════════════════════════════════════
//     if (description) {
//       drawSectionTitle("DESCRIPTION");
//       pb.ensureSpace(12);
//       doc.setFontSize(8);
//       doc.setFont("helvetica", "normal");
//       doc.setTextColor(...PDF_COLORS.GRAY_DARK);
//       const descLines = doc.splitTextToSize(description, pb.contentWidth - 8);
//       // Écrire ligne par ligne avec gestion du saut
//       descLines.forEach((line) => {
//         pb.ensureSpace(5);
//         doc.text(line, margin + 4, pb.y);
//         pb.y += 4.5;
//       });
//       pb.y += 4;
//     }

//     // ════════════════════════════════════════════════════════════════
//     //  EMPLACEMENTS (fiche complète)
//     // ════════════════════════════════════════════════════════════════
//     if (!isVitrine) {
//       const place = safeTrim(article.PLACE);
//       const gisements = ["GISM1","GISM2","GISM3","GISM4","GISM5"].map((g) => safeTrim(article[g])).filter(Boolean);
//       if (place || gisements.length > 0) {
//         drawSectionTitle("EMPLACEMENTS");
//         if (place) drawInfoLine("Place principale", place);
//         gisements.forEach((g, i) => drawInfoLine(`Gisement ${i + 1}`, g));
//         pb.y += 2;
//       }
//     }

//     // ════════════════════════════════════════════════════════════════
//     //  VENTES 12 MOIS (fiche complète)
//     // ════════════════════════════════════════════════════════════════
//     if (!isVitrine && totalSales > 0) {
//       drawSectionTitle("VENTES (12 DERNIERS MOIS)");
//       drawInfoLine("Total ventes", formatStock(totalSales));
//       drawInfoLine("Moyenne / mois", averageMonthlySales.toFixed(1));
//       if (totalRuptures > 0) drawInfoLine("Total ruptures", formatStock(totalRuptures));
//       pb.y += 2;
//     }

//     // ════════════════════════════════════════════════════════════════
//     //  OBSERVATIONS
//     // ════════════════════════════════════════════════════════════════
//     const observ = safeTrim(article.OBSERV);
//     if (observ) {
//       drawSectionTitle("OBSERVATIONS");
//       pb.ensureSpace(10);
//       doc.setFontSize(8);
//       doc.setFont("helvetica", "italic");
//       doc.setTextColor(...PDF_COLORS.GRAY_DARK);
//       const obsLines = doc.splitTextToSize(observ, pb.contentWidth - 8);
//       obsLines.forEach((line) => {
//         pb.ensureSpace(5);
//         doc.text(line, margin + 4, pb.y);
//         pb.y += 4.5;
//       });
//       pb.y += 4;
//     }

//     // ════════════════════════════════════════════════════════════════
//     //  QR CODE GRAND (si webUrl et pas déjà dans le bloc prix)
//     // ════════════════════════════════════════════════════════════════
//     if (qrImg && webUrl) {
//       pb.ensureSpace(35);
//       doc.setFillColor(...PDF_COLORS.GRAY_BG);
//       doc.roundedRect(margin, pb.y, pb.contentWidth, 30, 2, 2, "F");

//       doc.addImage(qrImg, "PNG", margin + 4, pb.y + 3, 24, 24);

//       doc.setTextColor(...PDF_COLORS.BLACK);
//       doc.setFontSize(9);
//       doc.setFont("helvetica", "bold");
//       doc.text("Voir cet article en ligne", margin + 34, pb.y + 12);

//       doc.setTextColor(...PDF_COLORS.GRAY);
//       doc.setFontSize(7);
//       doc.setFont("helvetica", "normal");
//       const urlTruncated = webUrl.length > 80 ? webUrl.substring(0, 77) + "..." : webUrl;
//       doc.text(urlTruncated, margin + 34, pb.y + 19);

//       pb.y += 34;
//     }

//     // Finaliser (dessiner footer dernière page)
//     pb.finalize();

//     const filename = isVitrine
//       ? `Fiche_Vitrine_${safeTrim(article.NART)}.pdf`
//       : `Fiche_Complete_${safeTrim(article.NART)}.pdf`;
//     doc.save(filename);
//   }, [article, photoUrl, hasActivePromo, selectedEntrepriseData, stockEnJours, totalSales, totalRuptures, averageMonthlySales, salesData, mappingEntrepots]);

//   // ── Rendu onglet Filiales ─────────────────────────────────────────────────
//   const renderFilialesTab = () => {
//     if (loadingFiliales || fetchingFiliales)
//       return (<div className="filiales-loading"><div className="loading-spinner"></div><p>Chargement des données inter-entreprises...</p></div>);

//     if (!filialeData?.filiales?.length)
//       return (<div className="filiales-empty"><HiGlobe className="filiales-empty-icon" /><h3>Aucune donnée disponible</h3><p>Cet article n'a pas de correspondance dans les autres entités</p></div>);

//     const filiales = filialeData.filiales;
//     const stockFiliales = filialeData.stockTotal || 0;
//     const stockEntrepriseSelectionnee = calculateStockTotal(article);
//     const stockTotalGroupe = stockFiliales + stockEntrepriseSelectionnee;
//     const filialesAvecStock = filiales.filter((f) => f.stock > 0);
//     const filialesSansStock = filiales.filter((f) => f.stock === 0);
//     const nbEntitesAvecStock = filialesAvecStock.length + (stockEntrepriseSelectionnee > 0 ? 1 : 0);

//     return (
//       <div className="tab-panel filiales-tab">
//         <div className="filiales-content">
//           <div className="filiales-summary">
//             <div className="filiales-summary-card total"><HiChartBar className="summary-icon" /><div className="summary-info"><span className="summary-label">Stock Total Groupe</span><span className={`summary-value ${stockTotalGroupe > 0 ? "positive" : "zero"}`}>{formatStock(stockTotalGroupe)}</span></div></div>
//             <div className="filiales-summary-card count"><HiOfficeBuilding className="summary-icon" /><div className="summary-info"><span className="summary-label">Autres entités</span><span className="summary-value">{filiales.length}</span></div></div>
//             <div className="filiales-summary-card available"><HiCube className="summary-icon" /><div className="summary-info"><span className="summary-label">Entités en stock</span><span className="summary-value positive">{nbEntitesAvecStock}</span></div></div>
//           </div>
//           <div className="filiales-list">
//             <h3 className="filiales-list-title"><HiGlobe /> Disponibilité par entité</h3>
//             <div className="filiales-cards-container">
//               {filialesAvecStock.map((f, i) => (
//                 <div key={`stock-${i}`} className="filiale-card has-stock">
//                   <div className="filiale-card-header"><div className="filiale-card-entity"><span className="filiale-trigramme">{f.trigramme}</span><span className="filiale-nom">{f.entrepriseNom}</span></div><div className="filiale-card-status in-stock"><HiCheckCircle /><span>En stock</span></div></div>
//                   <div className="filiale-card-body"><div className="filiale-card-info"><span className="filiale-card-label">Code Article</span><code className="filiale-card-nart">{f.nartFiliale}</code></div><div className="filiale-card-info"><span className="filiale-card-label">Stock</span><span className="filiale-card-stock positive">{formatStock(f.stock)}</span></div><div className="filiale-card-info"><span className="filiale-card-label">Prix TTC</span>{f.hasPrix ? <span className="filiale-card-prix">{formatPrice(f.prix)}</span> : <span className="filiale-card-prix-na">Grossiste</span>}</div></div>
//                 </div>
//               ))}
//               {filialesSansStock.map((f, i) => (
//                 <div key={`nostock-${i}`} className="filiale-card no-stock">
//                   <div className="filiale-card-header"><div className="filiale-card-entity"><span className="filiale-trigramme">{f.trigramme}</span><span className="filiale-nom">{f.entrepriseNom}</span></div><div className="filiale-card-status out-of-stock"><HiXCircle /><span>Rupture</span></div></div>
//                   <div className="filiale-card-body"><div className="filiale-card-info"><span className="filiale-card-label">Code Article</span><code className="filiale-card-nart">{f.nartFiliale}</code></div><div className="filiale-card-info"><span className="filiale-card-label">Stock</span><span className="filiale-card-stock zero">0</span></div><div className="filiale-card-info"><span className="filiale-card-label">Prix TTC</span>{f.hasPrix ? <span className="filiale-card-prix muted">{formatPrice(f.prix)}</span> : <span className="filiale-card-prix-na">Grossiste</span>}</div></div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   if (loadingEntreprises) return (<div className="admin-article-infos-page"><div className="loading-state"><div className="loading-spinner"></div><p>Chargement...</p></div></div>);

//   return (
//     <div className="admin-article-infos-page">
//       {/* Header */}
//       <header className="article-infos-header">
//         <div className="header-left">
//           <button className="btn-back" onClick={() => navigate(-1)}><HiArrowLeft /></button>
//           <div className="header-title">
//             <h1><HiCube className="title-icon" />Fiche Article</h1>
//             <span className="article-nart-badge">{nart}</span>
//           </div>
//           {hasActivePromo && (
//             <div className="promo-indicator-header"><HiFire /><div className="promo-text"><span className="promo-label">Promo</span><span className="promo-discount">-{calculateDiscount(article.PVTETTC, article.PVPROMO)}%</span></div></div>
//           )}
//         </div>

//         <div className="article-navigation">
//           <button className="btn-nav btn-prev" onClick={handleNavigatePrevious} disabled={!previousArticle || loadingAdjacent} title={previousArticle ? `Article précédent: ${previousArticle.NART?.trim()}` : "Aucun article précédent"}>
//             <HiChevronLeft /><span className="nav-label"></span>
//             {previousArticle && <span className="nav-nart">{previousArticle.NART?.trim()}</span>}
//           </button>
//           <div className="nav-divider" />
//           <button className="btn-nav btn-next" onClick={handleNavigateNext} disabled={!nextArticle || loadingAdjacent} title={nextArticle ? `Article suivant: ${nextArticle.NART?.trim()}` : "Aucun article suivant"}>
//             {nextArticle && <span className="nav-nart">{nextArticle.NART?.trim()}</span>}
//             <span className="nav-label"></span><HiChevronRight />
//           </button>
//         </div>

//         <div className="header-center">
//           <div className="entreprise-selector">
//             <HiOfficeBuilding className="selector-icon" />
//             <select value={selectedEntreprise} onChange={handleEntrepriseChange}>
//               <option value="">Sélectionner une entreprise</option>
//               {entreprises?.map((e) => (<option key={e._id} value={e.nomDossierDBF}>{e.trigramme} - {e.nomComplet}</option>))}
//             </select>
//             <HiChevronDown className="selector-arrow" />
//           </div>
//         </div>

//         <div className="header-actions">
//           <button className="btn-action" onClick={refetch} disabled={isFetching} title="Rafraîchir"><HiRefresh className={isFetching ? "spinning" : ""} /></button>
//           <button className="btn-action" onClick={handleInvalidateCache} disabled={invalidating} title="Invalider le cache"><HiCog className={invalidating ? "spinning" : ""} /></button>
//           <button className="btn-action" onClick={() => setShowPrintModal(true)} title="Imprimer la fiche article (PDF)"><HiPrinter /></button>
//         </div>
//       </header>

//       {/* Print Modal */}
//       <PrintModal
//         isOpen={showPrintModal}
//         onClose={() => setShowPrintModal(false)}
//         onGenerate={handleGeneratePdf}
//         articleDesign={article ? safeTrim(article.DESIGN) : ""}
//         nart={nart}
//       />

//       {/* Content */}
//       {!selectedEntreprise ? (
//         <div className="empty-state"><HiOfficeBuilding className="empty-icon" /><h2>Sélectionnez une entreprise</h2><p>Choisissez une entreprise pour voir les informations de l'article</p></div>
//       ) : loadingArticle ? (
//         <div className="loading-state"><div className="loading-spinner"></div><p>Chargement de l'article...</p></div>
//       ) : articleError ? (
//         <div className="error-state"><HiExclamation className="error-icon" /><h2>Article non trouvé</h2><p>L'article {nart} n'existe pas dans {selectedEntrepriseData?.nomComplet}</p><button onClick={() => navigate(-1)}>Retour à la liste</button></div>
//       ) : article ? (
//         <div className="article-infos-content">
//           {/* Bannière promo */}
//           {hasActivePromo && (
//             <div className="promo-mega-banner">
//               <div className="promo-mega-content">
//                 <div className="promo-mega-icon"><HiFire /></div>
//                 <div className="promo-mega-info">
//                   <span className="promo-mega-title">🔥 PROMOTION EN COURS 🔥</span>
//                   <span className="promo-mega-dates">Du <strong>{formatDate(article.DPROMOD)}</strong> au <strong>{formatDate(article.DPROMOF)}</strong></span>
//                 </div>
//               </div>
//               <div className="promo-mega-prices">
//                 <span className="promo-old-price">{formatPrice(article.PVTETTC)}</span>
//                 <span className="promo-new-price">{formatPrice(article.PVPROMO)}</span>
//                 <div className="promo-discount-badge">-{calculateDiscount(article.PVTETTC, article.PVPROMO)}%</div>
//               </div>
//             </div>
//           )}

//           {isRenvoi && (
//             <div className="alert-banner renvoi">
//               <HiSwitchHorizontal className="banner-icon" />
//               <div className="banner-content"><strong>ARTICLE EN RENVOI</strong><span>Remplace l'article {articleOriginal?.nart} ({articleOriginal?.designation})</span></div>
//               {nombreRenvois > 1 && <span className="renvoi-chain">Chaîne de {nombreRenvois} renvois</span>}
//             </div>
//           )}

//           {isRenvoi && articleOriginal && (
//             <div className="renvoi-details-section">
//               <div className="renvoi-details">
//                 <div className="renvoi-from">
//                   <span className="renvoi-label">Article recherché</span>
//                   <span className="renvoi-nart">{articleOriginal.nart}</span>
//                   <span className="renvoi-design">{articleOriginal.designation}</span>
//                   {articleOriginal.gencod && <span className="renvoi-gencod"><HiQrcode /> {articleOriginal.gencod}</span>}
//                 </div>
//                 <div className="renvoi-arrow"><HiSwitchHorizontal /></div>
//                 <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.NART)}`} className="renvoi-to renvoi-to-clickable">
//                   <span className="renvoi-label">Remplacé par <HiExternalLink className="renvoi-link-icon" /></span>
//                   <span className="renvoi-nart">{safeTrim(article.NART)}</span>
//                   <span className="renvoi-design">{safeTrim(article.DESIGN)}</span>
//                   {safeTrim(article.GENCOD) && <span className="renvoi-gencod"><HiQrcode /> {safeTrim(article.GENCOD)}</span>}
//                   <span className="renvoi-click-hint">Cliquer pour voir la fiche →</span>
//                 </Link>
//               </div>
//               {nombreRenvois > 1 && <div className="renvoi-chain-warning">⚠️ Chaîne de {nombreRenvois} renvois</div>}
//             </div>
//           )}

//           {(parseFloat(article.DEPREC) || 0) > 0 && (
//             <div className="alert-banner deprec"><HiExclamation className="banner-icon" /><div className="banner-content"><strong>ARTICLE DÉPRÉCIÉ</strong><span>Dépréciation de {article.DEPREC}%</span></div></div>
//           )}

//           {/* Main Grid */}
//           <div className="article-main-grid">
//             {/* ── Colonne gauche ── */}
//             <div className="article-left-column">
//               <MediaCard
//                 photoUrl={photoUrl}
//                 pdfUrl={pdfUrl}
//                 hasPhotosConfigured={hasPhotosConfigured}
//                 articleDesign={safeTrim(article.DESIGN)}
//                 hasActivePromo={hasActivePromo}
//                 promoDiscount={calculateDiscount(article.PVTETTC, article.PVPROMO)}
//               />

//               <div className="quick-badges">
//                 {hasActivePromo && <div className="quick-badge promo"><HiFire /> PROMO -{calculateDiscount(article.PVTETTC, article.PVPROMO)}%</div>}
//                 {safeTrim(article.WEB) === "O" && <div className="quick-badge web"><HiGlobe /> Visible Web</div>}
//                 {safeTrim(article.FOTO) === "F" && <div className="quick-badge photo"><HiPhotograph /> Photo dispo</div>}
//                 {safeTrim(article.SAV) === "O" && <div className="quick-badge sav"><HiShieldCheck /> SAV</div>}
//                 {safeTrim(article.COMPOSE) === "O" && <div className="quick-badge compose"><HiCollection /> Composé</div>}
//                 {safeTrim(article.RENV) === "O" && <div className="quick-badge renvoi"><HiSwitchHorizontal /> Renvoi</div>}
//               </div>

//               <div className="quick-stats">
//                 <div className="quick-stat"><span className="stat-label">Stock Total</span><span className={`stat-value ${calculateStockTotal(article) > 0 ? "positive" : "zero"}`}>{formatStock(calculateStockTotal(article))}</span></div>
//                 <div className="quick-stat"><span className="stat-label">En Commande</span><span className={`stat-value ${getEnCommande(article) > 0 ? "encde" : ""}`}>{formatStock(getEnCommande(article))}</span></div>
//                 <div className="quick-stat"><span className="stat-label">Ventes 12 mois</span><span className="stat-value">{formatStock(totalSales)}</span></div>
//                 <div className="quick-stat"><span className="stat-label">Ruptures 12 mois</span><span className={`stat-value ${totalRuptures > 0 ? "warning" : ""}`}>{formatStock(totalRuptures)}</span></div>
//                 <div className="quick-stat highlight">
//                   <span className="stat-label"><HiClock style={{ marginRight: "4px", verticalAlign: "middle" }} />Stock en jours</span>
//                   <span className={`stat-value ${stockEnJours === 0 ? "zero" : stockEnJours === Infinity ? "positive" : stockEnJours < 30 ? "warning" : stockEnJours < 90 ? "" : "positive"}`}>{formatStockEnJours(stockEnJours)}</span>
//                 </div>
//                 <div className="quick-stat"><span className="stat-label">Stock en mois</span><span className="stat-value">{formatStockEnMois(stockEnMois)}</span></div>
//                 <div className="quick-stat full-width"><span className="stat-label">Marge</span><span className="stat-value">{calculateMarge(article) ? `${calculateMarge(article)}%` : "-"}</span></div>
//               </div>

//               {safeTrim(article.GENDOUBL) && (
//                 <div className="linked-article-card renvoi-card">
//                   <h4><HiSwitchHorizontal /> Article de renvoi vers</h4>
//                   <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.GENDOUBL)}`} className="linked-article-link"><span className="linked-nart">{safeTrim(article.GENDOUBL)}</span><HiExternalLink /></Link>
//                   <p className="linked-article-hint">Cet article renvoie vers un autre article</p>
//                 </div>
//               )}

//               {safeTrim(article.ASSOCIE) && (
//                 <div className="linked-article-card">
//                   <h4><HiCollection /> Article associé</h4>
//                   <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.ASSOCIE)}`} className="linked-article-link"><span className="linked-nart">{safeTrim(article.ASSOCIE)}</span><HiExternalLink /></Link>
//                 </div>
//               )}
//             </div>

//             {/* ── Colonne droite ── */}
//             <div className="article-right-column">
//               <div className="tabs-nav">
//                 <button className={`tab-btn ${activeTab === "general" ? "active" : ""}`} onClick={() => setActiveTab("general")}><HiClipboardList /> <span>Général</span></button>
//                 <button className={`tab-btn ${activeTab === "stocks" ? "active" : ""}`} onClick={() => setActiveTab("stocks")}><HiArchive /> <span>Stocks</span></button>
//                 <button className={`tab-btn ${activeTab === "prix" ? "active" : ""}`} onClick={() => setActiveTab("prix")}><HiCurrencyDollar /> <span>Prix</span></button>
//                 <button className={`tab-btn ${activeTab === "ventes" ? "active" : ""}`} onClick={() => setActiveTab("ventes")}><HiChartBar /> <span>Ventes</span></button>
//                 <button className={`tab-btn ${activeTab === "filiales" ? "active" : ""}`} onClick={() => setActiveTab("filiales")}>
//                   <HiGlobe /> <span>Stock Groupe</span>
//                   {filialeData?.filiales?.length > 0 && <span className="tab-badge">{filialeData.filiales.length}</span>}
//                 </button>
//                 <button className={`tab-btn ${activeTab === "autres" ? "active" : ""}`} onClick={() => setActiveTab("autres")}><HiCog /> <span>Autres</span></button>
//               </div>

//               <div className="tab-content">
//                 {/* ── Général ── */}
//                 {activeTab === "general" && (
//                   <div className="tab-panel">
//                     <div className="info-section designation-section">
//                       <h2 className="article-design-main">{safeTrim(article.DESIGN)}</h2>
//                       {safeTrim(article.DESIGN2) && <p className="article-design-sub">{safeTrim(article.DESIGN2)}</p>}
//                       {safeTrim(article.DESIFRN) && <p className="article-design-frn"><span>Désignation fournisseur:</span> {safeTrim(article.DESIFRN)}</p>}
//                     </div>
//                     <div className="info-section">
//                       <h3><HiQrcode /> Identification</h3>
//                       <div className="info-grid cols-3">
//                         <div className="info-item"><label>Code NART</label><span className="value highlight mono">{safeTrim(article.NART)}</span></div>
//                         <div className="info-item"><label>Code barre (GENCOD)</label><span className="value mono">{safeTrim(article.GENCOD) || "-"}</span></div>
//                         <div className="info-item"><label>Réf. fournisseur</label><span className="value">{safeTrim(article.REFER) || "-"}</span></div>
//                         <div className="info-item"><label>Fournisseur</label><span className="value">{article.FOURN || "-"}</span></div>
//                         <div className="info-item"><label>Groupe / Famille</label><span className="value tag">{safeTrim(article.GROUPE) || "-"}</span></div>
//                         <div className="info-item"><label>Code tarif</label><span className="value">{safeTrim(article.CODTAR) || "-"}</span></div>
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiArchive /> Conditionnement</h3>
//                       <div className="info-grid cols-4">
//                         <div className="info-item"><label>Unité</label><span className="value">{safeTrim(article.UNITE) || "-"}</span></div>
//                         <div className="info-item"><label>Conditionnement</label><span className="value">{article.CONDITNM || "-"}</span></div>
//                         <div className="info-item"><label>Volume</label><span className="value">{article.VOL || "-"}</span></div>
//                         <div className="info-item"><label>Colisage (KL)</label><span className="value">{safeTrim(article.KL) || "-"}</span></div>
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiLocationMarker /> Emplacements / Gisements</h3>
//                       <div className="info-grid cols-3">
//                         <div className="info-item highlight-box"><label>Place principale</label><span className="value">{safeTrim(article.PLACE) || "-"}</span></div>
//                         {["GISM1","GISM2","GISM3","GISM4","GISM5"].map((g, i) => (
//                           <div key={g} className="info-item"><label>Gisement {i + 1}</label><span className="value">{safeTrim(article[g]) || "-"}</span></div>
//                         ))}
//                       </div>
//                     </div>
//                     {safeTrim(article.OBSERV) && (
//                       <div className="info-section observations-section">
//                         <h3><HiDocumentText /> Observations</h3>
//                         <p className="observations-text">{safeTrim(article.OBSERV)}</p>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* ── Stocks ── */}
//                 {activeTab === "stocks" && (
//                   <div className="tab-panel">
//                     <div className="info-section">
//                       <h3><HiArchive /> Stocks par emplacement</h3>
//                       <div className="stocks-grid">
//                         <div className="stock-card total"><div className="stock-card-header"><span className="stock-label">Stock Total</span><HiArchive className="stock-icon" /></div><span className={`stock-value ${calculateStockTotal(article) > 0 ? "positive" : "zero"}`}>{formatStock(calculateStockTotal(article))}</span></div>
//                         <div className="stock-card encde"><div className="stock-card-header"><span className="stock-label">En Commande</span><HiTruck className="stock-icon" /></div><span className={`stock-value ${getEnCommande(article) > 0 ? "encde" : ""}`}>{formatStock(getEnCommande(article))}</span></div>
//                         <div className="stock-card stock-days"><div className="stock-card-header"><span className="stock-label">Stock en Jours</span><HiClock className="stock-icon" /></div><span className={`stock-value ${stockEnJours === 0 ? "zero" : stockEnJours === Infinity ? "positive" : stockEnJours < 30 ? "warning" : stockEnJours < 90 ? "" : "positive"}`}>{formatStockEnJours(stockEnJours)}</span><span className="stock-subvalue">({formatStockEnMois(stockEnMois)})</span></div>
//                         {["S1","S2","S3","S4","S5"].map((key) => (
//                           <div key={key} className="stock-card"><div className="stock-card-header"><span className="stock-label">{mappingEntrepots[key]}</span><span className="stock-key">{key}</span></div><span className={`stock-value ${parseFloat(article[key]) > 0 ? "positive" : "zero"}`}>{formatStock(article[key])}</span></div>
//                         ))}
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiTrendingDown /> Gestion des stocks</h3>
//                       <div className="info-grid cols-4">
//                         <div className="info-item"><label>Stock STOCK (ancien)</label><span className={`value ${parseFloat(article.STOCK) > 0 ? "positive" : "zero"}`}>{formatStock(article.STOCK)}</span></div>
//                         <div className="info-item"><label>Stock local 2 (STLOC2)</label><span className="value">{formatStock(article.STLOC2)}</span></div>
//                         <div className="info-item"><label>Stock mini (SMINI)</label><span className="value warning">{formatStock(article.SMINI)}</span></div>
//                         <div className="info-item"><label>Réservé</label><span className="value reserved">{formatStock(article.RESERV)}</span></div>
//                         <div className="info-item"><label>En commande (ENCDE)</label><span className="value">{formatStock(article.ENCDE)}</span></div>
//                         <div className="info-item"><label>Commande spéciale</label><span className="value">{formatStock(article.CDESPEC)}</span></div>
//                         <div className="info-item"><label>Stock sécurité</label><span className="value">{formatStock(article.STSECUR)}</span></div>
//                         <div className="info-item"><label>Tarif liste (TARIFL)</label><span className="value">{article.TARIFL ? "Oui" : "Non"}</span></div>
//                       </div>
//                     </div>
//                     <div className="info-section chart-section">
//                       <h3><HiChartBar /> Répartition des stocks</h3>
//                       <div className="chart-container">
//                         {(() => {
//                           const items = ["S1","S2","S3","S4","S5"].map((k) => ({ name: mappingEntrepots[k], value: parseFloat(article[k]) || 0 }));
//                           const maxV = Math.max(...items.map(d => d.value), 1);
//                           return (
//                             <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: 300, padding: "20px 10px 30px" }}>
//                               {items.map((item, i) => {
//                                 const h = maxV > 0 ? (item.value / maxV) * 240 : 0;
//                                 return (
//                                   <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
//                                     <span style={{ fontSize: "12px", color: "#f0f0f5", fontWeight: 600 }}>{item.value > 0 ? item.value : ""}</span>
//                                     <div style={{ width: "100%", maxWidth: 60, height: h, backgroundColor: "#6366f1", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease", minHeight: item.value > 0 ? 4 : 0 }} />
//                                     <span style={{ fontSize: "11px", color: "#a0a0b0" }}>{item.name}</span>
//                                   </div>
//                                 );
//                               })}
//                             </div>
//                           );
//                         })()}
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* ── Prix ── */}
//                 {activeTab === "prix" && (
//                   <div className="tab-panel">
//                     <div className="info-section">
//                       <h3><HiCurrencyDollar /> Prix de vente</h3>
//                       <div className="price-cards">
//                         <div className={`price-card main ${hasActivePromo ? "has-promo" : ""}`}><span className="price-label">Prix TTC</span><span className={`price-value ${hasActivePromo ? "strikethrough" : ""}`}>{formatPrice(article.PVTETTC)}</span></div>
//                         {hasActivePromo && (<div className="price-card promo"><span className="price-label">Prix PROMO</span><span className="price-value">{formatPrice(article.PVPROMO)}</span><span className="discount-badge">-{calculateDiscount(article.PVTETTC, article.PVPROMO)}%</span></div>)}
//                         <div className="price-card"><span className="price-label">Prix HT</span><span className="price-value">{formatPrice(article.PVTE)}</span></div>
//                         <div className="price-card"><span className="price-label">Prix détail</span><span className="price-value">{formatPrice(article.PDETAIL)}</span></div>
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiTrendingUp /> Prix d'achat & Marges</h3>
//                       <div className="info-grid cols-4">
//                         <div className="info-item highlight-box">
//                           <label>Prix d'achat (PACHAT){safeTrim(article.DEVISE) && safeTrim(article.DEVISE) !== "XPF" && <span className="devise-badge"><HiCurrencyEuro /> {safeTrim(article.DEVISE)}</span>}</label>
//                           <span className="value">
//                             {(() => {
//                               const devise = safeTrim(article.DEVISE);
//                               const pachat = parseFloat(article.PACHAT) || 0;
//                               if (!devise || devise === "XPF" || devise === "CFP" || devise === "F") return formatPrice(pachat);
//                               return `${pachat.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${devise}`;
//                             })()}
//                           </span>
//                           {safeTrim(article.DEVISE) && !["XPF","CFP","F"].includes(safeTrim(article.DEVISE)) && (
//                             <div className="conversion-info">
//                               {(() => {
//                                 const conv = convertToXPF(parseFloat(article.PACHAT) || 0, safeTrim(article.DEVISE));
//                                 if (conv.error) return <span className="conversion-error">⚠️ {conv.error}</span>;
//                                 if (conv.amountXPF !== null) return (<><span className="conversion-result">≈ {formatPrice(conv.amountXPF)}</span><span className="conversion-rate">(1 {conv.fromCurrency} = {conv.rate?.toFixed(2)} XPF)</span>{exchangeRates?.isFallback && <span className="conversion-warning">Taux approximatif</span>}</>);
//                                 return null;
//                               })()}
//                             </div>
//                           )}
//                         </div>
//                         <div className="info-item"><label>Prix de revient (PREV)</label><span className="value">{formatPrice(article.PREV)}</span></div>
//                         <div className="info-item"><label>Dernier prix revient</label><span className="value">{formatPrice(article.DERPREV)}</span></div>
//                         <div className="info-item highlight-box success"><label>Marge calculée</label><span className="value">{calculateMarge(article) ? `${calculateMarge(article)}%` : "-"}</span>{calculateMarge(article) && <span className="marge-formula">(PVTE - DERPREV) / PVTE</span>}</div>
//                         <div className="info-item"><label>% Marge (POURC)</label><span className="value">{formatPercent(article.POURC)}</span></div>
//                         <div className="info-item"><label>Devise achat</label><span className="value">{safeTrim(article.DEVISE) || "XPF (défaut)"}</span></div>
//                         {exchangeRates && (<div className="info-item"><label>Taux de change{exchangeRatesLoading && " (chargement...)"}</label><span className="value small">{exchangeRates.isFallback ? <span className="warning">Taux approximatifs</span> : `Mis à jour: ${exchangeRates.date}`}</span></div>)}
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiTag /> Remises quantité</h3>
//                       <div className="info-grid cols-4">
//                         <div className="info-item"><label>Qté niveau 2</label><span className="value">{article.QT2 || "-"}</span></div>
//                         <div className="info-item"><label>Prix niveau 2</label><span className="value">{formatPrice(article.PR2)}</span></div>
//                         <div className="info-item"><label>Qté niveau 3</label><span className="value">{article.QT3 || "-"}</span></div>
//                         <div className="info-item"><label>Prix niveau 3</label><span className="value">{formatPrice(article.PR3)}</span></div>
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiDocumentText /> Fiscalité</h3>
//                       <div className="info-grid cols-4">
//                         <div className="info-item highlight-box"><label>Taux TGC (TAXES)</label><span className="value">{formatPercent(article.TAXES)}</span></div>
//                         <div className="info-item"><label>Autre TVA (ATVA)</label><span className="value">{formatPercent(article.ATVA)}</span></div>
//                         <div className="info-item"><label>Taux à déduire</label><span className="value">{formatPercent(article.TXADEDUIRE)}</span></div>
//                         <div className="info-item"><label>Code TGC</label><span className="value">{safeTrim(article.CODTGC) || "-"}</span></div>
//                       </div>
//                     </div>
//                     {(article.DPROMOD || article.DPROMOF) && (
//                       <div className="info-section promo-section">
//                         <h3><HiTag /> Informations promotion</h3>
//                         <div className="info-grid cols-3">
//                           <div className="info-item"><label>Date début promo</label><span className="value">{formatDate(article.DPROMOD)}</span></div>
//                           <div className="info-item"><label>Date fin promo</label><span className="value">{formatDate(article.DPROMOF)}</span></div>
//                           <div className="info-item"><label>Prix promo</label><span className="value promo">{formatPrice(article.PVPROMO)}</span></div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* ── Ventes ── */}
//                 {activeTab === "ventes" && (
//                   <div className="tab-panel">
//                     <div className="info-section chart-section">
//                       <h3><HiTrendingUp /> Historique des ventes (12 derniers mois)</h3>
//                       <div className="chart-stats">
//                         <div className="chart-stat"><span className="stat-value">{formatStock(totalSales)}</span><span className="stat-label">Total ventes</span></div>
//                         <div className="chart-stat"><span className="stat-value">{averageMonthlySales.toFixed(1)}</span><span className="stat-label">Moyenne/mois</span></div>
//                         <div className="chart-stat highlight"><span className="stat-value">{formatStockEnJours(stockEnJours)}</span><span className="stat-label">Stock en jours</span></div>
//                       </div>
//                       <div className="chart-container large">
//                         {(() => {
//                           const vals = salesData.map(d => d.ventes);
//                           const maxV = Math.max(...vals, 1);
//                           const W = 600, H = 300, pad = { t: 20, r: 15, b: 10, l: 40 };
//                           const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
//                           const pts = vals.map((v, i) => ({ x: pad.l + (vals.length > 1 ? (i / (vals.length - 1)) * cW : cW / 2), y: pad.t + cH - (v / maxV) * cH, v }));
//                           const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
//                           const area = `${line} L ${pts[pts.length-1]?.x||0} ${pad.t+cH} L ${pts[0]?.x||0} ${pad.t+cH} Z`;
//                           return (
//                             <div style={{ width: "100%", height: 350 }}>
//                               <svg viewBox={`0 0 ${W} ${H+40}`} style={{ width: "100%", height: "100%" }}>
//                                 <defs><linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/></linearGradient></defs>
//                                 {[0,.25,.5,.75,1].map((f,idx) => { const y=pad.t+cH*(1-f); return <g key={idx}><line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke="#2a2a3a" strokeDasharray="3 3"/><text x={pad.l-6} y={y+4} textAnchor="end" fill="#a0a0b0" fontSize="10">{Math.round(maxV*f)}</text></g>; })}
//                                 <path d={area} fill="url(#gV)"/><path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
//                                 {pts.map((p,i) => <g key={i}><circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="#1a1a25" strokeWidth="2"/>{p.v > 0 && <text x={p.x} y={p.y-12} textAnchor="middle" fill="#f0f0f5" fontSize="11" fontWeight="600">{p.v}</text>}</g>)}
//                                 {salesData.map((d,i) => { const x=pad.l+(vals.length>1?(i/(vals.length-1))*cW:cW/2); return <text key={i} x={x} y={H+25} textAnchor="middle" fill="#a0a0b0" fontSize="10">{d.name}</text>; })}
//                               </svg>
//                             </div>
//                           );
//                         })()}
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiChartBar /> Détail des ventes par mois</h3>
//                       <div className="sales-table">
//                         <table>
//                           <thead><tr><th>Mois</th><th className="text-right">Ventes</th><th className="text-right">Ruptures</th></tr></thead>
//                           <tbody>
//                             {salesData.map((item, i) => (
//                               <tr key={item.name + i}>
//                                 <td>{item.fullName}</td>
//                                 <td className="text-right"><span className={item.ventes > 0 ? "positive" : ""}>{formatStock(item.ventes)}</span></td>
//                                 <td className="text-right"><span className={ruptureData[i]?.ruptures > 0 ? "warning" : ""}>{formatStock(ruptureData[i]?.ruptures || 0)}</span></td>
//                               </tr>
//                             ))}
//                           </tbody>
//                           <tfoot><tr><td><strong>Total</strong></td><td className="text-right"><strong>{formatStock(totalSales)}</strong></td><td className="text-right"><strong>{formatStock(totalRuptures)}</strong></td></tr></tfoot>
//                         </table>
//                       </div>
//                     </div>
//                     {totalRuptures > 0 && (
//                       <div className="info-section chart-section">
//                         <h3><HiExclamation /> Historique des ruptures (12 derniers mois)</h3>
//                         <div className="chart-stats warning"><div className="chart-stat"><span className="stat-value">{formatStock(totalRuptures)}</span><span className="stat-label">Total ruptures</span></div></div>
//                         <div className="chart-container">
//                           {(() => {
//                             const maxV = Math.max(...ruptureData.map(d => d.ruptures), 1);
//                             return (
//                               <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: 250, padding: "20px 10px 30px" }}>
//                                 {ruptureData.map((item, i) => {
//                                   const h = maxV > 0 ? (item.ruptures / maxV) * 190 : 0;
//                                   return (
//                                     <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
//                                       <span style={{ fontSize: "11px", color: "#f0f0f5", fontWeight: 600 }}>{item.ruptures > 0 ? item.ruptures : ""}</span>
//                                       <div style={{ width: "100%", maxWidth: 50, height: h, backgroundColor: "#f59e0b", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease", minHeight: item.ruptures > 0 ? 4 : 0 }} />
//                                       <span style={{ fontSize: "10px", color: "#a0a0b0" }}>{item.name}</span>
//                                     </div>
//                                   );
//                                 })}
//                               </div>
//                             );
//                           })()}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* ── Filiales ── */}
//                 {activeTab === "filiales" && renderFilialesTab()}

//                 {/* ── Autres ── */}
//                 {activeTab === "autres" && (
//                   <div className="tab-panel">
//                     <div className="info-section">
//                       <h3><HiCalendar /> Dates importantes</h3>
//                       <div className="info-grid cols-3">
//                         <div className="info-item"><label>Date création</label><span className="value">{formatDate(article.CREATION)}</span></div>
//                         <div className="info-item"><label>Date inventaire</label><span className="value">{formatDate(article.DATINV)}</span></div>
//                         <div className="info-item"><label>Date inventaire 2</label><span className="value">{formatDate(article.DATINV2)}</span></div>
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiDocumentText /> Informations douanières</h3>
//                       <div className="info-grid cols-3">
//                         <div className="info-item"><label>Code douane</label><span className="value mono">{safeTrim(article.DOUANE) || "-"}</span></div>
//                         <div className="info-item"><label>Devise</label><span className="value">{safeTrim(article.DEVISE) || "-"}</span></div>
//                         <div className="info-item"><label>Code mise à jour</label><span className="value">{safeTrim(article.CODMAJ) || "-"}</span></div>
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiCog /> Paramètres spéciaux</h3>
//                       <div className="info-grid cols-4">
//                         <div className="info-item"><label>SAV</label><span className={`value badge ${safeTrim(article.SAV) === "O" ? "success" : ""}`}>{safeTrim(article.SAV) === "O" ? "Oui" : "Non"}</span></div>
//                         <div className="info-item"><label>Garantie</label><span className="value">{safeTrim(article.GARANTIE) || "-"}</span></div>
//                         <div className="info-item"><label>Article composé</label><span className={`value badge ${safeTrim(article.COMPOSE) === "O" ? "info" : ""}`}>{safeTrim(article.COMPOSE) === "O" ? "Oui" : "Non"}</span></div>
//                         <div className="info-item"><label>Article en renvoi</label><span className={`value badge ${safeTrim(article.RENV) === "O" ? "warning" : ""}`}>{safeTrim(article.RENV) === "O" ? "Oui" : "Non"}</span></div>
//                         <div className="info-item"><label>Visible Web</label><span className={`value badge ${safeTrim(article.WEB) === "O" ? "success" : ""}`}>{safeTrim(article.WEB) === "O" ? "Oui" : "Non"}</span></div>
//                         <div className="info-item"><label>Photo disponible</label><span className={`value badge ${safeTrim(article.FOTO) === "F" ? "success" : ""}`}>{safeTrim(article.FOTO) === "F" ? "Oui" : "Non"}</span></div>
//                         <div className="info-item"><label>Texte</label><span className="value">{safeTrim(article.TEXTE) || "-"}</span></div>
//                         <div className="info-item"><label>Couleur</label><span className="value">{safeTrim(article.COULR) || "-"}</span></div>
//                       </div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiExclamation /> Dépréciation</h3>
//                       <div className="info-grid cols-2"><div className="info-item highlight-box warning"><label>Taux de dépréciation</label><span className="value">{formatPercent(article.DEPREC)}</span></div></div>
//                     </div>
//                     <div className="info-section">
//                       <h3><HiLink /> Articles liés</h3>
//                       <div className="info-grid cols-2">
//                         <div className="info-item"><label>Article de renvoi (GENDOUBL)</label>{safeTrim(article.GENDOUBL) ? <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.GENDOUBL)}`} className="value link">{safeTrim(article.GENDOUBL)}<HiExternalLink /></Link> : <span className="value">-</span>}</div>
//                         <div className="info-item"><label>Article associé</label>{safeTrim(article.ASSOCIE) ? <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.ASSOCIE)}`} className="value link">{safeTrim(article.ASSOCIE)}<HiExternalLink /></Link> : <span className="value">-</span>}</div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       ) : null}
//     </div>
//   );
// };

// export default AdminArticleInfosScreen;

// export default AdminArticleInfosScreen;
// import default React and hooks
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

// Icons
import {
  HiArrowLeft,
  HiChevronLeft,
  HiChevronRight,
  HiCube,
  HiOfficeBuilding,
  HiPhotograph,
  HiTag,
  HiExclamation,
  HiGlobe,
  HiQrcode,
  HiCurrencyDollar,
  HiTrendingUp,
  HiTrendingDown,
  HiChartBar,
  HiLocationMarker,
  HiCalendar,
  HiClipboardList,
  HiRefresh,
  HiExternalLink,
  HiSwitchHorizontal,
  HiShieldCheck,
  HiCog,
  HiArchive,
  HiCollection,
  HiDocumentText,
  HiChevronDown,
  HiPrinter,
  HiLink,
  HiCheckCircle,
  HiXCircle,
  HiTruck,
  HiClock,
  HiCurrencyEuro,
  HiSparkles,
  HiFire,
  HiDownload,
  HiEye,
  HiPlus,
  HiTrash,
  HiX,
} from "react-icons/hi";

// APIs
import { useGetEntreprisesQuery } from "../../slices/entrepriseApiSlice";
import {
  useGetArticleByNartQuery,
  useGetAdjacentArticlesQuery,
  useInvalidateArticleCacheMutation,
  getPhotoUrl,
} from "../../slices/articleApiSlice";
import { useGetArticleFilialeDataQuery } from "../../slices/fillialeApiSlice";

// PDF Generation
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

// CSS
import "./AdminArticleInfosScreen.css";

// ─────────────────────────────────────────────────────────────────────────────
// Helper : construire l'URL du PDF à partir du trigramme et du NART
// ─────────────────────────────────────────────────────────────────────────────
const getPdfUrl = (trigramme, nart) => {
  if (!trigramme || !nart) return null;
  const cleanNart = String(nart).trim();
  return `/photos/${trigramme}/${cleanNart}.pdf`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Couleurs de la charte PDF
// ─────────────────────────────────────────────────────────────────────────────
const PDF_COLORS = {
  BLACK: [26, 26, 26],
  YELLOW: [255, 200, 0],
  YELLOW_LIGHT: [255, 230, 120],
  WHITE: [255, 255, 255],
  GRAY_DARK: [80, 80, 80],
  GRAY: [120, 120, 120],
  GRAY_LIGHT: [200, 200, 200],
  GRAY_BG: [245, 245, 245],
  PROMO_RED: [220, 38, 38],
};

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : MediaCard (inchangé)
// ─────────────────────────────────────────────────────────────────────────────
const MediaCard = ({
  photoUrl,
  pdfUrl,
  hasPhotosConfigured,
  articleDesign,
  hasActivePromo,
  promoDiscount,
}) => {
  const [photoStatus, setPhotoStatus] = useState(hasPhotosConfigured ? "loading" : "error");
  const [pdfStatus, setPdfStatus] = useState("checking");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  useEffect(() => {
    setPhotoStatus(hasPhotosConfigured && photoUrl ? "loading" : "error");
  }, [photoUrl, hasPhotosConfigured]);

  useEffect(() => {
    if (!pdfUrl) { setPdfStatus("unavailable"); return; }
    let cancelled = false;
    setPdfStatus("checking");
    fetch(pdfUrl, { method: "HEAD" })
      .then((res) => { if (!cancelled) setPdfStatus(res.ok ? "available" : "unavailable"); })
      .catch(() => { if (!cancelled) setPdfStatus("unavailable"); });
    return () => { cancelled = true; };
  }, [pdfUrl]);

  const photoOk = hasPhotosConfigured && photoStatus === "ok";
  const pdfOk = pdfStatus === "available";
  const checking = pdfStatus === "checking";

  return (
    <>
      <div className="photo-card">
        {hasPhotosConfigured && photoStatus !== "error" ? (
          <div className={`photo-wrapper ${photoStatus === "ok" ? "loaded" : ""}`}>
            <img src={photoUrl} alt={articleDesign} onError={() => setPhotoStatus("error")} onLoad={() => setPhotoStatus("ok")} />
            {photoStatus === "loading" && (<div className="photo-loading"><div className="loading-spinner small" /></div>)}
            {hasActivePromo && (<div className="photo-badge promo">-{promoDiscount}%</div>)}
          </div>
        ) : (
          <div className={`no-photo ${pdfOk ? "no-photo--has-pdf" : ""}`}>
            <HiPhotograph /><span>Photo indisponible</span>
          </div>
        )}
        <div className="media-status-bar">
          <div className={`media-status-pill ${photoOk ? "pill--ok" : "pill--ko"}`}>
            <HiPhotograph className="pill-icon" />
            <span className="pill-label">{photoStatus === "loading" ? "Photo…" : photoOk ? "Photo disponible" : "Photo indisponible"}</span>
            {photoStatus === "loading" ? <div className="pill-spinner" /> : photoOk ? <HiCheckCircle className="pill-check" /> : <HiXCircle className="pill-cross" />}
          </div>
          <div className={`media-status-pill ${checking ? "pill--checking" : pdfOk ? "pill--ok" : "pill--ko"}`}>
            <HiDocumentText className="pill-icon" />
            <span className="pill-label">{checking ? "Fiche technique…" : pdfOk ? "Fiche technique disponible" : "Fiche technique indisponible"}</span>
            {checking ? <div className="pill-spinner" /> : pdfOk ? <HiCheckCircle className="pill-check" /> : <HiXCircle className="pill-cross" />}
          </div>
        </div>
        {pdfOk && (
          <div className="pdf-actions">
            <button className="btn-pdf btn-pdf--view" onClick={() => setPdfModalOpen(true)} title="Voir la fiche technique"><HiEye /><span>Voir la fiche</span></button>
            <a className="btn-pdf btn-pdf--download" href={pdfUrl} download target="_blank" rel="noopener noreferrer" title="Télécharger la fiche technique"><HiDownload /><span>Télécharger</span></a>
          </div>
        )}
      </div>
      {pdfModalOpen && (
        <div className="pdf-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPdfModalOpen(false); }}>
          <div className="pdf-modal">
            <div className="pdf-modal-header">
              <h3><HiDocumentText /> Fiche technique — {articleDesign}</h3>
              <div className="pdf-modal-actions">
                <a href={pdfUrl} download className="btn-pdf btn-pdf--download small" title="Télécharger"><HiDownload /><span>Télécharger</span></a>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-pdf btn-pdf--view small" title="Ouvrir dans un nouvel onglet"><HiExternalLink /><span>Nouvel onglet</span></a>
                <button className="pdf-modal-close" onClick={() => setPdfModalOpen(false)} title="Fermer"><HiXCircle /></button>
              </div>
            </div>
            <div className="pdf-modal-body">
              <iframe src={`${pdfUrl}#toolbar=1&navpanes=0`} title="Fiche technique" width="100%" height="100%" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : PrintModal
// Modale pré-génération PDF avec sélection template, description,
// caractéristiques dynamiques et lien web optionnel (QR code)
// ─────────────────────────────────────────────────────────────────────────────
const PrintModal = ({ isOpen, onClose, onGenerate, articleDesign, nart }) => {
  const [template, setTemplate] = useState("complete"); // "complete" | "vitrine" | "etiquette"
  const [description, setDescription] = useState("");
  const [characteristics, setCharacteristics] = useState([]);
  const [webUrl, setWebUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleAddCharacteristic = () => {
    setCharacteristics((prev) => [...prev, { label: "", value: "", id: Date.now() }]);
  };

  const handleRemoveCharacteristic = (id) => {
    setCharacteristics((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCharChange = (id, field, val) => {
    setCharacteristics((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate({
        template,
        description: description.trim(),
        characteristics: characteristics.filter((c) => c.label.trim() || c.value.trim()),
        webUrl: webUrl.trim(),
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    if (!generating) {
      setDescription("");
      setCharacteristics([]);
      setWebUrl("");
      setTemplate("complete");
      onClose();
    }
  };

  if (!isOpen) return null;

  const templates = [
    {
      id: "complete",
      label: "Fiche complète",
      desc: "Toutes les informations : prix d'achat, marges, stocks, détails complets",
      icon: "📋",
    },
    {
      id: "vitrine",
      label: "Fiche vitrine",
      desc: "Version client : prix TTC, promo, photo, sans marges ni prix d'achat",
      icon: "🏪",
    },
    {
      id: "etiquette",
      label: "Étiquette prix",
      desc: "Format 5×3 cm : NART, désignation, code-barres, prix TTC & promo",
      icon: "🏷️",
    },
  ];

  return (
    <div className="print-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="print-modal">
        {/* Header */}
        <div className="print-modal-header">
          <div className="print-modal-title">
            <HiPrinter />
            <div>
              <h3>Générer une fiche PDF</h3>
              <span className="print-modal-subtitle">{nart} — {articleDesign}</span>
            </div>
          </div>
          <button className="print-modal-close" onClick={handleClose} disabled={generating}>
            <HiX />
          </button>
        </div>

        {/* Body */}
        <div className="print-modal-body">

          {/* Template selector */}
          <div className="print-section">
            <label className="print-section-label">Type de fiche</label>
            <div className="template-selector">
              {templates.map((t) => (
                <button
                  key={t.id}
                  className={`template-option ${template === t.id ? "active" : ""}`}
                  onClick={() => setTemplate(t.id)}
                >
                  <span className="template-icon">{t.icon}</span>
                  <span className="template-label">{t.label}</span>
                  <span className="template-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description (pas pour étiquette) */}
          {template !== "etiquette" && (
            <div className="print-section">
              <label className="print-section-label">Description (optionnel)</label>
              <textarea
                className="print-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoutez une description libre pour cet article..."
                rows={3}
              />
            </div>
          )}

          {/* Caractéristiques dynamiques (pas pour étiquette) */}
          {template !== "etiquette" && (
            <div className="print-section">
              <label className="print-section-label">Caractéristiques supplémentaires (optionnel)</label>
              <div className="chars-list">
                {characteristics.map((c) => (
                  <div key={c.id} className="char-row">
                    <input
                      type="text"
                      className="char-input label"
                      placeholder="Label (ex: Poids)"
                      value={c.label}
                      onChange={(e) => handleCharChange(c.id, "label", e.target.value)}
                    />
                    <input
                      type="text"
                      className="char-input value"
                      placeholder="Valeur (ex: 2.5 kg)"
                      value={c.value}
                      onChange={(e) => handleCharChange(c.id, "value", e.target.value)}
                    />
                    <button
                      className="char-remove"
                      onClick={() => handleRemoveCharacteristic(c.id)}
                      title="Supprimer"
                    >
                      <HiTrash />
                    </button>
                  </div>
                ))}
                <button className="char-add" onClick={handleAddCharacteristic}>
                  <HiPlus /> Ajouter une caractéristique
                </button>
              </div>
            </div>
          )}

          {/* URL web optionnel (QR code) */}
          <div className="print-section">
            <label className="print-section-label">
              Lien page web (optionnel)
              <span className="print-section-hint">Un QR code sera ajouté sur la fiche</span>
            </label>
            <input
              type="url"
              className="print-input"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              placeholder="https://www.exemple.com/article/..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="print-modal-footer">
          <button className="print-btn cancel" onClick={handleClose} disabled={generating}>
            Annuler
          </button>
          <button className="print-btn generate" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><div className="btn-spinner" /> Génération...</>
            ) : (
              <><HiPrinter /> Générer le PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires PDF
// ─────────────────────────────────────────────────────────────────────────────

/** Charge une image (URL) en base64 data URL. Retourne null si échec. */
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

/** Génère un code-barres en base64 data URL. */
const generateBarcodeBase64 = (value, options = {}) => {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, value, {
      format: "CODE128",
      width: 1,
      height: 22,
      displayValue: true,
      fontSize: 9,
      margin: 2,
      background: "#FFFFFF",
      lineColor: "#000000",
      ...options,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

/** Génère un QR code en base64 data URL via import dynamique. Retourne null si lib absente. */
const generateQRCodeBase64 = async (url) => {
  try {
    const QRCode = await import("qrcode");
    const toDataURL = QRCode.toDataURL || QRCode.default?.toDataURL;
    if (!toDataURL) return null;
    return await toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
  } catch {
    console.warn("QR code generation failed. Install qrcode: npm install qrcode");
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Classe helper pour dessiner le PDF avec gestion auto du saut de page
// ─────────────────────────────────────────────────────────────────────────────
class PdfBuilder {
  constructor(doc, { margin = 15, footerHeight = 18, headerRepeatHeight = 0 } = {}) {
    this.doc = doc;
    this.margin = margin;
    this.footerHeight = footerHeight;
    this.headerRepeatHeight = headerRepeatHeight;
    this.pageWidth = doc.internal.pageSize.getWidth();
    this.pageHeight = doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - margin * 2;
    this.y = margin;
    this.pageNumber = 1;
    this._footerFn = null;
    this._headerRepeatFn = null;
  }

  get usableBottom() {
    return this.pageHeight - this.footerHeight;
  }

  setFooter(fn) { this._footerFn = fn; }
  setHeaderRepeat(fn) { this._headerRepeatFn = fn; }

  /** Vérifie s'il y a assez de place, sinon ajoute une page */
  ensureSpace(neededMm) {
    if (this.y + neededMm > this.usableBottom) {
      this.addPage();
    }
  }

  addPage() {
    // Dessiner le footer de la page courante
    if (this._footerFn) this._footerFn(this.doc, this.pageNumber);
    this.doc.addPage();
    this.pageNumber++;
    this.y = this.margin;
    // Dessiner le header répété
    if (this._headerRepeatFn) {
      this._headerRepeatFn(this.doc);
      this.y = this.margin + this.headerRepeatHeight;
    }
  }

  /** Dessine le footer sur la dernière page */
  finalize() {
    if (this._footerFn) this._footerFn(this.doc, this.pageNumber);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
const AdminArticleInfosScreen = () => {
  const { nomDossierDBF, nart } = useParams();
  const navigate = useNavigate();

  // États
  const [selectedEntreprise, setSelectedEntreprise] = useState(nomDossierDBF || "");
  const [selectedEntrepriseData, setSelectedEntrepriseData] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showPrintModal, setShowPrintModal] = useState(false);

  // State pour les taux de change
  const [exchangeRates, setExchangeRates] = useState(null);
  const [exchangeRatesLoading, setExchangeRatesLoading] = useState(false);
  const [exchangeRatesError, setExchangeRatesError] = useState(null);

  const XPF_EUR_RATE = 119.332;

  const DEVISE_MAPPING = {
    EUR: "EUR", EURO: "EUR", E: "EUR", "€": "EUR",
    USD: "USD", US: "USD", $: "USD", DOLLAR: "USD",
    AUD: "AUD", NZD: "NZD", JPY: "JPY", YEN: "JPY",
    CNY: "CNY", YUAN: "CNY", GBP: "GBP", CHF: "CHF",
    CAD: "CAD", SGD: "SGD", HKD: "HKD",
    XPF: "XPF", CFP: "XPF", F: "XPF",
  };

  const fetchExchangeRates = useCallback(async () => {
    setExchangeRatesLoading(true);
    setExchangeRatesError(null);
    try {
      const response = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR");
      if (!response.ok) throw new Error("Erreur lors de la récupération des taux de change");
      const data = await response.json();
      setExchangeRates({ base: "EUR", date: data.date, rates: { ...data.rates, EUR: 1, XPF: XPF_EUR_RATE } });
    } catch (error) {
      setExchangeRatesError(error.message);
      setExchangeRates({
        base: "EUR", date: new Date().toISOString().split("T")[0],
        rates: { EUR: 1, USD: 1.08, XPF: XPF_EUR_RATE, AUD: 1.65, NZD: 1.78, JPY: 162, GBP: 0.85, CHF: 0.95, CNY: 7.8, CAD: 1.47 },
        isFallback: true,
      });
    } finally { setExchangeRatesLoading(false); }
  }, []);

  useEffect(() => { fetchExchangeRates(); }, [fetchExchangeRates]);

  const convertToXPF = useCallback((amount, fromCurrency) => {
    if (!amount || amount === 0) return { amountXPF: 0, rate: null, fromCurrency: "XPF", error: null };
    if (!fromCurrency || fromCurrency.trim() === "") return { amountXPF: amount, rate: 1, fromCurrency: "XPF", error: null };
    const normalizedCurrency = fromCurrency.trim().toUpperCase();
    const isoCurrency = DEVISE_MAPPING[normalizedCurrency] || normalizedCurrency;
    if (isoCurrency === "XPF") return { amountXPF: amount, rate: 1, fromCurrency: "XPF", error: null };
    if (!exchangeRates?.rates) return { amountXPF: null, rate: null, fromCurrency: isoCurrency, error: "Taux de change non disponibles" };
    const rateFromEUR = exchangeRates.rates[isoCurrency];
    if (!rateFromEUR) return { amountXPF: null, rate: null, fromCurrency: isoCurrency, error: `Devise ${isoCurrency} non supportée` };
    return {
      amountXPF: Math.round((amount / rateFromEUR) * XPF_EUR_RATE),
      rate: XPF_EUR_RATE / rateFromEUR, fromCurrency: isoCurrency, error: null,
    };
  }, [exchangeRates]);

  // Queries
  const { data: entreprises, isLoading: loadingEntreprises } = useGetEntreprisesQuery();
  const { data: articleData, isLoading: loadingArticle, error: articleError, refetch, isFetching } =
    useGetArticleByNartQuery({ nomDossierDBF: selectedEntreprise, nart }, { skip: !selectedEntreprise || !nart });
  const { data: adjacentData, isLoading: loadingAdjacent } =
    useGetAdjacentArticlesQuery({ nomDossierDBF: selectedEntreprise, nart }, { skip: !selectedEntreprise || !nart });
  const [invalidateCache, { isLoading: invalidating }] = useInvalidateArticleCacheMutation();

  const article = articleData?.article;
  const previousArticle = adjacentData?.previous || null;
  const nextArticle = adjacentData?.next || null;

  const { data: filialeData, isLoading: loadingFiliales, isFetching: fetchingFiliales } =
    useGetArticleFilialeDataQuery(
      { nomDossierDBF: selectedEntreprise, nart: article?.NART?.trim() || "" },
      { skip: !selectedEntreprise || !article?.NART },
    );

  useEffect(() => {
    if (entreprises && nomDossierDBF) {
      const entreprise = entreprises.find((e) => e.nomDossierDBF === nomDossierDBF);
      if (entreprise) { setSelectedEntrepriseData(entreprise); setSelectedEntreprise(nomDossierDBF); }
    }
  }, [entreprises, nomDossierDBF]);

  // Handlers
  const handleEntrepriseChange = (e) => {
    const newNomDossier = e.target.value;
    const entreprise = entreprises?.find((ent) => ent.nomDossierDBF === newNomDossier);
    setSelectedEntreprise(newNomDossier);
    setSelectedEntrepriseData(entreprise);
    navigate(`/admin/articles/${newNomDossier}/${nart}`, { replace: true });
  };

  const handleInvalidateCache = async () => {
    if (selectedEntreprise) { await invalidateCache(selectedEntreprise); refetch(); }
  };

  const handleNavigatePrevious = () => {
    if (previousArticle) navigate(`/admin/articles/${selectedEntreprise}/${previousArticle.NART.trim()}`);
  };
  const handleNavigateNext = () => {
    if (nextArticle) navigate(`/admin/articles/${selectedEntreprise}/${nextArticle.NART.trim()}`);
  };

  // Helpers
  const safeTrim = (value) => {
    if (value === null || value === undefined) return "";
    return typeof value === "string" ? value.trim() : String(value);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "-";
    const num = Math.round(Number(price));
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} XPF`;
  };

  const formatStock = (stock) => {
    if (stock === null || stock === undefined) return "-";
    const num = parseFloat(stock);
    if (isNaN(num)) return "-";
    const parts = num.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(",");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    if (dateValue instanceof Date) return isNaN(dateValue.getTime()) ? "-" : dateValue.toLocaleDateString("fr-FR");
    if (typeof dateValue === "string") {
      if (dateValue.length === 8 && /^\d{8}$/.test(dateValue)) {
        const y = parseInt(dateValue.substring(0, 4));
        const m = parseInt(dateValue.substring(4, 6));
        const d = parseInt(dateValue.substring(6, 8));
        if (y > 0 && m >= 1 && m <= 12 && d >= 1 && d <= 31)
          return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
        return "-";
      }
      const parsed = new Date(dateValue);
      return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString("fr-FR") : "-";
    }
    if (typeof dateValue === "number") {
      const parsed = new Date(dateValue);
      return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString("fr-FR") : "-";
    }
    return "-";
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "-";
    return `${parseFloat(value).toFixed(1)}%`;
  };

  const isPromoActive = (art) => {
    if (!art?.DPROMOD || !art?.DPROMOF || !art?.PVPROMO) return false;
    const parsePromoDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
      if (typeof v === "string" && v.length === 8 && /^\d{8}$/.test(v)) {
        return new Date(parseInt(v.substring(0, 4)), parseInt(v.substring(4, 6)) - 1, parseInt(v.substring(6, 8)));
      }
      const parsed = new Date(v);
      return isNaN(parsed.getTime()) ? null : parsed;
    };
    const dateDebut = parsePromoDate(art.DPROMOD);
    const dateFin = parsePromoDate(art.DPROMOF);
    if (!dateDebut || !dateFin) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    dateDebut.setHours(0, 0, 0, 0); dateFin.setHours(23, 59, 59, 999);
    return today >= dateDebut && today <= dateFin;
  };

  const calculateDiscount = (originalPrice, promoPrice) => {
    if (!originalPrice || !promoPrice || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
  };

  const calculateStockTotal = (art) => {
    if (!art) return 0;
    return (parseFloat(art.S1) || 0) + (parseFloat(art.S2) || 0) + (parseFloat(art.S3) || 0) + (parseFloat(art.S4) || 0) + (parseFloat(art.S5) || 0);
  };

  const getEnCommande = (art) => (!art ? 0 : parseFloat(art.ENCDE) || 0);

  const getMonthsData = useMemo(() => {
    const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
    const shortMonthNames = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    const now = new Date();
    const lastCompleteMonth = (now.getMonth() - 1 + 12) % 12;
    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (lastCompleteMonth - (11 - i) + 12) % 12;
      return { vKey: `V${i + 1}`, rupKey: `RUP${i + 1}`, name: monthNames[monthIndex], shortName: shortMonthNames[monthIndex], monthIndex };
    });
  }, []);

  const salesData = useMemo(() => {
    if (!articleData?.article) return [];
    return getMonthsData.map((m) => ({ name: m.shortName, fullName: m.name, ventes: parseFloat(articleData.article[m.vKey]) || 0 }));
  }, [articleData, getMonthsData]);

  const ruptureData = useMemo(() => {
    if (!articleData?.article) return [];
    return getMonthsData.map((m) => ({ name: m.shortName, fullName: m.name, ruptures: parseFloat(articleData.article[m.rupKey]) || 0 }));
  }, [articleData, getMonthsData]);

  const totalSales = useMemo(() => salesData.reduce((s, i) => s + i.ventes, 0), [salesData]);
  const totalRuptures = useMemo(() => ruptureData.reduce((s, i) => s + i.ruptures, 0), [ruptureData]);
  const averageMonthlySales = useMemo(() => (totalSales === 0 ? 0 : totalSales / 12), [totalSales]);

  const stockEnJours = useMemo(() => {
    if (!article) return null;
    const st = calculateStockTotal(article);
    if (st === 0) return 0;
    if (averageMonthlySales === 0) return Infinity;
    return Math.round((st / averageMonthlySales) * 30);
  }, [article, averageMonthlySales]);

  const stockEnMois = useMemo(() => {
    if (!article) return null;
    const st = calculateStockTotal(article);
    if (st === 0) return 0;
    if (averageMonthlySales === 0) return Infinity;
    return (st / averageMonthlySales).toFixed(1);
  }, [article, averageMonthlySales]);

  const formatStockEnJours = (j) => j === null || j === undefined ? "-" : j === Infinity ? "∞" : j === 0 ? "0 jour" : j === 1 ? "1 jour" : `${j} jours`;
  const formatStockEnMois = (m) => m === null || m === undefined ? "-" : m === Infinity ? "∞" : `${m} mois`;

  const calculateMarge = (art) => {
    if (!art) return null;
    const pvHT = parseFloat(art.PVTE) || 0;
    const prixRevient = (parseFloat(art.DERPREV) || 0) > 0 ? parseFloat(art.DERPREV) : parseFloat(art.PREV) || 0;
    if (pvHT <= 0 || prixRevient <= 0) return null;
    return ((pvHT - prixRevient) / pvHT * 100).toFixed(1);
  };

  // Dérivés
  const isRenvoi = articleData?.isRenvoi || false;
  const articleOriginal = articleData?.articleOriginal;
  const nombreRenvois = articleData?.nombreRenvois || 0;
  const hasActivePromo = article ? isPromoActive(article) : false;
  const hasPhotosConfigured = !!selectedEntrepriseData?.cheminPhotos;

  const photoUrl = hasPhotosConfigured && article ? getPhotoUrl(selectedEntrepriseData?.trigramme, article.NART) : null;
  const pdfUrl = hasPhotosConfigured && article ? getPdfUrl(selectedEntrepriseData?.trigramme, article.NART) : null;
  const mappingEntrepots = selectedEntrepriseData?.mappingEntrepots || { S1: "Magasin", S2: "S2", S3: "S3", S4: "S4", S5: "S5" };

  // ─────────────────────────────────────────────────────────────────────────
  // PDF GENERATION — 3 templates
  // ─────────────────────────────────────────────────────────────────────────
  const handleGeneratePdf = useCallback(async (options) => {
    if (!article) return;
    const { template, description, characteristics, webUrl } = options;

    // ── Préparer les assets ──
    const gencod = safeTrim(article.GENCOD);
    const barcodeImg = gencod ? generateBarcodeBase64(gencod, {
      width: template === "etiquette" ? 1 : 1,
      height: template === "etiquette" ? 18 : 22,
      fontSize: template === "etiquette" ? 8 : 9,
    }) : null;

    const photoImg = photoUrl ? await loadImageAsBase64(photoUrl) : null;
    const qrImg = webUrl ? await generateQRCodeBase64(webUrl) : null;

    const entrepriseNom = selectedEntrepriseData?.nomComplet || "";
    const dateStr = new Date().toLocaleDateString("fr-FR");
    const promoActive = hasActivePromo;
    const discount = calculateDiscount(article.PVTETTC, article.PVPROMO);

    // ================================================================
    //  ÉTIQUETTE PRIX — Format 50mm × 30mm
    // ================================================================
    if (template === "etiquette") {
      const pw = 50;
      const ph = 30;
      const doc = new jsPDF({ unit: "mm", format: [pw, ph] });
      const m = 2;

      // Fond noir
      doc.setFillColor(...PDF_COLORS.BLACK);
      doc.rect(0, 0, pw, ph, "F");

      // Ligne jaune top
      doc.setFillColor(...PDF_COLORS.YELLOW);
      doc.rect(0, 0, pw, 1, "F");

      // NART (jaune, petit, en haut à gauche)
      doc.setTextColor(...PDF_COLORS.YELLOW);
      doc.setFontSize(5);
      doc.setFont("helvetica", "bold");
      doc.text(safeTrim(article.NART), m, 3.5);

      // TGC (ATVA) en haut à droite
      const atva = parseFloat(article.ATVA);
      if (atva) {
        doc.setTextColor(...PDF_COLORS.GRAY);
        doc.setFontSize(4);
        doc.setFont("helvetica", "normal");
        doc.text(`TGC ${atva.toFixed(1)}%`, pw - m, 3.5, { align: "right" });
      }

      // DESIGN (blanc, tronqué)
      doc.setTextColor(...PDF_COLORS.WHITE);
      doc.setFontSize(5);
      doc.setFont("helvetica", "bold");
      const designText = safeTrim(article.DESIGN);
      const designLines = doc.splitTextToSize(designText, pw - m * 2);
      doc.text(designLines.slice(0, 2), m, 6.5);

      let nextY = 6.5 + Math.min(designLines.length, 2) * 2.2;

      // Code-barres (petit, centré)
      if (barcodeImg) {
        const bw = 28;
        const bh = 7;
        const bx = (pw - bw) / 2;
        doc.setFillColor(...PDF_COLORS.WHITE);
        doc.rect(bx - 0.5, nextY - 0.3, bw + 1, bh + 0.6, "F");
        doc.addImage(barcodeImg, "PNG", bx, nextY, bw, bh);
        nextY += bh + 1.5;
      } else {
        nextY += 2;
      }

      // PRIX
      if (promoActive) {
        // Ancien prix barré
        doc.setTextColor(...PDF_COLORS.GRAY);
        doc.setFontSize(5);
        doc.setFont("helvetica", "normal");
        const oldPrice = formatPrice(article.PVTETTC);
        doc.text(oldPrice, m, nextY + 1);
        const oldW = doc.getTextWidth(oldPrice);
        doc.setDrawColor(...PDF_COLORS.PROMO_RED);
        doc.setLineWidth(0.3);
        doc.line(m, nextY + 0.5, m + oldW, nextY + 0.5);

        // Prix promo
        doc.setTextColor(...PDF_COLORS.YELLOW);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(formatPrice(article.PVPROMO), pw - m, nextY + 1.5, { align: "right" });

        nextY += 4;

        // Dates promo
        doc.setTextColor(...PDF_COLORS.GRAY);
        doc.setFontSize(3);
        doc.setFont("helvetica", "normal");
        doc.text(`${formatDate(article.DPROMOD)} - ${formatDate(article.DPROMOF)}`, pw / 2, nextY, { align: "center" });
      } else {
        // HT à gauche, TTC gros à droite
        doc.setTextColor(...PDF_COLORS.GRAY);
        doc.setFontSize(4);
        doc.setFont("helvetica", "normal");
        doc.text(`HT: ${formatPrice(article.PVTE)}`, m, nextY + 1);

        doc.setTextColor(...PDF_COLORS.WHITE);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(formatPrice(article.PVTETTC), pw - m, nextY + 1.5, { align: "right" });
      }

      // Ligne jaune bottom
      doc.setFillColor(...PDF_COLORS.YELLOW);
      doc.rect(0, ph - 0.8, pw, 0.8, "F");

      doc.save(`Etiquette_${safeTrim(article.NART)}.pdf`);
      return;
    }

    // ================================================================
    //  FICHE COMPLÈTE & FICHE VITRINE — Format A4
    // ================================================================
    const isVitrine = template === "vitrine";
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 15;
    const pb = new PdfBuilder(doc, { margin, footerHeight: 18, headerRepeatHeight: 12 });

    // ── Footer sur chaque page ──
    pb.setFooter((d, pageNum) => {
      d.setDrawColor(...PDF_COLORS.GRAY_LIGHT);
      d.setLineWidth(0.3);
      d.line(margin, pb.pageHeight - 14, pb.pageWidth - margin, pb.pageHeight - 14);
      d.setFontSize(7);
      d.setTextColor(...PDF_COLORS.GRAY);
      d.text(`${entrepriseNom} • ${dateStr}`, margin, pb.pageHeight - 9);
      d.text(`Page ${pageNum}`, pb.pageWidth - margin, pb.pageHeight - 9, { align: "right" });
    });

    // ── Header répété (petit bandeau noir) ──
    pb.setHeaderRepeat((d) => {
      d.setFillColor(...PDF_COLORS.BLACK);
      d.rect(0, 0, pb.pageWidth, 10, "F");
      d.setTextColor(...PDF_COLORS.YELLOW);
      d.setFontSize(8);
      d.setFont("helvetica", "bold");
      d.text(`${safeTrim(article.NART)} — ${safeTrim(article.DESIGN).substring(0, 60)}`, margin, 7);
    });

    // ════════════════════════════════════════════════════════════════
    //  PAGE 1 — HEADER PRINCIPAL
    // ════════════════════════════════════════════════════════════════
    doc.setFillColor(...PDF_COLORS.BLACK);
    doc.rect(0, 0, pb.pageWidth, 38, "F");

    // Bandeau jaune fin en haut
    doc.setFillColor(...PDF_COLORS.YELLOW);
    doc.rect(0, 0, pb.pageWidth, 2, "F");

    // Label "Fiche Article"
    doc.setTextColor(...PDF_COLORS.YELLOW);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(isVitrine ? "FICHE PRODUIT" : "FICHE ARTICLE", margin, 12);

    // NART
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(safeTrim(article.NART), margin, 23);

    // Désignation sous le NART
    doc.setTextColor(...PDF_COLORS.WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const headerDesign = doc.splitTextToSize(safeTrim(article.DESIGN), pb.pageWidth - margin - 70);
    doc.text(headerDesign, margin, 30);

    // Code-barres en haut à droite
    if (barcodeImg) {
      doc.setFillColor(...PDF_COLORS.WHITE);
      doc.roundedRect(pb.pageWidth - 60, 6, 48, 20, 2, 2, "F");
      doc.addImage(barcodeImg, "PNG", pb.pageWidth - 58, 7, 44, 18);
    }

    // GENCOD text sous le code-barres
    if (gencod) {
      doc.setTextColor(...PDF_COLORS.GRAY);
      doc.setFontSize(7);
      doc.text(gencod, pb.pageWidth - 36, 32, { align: "center" });
    }

    pb.y = 46;

    // ════════════════════════════════════════════════════════════════
    //  PHOTO + BLOC PRIX
    // ════════════════════════════════════════════════════════════════
    const photoBoxW = 75;
    const photoBoxH = 65;
    const priceBoxX = margin + photoBoxW + 8;
    const priceBoxW = pb.contentWidth - photoBoxW - 8;

    // Photo
    doc.setDrawColor(...PDF_COLORS.GRAY_LIGHT);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, pb.y, photoBoxW, photoBoxH, 2, 2, "FD");

    if (photoImg) {
      try {
        doc.addImage(photoImg, "JPEG", margin + 2, pb.y + 2, photoBoxW - 4, photoBoxH - 4);
      } catch {
        doc.setTextColor(...PDF_COLORS.GRAY);
        doc.setFontSize(10);
        doc.text("Photo indisponible", margin + 12, pb.y + 35);
      }
    } else {
      doc.setTextColor(...PDF_COLORS.GRAY);
      doc.setFontSize(10);
      doc.text("Photo indisponible", margin + 12, pb.y + 35);
    }

    // Bloc prix
    doc.setFillColor(...PDF_COLORS.GRAY_BG);
    doc.roundedRect(priceBoxX, pb.y, priceBoxW, photoBoxH, 2, 2, "F");

    let priceY = pb.y + 10;

    const drawPriceLine = (label, value, opts = {}) => {
      const { bold = false, accent = false, strikethrough = false } = opts;
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.GRAY_DARK);
      doc.setFont("helvetica", "normal");
      doc.text(label, priceBoxX + 8, priceY);

      doc.setFontSize(bold ? 15 : 12);
      doc.setTextColor(...(accent ? PDF_COLORS.YELLOW : PDF_COLORS.BLACK));
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(value, priceBoxX + priceBoxW - 8, priceY, { align: "right" });

      if (strikethrough) {
        const tw = doc.getTextWidth(value);
        doc.setDrawColor(...PDF_COLORS.PROMO_RED);
        doc.setLineWidth(0.5);
        doc.line(priceBoxX + priceBoxW - 8 - tw, priceY - 1.5, priceBoxX + priceBoxW - 8, priceY - 1.5);
      }

      priceY += 12;
    };

    if (!isVitrine) {
      drawPriceLine("Prix HT (PVTE)", formatPrice(article.PVTE));
      drawPriceLine("TGC (ATVA)", formatPercent(article.ATVA));
    }
    drawPriceLine("Prix TTC", formatPrice(article.PVTETTC), {
      bold: true,
      strikethrough: promoActive,
    });

    if (promoActive) {
      drawPriceLine(`PROMO -${discount}%`, formatPrice(article.PVPROMO), { bold: true, accent: true });
    }

    // QR code dans le bloc prix (coin bas droit)
    if (qrImg) {
      const qrSize = 22;
      const qrX = priceBoxX + priceBoxW - qrSize - 5;
      const qrY2 = pb.y + photoBoxH - qrSize - 3;
      doc.addImage(qrImg, "PNG", qrX, qrY2, qrSize, qrSize);
      doc.setFontSize(5);
      doc.setTextColor(...PDF_COLORS.GRAY);
      doc.text("Voir en ligne", qrX + qrSize / 2, qrY2 + qrSize + 3, { align: "center" });
    }

    pb.y += photoBoxH + 8;

    // ════════════════════════════════════════════════════════════════
    //  BANDEAU PROMO (si actif)
    // ════════════════════════════════════════════════════════════════
    if (promoActive) {
      pb.ensureSpace(22);
      doc.setFillColor(...PDF_COLORS.YELLOW);
      doc.roundedRect(margin, pb.y, pb.contentWidth, 16, 2, 2, "F");

      doc.setTextColor(...PDF_COLORS.BLACK);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`PROMOTION  -${discount}%`, margin + 8, pb.y + 7);

      doc.setFontSize(14);
      doc.text(formatPrice(article.PVPROMO), pb.pageWidth - margin - 8, pb.y + 8, { align: "right" });

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...PDF_COLORS.GRAY_DARK);
      doc.text(`Du ${formatDate(article.DPROMOD)} au ${formatDate(article.DPROMOF)}`, margin + 8, pb.y + 13);

      pb.y += 22;
    }

    // ════════════════════════════════════════════════════════════════
    //  HELPER — Section titre
    // ════════════════════════════════════════════════════════════════
    const drawSectionTitle = (title) => {
      pb.ensureSpace(14);
      doc.setFillColor(...PDF_COLORS.BLACK);
      doc.roundedRect(margin, pb.y, pb.contentWidth, 8, 1, 1, "F");
      doc.setTextColor(...PDF_COLORS.YELLOW);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 4, pb.y + 5.5);
      pb.y += 12;
    };

    // ════════════════════════════════════════════════════════════════
    //  HELPER — Ligne info (label / valeur)
    // ════════════════════════════════════════════════════════════════
    const drawInfoLine = (label, value, opts = {}) => {
      const { indent = 0 } = opts;
      pb.ensureSpace(6);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...PDF_COLORS.GRAY_DARK);
      doc.text(label, margin + 4 + indent, pb.y);
      doc.setTextColor(...PDF_COLORS.BLACK);
      doc.setFont("helvetica", "bold");
      doc.text(String(value || "-"), pb.pageWidth - margin - 4, pb.y, { align: "right" });
      pb.y += 6;
    };

    // ════════════════════════════════════════════════════════════════
    //  INFOS PRODUIT
    // ════════════════════════════════════════════════════════════════
    drawSectionTitle("INFORMATIONS PRODUIT");
    drawInfoLine("Fournisseur", article.FOURN || "-");
    drawInfoLine("Réf. fournisseur", safeTrim(article.REFER) || "-");
    drawInfoLine("Groupe / Famille", safeTrim(article.GROUPE) || "-");
    drawInfoLine("Unité", safeTrim(article.UNITE) || "-");
    if (safeTrim(article.GENCOD)) drawInfoLine("Code barre (GENCOD)", safeTrim(article.GENCOD));
    pb.y += 2;

    // ════════════════════════════════════════════════════════════════
    //  PRIX
    // ════════════════════════════════════════════════════════════════
    drawSectionTitle("PRIX");
    drawInfoLine("Prix HT (PVTE)", formatPrice(article.PVTE));
    drawInfoLine("TGC (ATVA)", formatPercent(article.ATVA));
    drawInfoLine("Prix TTC", formatPrice(article.PVTETTC));
    if (promoActive) {
      drawInfoLine("Prix PROMO", formatPrice(article.PVPROMO));
      drawInfoLine("Du", formatDate(article.DPROMOD));
      drawInfoLine("Au", formatDate(article.DPROMOF));
    }
    if (!isVitrine) {
      const marge = calculateMarge(article);
      if (marge) drawInfoLine("Marge calculée", `${marge}%`);
    }
    pb.y += 2;

    // ════════════════════════════════════════════════════════════════
    //  STOCKS (fiche complète uniquement)
    // ════════════════════════════════════════════════════════════════
    if (!isVitrine) {
      drawSectionTitle("STOCKS");
      drawInfoLine("Stock total", formatStock(calculateStockTotal(article)));
      drawInfoLine("En commande", formatStock(getEnCommande(article)));
      drawInfoLine("Stock en jours", formatStockEnJours(stockEnJours));

      const stockKeys = ["S1", "S2", "S3", "S4", "S5"];
      stockKeys.forEach((k) => {
        const val = parseFloat(article[k]) || 0;
        if (val > 0) drawInfoLine(`  ${mappingEntrepots[k]}`, formatStock(val), { indent: 6 });
      });
      pb.y += 2;
    }

    // ════════════════════════════════════════════════════════════════
    //  CARACTÉRISTIQUES PERSONNALISÉES
    // ════════════════════════════════════════════════════════════════
    if (characteristics && characteristics.length > 0) {
      drawSectionTitle("CARACTÉRISTIQUES");
      characteristics.forEach((c) => {
        drawInfoLine(c.label, c.value);
      });
      pb.y += 2;
    }

    // ════════════════════════════════════════════════════════════════
    //  DESCRIPTION
    // ════════════════════════════════════════════════════════════════
    if (description) {
      drawSectionTitle("DESCRIPTION");
      pb.ensureSpace(12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...PDF_COLORS.GRAY_DARK);
      const descLines = doc.splitTextToSize(description, pb.contentWidth - 8);
      // Écrire ligne par ligne avec gestion du saut
      descLines.forEach((line) => {
        pb.ensureSpace(5);
        doc.text(line, margin + 4, pb.y);
        pb.y += 4.5;
      });
      pb.y += 4;
    }

    // ════════════════════════════════════════════════════════════════
    //  QR CODE GRAND (si webUrl et pas déjà dans le bloc prix)
    // ════════════════════════════════════════════════════════════════
    if (qrImg && webUrl) {
      pb.ensureSpace(35);
      doc.setFillColor(...PDF_COLORS.GRAY_BG);
      doc.roundedRect(margin, pb.y, pb.contentWidth, 30, 2, 2, "F");

      doc.addImage(qrImg, "PNG", margin + 4, pb.y + 3, 24, 24);

      doc.setTextColor(...PDF_COLORS.BLACK);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Voir cet article en ligne", margin + 34, pb.y + 12);

      doc.setTextColor(...PDF_COLORS.GRAY);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      const urlTruncated = webUrl.length > 80 ? webUrl.substring(0, 77) + "..." : webUrl;
      doc.text(urlTruncated, margin + 34, pb.y + 19);

      pb.y += 34;
    }

    // Finaliser (dessiner footer dernière page)
    pb.finalize();

    const filename = isVitrine
      ? `Fiche_Vitrine_${safeTrim(article.NART)}.pdf`
      : `Fiche_Complete_${safeTrim(article.NART)}.pdf`;
    doc.save(filename);
  }, [article, photoUrl, hasActivePromo, selectedEntrepriseData, stockEnJours, totalSales, totalRuptures, averageMonthlySales, salesData, mappingEntrepots]);

  // ── Rendu onglet Filiales ─────────────────────────────────────────────────
  const renderFilialesTab = () => {
    if (loadingFiliales || fetchingFiliales)
      return (<div className="filiales-loading"><div className="loading-spinner"></div><p>Chargement des données inter-entreprises...</p></div>);

    if (!filialeData?.filiales?.length)
      return (<div className="filiales-empty"><HiGlobe className="filiales-empty-icon" /><h3>Aucune donnée disponible</h3><p>Cet article n'a pas de correspondance dans les autres entités</p></div>);

    const filiales = filialeData.filiales;
    const stockFiliales = filialeData.stockTotal || 0;
    const stockEntrepriseSelectionnee = calculateStockTotal(article);
    const stockTotalGroupe = stockFiliales + stockEntrepriseSelectionnee;
    const filialesAvecStock = filiales.filter((f) => f.stock > 0);
    const filialesSansStock = filiales.filter((f) => f.stock === 0);
    const nbEntitesAvecStock = filialesAvecStock.length + (stockEntrepriseSelectionnee > 0 ? 1 : 0);

    return (
      <div className="tab-panel filiales-tab">
        <div className="filiales-content">
          <div className="filiales-summary">
            <div className="filiales-summary-card total"><HiChartBar className="summary-icon" /><div className="summary-info"><span className="summary-label">Stock Total Groupe</span><span className={`summary-value ${stockTotalGroupe > 0 ? "positive" : "zero"}`}>{formatStock(stockTotalGroupe)}</span></div></div>
            <div className="filiales-summary-card count"><HiOfficeBuilding className="summary-icon" /><div className="summary-info"><span className="summary-label">Autres entités</span><span className="summary-value">{filiales.length}</span></div></div>
            <div className="filiales-summary-card available"><HiCube className="summary-icon" /><div className="summary-info"><span className="summary-label">Entités en stock</span><span className="summary-value positive">{nbEntitesAvecStock}</span></div></div>
          </div>
          <div className="filiales-list">
            <h3 className="filiales-list-title"><HiGlobe /> Disponibilité par entité</h3>
            <div className="filiales-cards-container">
              {filialesAvecStock.map((f, i) => (
                <div key={`stock-${i}`} className="filiale-card has-stock">
                  <div className="filiale-card-header"><div className="filiale-card-entity"><span className="filiale-trigramme">{f.trigramme}</span><span className="filiale-nom">{f.entrepriseNom}</span></div><div className="filiale-card-status in-stock"><HiCheckCircle /><span>En stock</span></div></div>
                  <div className="filiale-card-body"><div className="filiale-card-info"><span className="filiale-card-label">Code Article</span><code className="filiale-card-nart">{f.nartFiliale}</code></div><div className="filiale-card-info"><span className="filiale-card-label">Stock</span><span className="filiale-card-stock positive">{formatStock(f.stock)}</span></div><div className="filiale-card-info"><span className="filiale-card-label">Prix TTC</span>{f.hasPrix ? <span className="filiale-card-prix">{formatPrice(f.prix)}</span> : <span className="filiale-card-prix-na">Grossiste</span>}</div></div>
                </div>
              ))}
              {filialesSansStock.map((f, i) => (
                <div key={`nostock-${i}`} className="filiale-card no-stock">
                  <div className="filiale-card-header"><div className="filiale-card-entity"><span className="filiale-trigramme">{f.trigramme}</span><span className="filiale-nom">{f.entrepriseNom}</span></div><div className="filiale-card-status out-of-stock"><HiXCircle /><span>Rupture</span></div></div>
                  <div className="filiale-card-body"><div className="filiale-card-info"><span className="filiale-card-label">Code Article</span><code className="filiale-card-nart">{f.nartFiliale}</code></div><div className="filiale-card-info"><span className="filiale-card-label">Stock</span><span className="filiale-card-stock zero">0</span></div><div className="filiale-card-info"><span className="filiale-card-label">Prix TTC</span>{f.hasPrix ? <span className="filiale-card-prix muted">{formatPrice(f.prix)}</span> : <span className="filiale-card-prix-na">Grossiste</span>}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loadingEntreprises) return (<div className="admin-article-infos-page"><div className="loading-state"><div className="loading-spinner"></div><p>Chargement...</p></div></div>);

  return (
    <div className="admin-article-infos-page">
      {/* Header */}
      <header className="article-infos-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}><HiArrowLeft /></button>
          <div className="header-title">
            <h1><HiCube className="title-icon" />Fiche Article</h1>
            <span className="article-nart-badge">{nart}</span>
          </div>
          {hasActivePromo && (
            <div className="promo-indicator-header"><HiFire /><div className="promo-text"><span className="promo-label">Promo</span><span className="promo-discount">-{calculateDiscount(article.PVTETTC, article.PVPROMO)}%</span></div></div>
          )}
        </div>

        <div className="article-navigation">
          <button className="btn-nav btn-prev" onClick={handleNavigatePrevious} disabled={!previousArticle || loadingAdjacent} title={previousArticle ? `Article précédent: ${previousArticle.NART?.trim()}` : "Aucun article précédent"}>
            <HiChevronLeft /><span className="nav-label"></span>
            {previousArticle && <span className="nav-nart">{previousArticle.NART?.trim()}</span>}
          </button>
          <div className="nav-divider" />
          <button className="btn-nav btn-next" onClick={handleNavigateNext} disabled={!nextArticle || loadingAdjacent} title={nextArticle ? `Article suivant: ${nextArticle.NART?.trim()}` : "Aucun article suivant"}>
            {nextArticle && <span className="nav-nart">{nextArticle.NART?.trim()}</span>}
            <span className="nav-label"></span><HiChevronRight />
          </button>
        </div>

        <div className="header-center">
          <div className="entreprise-selector">
            <HiOfficeBuilding className="selector-icon" />
            <select value={selectedEntreprise} onChange={handleEntrepriseChange}>
              <option value="">Sélectionner une entreprise</option>
              {entreprises?.map((e) => (<option key={e._id} value={e.nomDossierDBF}>{e.trigramme} - {e.nomComplet}</option>))}
            </select>
            <HiChevronDown className="selector-arrow" />
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-action" onClick={refetch} disabled={isFetching} title="Rafraîchir"><HiRefresh className={isFetching ? "spinning" : ""} /></button>
          <button className="btn-action" onClick={handleInvalidateCache} disabled={invalidating} title="Invalider le cache"><HiCog className={invalidating ? "spinning" : ""} /></button>
          <button className="btn-action" onClick={() => setShowPrintModal(true)} title="Imprimer la fiche article (PDF)"><HiPrinter /></button>
        </div>
      </header>

      {/* Print Modal */}
      <PrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onGenerate={handleGeneratePdf}
        articleDesign={article ? safeTrim(article.DESIGN) : ""}
        nart={nart}
      />

      {/* Content */}
      {!selectedEntreprise ? (
        <div className="empty-state"><HiOfficeBuilding className="empty-icon" /><h2>Sélectionnez une entreprise</h2><p>Choisissez une entreprise pour voir les informations de l'article</p></div>
      ) : loadingArticle ? (
        <div className="loading-state"><div className="loading-spinner"></div><p>Chargement de l'article...</p></div>
      ) : articleError ? (
        <div className="error-state"><HiExclamation className="error-icon" /><h2>Article non trouvé</h2><p>L'article {nart} n'existe pas dans {selectedEntrepriseData?.nomComplet}</p><button onClick={() => navigate(-1)}>Retour à la liste</button></div>
      ) : article ? (
        <div className="article-infos-content">
          {/* Bannière promo */}
          {hasActivePromo && (
            <div className="promo-mega-banner">
              <div className="promo-mega-content">
                <div className="promo-mega-icon"><HiFire /></div>
                <div className="promo-mega-info">
                  <span className="promo-mega-title">🔥 PROMOTION EN COURS 🔥</span>
                  <span className="promo-mega-dates">Du <strong>{formatDate(article.DPROMOD)}</strong> au <strong>{formatDate(article.DPROMOF)}</strong></span>
                </div>
              </div>
              <div className="promo-mega-prices">
                <span className="promo-old-price">{formatPrice(article.PVTETTC)}</span>
                <span className="promo-new-price">{formatPrice(article.PVPROMO)}</span>
                <div className="promo-discount-badge">-{calculateDiscount(article.PVTETTC, article.PVPROMO)}%</div>
              </div>
            </div>
          )}

          {isRenvoi && (
            <div className="alert-banner renvoi">
              <HiSwitchHorizontal className="banner-icon" />
              <div className="banner-content"><strong>ARTICLE EN RENVOI</strong><span>Remplace l'article {articleOriginal?.nart} ({articleOriginal?.designation})</span></div>
              {nombreRenvois > 1 && <span className="renvoi-chain">Chaîne de {nombreRenvois} renvois</span>}
            </div>
          )}

          {isRenvoi && articleOriginal && (
            <div className="renvoi-details-section">
              <div className="renvoi-details">
                <div className="renvoi-from">
                  <span className="renvoi-label">Article recherché</span>
                  <span className="renvoi-nart">{articleOriginal.nart}</span>
                  <span className="renvoi-design">{articleOriginal.designation}</span>
                  {articleOriginal.gencod && <span className="renvoi-gencod"><HiQrcode /> {articleOriginal.gencod}</span>}
                </div>
                <div className="renvoi-arrow"><HiSwitchHorizontal /></div>
                <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.NART)}`} className="renvoi-to renvoi-to-clickable">
                  <span className="renvoi-label">Remplacé par <HiExternalLink className="renvoi-link-icon" /></span>
                  <span className="renvoi-nart">{safeTrim(article.NART)}</span>
                  <span className="renvoi-design">{safeTrim(article.DESIGN)}</span>
                  {safeTrim(article.GENCOD) && <span className="renvoi-gencod"><HiQrcode /> {safeTrim(article.GENCOD)}</span>}
                  <span className="renvoi-click-hint">Cliquer pour voir la fiche →</span>
                </Link>
              </div>
              {nombreRenvois > 1 && <div className="renvoi-chain-warning">⚠️ Chaîne de {nombreRenvois} renvois</div>}
            </div>
          )}

          {(parseFloat(article.DEPREC) || 0) > 0 && (
            <div className="alert-banner deprec"><HiExclamation className="banner-icon" /><div className="banner-content"><strong>ARTICLE DÉPRÉCIÉ</strong><span>Dépréciation de {article.DEPREC}%</span></div></div>
          )}

          {/* Main Grid */}
          <div className="article-main-grid">
            {/* ── Colonne gauche ── */}
            <div className="article-left-column">
              <MediaCard
                photoUrl={photoUrl}
                pdfUrl={pdfUrl}
                hasPhotosConfigured={hasPhotosConfigured}
                articleDesign={safeTrim(article.DESIGN)}
                hasActivePromo={hasActivePromo}
                promoDiscount={calculateDiscount(article.PVTETTC, article.PVPROMO)}
              />

              <div className="quick-badges">
                {hasActivePromo && <div className="quick-badge promo"><HiFire /> PROMO -{calculateDiscount(article.PVTETTC, article.PVPROMO)}%</div>}
                {safeTrim(article.WEB) === "O" && <div className="quick-badge web"><HiGlobe /> Visible Web</div>}
                {safeTrim(article.FOTO) === "F" && <div className="quick-badge photo"><HiPhotograph /> Photo dispo</div>}
                {safeTrim(article.SAV) === "O" && <div className="quick-badge sav"><HiShieldCheck /> SAV</div>}
                {safeTrim(article.COMPOSE) === "O" && <div className="quick-badge compose"><HiCollection /> Composé</div>}
                {safeTrim(article.RENV) === "O" && <div className="quick-badge renvoi"><HiSwitchHorizontal /> Renvoi</div>}
              </div>

              <div className="quick-stats">
                <div className="quick-stat"><span className="stat-label">Stock Total</span><span className={`stat-value ${calculateStockTotal(article) > 0 ? "positive" : "zero"}`}>{formatStock(calculateStockTotal(article))}</span></div>
                <div className="quick-stat"><span className="stat-label">En Commande</span><span className={`stat-value ${getEnCommande(article) > 0 ? "encde" : ""}`}>{formatStock(getEnCommande(article))}</span></div>
                <div className="quick-stat"><span className="stat-label">Ventes 12 mois</span><span className="stat-value">{formatStock(totalSales)}</span></div>
                <div className="quick-stat"><span className="stat-label">Ruptures 12 mois</span><span className={`stat-value ${totalRuptures > 0 ? "warning" : ""}`}>{formatStock(totalRuptures)}</span></div>
                <div className="quick-stat highlight">
                  <span className="stat-label"><HiClock style={{ marginRight: "4px", verticalAlign: "middle" }} />Stock en jours</span>
                  <span className={`stat-value ${stockEnJours === 0 ? "zero" : stockEnJours === Infinity ? "positive" : stockEnJours < 30 ? "warning" : stockEnJours < 90 ? "" : "positive"}`}>{formatStockEnJours(stockEnJours)}</span>
                </div>
                <div className="quick-stat"><span className="stat-label">Stock en mois</span><span className="stat-value">{formatStockEnMois(stockEnMois)}</span></div>
                <div className="quick-stat full-width"><span className="stat-label">Marge</span><span className="stat-value">{calculateMarge(article) ? `${calculateMarge(article)}%` : "-"}</span></div>
              </div>

              {safeTrim(article.GENDOUBL) && (
                <div className="linked-article-card renvoi-card">
                  <h4><HiSwitchHorizontal /> Article de renvoi vers</h4>
                  <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.GENDOUBL)}`} className="linked-article-link"><span className="linked-nart">{safeTrim(article.GENDOUBL)}</span><HiExternalLink /></Link>
                  <p className="linked-article-hint">Cet article renvoie vers un autre article</p>
                </div>
              )}

              {safeTrim(article.ASSOCIE) && (
                <div className="linked-article-card">
                  <h4><HiCollection /> Article associé</h4>
                  <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.ASSOCIE)}`} className="linked-article-link"><span className="linked-nart">{safeTrim(article.ASSOCIE)}</span><HiExternalLink /></Link>
                </div>
              )}
            </div>

            {/* ── Colonne droite ── */}
            <div className="article-right-column">
              <div className="tabs-nav">
                <button className={`tab-btn ${activeTab === "general" ? "active" : ""}`} onClick={() => setActiveTab("general")}><HiClipboardList /> <span>Général</span></button>
                <button className={`tab-btn ${activeTab === "stocks" ? "active" : ""}`} onClick={() => setActiveTab("stocks")}><HiArchive /> <span>Stocks</span></button>
                <button className={`tab-btn ${activeTab === "prix" ? "active" : ""}`} onClick={() => setActiveTab("prix")}><HiCurrencyDollar /> <span>Prix</span></button>
                <button className={`tab-btn ${activeTab === "ventes" ? "active" : ""}`} onClick={() => setActiveTab("ventes")}><HiChartBar /> <span>Ventes</span></button>
                <button className={`tab-btn ${activeTab === "filiales" ? "active" : ""}`} onClick={() => setActiveTab("filiales")}>
                  <HiGlobe /> <span>Stock Groupe</span>
                  {filialeData?.filiales?.length > 0 && <span className="tab-badge">{filialeData.filiales.length}</span>}
                </button>
                <button className={`tab-btn ${activeTab === "autres" ? "active" : ""}`} onClick={() => setActiveTab("autres")}><HiCog /> <span>Autres</span></button>
              </div>

              <div className="tab-content">
                {/* ── Général ── */}
                {activeTab === "general" && (
                  <div className="tab-panel">
                    <div className="info-section designation-section">
                      <h2 className="article-design-main">{safeTrim(article.DESIGN)}</h2>
                      {safeTrim(article.DESIGN2) && <p className="article-design-sub">{safeTrim(article.DESIGN2)}</p>}
                      {safeTrim(article.DESIFRN) && <p className="article-design-frn"><span>Désignation fournisseur:</span> {safeTrim(article.DESIFRN)}</p>}
                    </div>
                    <div className="info-section">
                      <h3><HiQrcode /> Identification</h3>
                      <div className="info-grid cols-3">
                        <div className="info-item"><label>Code NART</label><span className="value highlight mono">{safeTrim(article.NART)}</span></div>
                        <div className="info-item"><label>Code barre (GENCOD)</label><span className="value mono">{safeTrim(article.GENCOD) || "-"}</span></div>
                        <div className="info-item"><label>Réf. fournisseur</label><span className="value">{safeTrim(article.REFER) || "-"}</span></div>
                        <div className="info-item"><label>Fournisseur</label><span className="value">{article.FOURN || "-"}</span></div>
                        <div className="info-item"><label>Groupe / Famille</label><span className="value tag">{safeTrim(article.GROUPE) || "-"}</span></div>
                        <div className="info-item"><label>Code tarif</label><span className="value">{safeTrim(article.CODTAR) || "-"}</span></div>
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiArchive /> Conditionnement</h3>
                      <div className="info-grid cols-4">
                        <div className="info-item"><label>Unité</label><span className="value">{safeTrim(article.UNITE) || "-"}</span></div>
                        <div className="info-item"><label>Conditionnement</label><span className="value">{article.CONDITNM || "-"}</span></div>
                        <div className="info-item"><label>Volume</label><span className="value">{article.VOL || "-"}</span></div>
                        <div className="info-item"><label>Colisage (KL)</label><span className="value">{safeTrim(article.KL) || "-"}</span></div>
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiLocationMarker /> Emplacements / Gisements</h3>
                      <div className="info-grid cols-3">
                        <div className="info-item highlight-box"><label>Place principale</label><span className="value">{safeTrim(article.PLACE) || "-"}</span></div>
                        {["GISM1","GISM2","GISM3","GISM4","GISM5"].map((g, i) => (
                          <div key={g} className="info-item"><label>Gisement {i + 1}</label><span className="value">{safeTrim(article[g]) || "-"}</span></div>
                        ))}
                      </div>
                    </div>
                    {safeTrim(article.OBSERV) && (
                      <div className="info-section observations-section">
                        <h3><HiDocumentText /> Observations</h3>
                        <p className="observations-text">{safeTrim(article.OBSERV)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Stocks ── */}
                {activeTab === "stocks" && (
                  <div className="tab-panel">
                    <div className="info-section">
                      <h3><HiArchive /> Stocks par emplacement</h3>
                      <div className="stocks-grid">
                        <div className="stock-card total"><div className="stock-card-header"><span className="stock-label">Stock Total</span><HiArchive className="stock-icon" /></div><span className={`stock-value ${calculateStockTotal(article) > 0 ? "positive" : "zero"}`}>{formatStock(calculateStockTotal(article))}</span></div>
                        <div className="stock-card encde"><div className="stock-card-header"><span className="stock-label">En Commande</span><HiTruck className="stock-icon" /></div><span className={`stock-value ${getEnCommande(article) > 0 ? "encde" : ""}`}>{formatStock(getEnCommande(article))}</span></div>
                        <div className="stock-card stock-days"><div className="stock-card-header"><span className="stock-label">Stock en Jours</span><HiClock className="stock-icon" /></div><span className={`stock-value ${stockEnJours === 0 ? "zero" : stockEnJours === Infinity ? "positive" : stockEnJours < 30 ? "warning" : stockEnJours < 90 ? "" : "positive"}`}>{formatStockEnJours(stockEnJours)}</span><span className="stock-subvalue">({formatStockEnMois(stockEnMois)})</span></div>
                        {["S1","S2","S3","S4","S5"].map((key) => (
                          <div key={key} className="stock-card"><div className="stock-card-header"><span className="stock-label">{mappingEntrepots[key]}</span><span className="stock-key">{key}</span></div><span className={`stock-value ${parseFloat(article[key]) > 0 ? "positive" : "zero"}`}>{formatStock(article[key])}</span></div>
                        ))}
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiTrendingDown /> Gestion des stocks</h3>
                      <div className="info-grid cols-4">
                        <div className="info-item"><label>Stock STOCK (ancien)</label><span className={`value ${parseFloat(article.STOCK) > 0 ? "positive" : "zero"}`}>{formatStock(article.STOCK)}</span></div>
                        <div className="info-item"><label>Stock local 2 (STLOC2)</label><span className="value">{formatStock(article.STLOC2)}</span></div>
                        <div className="info-item"><label>Stock mini (SMINI)</label><span className="value warning">{formatStock(article.SMINI)}</span></div>
                        <div className="info-item"><label>Réservé</label><span className="value reserved">{formatStock(article.RESERV)}</span></div>
                        <div className="info-item"><label>En commande (ENCDE)</label><span className="value">{formatStock(article.ENCDE)}</span></div>
                        <div className="info-item"><label>Commande spéciale</label><span className="value">{formatStock(article.CDESPEC)}</span></div>
                        <div className="info-item"><label>Stock sécurité</label><span className="value">{formatStock(article.STSECUR)}</span></div>
                        <div className="info-item"><label>Tarif liste (TARIFL)</label><span className="value">{article.TARIFL ? "Oui" : "Non"}</span></div>
                      </div>
                    </div>
                    <div className="info-section chart-section">
                      <h3><HiChartBar /> Répartition des stocks</h3>
                      <div className="chart-container">
                        {(() => {
                          const items = ["S1","S2","S3","S4","S5"].map((k) => ({ name: mappingEntrepots[k], value: parseFloat(article[k]) || 0 }));
                          const maxV = Math.max(...items.map(d => d.value), 1);
                          return (
                            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: 300, padding: "20px 10px 30px" }}>
                              {items.map((item, i) => {
                                const h = maxV > 0 ? (item.value / maxV) * 240 : 0;
                                return (
                                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                                    <span style={{ fontSize: "12px", color: "#f0f0f5", fontWeight: 600 }}>{item.value > 0 ? item.value : ""}</span>
                                    <div style={{ width: "100%", maxWidth: 60, height: h, backgroundColor: "#6366f1", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease", minHeight: item.value > 0 ? 4 : 0 }} />
                                    <span style={{ fontSize: "11px", color: "#a0a0b0" }}>{item.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Prix ── */}
                {activeTab === "prix" && (
                  <div className="tab-panel">
                    <div className="info-section">
                      <h3><HiCurrencyDollar /> Prix de vente</h3>
                      <div className="price-cards">
                        <div className={`price-card main ${hasActivePromo ? "has-promo" : ""}`}><span className="price-label">Prix TTC</span><span className={`price-value ${hasActivePromo ? "strikethrough" : ""}`}>{formatPrice(article.PVTETTC)}</span></div>
                        {hasActivePromo && (<div className="price-card promo"><span className="price-label">Prix PROMO</span><span className="price-value">{formatPrice(article.PVPROMO)}</span><span className="discount-badge">-{calculateDiscount(article.PVTETTC, article.PVPROMO)}%</span></div>)}
                        <div className="price-card"><span className="price-label">Prix HT</span><span className="price-value">{formatPrice(article.PVTE)}</span></div>
                        <div className="price-card"><span className="price-label">Prix détail</span><span className="price-value">{formatPrice(article.PDETAIL)}</span></div>
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiTrendingUp /> Prix d'achat & Marges</h3>
                      <div className="info-grid cols-4">
                        <div className="info-item highlight-box">
                          <label>Prix d'achat (PACHAT){safeTrim(article.DEVISE) && safeTrim(article.DEVISE) !== "XPF" && <span className="devise-badge"><HiCurrencyEuro /> {safeTrim(article.DEVISE)}</span>}</label>
                          <span className="value">
                            {(() => {
                              const devise = safeTrim(article.DEVISE);
                              const pachat = parseFloat(article.PACHAT) || 0;
                              if (!devise || devise === "XPF" || devise === "CFP" || devise === "F") return formatPrice(pachat);
                              return `${pachat.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${devise}`;
                            })()}
                          </span>
                          {safeTrim(article.DEVISE) && !["XPF","CFP","F"].includes(safeTrim(article.DEVISE)) && (
                            <div className="conversion-info">
                              {(() => {
                                const conv = convertToXPF(parseFloat(article.PACHAT) || 0, safeTrim(article.DEVISE));
                                if (conv.error) return <span className="conversion-error">⚠️ {conv.error}</span>;
                                if (conv.amountXPF !== null) return (<><span className="conversion-result">≈ {formatPrice(conv.amountXPF)}</span><span className="conversion-rate">(1 {conv.fromCurrency} = {conv.rate?.toFixed(2)} XPF)</span>{exchangeRates?.isFallback && <span className="conversion-warning">Taux approximatif</span>}</>);
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                        <div className="info-item"><label>Prix de revient (PREV)</label><span className="value">{formatPrice(article.PREV)}</span></div>
                        <div className="info-item"><label>Dernier prix revient</label><span className="value">{formatPrice(article.DERPREV)}</span></div>
                        <div className="info-item highlight-box success"><label>Marge calculée</label><span className="value">{calculateMarge(article) ? `${calculateMarge(article)}%` : "-"}</span>{calculateMarge(article) && <span className="marge-formula">(PVTE - DERPREV) / PVTE</span>}</div>
                        <div className="info-item"><label>% Marge (POURC)</label><span className="value">{formatPercent(article.POURC)}</span></div>
                        <div className="info-item"><label>Devise achat</label><span className="value">{safeTrim(article.DEVISE) || "XPF (défaut)"}</span></div>
                        {exchangeRates && (<div className="info-item"><label>Taux de change{exchangeRatesLoading && " (chargement...)"}</label><span className="value small">{exchangeRates.isFallback ? <span className="warning">Taux approximatifs</span> : `Mis à jour: ${exchangeRates.date}`}</span></div>)}
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiTag /> Remises quantité</h3>
                      <div className="info-grid cols-4">
                        <div className="info-item"><label>Qté niveau 2</label><span className="value">{article.QT2 || "-"}</span></div>
                        <div className="info-item"><label>Prix niveau 2</label><span className="value">{formatPrice(article.PR2)}</span></div>
                        <div className="info-item"><label>Qté niveau 3</label><span className="value">{article.QT3 || "-"}</span></div>
                        <div className="info-item"><label>Prix niveau 3</label><span className="value">{formatPrice(article.PR3)}</span></div>
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiDocumentText /> Fiscalité</h3>
                      <div className="info-grid cols-4">
                        <div className="info-item highlight-box"><label>Taux TGC (TAXES)</label><span className="value">{formatPercent(article.TAXES)}</span></div>
                        <div className="info-item"><label>Autre TVA (ATVA)</label><span className="value">{formatPercent(article.ATVA)}</span></div>
                        <div className="info-item"><label>Taux à déduire</label><span className="value">{formatPercent(article.TXADEDUIRE)}</span></div>
                        <div className="info-item"><label>Code TGC</label><span className="value">{safeTrim(article.CODTGC) || "-"}</span></div>
                      </div>
                    </div>
                    {(article.DPROMOD || article.DPROMOF) && (
                      <div className="info-section promo-section">
                        <h3><HiTag /> Informations promotion</h3>
                        <div className="info-grid cols-3">
                          <div className="info-item"><label>Date début promo</label><span className="value">{formatDate(article.DPROMOD)}</span></div>
                          <div className="info-item"><label>Date fin promo</label><span className="value">{formatDate(article.DPROMOF)}</span></div>
                          <div className="info-item"><label>Prix promo</label><span className="value promo">{formatPrice(article.PVPROMO)}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Ventes ── */}
                {activeTab === "ventes" && (
                  <div className="tab-panel">
                    <div className="info-section chart-section">
                      <h3><HiTrendingUp /> Historique des ventes (12 derniers mois)</h3>
                      <div className="chart-stats">
                        <div className="chart-stat"><span className="stat-value">{formatStock(totalSales)}</span><span className="stat-label">Total ventes</span></div>
                        <div className="chart-stat"><span className="stat-value">{averageMonthlySales.toFixed(1)}</span><span className="stat-label">Moyenne/mois</span></div>
                        <div className="chart-stat highlight"><span className="stat-value">{formatStockEnJours(stockEnJours)}</span><span className="stat-label">Stock en jours</span></div>
                      </div>
                      <div className="chart-container large">
                        {(() => {
                          const vals = salesData.map(d => d.ventes);
                          const maxV = Math.max(...vals, 1);
                          const W = 600, H = 300, pad = { t: 20, r: 15, b: 10, l: 40 };
                          const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
                          const pts = vals.map((v, i) => ({ x: pad.l + (vals.length > 1 ? (i / (vals.length - 1)) * cW : cW / 2), y: pad.t + cH - (v / maxV) * cH, v }));
                          const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                          const area = `${line} L ${pts[pts.length-1]?.x||0} ${pad.t+cH} L ${pts[0]?.x||0} ${pad.t+cH} Z`;
                          return (
                            <div style={{ width: "100%", height: 350 }}>
                              <svg viewBox={`0 0 ${W} ${H+40}`} style={{ width: "100%", height: "100%" }}>
                                <defs><linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/></linearGradient></defs>
                                {[0,.25,.5,.75,1].map((f,idx) => { const y=pad.t+cH*(1-f); return <g key={idx}><line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke="#2a2a3a" strokeDasharray="3 3"/><text x={pad.l-6} y={y+4} textAnchor="end" fill="#a0a0b0" fontSize="10">{Math.round(maxV*f)}</text></g>; })}
                                <path d={area} fill="url(#gV)"/><path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                {pts.map((p,i) => <g key={i}><circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="#1a1a25" strokeWidth="2"/>{p.v > 0 && <text x={p.x} y={p.y-12} textAnchor="middle" fill="#f0f0f5" fontSize="11" fontWeight="600">{p.v}</text>}</g>)}
                                {salesData.map((d,i) => { const x=pad.l+(vals.length>1?(i/(vals.length-1))*cW:cW/2); return <text key={i} x={x} y={H+25} textAnchor="middle" fill="#a0a0b0" fontSize="10">{d.name}</text>; })}
                              </svg>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiChartBar /> Détail des ventes par mois</h3>
                      <div className="sales-table">
                        <table>
                          <thead><tr><th>Mois</th><th className="text-right">Ventes</th><th className="text-right">Ruptures</th></tr></thead>
                          <tbody>
                            {salesData.map((item, i) => (
                              <tr key={item.name + i}>
                                <td>{item.fullName}</td>
                                <td className="text-right"><span className={item.ventes > 0 ? "positive" : ""}>{formatStock(item.ventes)}</span></td>
                                <td className="text-right"><span className={ruptureData[i]?.ruptures > 0 ? "warning" : ""}>{formatStock(ruptureData[i]?.ruptures || 0)}</span></td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot><tr><td><strong>Total</strong></td><td className="text-right"><strong>{formatStock(totalSales)}</strong></td><td className="text-right"><strong>{formatStock(totalRuptures)}</strong></td></tr></tfoot>
                        </table>
                      </div>
                    </div>
                    {totalRuptures > 0 && (
                      <div className="info-section chart-section">
                        <h3><HiExclamation /> Historique des ruptures (12 derniers mois)</h3>
                        <div className="chart-stats warning"><div className="chart-stat"><span className="stat-value">{formatStock(totalRuptures)}</span><span className="stat-label">Total ruptures</span></div></div>
                        <div className="chart-container">
                          {(() => {
                            const maxV = Math.max(...ruptureData.map(d => d.ruptures), 1);
                            return (
                              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: 250, padding: "20px 10px 30px" }}>
                                {ruptureData.map((item, i) => {
                                  const h = maxV > 0 ? (item.ruptures / maxV) * 190 : 0;
                                  return (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                                      <span style={{ fontSize: "11px", color: "#f0f0f5", fontWeight: 600 }}>{item.ruptures > 0 ? item.ruptures : ""}</span>
                                      <div style={{ width: "100%", maxWidth: 50, height: h, backgroundColor: "#f59e0b", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease", minHeight: item.ruptures > 0 ? 4 : 0 }} />
                                      <span style={{ fontSize: "10px", color: "#a0a0b0" }}>{item.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Filiales ── */}
                {activeTab === "filiales" && renderFilialesTab()}

                {/* ── Autres ── */}
                {activeTab === "autres" && (
                  <div className="tab-panel">
                    <div className="info-section">
                      <h3><HiCalendar /> Dates importantes</h3>
                      <div className="info-grid cols-3">
                        <div className="info-item"><label>Date création</label><span className="value">{formatDate(article.CREATION)}</span></div>
                        <div className="info-item"><label>Date inventaire</label><span className="value">{formatDate(article.DATINV)}</span></div>
                        <div className="info-item"><label>Date inventaire 2</label><span className="value">{formatDate(article.DATINV2)}</span></div>
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiDocumentText /> Informations douanières</h3>
                      <div className="info-grid cols-3">
                        <div className="info-item"><label>Code douane</label><span className="value mono">{safeTrim(article.DOUANE) || "-"}</span></div>
                        <div className="info-item"><label>Devise</label><span className="value">{safeTrim(article.DEVISE) || "-"}</span></div>
                        <div className="info-item"><label>Code mise à jour</label><span className="value">{safeTrim(article.CODMAJ) || "-"}</span></div>
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiCog /> Paramètres spéciaux</h3>
                      <div className="info-grid cols-4">
                        <div className="info-item"><label>SAV</label><span className={`value badge ${safeTrim(article.SAV) === "O" ? "success" : ""}`}>{safeTrim(article.SAV) === "O" ? "Oui" : "Non"}</span></div>
                        <div className="info-item"><label>Garantie</label><span className="value">{safeTrim(article.GARANTIE) || "-"}</span></div>
                        <div className="info-item"><label>Article composé</label><span className={`value badge ${safeTrim(article.COMPOSE) === "O" ? "info" : ""}`}>{safeTrim(article.COMPOSE) === "O" ? "Oui" : "Non"}</span></div>
                        <div className="info-item"><label>Article en renvoi</label><span className={`value badge ${safeTrim(article.RENV) === "O" ? "warning" : ""}`}>{safeTrim(article.RENV) === "O" ? "Oui" : "Non"}</span></div>
                        <div className="info-item"><label>Visible Web</label><span className={`value badge ${safeTrim(article.WEB) === "O" ? "success" : ""}`}>{safeTrim(article.WEB) === "O" ? "Oui" : "Non"}</span></div>
                        <div className="info-item"><label>Photo disponible</label><span className={`value badge ${safeTrim(article.FOTO) === "F" ? "success" : ""}`}>{safeTrim(article.FOTO) === "F" ? "Oui" : "Non"}</span></div>
                        <div className="info-item"><label>Texte</label><span className="value">{safeTrim(article.TEXTE) || "-"}</span></div>
                        <div className="info-item"><label>Couleur</label><span className="value">{safeTrim(article.COULR) || "-"}</span></div>
                      </div>
                    </div>
                    <div className="info-section">
                      <h3><HiExclamation /> Dépréciation</h3>
                      <div className="info-grid cols-2"><div className="info-item highlight-box warning"><label>Taux de dépréciation</label><span className="value">{formatPercent(article.DEPREC)}</span></div></div>
                    </div>
                    <div className="info-section">
                      <h3><HiLink /> Articles liés</h3>
                      <div className="info-grid cols-2">
                        <div className="info-item"><label>Article de renvoi (GENDOUBL)</label>{safeTrim(article.GENDOUBL) ? <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.GENDOUBL)}`} className="value link">{safeTrim(article.GENDOUBL)}<HiExternalLink /></Link> : <span className="value">-</span>}</div>
                        <div className="info-item"><label>Article associé</label>{safeTrim(article.ASSOCIE) ? <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(article.ASSOCIE)}`} className="value link">{safeTrim(article.ASSOCIE)}<HiExternalLink /></Link> : <span className="value">-</span>}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminArticleInfosScreen;