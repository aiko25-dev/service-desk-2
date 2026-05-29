'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState, useRef } from 'react';
import { FolderOpen, Upload, Trash2, Download, Search, FileText, Image, FileArchive, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FilesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [search, setSearch] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Files
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['cabinetFiles'],
    queryFn: async () => {
      const res = await api.get('/storage');
      return res.data;
    },
    enabled: !!user,
  });

  // Delete File Mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/storage/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinetFiles'] });
    },
  });

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      queryClient.invalidateQueries({ queryKey: ['cabinetFiles'] });
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Файлды жүктеу мүмкін болмады');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <Image className="text-blue-500" size={16} />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar')) return <FileArchive className="text-amber-500" size={16} />;
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('html') || mime.includes('css')) return <FileCode className="text-indigo-500" size={16} />;
    return <FileText className="text-slate-400" size={16} />;
  };

  const filteredFiles = files.filter((f: any) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-9rem)]">
      {/* Header */}
      <div className="border-b border-[#dfe1e6] pb-4 shrink-0">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Корпоративтік құжаттар қоймасы</span>
        <h2 className="text-xl font-bold text-slate-800 leading-tight">Файлдар архиві (Files)</h2>
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`premium-card p-6 border-2 border-dashed text-center cursor-pointer transition-all duration-150 shrink-0 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/10'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center gap-2">
          {isUploading ? (
            <>
              <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-1" />
              <p className="text-xs font-bold text-slate-700">Файл жүктелуде...</p>
            </>
          ) : (
            <>
              <Upload size={24} className="text-slate-400 mb-1" />
              <p className="text-xs font-bold text-slate-750">
                Файлды осы жерге сүйреңіз немесе <span className="text-blue-600 hover:underline">таңдау үшін басыңыз</span>
              </p>
              <span className="text-[10px] text-slate-400 font-semibold">Рұқсат етілген максималды өлшем: 50MB</span>
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main ledger list */}
      <div className="flex-1 premium-card p-5 bg-white border border-[#dfe1e6] flex flex-col overflow-hidden justify-between">
        <div className="flex flex-col flex-1 overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <FolderOpen size={16} className="text-blue-500" />
              Құжаттар каталогы
            </h3>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Файл атауы бойынша іздеу..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-semibold"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-12 text-slate-450 font-bold text-xs">Жүктелуде...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-slate-450 font-semibold text-xs italic">Мұрағат бос</div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-450 border-b border-slate-200 pb-2.5 font-bold">
                      <th className="py-2.5">Файл атауы</th>
                      <th className="py-2.5">Өлшемі</th>
                      <th className="py-2.5">Түрі</th>
                      <th className="py-2.5">Байланысты өтінім</th>
                      <th className="py-2.5">Жүктелген күні</th>
                      <th className="py-2.5 text-right">Әрекеттер</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredFiles.map((file: any) => (
                      <tr key={file.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.mimeType)}
                            <span className="truncate max-w-[200px] block" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-500">{formatBytes(file.size)}</td>
                        <td className="py-3 text-slate-400 font-bold uppercase text-[9px]">{file.mimeType.split('/')[1] || 'Файл'}</td>
                        <td className="py-3 text-slate-500 max-w-[150px] truncate">
                          {file.ticket ? (
                            <span className="text-blue-600 font-semibold">#{file.ticket.title}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-450 font-bold">{new Date(file.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <a
                              href={`${api.defaults.baseURL}${file.url}`}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-1 text-slate-500 hover:text-blue-650 hover:bg-slate-100 rounded transition-all"
                              title="Жүктеп алу"
                            >
                              <Download size={14} />
                            </a>
                            <button
                              onClick={() => {
                                if (confirm(`Файлды өшіру керек пе: "${file.name}"?`)) {
                                  deleteFileMutation.mutate(file.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded transition-all cursor-pointer"
                              title="Өшіру"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
