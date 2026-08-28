import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { useToast } from '../context/ToastContext';
import { verificationService } from '../services/verificationService';
import { ScanLaserOverlay } from '../components/verification/ScanLaserOverlay';
import { 
  Image as ImageIcon, 
  Upload, 
  ArrowLeft, 
  Trash2, 
  Sparkles, 
  Search, 
  ShieldCheck, 
  FileImage,
  AlertCircle
} from 'lucide-react';

export const SAMPLE_IMAGES = [
  {
    name: 'deepfake_paris_floods_midjourney.jpg',
    label: 'Sample AI Deepfake Photo',
    type: 'FAKE' as const,
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    description: 'Simulated AI diffusion render of Paris flood disaster with lighting anomalies.',
  },
  {
    name: 'authentic_nasa_telescope_capture.jpg',
    label: 'Sample Authentic Photo',
    type: 'REAL' as const,
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80',
    description: 'Genuine camera sensor exposure with verified EXIF and sensor noise.',
  }
];

export const ImageScanPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addScan } = useHistory();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<{
    name: string;
    dataUrl: string;
    size: number;
    width?: number;
    height?: number;
    isSampleFake?: boolean;
    isSampleReal?: boolean;
  } | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setSelectedImage({
          name: file.name,
          dataUrl,
          size: file.size,
          width: img.width,
          height: img.height,
        });
        showToast('Image loaded successfully!', 'success');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please drop a valid image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setSelectedImage({
          name: file.name,
          dataUrl,
          size: file.size,
          width: img.width,
          height: img.height,
        });
        showToast('Image dropped successfully!', 'success');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_IMAGES[0]) => {
    setSelectedImage({
      name: sample.name,
      dataUrl: sample.url,
      size: 1024 * 450,
      width: 1200,
      height: 800,
      isSampleFake: sample.type === 'FAKE',
      isSampleReal: sample.type === 'REAL',
    });
    showToast(`Loaded "${sample.label}"!`, 'info');
  };

  const handleClear = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVerify = async () => {
    if (!selectedImage) {
      showToast('Please select or upload an image first.', 'error');
      return;
    }

    if (!currentUser?.email) {
      showToast('Authentication error. Please login again.', 'error');
      return;
    }

    setIsScanning(true);

    try {
      const result = await verificationService.verifyImage(selectedImage, currentUser.email);
      // Auto-save to user history
      addScan(result);
      setIsScanning(false);

      // Navigate to detailed result page
      navigate(`/result`, { state: { result } });
    } catch (err) {
      setIsScanning(false);
      showToast('Image scan failed. Please try again.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-brand-400" />
              <span>Image & Deepfake Forensics</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Detect synthetic AI diffusion, cloned artifacts, and Error Level Analysis (ELA) anomalies.
            </p>
          </div>
        </div>
      </div>

      {isScanning ? (
        <ScanLaserOverlay
          type="IMAGE"
          label="Running Error Level Analysis (ELA), GAN latent pattern matching, and EXIF quantization checks..."
        />
      ) : (
        <div className="space-y-6">
          {/* Main Upload Workspace */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-6">
            {/* Hidden native input with broad image support */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              onChange={handleFileChange}
              className="hidden"
              id="image-file-input"
            />

            {!selectedImage ? (
              /* Dropzone */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] ${
                  isDragging
                    ? 'border-brand-400 bg-brand-500/10 shadow-glow-brand'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900/90'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-950/80 border border-brand-500/30 text-brand-400 flex items-center justify-center mb-4 shadow-glow-brand">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-2">
                  Choose File or Drag & Drop Image Here
                </h3>

                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-4">
                  Supports JPG, JPEG, PNG, WEBP from your device gallery, photos, or desktop folders.
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-cyan transition-all"
                >
                  Choose File
                </button>
              </div>
            ) : (
              /* Image Preview View */
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-[380px] flex items-center justify-center group">
                  <img
                    src={selectedImage.dataUrl}
                    alt="Preview"
                    className="max-h-[380px] w-auto object-contain rounded-2xl"
                  />
                  
                  {/* Top floating metadata badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-2">
                    <FileImage className="w-3.5 h-3.5 text-brand-cyan" />
                    <span className="truncate max-w-[200px]">{selectedImage.name}</span>
                    {selectedImage.width && (
                      <span className="text-slate-500">
                        • {selectedImage.width}×{selectedImage.height}
                      </span>
                    )}
                  </div>

                  {/* Top right Remove button */}
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Remove Image"
                    className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Scan Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Neural vision models will test for AI generation signatures.</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleVerify}
                      className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-500 text-white font-bold text-sm shadow-glow-brand hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Scan & Verify Image</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Test Images */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Or click a demo test image below:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-brand-500/40 transition-all flex items-center gap-3 text-left group"
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-700 group-hover:border-cyan-400 transition-colors shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-xs font-mono font-bold uppercase ${
                          sample.type === 'REAL' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {sample.type === 'REAL' ? 'Authentic Sample' : 'Deepfake Sample'}
                      </span>
                      <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 font-mono">
                        Load ↗
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">
                      {sample.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
