"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Images,
  FileText,
  Inbox,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Upload,
  CheckCircle2,
  AlertCircle,
  Video,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Save,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { initialSiteData } from "@/lib/data.js";
import { cn } from "@/lib/utils.js";

/**
 * Client-side compression for CMS image uploads:
 * Downscales images wider or taller than 2000px down to 2000px (preserving aspect ratio)
 * and re-encodes at 0.8 quality via HTML5 Canvas.
 * Keeps uploads snappy, well below Vercel's 4MB limit. Skips videos, GIFs, and SVGs.
 */
async function compressImageClient(file, maxDimension = 2000, quality = 0.8) {
  if (!file || !file.type?.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= maxDimension && height <= maxDimension && file.size < 1.5 * 1024 * 1024) {
          return resolve(file);
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === "image/png";
        const outputType = isPng ? "image/jpeg" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + (outputType === "image/webp" ? ".webp" : ".jpg");

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              return resolve(file);
            }
            const compressedFile = new File([blob], newFileName, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("gallery");
  const [siteData, setSiteData] = useState(initialSiteData);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Gallery upload state
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadingProgress, setUploadingProgress] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("Reception");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadShowHome, setUploadShowHome] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState(null);

  // Check auth & load data on mount
  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch("/api/auth/check");
        const authData = await authRes.json();
        if (!authData.authenticated) {
          router.replace("/admin/login");
          return;
        }

        const [contentRes, enquiriesRes] = await Promise.all([
          fetch("/api/admin/content"),
          fetch("/api/admin/enquiries"),
        ]);

        if (contentRes.ok) {
          const content = await contentRes.json();
          setSiteData(content);
          if (content.categories && content.categories.length > 0) {
            setUploadCategory(content.categories[1] || content.categories[0]);
          }
        }

        if (enquiriesRes.ok) {
          const enqData = await enquiriesRes.json();
          setEnquiries(enqData.enquiries || []);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  // Save all site data to backend
  const handleSaveContent = async (overrideData) => {
    setIsSaving(true);
    try {
      const dataToSave = overrideData || siteData;
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (res.ok) {
        showToast("Changes saved and live across the site!");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save changes", "error");
      }
    } catch {
      showToast("Network error while saving content.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ==============================================================
  // GALLERY MANAGEMENT
  // ==============================================================

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) {
      showToast("Please select at least one image or video to upload.", "error");
      return;
    }

    setUploadingProgress(10);
    const newItems = [];

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        let file = uploadFiles[i];
        if (file.type?.startsWith("image/")) {
          try {
            file = await compressImageClient(file);
          } catch (cErr) {
            console.warn("Client compression fallback:", cErr);
          }
        }
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || `Failed uploading ${file.name}`);
        }

        const uploaded = await uploadRes.json();
        const isVideo = uploaded.type === "video";

        newItems.push({
          id: `gal-${Date.now()}-${i}`,
          type: isVideo ? "video" : "image",
          url: uploaded.url,
          title: uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, ""),
          caption: uploadCaption.trim() || undefined,
          category: uploadCategory,
          showOnHome: uploadShowHome,
          order: siteData.gallery.length + i + 1,
          uploadedAt: new Date().toISOString(),
        });

        setUploadingProgress(Math.round(((i + 1) / uploadFiles.length) * 90));
      }

      const updatedGallery = [...newItems, ...siteData.gallery];
      const updatedData = {
        ...siteData,
        gallery: updatedGallery,
      };

      setSiteData(updatedData);
      await handleSaveContent(updatedData);

      // Reset form
      setUploadFiles([]);
      setUploadTitle("");
      setUploadCaption("");
      setUploadShowHome(false);
      showToast(`Uploaded ${newItems.length} item(s) successfully!`);
    } catch (err) {
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setUploadingProgress(null);
    }
  };

  const handleDeleteGalleryItem = async (id) => {
    if (!confirm("Are you sure you want to remove this item from the gallery?")) return;
    const updated = siteData.gallery.filter((g) => g.id !== id);
    const updatedData = { ...siteData, gallery: updated };
    setSiteData(updatedData);
    await handleSaveContent(updatedData);
  };

  const handleToggleHome = async (id) => {
    const updated = siteData.gallery.map((g) =>
      g.id === id ? { ...g, showOnHome: !g.showOnHome } : g
    );
    const updatedData = { ...siteData, gallery: updated };
    setSiteData(updatedData);
    await handleSaveContent(updatedData);
  };

  const handleMoveItem = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siteData.gallery.length) return;

    const list = [...siteData.gallery];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updatedData = { ...siteData, gallery: list };
    setSiteData(updatedData);
    await handleSaveContent(updatedData);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    if (siteData.categories.includes(trimmed)) {
      showToast("Category already exists.", "error");
      return;
    }
    const updatedCategories = [...siteData.categories, trimmed];
    const updatedData = { ...siteData, categories: updatedCategories };
    setSiteData(updatedData);
    setNewCategoryName("");
    await handleSaveContent(updatedData);
    showToast(`Added category "${trimmed}"`);
  };

  const handleDeleteCategory = async (cat) => {
    if (cat === "All") {
      showToast("Cannot delete the All category.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to delete category "${cat}"? Items will be set to "Custom Themes".`)) return;

    const updatedCategories = siteData.categories.filter((c) => c !== cat);
    const updatedGallery = siteData.gallery.map((g) =>
      g.category === cat ? { ...g, category: "Custom Themes" } : g
    );
    const updatedData = {
      ...siteData,
      categories: updatedCategories,
      gallery: updatedGallery,
    };
    setSiteData(updatedData);
    await handleSaveContent(updatedData);
  };

  // ==============================================================
  // GALLERY: edit title / subtext after upload
  // ==============================================================

  const updateGalleryItem = (id, patch) =>
    setSiteData((d) => ({
      ...d,
      gallery: d.gallery.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));

  // ==============================================================
  // POLAROID HERO SLIDES: add / replace photo, reorder, delete, text
  // ==============================================================

  const [heroBusy, setHeroBusy] = useState(false);

  const uploadImageFile = async (rawFile) => {
    let file = rawFile;
    if (file?.type?.startsWith("image/")) {
      try {
        file = await compressImageClient(file);
      } catch (cErr) {
        console.warn("Client compression fallback:", cErr);
      }
    }
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Failed uploading ${file.name}`);
    return data.url;
  };

  const updateHeroSlide = (idx, patch) =>
    setSiteData((d) => ({
      ...d,
      heroSlides: d.heroSlides.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));

  const handleAddHeroSlides = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length) {
      showToast("Please choose image files (JPG, PNG, WebP).", "error");
      return;
    }
    setHeroBusy(true);
    try {
      const added = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageFile(files[i]);
        added.push({
          id: `slide-${Date.now()}-${i}`,
          image: url,
          title: "New slide heading",
          subtitle: "",
          extra: "",
          ctaText: "",
          ctaLink: "/gallery",
        });
      }
      const updatedData = { ...siteData, heroSlides: [...siteData.heroSlides, ...added] };
      setSiteData(updatedData);
      await handleSaveContent(updatedData);
      showToast(`Added ${added.length} polaroid(s). Edit their text below.`);
    } catch (err) {
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setHeroBusy(false);
    }
  };

  const handleReplaceHeroImage = async (idx, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    setHeroBusy(true);
    try {
      const url = await uploadImageFile(file);
      const updatedData = {
        ...siteData,
        heroSlides: siteData.heroSlides.map((s, i) => (i === idx ? { ...s, image: url } : s)),
      };
      setSiteData(updatedData);
      await handleSaveContent(updatedData);
    } catch (err) {
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setHeroBusy(false);
    }
  };

  const handleMoveHero = async (idx, direction) => {
    const to = direction === "up" ? idx - 1 : idx + 1;
    if (to < 0 || to >= siteData.heroSlides.length) return;
    const list = [...siteData.heroSlides];
    [list[idx], list[to]] = [list[to], list[idx]];
    const updatedData = { ...siteData, heroSlides: list };
    setSiteData(updatedData);
    await handleSaveContent(updatedData);
  };

  const handleDeleteHero = async (idx) => {
    if (siteData.heroSlides.length <= 1) {
      showToast("Keep at least one polaroid on the homepage.", "error");
      return;
    }
    if (!confirm("Remove this polaroid from the homepage?")) return;
    const updatedData = {
      ...siteData,
      heroSlides: siteData.heroSlides.filter((_, i) => i !== idx),
    };
    setSiteData(updatedData);
    await handleSaveContent(updatedData);
  };

  // ==============================================================
  // ENQUIRIES MANAGEMENT
  // ==============================================================

  const handleDeleteEnquiry = async (id) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      const res = await fetch(`/api/admin/enquiries?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEnquiries(enquiries.filter((e) => e.id !== id));
        showToast("Enquiry deleted.");
      }
    } catch {
      showToast("Failed to delete enquiry.", "error");
    }
  };

  // ==============================================================
  // PASSWORD MANAGEMENT
  // ==============================================================

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setPwdMsg({ type: "success", text: "Main client password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwdMsg({ type: "error", text: data.error || "Failed to update password." });
      }
    } catch {
      setPwdMsg({ type: "error", text: "Connection error occurred." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-950 text-cream-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-forest-900 border-b border-forest-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-40">
            <Image
              src="/images/logo.png"
              alt="Marrigold Events"
              fill
              sizes="160px"
              priority
              className="object-contain"
            />
          </div>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-forest-950 border border-gold-500/30 text-gold-400 text-[10px] font-bold tracking-widest uppercase">
            CMS Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-forest-200 hover:text-white px-3 py-1.5 rounded-lg bg-forest-950 border border-forest-800 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => handleSaveContent()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-forest-950 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? "Saving..." : "Save All"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-forest-200 hover:text-rose-400 hover:bg-forest-800 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={cn(
              "px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 border",
              toast.type === "success"
                ? "bg-emerald-950 border-emerald-500 text-emerald-200"
                : "bg-rose-950 border-rose-500 text-rose-200"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Main CMS Shell */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-forest-900/60 border-r border-forest-800/80 p-4 shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
          <button
            onClick={() => setActiveTab("gallery")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 md:w-full text-left",
              activeTab === "gallery"
                ? "bg-gold-500 text-forest-950 font-bold shadow-md"
                : "text-forest-200 hover:bg-forest-800 hover:text-white"
            )}
          >
            <Images className="w-4 h-4" />
            <span>Gallery & Media ({siteData.gallery.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("content")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 md:w-full text-left",
              activeTab === "content"
                ? "bg-gold-500 text-forest-950 font-bold shadow-md"
                : "text-forest-200 hover:bg-forest-800 hover:text-white"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Page Content</span>
          </button>

          <button
            onClick={() => setActiveTab("enquiries")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 md:w-full text-left relative",
              activeTab === "enquiries"
                ? "bg-gold-500 text-forest-950 font-bold shadow-md"
                : "text-forest-200 hover:bg-forest-800 hover:text-white"
            )}
          >
            <Inbox className="w-4 h-4" />
            <span>Enquiries ({enquiries.length})</span>
            {enquiries.length > 0 && (
              <span className="ml-auto w-2 h-2 rounded-full bg-gold-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 md:w-full text-left",
              activeTab === "settings"
                ? "bg-gold-500 text-forest-950 font-bold shadow-md"
                : "text-forest-200 hover:bg-forest-800 hover:text-white"
            )}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings & Access</span>
          </button>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl overflow-y-auto">
          {/* ========================================================= */}
          {/* TAB 1: GALLERY & MEDIA */}
          {/* ========================================================= */}
          {activeTab === "gallery" && (
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl font-bold text-cream-100">
                  Gallery & Media Studio
                </h2>
                <p className="text-xs text-forest-200 mt-1">
                  Upload wedding photos and videos, manage categories, and curate home showcases.
                </p>
              </div>

              {/* Upload Box */}
              <div className="bg-forest-900/80 border border-forest-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-gold-400" />
                  <h3 className="font-serif text-xl font-bold text-gold-300">
                    Upload Photos & Videos
                  </h3>
                </div>

                <form onSubmit={handleFileUpload} className="space-y-5">
                  <div className="border-2 border-dashed border-forest-700 hover:border-gold-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-forest-950/40">
                    <input
                      type="file"
                      id="gallery-files"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                      onChange={(e) => {
                        if (e.target.files) {
                          setUploadFiles(Array.from(e.target.files));
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="gallery-files" className="cursor-pointer space-y-2 block">
                      <div className="w-12 h-12 rounded-full bg-forest-800 text-gold-400 mx-auto flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {uploadFiles.length > 0
                          ? `Selected ${uploadFiles.length} file(s)`
                          : "Drag & drop or Click to choose files"}
                      </p>
                      <p className="text-xs text-forest-300">
                        Supports JPG, PNG, WebP & MP4, WebM, MOV videos
                      </p>
                    </label>
                  </div>

                  {uploadingProgress !== null && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gold-300">
                        <span>Uploading files...</span>
                        <span>{uploadingProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-forest-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-400 transition-all duration-300"
                          style={{ width: `${uploadingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                        Category
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      >
                        {siteData.categories
                          .filter((c) => c !== "All")
                          .map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                        Title / Setup Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Royal Mandap Elegance"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                        Short Caption / Details
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Floral canopy with warm chandeliers"
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-forest-200">
                      <input
                        type="checkbox"
                        checked={uploadShowHome}
                        onChange={(e) => setUploadShowHome(e.target.checked)}
                        className="rounded border-forest-700 text-gold-500 focus:ring-0"
                      />
                      <span>Feature in Homepage Highlights</span>
                    </label>

                    <button
                      type="submit"
                      disabled={uploadFiles.length === 0 || uploadingProgress !== null}
                      className="bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      Start Upload
                    </button>
                  </div>
                </form>
              </div>

              {/* Category Management */}
              <div className="bg-forest-900/60 border border-forest-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-serif text-lg font-bold text-gold-300">
                  Manage Categories
                </h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {siteData.categories.map((cat) => (
                    <div
                      key={cat}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-950 border border-forest-700 text-xs text-cream-100"
                    >
                      <span>{cat}</span>
                      {cat !== "All" && (
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-forest-400 hover:text-rose-400"
                          title="Delete category"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <input
                      type="text"
                      placeholder="New category..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="bg-forest-950 border border-forest-700 rounded-full px-3 py-1 text-xs text-white w-36"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="px-3 py-1 bg-gold-600 hover:bg-gold-500 text-forest-950 rounded-full text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Gallery Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-cream-100">
                    Existing Album Items ({siteData.gallery.length})
                  </h3>
                  <span className="text-xs text-forest-300">
                    Click order arrows to re-position
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {siteData.gallery.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-forest-900 border border-forest-800 rounded-2xl overflow-hidden flex flex-col justify-between group shadow-sm"
                    >
                      <div className="relative h-44 w-full bg-black">
                        {item.type === "video" ? (
                          <div className="relative w-full h-full flex items-center justify-center bg-forest-950">
                            <Video className="w-10 h-10 text-gold-400" />
                            <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-white uppercase font-bold">
                              Video
                            </span>
                          </div>
                        ) : (
                          <Image
                            src={item.url}
                            alt={item.title}
                            fill
                            sizes="240px"
                            className="object-cover"
                          />
                        )}
                        <span className="absolute top-2 left-2 text-[10px] bg-forest-950/80 backdrop-blur-md px-2 py-0.5 rounded text-gold-300 border border-forest-700">
                          {item.category}
                        </span>
                        {item.showOnHome && (
                          <span className="absolute top-2 right-2 text-[10px] bg-gold-500 text-forest-950 font-bold px-2 py-0.5 rounded">
                            Home
                          </span>
                        )}
                      </div>

                      <div className="p-3 space-y-1.5">
                        <input
                          type="text"
                          value={item.title || ""}
                          placeholder="Title"
                          onChange={(e) => updateGalleryItem(item.id, { title: e.target.value })}
                          onFocus={(e) => (e.target.dataset.v = e.target.value)}
                          onBlur={(e) => e.target.dataset.v !== e.target.value && handleSaveContent()}
                          className="w-full bg-transparent border-b border-transparent hover:border-forest-700 focus:border-gold-400 outline-none font-serif text-sm font-bold text-white"
                        />
                        <input
                          type="text"
                          value={item.caption || ""}
                          placeholder="Add subtext / caption…"
                          onChange={(e) => updateGalleryItem(item.id, { caption: e.target.value })}
                          onFocus={(e) => (e.target.dataset.v = e.target.value)}
                          onBlur={(e) => e.target.dataset.v !== e.target.value && handleSaveContent()}
                          className="w-full bg-transparent border-b border-transparent hover:border-forest-700 focus:border-gold-400 outline-none text-[11px] text-forest-200 placeholder-forest-500"
                        />
                      </div>

                      <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-forest-800/60 text-forest-300 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveItem(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 hover:text-gold-300 disabled:opacity-30"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveItem(idx, "down")}
                            disabled={idx === siteData.gallery.length - 1}
                            className="p-1 hover:text-gold-300 disabled:opacity-30"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleHome(item.id)}
                            className="p-1 hover:text-gold-300"
                            title={item.showOnHome ? "Remove from Home" : "Feature on Home"}
                          >
                            {item.showOnHome ? (
                              <Eye className="w-4 h-4 text-gold-400" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-forest-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteGalleryItem(item.id)}
                            className="p-1 hover:text-rose-400"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PAGE CONTENT EDITOR */}
          {/* ========================================================= */}
          {activeTab === "content" && (
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl font-bold text-cream-100">
                  Page Content Management
                </h2>
                <p className="text-xs text-forest-200 mt-1">
                  Update homepage hero slides, founder story, services, and studio contact info.
                </p>
              </div>

              {/* Homepage Polaroid Stack */}
              <div className="bg-forest-900/80 border border-forest-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-gold-300">
                      Homepage Polaroid Stack ({siteData.heroSlides.length})
                    </h3>
                    <p className="text-xs text-forest-300 mt-1">
                      Each polaroid has its own heading, subtext, an optional line under it, and a button.
                    </p>
                  </div>
                  <label
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-full bg-gold-500 px-4 py-2 text-xs font-bold text-forest-950 hover:bg-gold-400 transition-colors",
                      heroBusy && "opacity-60 pointer-events-none"
                    )}
                  >
                    {heroBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{heroBusy ? "Uploading..." : "Add photo(s)"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleAddHeroSlides}
                    />
                  </label>
                </div>

                <div className="space-y-5">
                  {siteData.heroSlides.map((slide, sIdx) => (
                    <div
                      key={slide.id}
                      className="p-4 sm:p-5 rounded-2xl bg-forest-950 border border-forest-800 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-gold-400">Polaroid #{sIdx + 1}</span>
                        <div className="flex items-center gap-1 text-forest-300">
                          <button
                            onClick={() => handleMoveHero(sIdx, "up")}
                            disabled={sIdx === 0}
                            className="p-1.5 hover:text-gold-300 disabled:opacity-30"
                            title="Move earlier"
                          >
                            <MoveUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveHero(sIdx, "down")}
                            disabled={sIdx === siteData.heroSlides.length - 1}
                            className="p-1.5 hover:text-gold-300 disabled:opacity-30"
                            title="Move later"
                          >
                            <MoveDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHero(sIdx)}
                            className="p-1.5 hover:text-rose-400"
                            title="Remove polaroid"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[132px_1fr]">
                        <div className="space-y-2">
                          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-forest-700 bg-forest-900">
                            <Image src={slide.image} alt={slide.title || ""} fill sizes="132px" className="object-cover" />
                          </div>
                          <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-forest-700 px-2 py-1.5 text-[11px] font-semibold text-forest-200 hover:border-gold-400 hover:text-gold-300 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            Replace photo
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = "";
                                handleReplaceHeroImage(sIdx, f);
                              }}
                            />
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                              Heading
                            </label>
                            <input
                              type="text"
                              value={slide.title || ""}
                              onChange={(e) => updateHeroSlide(sIdx, { title: e.target.value })}
                              className="w-full bg-forest-900 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                              Subtext
                            </label>
                            <input
                              type="text"
                              value={slide.subtitle || ""}
                              onChange={(e) => updateHeroSlide(sIdx, { subtitle: e.target.value })}
                              className="w-full bg-forest-900 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                              Line under the subtext (optional)
                            </label>
                            <input
                              type="text"
                              value={slide.extra || ""}
                              placeholder="e.g. Now booking 2027 dates"
                              onChange={(e) => updateHeroSlide(sIdx, { extra: e.target.value })}
                              className="w-full bg-forest-900 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-forest-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                              Button text (empty = no button)
                            </label>
                            <input
                              type="text"
                              value={slide.ctaText || ""}
                              onChange={(e) => updateHeroSlide(sIdx, { ctaText: e.target.value })}
                              className="w-full bg-forest-900 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                              Button link
                            </label>
                            <input
                              type="text"
                              value={slide.ctaLink || ""}
                              placeholder="/gallery"
                              onChange={(e) => updateHeroSlide(sIdx, { ctaLink: e.target.value })}
                              className="w-full bg-forest-900 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-forest-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSaveContent()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-xs font-bold text-forest-950 hover:bg-gold-400 transition-colors disabled:opacity-60"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? "Saving..." : "Save polaroid text"}
                </button>
              </div>

              {/* Contact Information */}
              <div className="bg-forest-900/80 border border-forest-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <h3 className="font-serif text-xl font-bold text-gold-300">
                  Studio Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                      Contact Person / Team Name
                    </label>
                    <input
                      type="text"
                      value={siteData.contact.founderName}
                      onChange={(e) =>
                        setSiteData({
                          ...siteData,
                          contact: { ...siteData.contact, founderName: e.target.value },
                        })
                      }
                      className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                      Direct Email
                    </label>
                    <input
                      type="email"
                      value={siteData.contact.email}
                      onChange={(e) =>
                        setSiteData({
                          ...siteData,
                          contact: { ...siteData.contact, email: e.target.value },
                        })
                      }
                      className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                      Mulund West Studio Address
                    </label>
                    <input
                      type="text"
                      value={siteData.contact.address}
                      onChange={(e) =>
                        setSiteData({
                          ...siteData,
                          contact: { ...siteData.contact, address: e.target.value },
                        })
                      }
                      className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ENQUIRIES INBOX */}
          {/* ========================================================= */}
          {activeTab === "enquiries" && (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-3xl font-bold text-cream-100">
                  Client Enquiries Inbox
                </h2>
                <p className="text-xs text-forest-200 mt-1">
                  Review all contact and wedding enquiries submitted through the website.
                </p>
              </div>

              {enquiries.length === 0 ? (
                <div className="p-12 text-center bg-forest-900/60 rounded-3xl border border-forest-800">
                  <Inbox className="w-12 h-12 text-forest-400 mx-auto mb-3" />
                  <p className="text-forest-200 text-sm">No enquiries received yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((enq) => (
                    <div
                      key={enq.id}
                      className="p-6 rounded-2xl bg-forest-900 border border-forest-800 shadow-md space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-forest-800 pb-3">
                        <div>
                          <h4 className="font-serif text-xl font-bold text-gold-300">
                            {enq.name}
                          </h4>
                          <span className="text-xs text-forest-300">
                            Service: <strong className="text-cream-100">{enq.serviceInterest}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-forest-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(enq.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteEnquiry(enq.id)}
                            className="p-1.5 rounded-lg text-forest-400 hover:text-rose-400 transition-colors"
                            title="Delete Enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-forest-200">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gold-400" />
                          <a href={`tel:${enq.phone}`} className="hover:text-gold-300 underline font-semibold">
                            {enq.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gold-400" />
                          <a href={`mailto:${enq.email}`} className="hover:text-gold-300 underline">
                            {enq.email}
                          </a>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-forest-950 text-xs text-cream-100 leading-relaxed border border-forest-800">
                        {enq.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: SETTINGS & PASSWORD */}
          {/* ========================================================= */}
          {activeTab === "settings" && (
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl font-bold text-cream-100">
                  Settings & Access Control
                </h2>
                <p className="text-xs text-forest-200 mt-1">
                  Change your studio management password and update SEO essentials.
                </p>
              </div>

              {/* Password Change Box */}
              <div className="bg-forest-900/80 border border-forest-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-xl">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-gold-400" />
                  <h3 className="font-serif text-xl font-bold text-gold-300">
                    Change Studio Password
                  </h3>
                </div>

                {pwdMsg && (
                  <div
                    className={cn(
                      "p-4 rounded-xl text-xs flex items-center gap-2",
                      pwdMsg.type === "success"
                        ? "bg-emerald-950 border border-emerald-500 text-emerald-200"
                        : "bg-rose-950 border border-rose-500 text-rose-200"
                    )}
                  >
                    {pwdMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-colors"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* SEO Basics */}
              <div className="bg-forest-900/80 border border-forest-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-xl">
                <h3 className="font-serif text-xl font-bold text-gold-300">
                  Site Meta & Search Optimization
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                      Website Browser Title
                    </label>
                    <input
                      type="text"
                      value={siteData.settings.siteTitle}
                      onChange={(e) =>
                        setSiteData({
                          ...siteData,
                          settings: { ...siteData.settings, siteTitle: e.target.value },
                        })
                      }
                      className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-semibold text-forest-200 mb-1">
                      Google Meta Description
                    </label>
                    <textarea
                      rows={3}
                      value={siteData.settings.metaDescription}
                      onChange={(e) =>
                        setSiteData({
                          ...siteData,
                          settings: { ...siteData.settings, metaDescription: e.target.value },
                        })
                      }
                      className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

