/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { formatIndianDate } from "@/lib/utils";
import MilkifyLoader from "@/components/ui/Loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload, Image as ImageIcon, FileText, Trash2, Copy, Check,
  Search, HardDrive, RefreshCw, X, ExternalLink,
  Plus, Eye, Layers
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Assets" },
  { id: "general", label: "General" },
  { id: "farmers", label: "Farmer Photos" },
  { id: "receipts", label: "Receipts & Slips" },
  { id: "banners", label: "Banners" },
  { id: "documents", label: "Documents" },
];

export default function DairyMediaGallery() {
  const [mediaList, setMediaList] = useState([]);
  const [stats, setStats] = useState({ totalFiles: 0, formattedSize: "0 MB" });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("general");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (category !== "all") params.category = category;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [resList, resStats] = await Promise.all([
        api.get("/media", { params }),
        api.get("/media/stats").catch(() => ({ data: { totalFiles: 0, formattedSize: "0 MB" } })),
      ]);

      const list = resList.data?.media || resList.data?.data?.media || (Array.isArray(resList.data) ? resList.data : []);
      setMediaList(list);

      const statsData = resStats.data?.stats || (resStats.data?.formattedSize ? resStats.data : resStats.data?.data);
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load media files");
    } finally {
      setLoading(false);
    }
  }, [category, searchTerm]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedia();
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("category", uploadCategory);

    setUploading(true);
    try {
      await api.post("/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${files.length} file(s) uploaded to AWS S3!`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchMedia();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("AWS S3 public link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await api.delete(`/media/${id}`);
      toast.success("File deleted from AWS S3");
      setMediaList((prev) => prev.filter((m) => m._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm">
              AWS S3 Storage
            </span>
            <span className="text-blue-100 text-xs">Region: ap-southeast-2</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Dairy Media Gallery</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Upload, store, and manage your dairy receipts, farmer profile photos, and high-resolution media on high-availability cloud storage.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,application/pdf"
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="bg-white/10 text-white text-xs border border-white/20 rounded-xl px-3 py-2.5 outline-none font-medium cursor-pointer backdrop-blur-sm"
            >
              <option value="general" className="text-slate-800">General</option>
              <option value="farmers" className="text-slate-800">Farmer Photo</option>
              <option value="receipts" className="text-slate-800">Receipt / Slip</option>
              <option value="banners" className="text-slate-800">Banner</option>
              <option value="documents" className="text-slate-800">Document</option>
            </select>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg shadow-black/10 rounded-xl px-4 py-2.5 flex items-center gap-2"
            >
              {uploading ? (
                <MilkifyLoader size="sm" color="blue" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploading ? "Uploading..." : "Upload Files"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4.5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Files</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
                {stats.totalFiles || mediaList.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4.5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cloud Storage Used</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
                {stats.formattedSize}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4.5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cloud Bucket</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white mt-1 truncate">
                ab-tech-network
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="border-slate-200 dark:border-slate-700 h-8 px-3 text-xs"
          >
            Filter
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={fetchMedia}
            className="h-8 w-8 p-0"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </Button>
        </form>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <MilkifyLoader size="lg" color="blue" />
          <p className="text-xs text-slate-400 mt-3 font-medium">Fetching media assets from S3...</p>
        </div>
      ) : mediaList.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <CardContent className="py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-3">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No media assets found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {category !== "all" || searchTerm
                ? "Try clearing filters to see more assets."
                : "You haven't uploaded any media files yet. Click 'Upload Files' to store receipts or farmer photos."}
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Upload First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {mediaList.map((media) => {
            const isImage = media.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(media.url);
            return (
              <div
                key={media._id}
                className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => setPreviewMedia(media)}
                  className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer flex items-center justify-center group-hover:brightness-95 transition-all"
                >
                  {isImage ? (
                    <img
                      src={media.url}
                      alt={media.fileName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-slate-400">
                      <FileText className="w-12 h-12 text-blue-500 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PDF Document</span>
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/75 backdrop-blur-sm text-white capitalize shadow-sm">
                    {media.category || "general"}
                  </span>
                </div>

                {/* Details Footer */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={media.fileName}>
                      {media.fileName}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{formatFileSize(media.fileSize)}</span>
                      <span>{formatIndianDate(media.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-1 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleCopyUrl(media.url, media._id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Copy S3 public link"
                    >
                      {copiedId === media._id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setPreviewMedia(media)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(media._id)}
                      className="p-1.5 text-slate-500 hover:text-red-600 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete from S3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="min-w-0 pr-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                  {previewMedia.fileName}
                </h4>
                <p className="text-xs text-slate-400">
                  {formatFileSize(previewMedia.fileSize)} • Uploaded {formatIndianDate(previewMedia.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyUrl(previewMedia.url, previewMedia._id)}
                  className="text-xs h-8 gap-1.5"
                >
                  {copiedId === previewMedia._id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy URL
                </Button>
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex items-center justify-center min-h-[300px] max-h-[70vh] bg-slate-950/10 dark:bg-slate-950/40">
              {previewMedia.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(previewMedia.url) ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.fileName}
                  className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">PDF Document</p>
                  <a
                    href={previewMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    View Document <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete file from AWS S3?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              This action cannot be undone. The file will be permanently deleted from the cloud bucket and will no longer be accessible via its URL.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
