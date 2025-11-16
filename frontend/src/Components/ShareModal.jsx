import React, { useState, useEffect } from 'react';
import { Copy, X, UserPlus, Trash2, Check } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Label } from '@/Components/ui/Label';
import { Switch } from '@/Components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select'; // Import Select components
import axios from '../api/axios';
import toast from 'react-hot-toast';

const ShareModal = ({ documentId, documentTitle, onClose, initialSharedWithUsers = [] }) => {
  const [publicPermissionLevel, setPublicPermissionLevel] = useState('view');
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameToShare, setUsernameToShare] = useState('');
  const [userPermissionLevel, setUserPermissionLevel] = useState('view');
  const [sharedUsers, setSharedUsers] = useState(initialSharedWithUsers);

  useEffect(() => {
    // Fetch current public share settings and shared users when modal opens
    const fetchShareSettings = async () => {
      if (!documentId) return;
      try {
        const response = await axios.get(`api/documents/conversations/${documentId}/`);
        const conversation = response.data;
        if (conversation.share_permissions) {
          setPublicPermissionLevel(conversation.share_permissions.permission_level);
        }
        setSharedUsers(conversation.shared_with_users || []);
      } catch (error) {
        console.error('Error fetching share settings:', error);
        toast.error('Failed to load share settings.');
      }
    };
    fetchShareSettings();
  }, [documentId]);

  const generateLink = async () => {
    setLoading(true);
    try {
      const response = await axios.post('api/documents/generate-share-link/', {
        document_id: documentId,
        permission_level: publicPermissionLevel,
      });
      const url = `${window.location.origin}${response.data.share_url}`;
      setShareUrl(url);
      toast.success('Public share link generated!');
    } catch (err) {
      console.error('Error generating share link:', err);
      toast.error('Failed to generate public share link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleShareWithUser = async () => {
    if (!usernameToShare.trim()) {
      toast.error('Please enter a username.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`api/documents/conversations/${documentId}/share-with-user/`, {
        username: usernameToShare,
        permission_level: userPermissionLevel,
      });
      toast.success(`Document shared with ${usernameToShare}!`);
      setUsernameToShare('');
      // Re-fetch shared users to update the list
      const response = await axios.get(`api/documents/conversations/${documentId}/`);
      setSharedUsers(response.data.shared_with_users || []);
    } catch (error) {
      console.error('Error sharing with user:', error);
      toast.error(error.response?.data?.error || 'Failed to share with user.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUserShare = async (username) => {
    setLoading(true);
    try {
      await axios.post(`api/documents/conversations/${documentId}/share-with-user/`, {
        username: username,
        permission_level: null, // Indicate removal
      });
      toast.success(`Access revoked for ${username}.`);
      // Re-fetch shared users to update the list
      const response = await axios.get(`api/documents/conversations/${documentId}/`);
      setSharedUsers(response.data.shared_with_users || []);
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error(error.response?.data?.error || 'Failed to revoke access.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserPermission = async (username, newPermissionLevel) => {
    setLoading(true);
    try {
      await axios.post(`api/documents/conversations/${documentId}/share-with-user/`, {
        username: username,
        permission_level: newPermissionLevel,
      });
      toast.success(`Permissions updated for ${username}.`);
      // Re-fetch shared users to update the list
      const response = await axios.get(`api/documents/conversations/${documentId}/`);
      setSharedUsers(response.data.shared_with_users || []);
    } catch (error) {
      console.error('Error changing permissions:', error);
      toast.error(error.response?.data?.error || 'Failed to change permissions.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-lg bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Share "{documentTitle}"</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Public Share Link Section */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-lg font-semibold">Public Share Link</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="public-edit-permission"
                checked={publicPermissionLevel === 'edit'}
                onCheckedChange={(checked) => setPublicPermissionLevel(checked ? 'edit' : 'view')}
                disabled={loading}
              />
              <Label htmlFor="public-edit-permission">Allow public editing</Label>
            </div>
            <Button onClick={generateLink} disabled={loading}>
              {loading ? 'Generating...' : 'Generate/Update Public Link'}
            </Button>
            {shareUrl && (
              <div className="flex items-center space-x-2">
                <Input value={shareUrl} readOnly />
                <Button onClick={handleCopyToClipboard} size="icon">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Share with Specific Users Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Share with Specific Users</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Username"
                value={usernameToShare}
                onChange={(e) => setUsernameToShare(e.target.value)}
                disabled={loading}
              />
              <Select value={userPermissionLevel} onValueChange={setUserPermissionLevel} disabled={loading}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShareWithUser} disabled={loading || !usernameToShare.trim()}>
                <UserPlus className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>

            {/* List of Shared Users */}
            {sharedUsers.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                <p className="text-sm text-muted-foreground">Currently shared with:</p>
                {sharedUsers.map((user) => (
                  <div key={user.username} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                    <span className="font-medium">{user.username}</span>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.permission_level}
                        onValueChange={(newLevel) => handleChangeUserPermission(user.username, newLevel)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveUserShare(user.username)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareModal;
