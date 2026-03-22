import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  BORROWER = 'borrower',
  LENDER = 'lender',
  ADMIN = 'admin',
  BROKER = 'broker',
}

export interface NotificationPreferences {
  emailFrequency: 'instant' | 'daily' | 'weekly' | 'none';
  applicationUpdates: boolean;
  newProposals: boolean;
  marketingEmails: boolean;
}

export interface UserPermissions {
  canApproveLoans: boolean;
  canViewAllApplications: boolean;
  canManageUsers: boolean;
  canEditApplications: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: Timestamp;
  notificationPreferences?: NotificationPreferences;
  permissions?: UserPermissions;
}

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ProposedModifications {
  amount?: number;
  loanTerm?: number;
  notes?: string;
  proposedAt: Timestamp;
}

export interface LoanDocument {
  name: string;
  url: string;
  uploadedAt: Timestamp;
}

export interface Asset {
  type: string;
  value: number;
  description: string;
}

export interface Liability {
  type: string;
  balance: number;
  monthlyRepayment: number;
  description: string;
}

export interface Applicant {
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  maritalStatus: string;
  dependents: number;
  incomeSource: string;
  isSelfEmployed: boolean;
  employerName: string;
  jobTitle: string;
  yearsAtJob: number;
  baseIncome: number;
  bonusIncome: number;
  rentalIncome: number;
  otherIncome: number;
  annualIncome: number;
  creditScore: number;
  monthlyExpenses: number;
  assets: Asset[];
  liabilities: Liability[];
  totalAssets: number;
  totalLiabilities: number;
  otherMonthlyDebts: number;
}

export interface LoanApplication {
  id: string;
  borrowerId: string;
  borrowerName: string; // Primary borrower name for quick access
  borrowerEmail: string;
  applicants: Applicant[];
  amount: number;
  purpose: string;
  loanTerm: number;
  status: ApplicationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  documents?: LoanDocument[];
  lenderNotes?: string;
  internalNotes?: string;
  lenderId?: string;
  lenderEmail?: string;
  nsr?: number;
  dsr?: number;
  proposedModifications?: ProposedModifications;
  brokerId?: string;
  brokerEmail?: string;
  // Legacy fields (optional now)
  creditScore?: number;
  annualIncome?: number;
  baseIncome?: number;
  bonusIncome?: number;
  rentalIncome?: number;
  otherIncome?: number;
  phone?: string;
  address?: string;
  incomeSource?: string;
  employerName?: string;
  jobTitle?: string;
  yearsAtJob?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  assetDescription?: string;
  assets?: Asset[];
  liabilities?: Liability[];
  gender?: string;
  dob?: string;
  maritalStatus?: string;
  dependents?: number;
  monthlyExpenses?: number;
  otherMonthlyDebts?: number;
}

export interface WhiteLabelConfig {
  brokerId: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  welcomeMessage?: string;
  updatedAt: Timestamp;
}

export interface UserInvite {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  createdAt: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
