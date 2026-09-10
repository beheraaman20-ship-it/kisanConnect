import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { farmerApi } from '@/lib/api/farmerApi';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/lib/types';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [savedMessage, setSavedMessage] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    address: user?.address || '',
    district: user?.district || '',
    village: user?.village || '',
  });

  const { data: profileData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: farmerApi.getProfile,
    initialData: user ? { success: true, data: user, message: '' } : undefined,
  });

  useEffect(() => {
    const profile = profileData?.data;
    if (profile) {
      setForm((f) => ({
        name: f.name || profile.name || '',
        address: f.address || profile.address || '',
        district: f.district || profile.district || '',
        village: f.village || profile.village || '',
      }));
    }
  }, [profileData?.data]);

  const updateMutation = useMutation({
    mutationFn: () => farmerApi.updateProfile(form),
    onSuccess: (response) => {
      const updated = response.data as User;
      setUser(updated);
      queryClient.setQueryData(['my-profile'], response);
      setSavedMessage(true);
      window.setTimeout(() => setSavedMessage(false), 3000);
    },
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const profile = profileData?.data;
  const name = profile?.name || user?.name || form.name || 'Farmer';
  const mobile = profile?.mobile || user?.mobile;

  return (
    <div>
      <Card className="mb-5 flex flex-col items-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary-600">
          <span className="text-4xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="mb-1 text-xl font-semibold text-neutral-900">{name}</h3>
        {mobile ? (
          <p className="text-sm text-neutral-500">📱 +91 {mobile}</p>
        ) : null}
      </Card>

      <h2 className="mb-4 text-lg font-semibold text-neutral-900">
        Edit Profile
      </h2>

      {savedMessage ? (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-success">
          Profile updated successfully
        </div>
      ) : null}

      <Card>
        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => set('address')(e.target.value)}
        />
        <Input
          label="Village"
          value={form.village}
          onChange={(e) => set('village')(e.target.value)}
        />
        <Input
          label="District"
          value={form.district}
          onChange={(e) => set('district')(e.target.value)}
        />
        <Button
          onClick={() => updateMutation.mutate()}
          loading={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card>
    </div>
  );
};