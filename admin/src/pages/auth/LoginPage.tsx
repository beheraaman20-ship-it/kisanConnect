import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface LoginForm {
  mobile: string;
  otp: string;
  step: 'mobile' | 'otp';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState<LoginForm>({
    mobile: '',
    otp: '',
    step: 'mobile',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setLoading(true);
    // Simulating OTP send - connect to real API in production
    console.log('Sending OTP to', form.mobile);
    setForm((f) => ({ ...f, step: 'otp' }));
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(form.otp)) {
      setError('OTP must be 6 digits');
      return;
    }
    setError(null);
    setLoading(true);
    // Demo login - replace with real API
    const demoToken = 'demo-token-' + Date.now();
    const demoUser = {
      id: 'admin-1',
      name: 'Admin User',
      mobile: form.mobile,
      role: 'admin' as const,
    };
    login(demoToken, demoUser);
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-green-100 rounded-xl mb-4">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">KisanConnect</h1>
            <p className="text-sm text-gray-500 mt-1">
              Admin & Staff Portal
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {form.step === 'mobile' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mobile: e.target.value }))
                  }
                  placeholder="Enter 10-digit mobile"
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP
                </label>
                <input
                  type="tel"
                  value={form.otp}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, otp: e.target.value }))
                  }
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  OTP sent to +91 {form.mobile}
                </p>
              </div>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, step: 'mobile', otp: '' }))}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
