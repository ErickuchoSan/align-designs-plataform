'use client';

import { useState, memo } from 'react';
import { User } from '@/types';
import { UsersService } from '@/services/users.service';
import { ButtonLoader } from '@/components/ui/Loader';
import PhoneInput from '@/components/ui/inputs/PhoneInput';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
}

interface ProfileInfoCardProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
}

function ProfileInfoCard({ user, onUpdateUser }: ProfileInfoCardProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      await UsersService.updateProfile(profileData);
      toast.success('Profile updated successfully');
      setEditingProfile(false);
      onUpdateUser(profileData);
    } catch (err) {
      toast.error(handleApiError(err, 'Error updating profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    setProfileData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 animate-slideUp">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-navy-900">Personal Information</h2>
        {!editingProfile && user.role === 'ADMIN' && (
          <button
            onClick={() => setEditingProfile(true)}
            className="text-navy-700 hover:text-navy-900 font-medium hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {!editingProfile ? (
        <ProfileDisplay user={user} />
      ) : (
        <ProfileForm
          profileData={profileData}
          setProfileData={setProfileData}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
          isSaving={savingProfile}
        />
      )}
    </div>
  );
}

// Display-only view of profile
const ProfileDisplay = memo(function ProfileDisplay({ user }: { user: User }) {
  return (
    <dl className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <dt className="block text-sm font-medium text-stone-700 mb-1">First Name</dt>
          <dd className="text-lg text-navy-900 font-medium">{user.firstName}</dd>
        </div>
        <div>
          <dt className="block text-sm font-medium text-stone-700 mb-1">Last Name</dt>
          <dd className="text-lg text-navy-900 font-medium">{user.lastName}</dd>
        </div>
      </div>
      <div>
        <dt className="block text-sm font-medium text-stone-700 mb-1">Email</dt>
        <dd className="text-lg text-navy-900 font-medium">{user.email}</dd>
      </div>
      <div>
        <dt className="block text-sm font-medium text-stone-700 mb-1">Phone</dt>
        <dd className="text-lg text-navy-900 font-medium">{user.phone || 'Not specified'}</dd>
      </div>
      <div>
        <dt className="block text-sm font-medium text-stone-700 mb-1">Role</dt>
        <dd>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'ADMIN' ? 'bg-gold-100 text-gold-800' : 'bg-navy-100 text-navy-800'
            }`}
          >
            {user.role === 'ADMIN' ? 'Administrator' : 'Client'}
          </span>
        </dd>
      </div>
    </dl>
  );
});

// Editable form view
const ProfileForm = memo(function ProfileForm({
  profileData,
  setProfileData,
  onSave,
  onCancel,
  isSaving,
}: {
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-firstName" className="block text-sm font-medium text-navy-900 mb-2">First Name</label>
          <input
            id="profile-firstName"
            type="text"
            required
            value={profileData.firstName}
            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
            className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
          />
        </div>
        <div>
          <label htmlFor="profile-lastName" className="block text-sm font-medium text-navy-900 mb-2">Last Name</label>
          <input
            id="profile-lastName"
            type="text"
            required
            value={profileData.lastName}
            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
            className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
          />
        </div>
      </div>
      <div>
        <label htmlFor="profile-phone" className="block text-sm font-medium text-navy-900 mb-2">Phone</label>
        <PhoneInput
          id="profile-phone"
          value={profileData.phone}
          onChange={(phone) => setProfileData({ ...profileData, phone })}
          placeholder="Phone number"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 px-5 py-3 text-sm font-medium text-navy-900 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 px-5 py-3 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSaving ? <ButtonLoader /> : 'Save changes'}
        </button>
      </div>
    </form>
  );
});

export default memo(ProfileInfoCard);
