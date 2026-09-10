import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    devOtp,
    sendOtp,
    verifyOtp,
    loadUser,
    logout,
    clearError,
    setUser,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    devOtp,
    sendOtp,
    verifyOtp,
    loadUser,
    logout,
    clearError,
    setUser,
  };
};