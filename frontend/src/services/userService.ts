import api from './api'; // Import the configured Axios instance

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface SuccessResponse {
  message: string;
}

// Function to call the change password endpoint
export const changePassword = async (passwordData: ChangePasswordData): Promise<SuccessResponse> => {
  try {
    const response = await api.put<SuccessResponse>('/users/change-password', passwordData);
    return response.data;
  } catch (error: any) {
    // Re-throw the error so the component can handle it (e.g., display error message)
    console.error('Error in changePassword service:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to change password');
  }
};

// You can add other user-related service functions here later, e.g.:
// export const getUserProfile = async () => { ... };
// export const updateUserProfile = async (profileData) => { ... }; 