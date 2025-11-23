import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Loader2, Upload, Shield } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile({
            username: data.username || '',
            display_name: data.display_name || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || ''
          });
        }
      }
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (!supabase || !user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (!supabase) throw new Error('Not authenticated');

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="text-neon-cyan animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white mb-1">Profile Settings</h2>
        <p className="text-text-secondary-dark">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <User className="text-neon-cyan" size={24} />
            <h3 className="text-xl font-bold text-white">Profile Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-neon-cyan mb-1 font-medium">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                placeholder="yourusername"
              />
            </div>

            <div>
              <label className="block text-xs text-neon-cyan mb-1 font-medium">Display Name</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-xs text-neon-cyan mb-1 font-medium">Email</label>
              <div className="flex items-center gap-2 w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-carbon-500">
                <Mail size={18} />
                <span>{user?.email}</span>
              </div>
              <p className="text-xs text-carbon-600 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs text-neon-cyan mb-1 font-medium">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none h-24 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="w-full bg-neon-cyan text-carbon-950 font-bold py-3 rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-neon-cyan/20"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <Shield className="text-neon-cyan" size={24} />
            <h3 className="text-xl font-bold text-white">Security</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-neon-cyan mb-1 font-medium">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-xs text-neon-cyan mb-1 font-medium">Confirm Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                placeholder="Confirm new password"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={saving || !passwordData.newPassword}
              className="w-full bg-carbon-800 hover:bg-carbon-700 text-neon-cyan border border-carbon-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-carbon-500 mb-3">Account Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-carbon-600">Account ID</span>
              <span className="text-carbon-400 font-mono text-xs">{user?.id.slice(0, 18)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-carbon-600">Created</span>
              <span className="text-carbon-400">{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
