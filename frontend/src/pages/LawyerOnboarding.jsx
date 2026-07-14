import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Upload, X, FileText, ChevronRight } from 'lucide-react';
import AuthBackground from '@/Components/AuthBackground';

const LawyerOnboarding = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    license_number: '',
    bar_council_id: '',
    education: '',
    experience_years: '',
    law_firm: '',
    consultation_fee: '',
    specializations: '',
    bio: '',
  });
  const [documents, setDocuments] = useState([]); // List of uploaded document URLs
  const [documentNames, setDocumentNames] = useState([]); // List of file names for display
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Redirect if user is not a lawyer
    if (user && user.role !== 'lawyer') {
      toast.error('Only lawyer accounts can access onboarding.');
      navigate('/');
    }
  }, [user, navigate]);

  // Load existing profile details if any exist
  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const response = await axios.get('/api/lawyer/my-profile/');
        const data = response.data;
        setFormData({
          license_number: data.license_number || '',
          bar_council_id: data.bar_council_id || '',
          education: data.education || '',
          experience_years: data.experience_years !== undefined ? String(data.experience_years) : '',
          law_firm: data.law_firm || '',
          consultation_fee: data.consultation_fee || '',
          specializations: Array.isArray(data.specializations) ? data.specializations.join(', ') : '',
          bio: data.bio || '',
        });
        if (data.verification_documents) {
          setDocuments(data.verification_documents);
          setDocumentNames(data.verification_documents.map(url => {
            try {
              const decoded = decodeURIComponent(url);
              return decoded.substring(decoded.lastIndexOf('/') + 1);
            } catch (e) {
              return 'Uploaded Document';
            }
          }));
        }
      } catch (err) {
        console.error('Failed to fetch existing profile details:', err);
      }
    };

    if (user && user.role === 'lawyer') {
      fetchExistingProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newDocs = [...documents];
    const newDocNames = [...documentNames];

    for (const file of files) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only PDF, JPG, JPEG, and PNG are allowed.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Maximum size allowed is 10MB.`);
        continue;
      }

      const fileData = new FormData();
      fileData.append('file', file);

      try {
        const response = await axios.post('/api/lawyer/upload-verification-doc/', fileData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        newDocs.push(response.data.secure_url);
        newDocNames.push(file.name);
        toast.success(`Uploaded ${file.name} successfully!`);
      } catch (err) {
        console.error('Failed to upload file:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setDocuments(newDocs);
    setDocumentNames(newDocNames);
    setUploading(false);
  };

  const removeDocument = (index) => {
    const newDocs = documents.filter((_, i) => i !== index);
    const newDocNames = documentNames.filter((_, i) => i !== index);
    setDocuments(newDocs);
    setDocumentNames(newDocNames);
    toast.success('Document removed.');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.license_number.trim()) {
      newErrors.license_number = 'License Number is required';
    }
    if (!formData.bar_council_id.trim()) {
      newErrors.bar_council_id = 'Bar Council ID is required';
    }
    if (documents.length === 0) {
      newErrors.documents = 'At least one verification document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix validation errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        experience_years: formData.experience_years ? Number(formData.experience_years) : 0,
        specializations: formData.specializations
          ? formData.specializations.split(',').map(item => item.trim()).filter(Boolean)
          : [],
        verification_documents: documents,
      };

      await axios.patch('/api/lawyer/my-profile/', payload);

      const resProfile = await axios.get('/api/auth/profile/');
      setUser(resProfile.data);

      toast.success('Professional profile completed! Redirecting to dashboard.');
      navigate('/lawyer-dashboard');
    } catch (err) {
      console.error('Onboarding update error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit onboarding profile.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12 px-4">
      <AuthBackground />

      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-xl relative z-10 p-6 md:p-10 animate-fade-in space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20 flex items-center justify-center w-12 h-12">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Complete Your Professional Profile</h1>
              <p className="text-xs text-muted-foreground">Setup details to request professional verification approval</p>
            </div>
          </div>
          <div className="text-xs text-amber-500 font-medium px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit">
            Status: Onboarding Pending
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="license_number" className="text-sm font-medium text-foreground">License Number *</label>
              <input
                id="license_number"
                name="license_number"
                placeholder="State Bar License Number"
                required
                value={formData.license_number}
                onChange={handleInputChange}
                disabled={loading}
                className={`${inputClass} ${errors.license_number ? 'border-destructive focus:ring-destructive' : ''}`}
              />
              {errors.license_number && (
                <p className="text-xs text-destructive mt-1">{errors.license_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="bar_council_id" className="text-sm font-medium text-foreground">Bar Council ID *</label>
              <input
                id="bar_council_id"
                name="bar_council_id"
                placeholder="Bar Council Registration ID"
                required
                value={formData.bar_council_id}
                onChange={handleInputChange}
                disabled={loading}
                className={`${inputClass} ${errors.bar_council_id ? 'border-destructive focus:ring-destructive' : ''}`}
              />
              {errors.bar_council_id && (
                <p className="text-xs text-destructive mt-1">{errors.bar_council_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="education" className="text-sm font-medium text-foreground">Education</label>
              <input
                id="education"
                name="education"
                placeholder="LLB, LLM..."
                value={formData.education}
                onChange={handleInputChange}
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="experience_years" className="text-sm font-medium text-foreground">Years of Experience</label>
              <input
                id="experience_years"
                name="experience_years"
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={formData.experience_years}
                onChange={handleInputChange}
                disabled={loading}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="law_firm" className="text-sm font-medium text-foreground">Law Firm / Practice</label>
              <input
                id="law_firm"
                name="law_firm"
                placeholder="Firm name or Independent"
                value={formData.law_firm}
                onChange={handleInputChange}
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="consultation_fee" className="text-sm font-medium text-foreground">Consultation Fee</label>
              <input
                id="consultation_fee"
                name="consultation_fee"
                placeholder="e.g. ₹1500/hour"
                value={formData.consultation_fee}
                onChange={handleInputChange}
                disabled={loading}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="specializations" className="text-sm font-medium text-foreground">Specializations</label>
            <input
              id="specializations"
              name="specializations"
              placeholder="Separate with commas e.g. Corporate Law, Family Law, Criminal Law"
              value={formData.specializations}
              onChange={handleInputChange}
              disabled={loading}
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground">Type multiple specializations separated by commas</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium text-foreground">Professional Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              placeholder="Describe your background, expertise, or approach to representation..."
              value={formData.bio}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none font-sans"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Verification Documents *</label>
            
            <div
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center cursor-pointer select-none bg-background ${
                errors.documents ? 'border-destructive bg-destructive/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
              onClick={() => document.getElementById('file-upload-input').click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  const input = document.getElementById('file-upload-input');
                  input.files = files;
                  const event = { target: { files } };
                  handleFileUpload(event);
                }
              }}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading || loading}
              />
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20 flex items-center justify-center w-12 h-12 mx-auto">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Drag and drop your professional documents here</p>
                  <p className="text-xs text-muted-foreground">or click to browse from device</p>
                </div>
                <div className="text-xxs text-muted-foreground flex gap-2 justify-center">
                  <span className="px-2 py-0.5 bg-muted rounded border border-border">PDF</span>
                  <span className="px-2 py-0.5 bg-muted rounded border border-border">PNG</span>
                  <span className="px-2 py-0.5 bg-muted rounded border border-border">JPG</span>
                </div>
              </div>
            </div>
            
            {errors.documents && (
              <p className="text-xs text-destructive mt-1">{errors.documents}</p>
            )}

            {documentNames.length > 0 && (
              <div className="pt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Uploaded Proofs:</p>
                <div className="flex flex-wrap gap-2">
                  {documentNames.map((name, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs text-foreground font-medium max-w-xs"
                    >
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{name}</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors ml-1 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                Uploading file(s) to secure cloud storage...
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full py-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                Submitting Profile...
              </>
            ) : (
              <>
                Submit for Verification Approval
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LawyerOnboarding;
