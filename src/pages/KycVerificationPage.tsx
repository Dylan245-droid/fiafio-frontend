import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, XCircle, Clock, Camera, CreditCard, FileText, Shield, Save, LogOut } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';



type DocumentType = 'CNI_FRONT' | 'CNI_BACK' | 'SELFIE' | 'PROOF_OF_ADDRESS' | 'PASSPORT' | 'NIP';

interface KycDocument {
  id: number;
  type: DocumentType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

interface PersonalInfo {
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  address: string | null;
  cniNumber: string | null;
  email: string | null;
}

interface KycStatus {
  kycLevel: number;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  role: 'CLIENT' | 'AGENT' | 'ADMIN';
  personalInfo: PersonalInfo;
  documents: KycDocument[];
  requiredDocuments: string[];
}

const DOCUMENT_CONFIG = {
  CNI_FRONT: { label: 'CNI - Recto', icon: CreditCard, description: 'Photo claire de l\'avant de votre carte d\'identité' },
  CNI_BACK: { label: 'CNI - Verso', icon: CreditCard, description: 'Photo claire de l\'arrière de votre carte d\'identité' },
  PASSPORT: { label: 'Passeport', icon: CreditCard, description: 'Page d\'identification du passeport' },
  NIP: { label: 'NIP', icon: CreditCard, description: 'Photo du Numéro d\'Identifiant Personnel (Recto)' },
  SELFIE: { label: 'Selfie avec Pièce', icon: Camera, description: 'Photo de vous tenant votre pièce d\'identité' },
  PROOF_OF_ADDRESS: { label: 'Justificatif de domicile', icon: FileText, description: 'Facture récente (eau, électricité) ou attestation' },
};

const ROLE_MESSAGES = {
  CLIENT: {
    title: 'Vérification d\'identité',
    subtitle: 'Vérifiez votre identité pour effectuer des transactions',
    requirement: 'Niveau 1 minimum pour transacter',
  },
  AGENT: {
    title: 'Vérification Agent',
    subtitle: 'Niveau 2 requis pour activer votre compte agent',
    requirement: 'Niveau 2 obligatoire pour l\'activation',
  },
  ADMIN: {
    title: 'Vérification Admin',
    subtitle: 'Votre compte administrateur',
    requirement: '',
  },
};

export default function KycVerificationPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [idType, setIdType] = useState<'CNI' | 'PASSPORT' | 'NIP'>('CNI');

  // Detect preferred ID type from existing documents
  useEffect(() => {
    if (kycStatus?.documents.find(d => d.type === 'PASSPORT')) {
      setIdType('PASSPORT');
    } else if (kycStatus?.documents.find(d => d.type === 'NIP')) {
      setIdType('NIP');
    } else if (kycStatus?.documents.find(d => d.type === 'CNI_FRONT')) {
      setIdType('CNI');
    }
  }, [kycStatus]);

  // Personal info form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [cniNumber, setCniNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [nipNumber, setNipNumber] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const res = await api.get('/kyc/status');
      setKycStatus(res.data);
      // Pre-fill form with existing data
      if (res.data.personalInfo) {
        setFirstName(res.data.personalInfo.firstName || '');
        setLastName(res.data.personalInfo.lastName || '');
        setDateOfBirth(res.data.personalInfo.dateOfBirth?.split('T')[0] || '');
        setAddress(res.data.personalInfo.address || '');
        setCniNumber(res.data.personalInfo.cniNumber || '');
        setPassportNumber(res.data.personalInfo.passportNumber || '');
        setNipNumber(res.data.personalInfo.nipNumber || '');
        setEmail(res.data.personalInfo.email || '');
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    setSavingInfo(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/kyc/personal-info', {
        firstName,
        lastName,
        dateOfBirth,
        address,
        cniNumber: idType === 'CNI' ? cniNumber : undefined,
        passportNumber: idType === 'PASSPORT' ? passportNumber : undefined,
        nipNumber: idType === 'NIP' ? nipNumber : undefined,
        email,
      });
      setSuccess('Informations enregistrées !');
      fetchKycStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleUploadClick = (docType: DocumentType) => {
    setSelectedDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType) return;

    setUploading(selectedDocType);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', selectedDocType);

