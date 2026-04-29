import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { detectionsApi } from '../lib/api';
import toast from 'react-hot-toast';
import {
  Upload, Image as ImageIcon, FileVideo, X, CheckCircle,
  AlertTriangle, Download, Eye, Info, Loader2
} from 'lucide-react';
import { ConfidenceMeter, Spinner } from '../components/UI';

const ACCEPTED_IMAGE = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };
const ACCEPTED_VIDEO = { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/x-msvideo': ['.avi'] };

function EditTypeBadge({ tag }) {
  // Pick colour/icon based on tag keyword
  const isGAN = tag.toLowerCase().includes('gan') || tag.toLowerCase().includes('diffusion') || tag.toLowerCase().includes('ai-generated');
  const isSplice = tag.toLowerCase().includes('splicing') || tag.toLowerCase().includes('compositing') || tag.toLowerCase().includes('pasting');
  const isSwap = tag.toLowerCase().includes('face swap') || tag.toLowerCase().includes('inpainting') || tag.toLowerCase().includes('blur');
  const isNoise = tag.toLowerCase().includes('noise') || tag.toLowerCase().includes('artifact') || tag.toLowerCase().includes('grid');
  const isColor = tag.toLowerCase().includes('color') || tag.toLowerCase().includes('channel');

  let colorClass = 'bg-orange-500/15 border-orange-500/30 text-orange-300';
  let dot = 'bg-orange-400';
  if (isGAN)   { colorClass = 'bg-violet-500/15 border-violet-500/30 text-violet-300'; dot = 'bg-violet-400'; }
  if (isSplice){ colorClass = 'bg-red-500/15 border-red-500/30 text-red-300'; dot = 'bg-red-400'; }
  if (isSwap)  { colorClass = 'bg-amber-500/15 border-amber-500/30 text-amber-300'; dot = 'bg-amber-400'; }
  if (isNoise) { colorClass = 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'; dot = 'bg-cyan-400'; }
  if (isColor) { colorClass = 'bg-pink-500/15 border-pink-500/30 text-pink-300'; dot = 'bg-pink-400'; }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {tag}
    </span>
  );
}

function ResultPanel({ result, onReset }) {
  const isFake = result.prediction === 'FAKE';
  const [downloading, setDownloading] = useState(false);
  const editTypes = result.edit_types || [];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const resp = await detectionsApi.downloadReport(result.id);
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deepguard_report_${result.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      {/* Verdict banner */}
      <div className={`rounded-2xl p-6 border ${isFake ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} relative overflow-hidden`}>
        <div className={`absolute inset-0 ${isFake ? 'bg-gradient-to-r from-red-600/5 to-transparent' : 'bg-gradient-to-r from-emerald-600/5 to-transparent'}`} />
        <div className="relative flex items-center gap-4">
          {isFake
            ? <AlertTriangle className="w-10 h-10 text-red-400 flex-shrink-0" />
            : <CheckCircle className="w-10 h-10 text-emerald-400 flex-shrink-0" />
          }
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Detection Result</p>
            <p className={`text-2xl font-black ${isFake ? 'text-red-400' : 'text-emerald-400'}`}>
              {isFake ? 'AI-Generated (Fake)' : 'Authentic (Real)'}
            </p>
            <p className="text-slate-400 text-sm mt-0.5">{result.filename} · {result.file_type.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Confidence meter */}
      <div className="glass p-5">
        <ConfidenceMeter value={result.confidence} prediction={result.prediction} />
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          Processed in {result.processing_time?.toFixed(2)}s
        </p>
      </div>

      {/* Detected manipulation types */}
      {isFake && editTypes.length > 0 && (
        <div className="glass p-5">
          <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Detected Manipulation Types
          </p>
          <div className="flex flex-wrap gap-2">
            {editTypes.map((tag, i) => (
              <EditTypeBadge key={i} tag={tag} />
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Based on Error Level Analysis, frequency fingerprinting, noise mapping, and colour channel forensics.
          </p>
        </div>
      )}

      {/* Explanation */}
      <div className="glass p-5">
        <p className="text-sm font-semibold text-slate-300 mb-2">AI Explanation</p>
        <p className="text-sm text-slate-400 leading-relaxed">{result.explanation}</p>
      </div>

      {/* Video frames */}
      {result.frame_results?.length > 0 && (
        <div className="glass p-5">
          <p className="text-sm font-semibold text-slate-300 mb-4">Frame Analysis ({result.frame_results.length} frames sampled)</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {result.frame_results.map((fr) => (
              <div key={fr.frame_number} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${fr.is_suspicious ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/10'}`}>
                <span className="text-slate-400">Frame {fr.frame_number} <span className="text-slate-600">@ {fr.timestamp}s</span></span>
                <div className="flex items-center gap-2">
                  <span className={fr.prediction === 'FAKE' ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>{fr.prediction}</span>
                  <span className="text-slate-500">{Math.round(fr.confidence * 100)}%</span>
                  {fr.is_suspicious && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button id="download-report" onClick={handleDownload} disabled={downloading} className="btn-primary flex-1">
          {downloading ? <Spinner size="sm" /> : <Download className="w-4 h-4" />}
          Download PDF Report
        </button>
        <button id="scan-another" onClick={onReset} className="btn-secondary flex-1">Scan Another</button>
      </div>
    </div>
  );
}


export default function DetectPage() {
  const [mode, setMode] = useState('image'); // 'image' | 'video'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: mode === 'image' ? ACCEPTED_IMAGE : ACCEPTED_VIDEO,
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = () => { setFile(null); setPreview(null); setResult(null); };

  const handleAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const fn = mode === 'image' ? detectionsApi.analyzeImage : detectionsApi.analyzeVideo;
      const data = await fn(formData, (p) => setProgress(p));
      setResult(data);
      toast.success('Analysis complete!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Analysis failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  if (result) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <ResultPanel result={result} onReset={() => { setResult(null); setFile(null); setPreview(null); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold mb-3">
            <span className="gradient-text">Deepfake</span> Detector
          </h1>
          <p className="text-slate-400">Upload an image or video. Our AI will analyze it instantly.</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-2xl bg-white/5 border border-white/10 p-1.5 gap-1.5">
          {[
            { key: 'image', label: 'Image', icon: ImageIcon, formats: 'JPG · PNG · WebP up to 10MB' },
            { key: 'video', label: 'Video', icon: FileVideo, formats: 'MP4 · MOV · AVI up to 100MB' },
          ].map(({ key, label, icon: Icon, formats }) => (
            <button
              key={key}
              id={`mode-${key}`}
              onClick={() => { setMode(key); removeFile(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === key
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Drop zone */}
        {!file ? (
          <div
            {...getRootProps()}
            id="dropzone"
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                : 'border-white/20 hover:border-brand-500/50 hover:bg-white/3'
            }`}
          >
            <input {...getInputProps()} />
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all ${
              isDragActive ? 'bg-brand-500/20 border-brand-500/40' : 'bg-white/5 border-white/10'
            } border`}>
              <Upload className={`w-9 h-9 ${isDragActive ? 'text-brand-400' : 'text-slate-500'}`} />
            </div>
            <p className="text-lg font-semibold text-slate-200 mb-2">
              {isDragActive ? 'Drop it here!' : 'Drag & drop your file'}
            </p>
            <p className="text-slate-500 text-sm mb-4">or click to browse</p>
            <p className="text-xs text-slate-600">
              {mode === 'image' ? 'JPG · PNG · WebP up to 10MB' : 'MP4 · MOV · AVI up to 100MB'}
            </p>
          </div>
        ) : (
          <div className="glass p-6 rounded-2xl animate-slide-up">
            <div className="flex items-center gap-4">
              {preview ? (
                <img src={preview} alt="Preview" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-white/10" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <FileVideo className="w-9 h-9 text-brand-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-200 truncate">{file.name}</p>
                <p className="text-slate-500 text-sm mt-0.5">{formatBytes(file.size)}</p>
                <p className="text-xs text-brand-400 mt-1 font-medium">{file.type}</p>
              </div>
              <button onClick={removeFile} className="text-slate-500 hover:text-slate-200 p-2 rounded-lg hover:bg-white/5 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {!uploading && (
              <button id="analyze-btn" onClick={handleAnalyze} className="btn-primary w-full mt-5 py-3.5 text-base">
                <Upload className="w-4 h-4" />
                Analyze {mode === 'image' ? 'Image' : 'Video'}
              </button>
            )}
          </div>
        )}

        {/* Info row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Processing', value: mode === 'image' ? '~2 seconds' : '~30 seconds' },
            { label: 'Model', value: 'EfficientNet-B4' },
            { label: 'Privacy', value: 'Secure & encrypted' },
          ].map(({ label, value }) => (
            <div key={label} className="glass p-4 text-center">
              <p className="text-sm font-semibold text-slate-200">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
