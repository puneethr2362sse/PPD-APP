import { VerificationResult } from '../types';
import { apiClient } from './apiClient';

export const verificationService = {
  // Analyze Text via Backend API & Live Internet Grounding
  async verifyText(text: string, userEmail: string): Promise<VerificationResult> {
    const res = await apiClient.post('/verify/text', {
      text: text.trim(),
      email: userEmail.trim().toLowerCase(),
    });

    if (res.success && res.result) {
      return res.result;
    }
    throw new Error(res.error || 'Live verification is currently unavailable. Please try again.');
  },

  // Analyze Image via Backend API & Firestore
  async verifyImage(
    fileData: { name: string; dataUrl: string; size: number; width?: number; height?: number; isSampleFake?: boolean; isSampleReal?: boolean },
    userEmail: string
  ): Promise<VerificationResult> {
    const res = await apiClient.post('/verify/image', {
      name: fileData.name,
      dataUrl: fileData.dataUrl,
      width: fileData.width,
      height: fileData.height,
      email: userEmail.trim().toLowerCase(),
    });

    if (res.success && res.result) {
      return res.result;
    }
    throw new Error(res.error || 'Image verification failed.');
  }
};
