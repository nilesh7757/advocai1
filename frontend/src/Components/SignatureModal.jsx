import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, CheckCircle, Clock, Trash2, Loader2, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Label } from '@/Components/ui/Label';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const SignatureModal = ({ documentId, onClose, onSignatureAdded }) => {
  const [activeTab, setActiveTab] = useState('insert'); // 'insert' | 'workflow'
  
  // Tab 1: Insert Signature states
  const [partyName, setPartyName] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Tab 2: Workflow states
  const [signers, setSigners] = useState([]);
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [actionLoadingEmail, setActionLoadingEmail] = useState(null); // track which user is signing
  
  const workflowFileInputRef = useRef(null);
  const [signingEmail, setSigningEmail] = useState(null);

  const fetchSigners = async () => {
    if (!documentId) return;
    setLoadingWorkflow(true);
    try {
      const response = await axios.get(`/api/documents/conversations/${documentId}/signatures/`);
      setSigners(response.data.signers || []);
    } catch (err) {
      console.error('Failed to fetch signers:', err);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'workflow' && documentId) {
      fetchSigners();
    }
  }, [activeTab, documentId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && ['image/png','image/jpeg','image/jpg','image/webp'].includes(file.type)) {
      setSignatureFile(file);
    } else {
      toast.error('Please select a PNG, JPG, or WEBP image.');
    }
  };

  const handleAddSignature = async () => {
    if (!partyName.trim() || !signatureFile) {
      toast.error('Please provide a party name and a signature image.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('signature', signatureFile);
      const res = await axios.post('api/utils/upload-signature/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url;
      if (!url) {
        toast.error('Upload failed. No URL returned.');
        return;
      }

      const signatureMarkdown = `![Signature for ${partyName}](${url})`;
      onSignatureAdded(signatureMarkdown, partyName);
      toast.success('Signature uploaded successfully!');
      onClose();
    } catch (error) {
      console.error('Signature upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload signature.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSignerToWorkflow = async () => {
    if (!newSignerName.trim() || !newSignerEmail.trim()) {
      toast.error('Please enter name and email.');
      return;
    }
    
    if (signers.some(s => s.email === newSignerEmail)) {
      toast.error('Signer with this email already exists.');
      return;
    }

    const updatedList = [...signers, { name: newSignerName, email: newSignerEmail, status: 'pending' }];
    setLoadingWorkflow(true);
    try {
      const res = await axios.post(`/api/documents/conversations/${documentId}/signatures/`, {
        signers: updatedList
      });
      setSigners(res.data.signers || []);
      setNewSignerName('');
      setNewSignerEmail('');
      toast.success('Signer added successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to add signer.');
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const handleRemoveSignerFromWorkflow = async (emailToRemove) => {
    const updatedList = signers.filter(s => s.email !== emailToRemove);
    setLoadingWorkflow(true);
    try {
      const res = await axios.post(`/api/documents/conversations/${documentId}/signatures/`, {
        signers: updatedList
      });
      setSigners(res.data.signers || []);
      toast.success('Signer removed.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove signer.');
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const triggerSignWorkflow = (email) => {
    setSigningEmail(email);
    workflowFileInputRef.current?.click();
  };

  const handleWorkflowFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !signingEmail) return;

    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.type)) {
      toast.error('Please select a PNG, JPG, or WEBP image.');
      return;
    }

    setActionLoadingEmail(signingEmail);
    try {
      const form = new FormData();
      form.append('signature', file);
      const res = await axios.post('api/utils/upload-signature/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url;
      if (!url) {
        toast.error('Upload failed. No URL returned.');
        return;
      }

      const patchRes = await axios.patch(`/api/documents/conversations/${documentId}/signatures/`, {
        email: signingEmail,
        status: 'signed',
        signature_url: url
      });

      setSigners(patchRes.data.signers || []);
      toast.success('Signed successfully!');
      
      const signerObj = signers.find(s => s.email === signingEmail);
      if (signerObj) {
        const signatureMarkdown = `![Signature for ${signerObj.name}](${url})`;
        onSignatureAdded(signatureMarkdown, signerObj.name);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign document.');
    } finally {
      setActionLoadingEmail(null);
      setSigningEmail(null);
    }
  };

  const handleDeclineWorkflow = async (email) => {
    setActionLoadingEmail(email);
    try {
      const patchRes = await axios.patch(`/api/documents/conversations/${documentId}/signatures/`, {
        email: email,
        status: 'declined'
      });
      setSigners(patchRes.data.signers || []);
      toast.success('Declined signature request.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to decline request.');
    } finally {
      setActionLoadingEmail(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <Card className="w-full max-w-lg bg-card border-border shadow-2xl rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border select-none">
          <CardTitle className="text-lg font-bold">Document Signatures</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        {/* Tabs switcher */}
        <div className="flex bg-muted p-1 rounded-lg select-none mx-6 mt-4">
          <button
            onClick={() => setActiveTab('insert')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
              activeTab === 'insert'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Insert My Signature
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
              activeTab === 'workflow'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Signers Workflow
          </button>
        </div>

        <CardContent className="space-y-4 pt-4 overflow-y-auto max-h-[500px] custom-scrollbar">
          {activeTab === 'insert' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="party-name" className="text-xs font-semibold text-foreground">Signer's / Party's Name</Label>
                <Input
                  id="party-name"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g., Landlord, Tenant, First Party"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground">Signature Image</Label>
                <div
                  className="mt-1 flex flex-col justify-center items-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md cursor-pointer hover:border-primary/50 hover:bg-muted/35 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-xs text-foreground font-medium">{signatureFile ? signatureFile.name : 'Click to upload signature image'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <Button 
                onClick={handleAddSignature} 
                disabled={loading || !partyName.trim() || !signatureFile}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
              >
                {loading ? 'Uploading & Inserting...' : 'Insert Signature into Document'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!documentId ? (
                <div className="p-4 bg-muted/40 rounded-lg flex flex-col items-center justify-center text-center space-y-2 border border-border">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Draft Document</p>
                  <p className="text-xs text-muted-foreground">Please save this document first to set up a multi-party signature workflow.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Add Signer Form */}
                  <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Add New Signer</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="signer-name" className="text-[10px] uppercase font-semibold text-muted-foreground">Name</Label>
                        <Input
                          id="signer-name"
                          value={newSignerName}
                          onChange={(e) => setNewSignerName(e.target.value)}
                          placeholder="Ananya Sharma"
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signer-email" className="text-[10px] uppercase font-semibold text-muted-foreground">Email</Label>
                        <Input
                          id="signer-email"
                          value={newSignerEmail}
                          onChange={(e) => setNewSignerEmail(e.target.value)}
                          placeholder="ananya@example.com"
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleAddSignerToWorkflow} 
                      disabled={loadingWorkflow || !newSignerName || !newSignerEmail}
                      size="sm"
                      className="w-full text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Signer to Request List
                    </Button>
                  </div>

                  {/* Signers list */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Workflow status ({signers.length})</p>
                    {loadingWorkflow && signers.length === 0 ? (
                      <div className="flex justify-center items-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : signers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">No signers added to this document yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {signers.map((signer, idx) => {
                          const isActionLoading = actionLoadingEmail === signer.email;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm text-xs">
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-semibold text-foreground truncate">{signer.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{signer.email}</p>
                                {signer.signed_at && (
                                  <p className="text-[9px] text-primary font-medium">✓ Signed {new Date(signer.signed_at).toLocaleDateString()}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {signer.status === 'signed' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[10px]">
                                    <CheckCircle className="w-3 h-3" /> Signed
                                  </span>
                                ) : signer.status === 'declined' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/10 text-destructive font-semibold text-[10px]">
                                    <X className="w-3 h-3" /> Declined
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold text-[10px]">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}

                                {/* Actions for pending */}
                                {signer.status === 'pending' && (
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="outline" 
                                      className="h-7 px-2 text-[10px] font-bold cursor-pointer"
                                      disabled={isActionLoading}
                                      onClick={() => triggerSignWorkflow(signer.email)}
                                    >
                                      {isActionLoading ? '...' : 'Sign'}
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-7 px-2 text-[10px] font-bold text-destructive hover:bg-destructive/10 cursor-pointer"
                                      disabled={isActionLoading}
                                      onClick={() => handleDeclineWorkflow(signer.email)}
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                )}
                                
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                                  disabled={loadingWorkflow}
                                  onClick={() => handleRemoveSignerFromWorkflow(signer.email)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Hidden file input for workflow signing */}
                  <input
                    ref={workflowFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleWorkflowFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignatureModal;
