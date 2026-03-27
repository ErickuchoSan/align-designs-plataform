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

function ProfileInfoCard({ user, onUpdateUser }: Readonly<ProfileInfoCardProps>) {
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
    <div className="bg-white rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1B1C1A]">Personal Information</h2>
        {!editingProfile && user.role === 'ADMIN' && (
          <button
            onClick={() => setEditingProfile(true)}
            className="text-[#C9A84C] hover:text-[#755B00] font-medium hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {editingProfile ? (
        <ProfileForm
          profileData={profileData}
          setProfileData={setProfileData}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
          isSaving={savingProfile}
        />
      ) : (
        <ProfileDisplay user={user} />
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
          <dt className="block text-sm font-medium text-[#6B6A65] mb-1">First Name</dt>
          <dd className="text-lg text-[#1B1C1A] font-medium">{user.firstName}</dd>
        </div>
        <div>
          <dt className="block text-sm font-medium text-[#6B6A65] mb-1">Last Name</dt>
          <dd className="text-lg text-[#1B1C1A] font-medium">{user.lastName}</dd>
        </div>
      </div>
      <div>
        <dt className="block text-sm font-medium text-[#6B6A65] mb-1">Email</dt>
        <dd className="text-lg text-[#1B1C1A] font-medium">{user.email}</dd>
      </div>
      <div>
        <dt className="block text-sm font-medium text-[#6B6A65] mb-1">Phone</dt>
        <dd className="text-lg text-[#1B1C1A] font-medium">{user.phone || 'Not specified'}</dd>
      </div>
      <div>
        <dt className="block text-sm font-medium text-[#6B6A65] mb-1">Role</dt>
        <dd>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'ADMIN' ? 'bg-[#C9A84C]/20 text-[#755B00]' : 'bg-[#F5F4F0] text-[#1B1C1A]'
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
          <label htmlFor="profile-firstName" className="block text-sm font-medium text-[#6B6A65] mb-2">First Name</label>
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
          <label htmlFor="profile-lastName" className="block text-sm font-medium text-[#6B6A65] mb-2">Last Name</label>
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
        <label htmlFor="profile-phone" className="block text-sm font-medium text-[#6B6A65] mb-2">Phone</label>
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
          className="flex-1 px-5 py-3 text-sm font-medium bg-[#E3E2DF] text-[#1B1C1A] rounded-lg hover:bg-[#D9D8D5] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 px-5 py-3 text-sm font-medium text-white bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-lg hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSaving ? <ButtonLoader /> : 'Save changes'}
        </button>
      </div>
    </form>
  );
});

export default memo(ProfileInfoCard);
