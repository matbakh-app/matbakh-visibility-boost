export type EntryPoint = 'landing' | 'vc' | 'subscription' | 'direct' | 'unknown';

export interface VCData {
  businessName?: string;
  location?: string;
  postalCode?: string;
  mainCategory?: string;
  subCategory?: string;
  matbakhCategory?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  benchmarkOne?: string;
  benchmarkTwo?: string;
  benchmarkThree?: string;
}

class UserJourneyManager {
  private static instance: UserJourneyManager;
  private entryPoint: EntryPoint = 'unknown';
  private vcData: VCData | null = null;
  private redirectAfterAuth: string | null = null;

  private constructor() {
    // Initialize from localStorage if available
    this.loadFromStorage();
  }

  public static getInstance(): UserJourneyManager {
    if (!UserJourneyManager.instance) {
      UserJourneyManager.instance = new UserJourneyManager();
    }
    return UserJourneyManager.instance;
  }

  // Set the entry point where user started their journey
  public setEntryPoint(source: EntryPoint, data?: any): void {
    this.entryPoint = source;
    console.log('UserJourneyManager: Entry point set to:', source, data);
    
    // Store additional context data
    if (data) {
      if (source === 'vc') {
        this.setVCData(data);
      }
    }
    
    this.saveToStorage();
  }

  // Store visibility check data for prefilling forms
  public setVCData(data: VCData): void {
    this.vcData = data;
    console.log('UserJourneyManager: VC data stored:', data);
    this.saveToStorage();
  }

  // Get visibility check data for prefilling
  public getVCData(): VCData | null {
    return this.vcData;
  }

  // Clear VC data after successful use
  public clearVCData(): void {
    this.vcData = null;
    this.saveToStorage();
  }

  // Set where to redirect after successful authentication
  public setRedirectAfterAuth(path: string): void {
    this.redirectAfterAuth = path;
    this.saveToStorage();
  }

  // Get redirect path and clear it
  public getAndClearRedirect(): string | null {
    const redirect = this.redirectAfterAuth;
    this.redirectAfterAuth = null;
    this.saveToStorage();
    return redirect;
  }

  // Determine the next step after successful authentication
  public getNextStepAfterAuth(): string {
    const redirect = this.getAndClearRedirect();
    if (redirect) {
      return redirect;
    }

    // Based on entry point, determine next step
    switch (this.entryPoint) {
      case 'vc':
        // From visibility check, go to onboarding with VC data
        return '/onboarding/standard';
      
      case 'subscription':
        // From subscription selection, go to onboarding first, then checkout
        return '/onboarding/standard?source=subscription';
      
      case 'landing':
      case 'direct':
      default:
        // Default to dashboard
        return '/dashboard';
    }
  }

  // Determine onboarding prefill data
  public getOnboardingPrefillData(): any {
    const vcData = this.getVCData();
    if (vcData) {
      console.log('UserJourneyManager: Providing VC prefill data:', vcData);
      return {
        businessName: vcData.businessName,
        businessLocation: vcData.location,
        postalCode: vcData.postalCode,
        businessCategory: vcData.mainCategory,
        businessSubCategory: vcData.subCategory,
        matbakhCategory: vcData.matbakhCategory,
        websiteUrl: vcData.website,
        facebookPage: vcData.facebook,
        instagramHandle: vcData.instagram,
        tiktokHandle: vcData.tiktok,
        linkedinHandle: vcData.linkedin,
        benchmarks: [
          vcData.benchmarkOne,
          vcData.benchmarkTwo,
          vcData.benchmarkThree
        ].filter(Boolean)
      };
    }
    return {};
  }

  // Check if user came from visibility check
  public isFromVisibilityCheck(): boolean {
    return this.entryPoint === 'vc' && this.vcData !== null;
  }

  // Check if user should skip email verification gate
  public shouldSkipEmailGate(): boolean {
    // Skip email gate if user is already authenticated and came from VC
    return this.entryPoint === 'vc';
  }

  // Track successful onboarding completion
  public onOnboardingCompleted(): void {
    console.log('UserJourneyManager: Onboarding completed, clearing journey data');
    this.clearVCData();
    this.entryPoint = 'unknown';
    this.saveToStorage();
  }

  // Get current entry point
  public getEntryPoint(): EntryPoint {
    return this.entryPoint;
  }

  // Reset all journey data
  public reset(): void {
    this.entryPoint = 'unknown';
    this.vcData = null;
    this.redirectAfterAuth = null;
    localStorage.removeItem('userJourneyData');
  }

  // Persist data to localStorage
  private saveToStorage(): void {
    try {
      const data = {
        entryPoint: this.entryPoint,
        vcData: this.vcData,
        redirectAfterAuth: this.redirectAfterAuth,
        timestamp: Date.now()
      };
      localStorage.setItem('userJourneyData', JSON.stringify(data));
    } catch (error) {
      console.warn('UserJourneyManager: Failed to save to localStorage:', error);
    }
  }

  // Load data from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('userJourneyData');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check if data is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (data.timestamp && (Date.now() - data.timestamp) < maxAge) {
          this.entryPoint = data.entryPoint || 'unknown';
          this.vcData = data.vcData || null;
          this.redirectAfterAuth = data.redirectAfterAuth || null;
          console.log('UserJourneyManager: Loaded from storage:', data);
        } else {
          console.log('UserJourneyManager: Stored data expired, clearing');
          localStorage.removeItem('userJourneyData');
        }
      }
    } catch (error) {
      console.warn('UserJourneyManager: Failed to load from localStorage:', error);
    }
  }
}

// Export singleton instance
export const userJourneyManager = UserJourneyManager.getInstance();

// Export hook for React components
export const useUserJourney = () => {
  return {
    setEntryPoint: (source: EntryPoint, data?: any) => userJourneyManager.setEntryPoint(source, data),
    setVCData: (data: VCData) => userJourneyManager.setVCData(data),
    getVCData: () => userJourneyManager.getVCData(),
    clearVCData: () => userJourneyManager.clearVCData(),
    setRedirectAfterAuth: (path: string) => userJourneyManager.setRedirectAfterAuth(path),
    getNextStepAfterAuth: () => userJourneyManager.getNextStepAfterAuth(),
    getOnboardingPrefillData: () => userJourneyManager.getOnboardingPrefillData(),
    isFromVisibilityCheck: () => userJourneyManager.isFromVisibilityCheck(),
    shouldSkipEmailGate: () => userJourneyManager.shouldSkipEmailGate(),
    onOnboardingCompleted: () => userJourneyManager.onOnboardingCompleted(),
    getEntryPoint: () => userJourneyManager.getEntryPoint(),
    reset: () => userJourneyManager.reset()
  };
};