    try {
      await api.post('/kyc/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Document soumis avec succès !');
      fetchKycStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setUploading(null);
      setSelectedDocType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getDocumentStatus = (docType: DocumentType) => {
    return kycStatus?.documents.find(d => d.type === docType);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLevelBadge = (level: number) => {
    const badges = {
      0: { text: 'Non vérifié', color: 'bg-gray-600 text-gray-200' },
      1: { text: 'Basique', color: 'bg-blue-600 text-white' },
      2: { text: 'Vérifié', color: 'bg-green-600 text-white' },
      3: { text: 'Premium', color: 'bg-purple-600 text-white' },
    };
    return badges[level as keyof typeof badges] || badges[0];
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const badge = getLevelBadge(kycStatus?.kycLevel || 0);
  const roleConfig = ROLE_MESSAGES[kycStatus?.role || 'CLIENT'];

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>

        <button 
          onClick={() => { logout(); navigate('/login'); }}
          className="rounded-full bg-surface/50 p-2 text-gray-400 hover:bg-surface hover:text-red-400 transition"
          title="Se déconnecter"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 p-4 pb-8">
        {/* Title & Status */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{roleConfig.title}</h1>
          <p className="mt-2 text-gray-400">{roleConfig.subtitle}</p>
        </div>

        {/* Current Level Card */}
        <div className="rounded-2xl bg-surface/50 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Niveau actuel</p>
              <p className="text-2xl font-bold">Niveau {kycStatus?.kycLevel || 0}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
              {badge.text}
            </span>
          </div>
          
          {kycStatus?.kycLevel === 0 && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm">⚠️ {roleConfig.requirement}</p>
            </div>
          )}

          {kycStatus?.role === 'AGENT' && kycStatus?.kycLevel < 2 && kycStatus?.kycLevel > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm">⚠️ Niveau 2 requis pour activer votre compte agent</p>
            </div>
          )}
        </div>
        
        {/* Step 1: ID Type Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black text-xs font-bold">1</div>
              <h2 className="text-lg font-semibold text-white">Quelle est votre pièce d'identité ?</h2>
            </div>
            {kycStatus && (kycStatus.kycLevel > 0 || kycStatus.documents.some(d => ['CNI_FRONT', 'PASSPORT', 'NIP'].includes(d.type))) && (
              <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
                <Shield className="h-3 w-3" />
                <span>Choix verrouillé</span>
              </div>
            )}
          </div>
          
          <div className={`flex p-1 bg-surface/50 rounded-xl border border-white/10 ${
            kycStatus && (kycStatus.kycLevel > 0 || kycStatus.documents.some(d => ['CNI_FRONT', 'PASSPORT', 'NIP'].includes(d.type))) ? 'opacity-80 pointer-events-none' : ''
          }`}>
            <button
              onClick={() => setIdType('CNI')}
              disabled={!!(kycStatus && (kycStatus.kycLevel > 0 || kycStatus.documents.some(d => ['CNI_FRONT', 'PASSPORT', 'NIP'].includes(d.type))))}
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition ${
                idType === 'CNI' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Carte d'identité (CNI)
            </button>
            <button
              onClick={() => setIdType('NIP')}
              disabled={!!(kycStatus && (kycStatus.kycLevel > 0 || kycStatus.documents.some(d => ['CNI_FRONT', 'PASSPORT', 'NIP'].includes(d.type))))}
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition ${
                idType === 'NIP' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              NIP (Nouveau)
            </button>
            <button
              onClick={() => setIdType('PASSPORT')}
              disabled={!!(kycStatus && (kycStatus.kycLevel > 0 || kycStatus.documents.some(d => ['CNI_FRONT', 'PASSPORT', 'NIP'].includes(d.type))))}
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition ${
                idType === 'PASSPORT' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Passeport
            </button>
          </div>
          {kycStatus && (kycStatus.kycLevel > 0 || kycStatus.documents.some(d => ['CNI_FRONT', 'PASSPORT', 'NIP'].includes(d.type))) && (
            <p className="text-[10px] text-gray-500 italic">
              Le type de pièce est figé pour garantir la cohérence avec votre vérification de niveau 1.
            </p>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-4 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-green-500/20 border border-green-500/50 p-4 text-green-400">
            {success}
          </div>
        )}

        {/* Step 2: Personal Information */}
        <div className="rounded-2xl bg-surface/50 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black text-xs font-bold">2</div>
            <h2 className="text-lg font-semibold">Informations personnelles</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary/50"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary/50"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary/50"
                placeholder="email@exemple.com"
                disabled={!!kycStatus?.personalInfo?.email} // Disable if already set (legacy users can set it once)
              />
              {!kycStatus?.personalInfo?.email && (
                 <p className="text-xs text-yellow-400 mt-1">Ajoutez votre email pour sécuriser votre compte.</p>
              )}
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Date de naissance</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Numéro {idType === 'PASSPORT' ? 'Passeport' : idType === 'NIP' ? 'NIP' : 'CNI'}
              </label>
              <input
                type="text"
                value={idType === 'PASSPORT' ? passportNumber : idType === 'NIP' ? nipNumber : cniNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  if (idType === 'PASSPORT') setPassportNumber(val);
                  else if (idType === 'NIP') setNipNumber(val);
                  else setCniNumber(val);
                }}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary/50"
                placeholder={idType === 'PASSPORT' ? 'P00000000' : idType === 'NIP' ? '123456789' : 'AB123456789'}
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Adresse complète</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary/50 resize-none"
                placeholder="123 Rue Exemple, Ville, Pays"
                rows={2}
              />
            </div>

            <button
              onClick={handleSavePersonalInfo}
              disabled={savingInfo}
              className="w-full rounded-xl bg-primary/20 py-3 text-sm font-medium text-primary hover:bg-primary/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {savingInfo ? 'Enregistrement...' : 'Enregistrer les informations'}
            </button>
          </div>
        </div>

        {/* Step 3: Document Uploads */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black text-xs font-bold">3</div>
            <h2 className="text-lg font-semibold text-white">Téléversez vos documents</h2>
          </div>
          
          {Object.entries(DOCUMENT_CONFIG)
            .filter(([key]) => {
              const docType = key as DocumentType;
              
              // 1. Filter by ID Type Preference
              if (docType === 'PASSPORT' && idType !== 'PASSPORT') return false;
              if (docType === 'NIP' && idType !== 'NIP') return false;
              if ((docType === 'CNI_FRONT' || docType === 'CNI_BACK') && idType !== 'CNI') return false;
              
              // 2. Filter by Level Requirements (Progressive Disclosure)
              // Only show documents that are:
              // - Required for the NEXT level
              // - OR Alreay uploaded/interacted with (History)
              // - OR belong to the CURRENTLY SELECTED idType (Force display)
              const isRequired = kycStatus?.requiredDocuments?.includes(docType);
              const hasExistingDoc = kycStatus?.documents?.some(d => d.type === docType);
              
              const isIdDoc = ['CNI_FRONT', 'CNI_BACK', 'PASSPORT', 'NIP'].includes(docType);
              
              return isRequired || hasExistingDoc || isIdDoc;
            })
            .map(([key, config]) => {
            const docType = key as DocumentType;
            const doc = getDocumentStatus(docType);
            const Icon = config.icon;
            
            const dynamicDescription = docType === 'SELFIE' 
              ? `Photo de vous tenant votre ${idType === 'PASSPORT' ? 'Passeport' : idType === 'NIP' ? 'NIP' : 'CNI'}`
              : config.description;

            return (
              <div
                key={key}
                className={`rounded-2xl p-4 border transition-all ${
                  doc?.status === 'APPROVED' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : doc?.status === 'REJECTED'
                    ? 'bg-red-500/10 border-red-500/30'
                    : doc?.status === 'PENDING'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-surface/50 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{config.label}</p>
                      <p className="text-xs text-gray-400">{dynamicDescription}</p>
                    </div>
                  </div>
                  {getStatusIcon(doc?.status)}
                </div>

                {doc?.status === 'REJECTED' && doc.rejectionReason && (
                  <p className="mt-2 text-sm text-red-400">Raison: {doc.rejectionReason}</p>
                )}

                {doc?.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleUploadClick(docType)}
                    disabled={uploading === docType}
                    className="mt-3 w-full rounded-xl bg-primary/20 py-2 text-sm font-medium text-primary hover:bg-primary/30 disabled:opacity-50"
                  >
                    {uploading === docType ? 'Envoi en cours...' : doc?.status === 'PENDING' ? 'Remplacer' : 'Téléverser'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Level Requirements - Only for Clients */}
        {kycStatus?.role === 'CLIENT' && (
          <div className="rounded-2xl bg-surface/30 border border-white/5 p-4">
            <h3 className="font-semibold mb-3">Exigences par niveau</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Niveau 1 (50k/tx, 100k/jour)</span>
                <span>CNI Recto, Passeport <span className="text-primary">OU</span> NIP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Niveau 2 (200k/tx, 500k/jour)</span>
                <span>+ Selfie (et CNI Verso si CNI)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Niveau 3 (1M/tx, 2M/jour)</span>
                <span>+ Justificatif de domicile</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
