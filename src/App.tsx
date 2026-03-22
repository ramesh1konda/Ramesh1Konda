import React, { useState, useEffect, useCallback, Component } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { UserRole, ApplicationStatus, LoanApplication, OperationType, UserProfile, LoanDocument, Asset, Liability, Applicant, NotificationPreferences, UserPermissions, WhiteLabelConfig, UserInvite } from './types';
import { db, auth, storage } from './firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, deleteField, Timestamp, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError } from './utils/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Search,
  Filter,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  File,
  BarChart3,
  Activity,
  Calculator,
  PieChart,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Building2,
  UserCircle,
  Wallet,
  Calendar,
  Heart,
  Baby,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Edit2,
  Edit3,
  CreditCard,
  Download,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Settings,
  Shield,
  X,
  Home,
  Car,
  ArrowRightLeft
} from 'lucide-react';
import { format, startOfDay, subDays, isSameDay } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer, 
  LineChart as ReLineChart, 
  Line, 
  Legend, 
  Cell 
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!response.ok) {
      console.error('Failed to send email notification');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-zinc-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
            </div>
            <p className="text-zinc-600 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <pre className="bg-zinc-100 p-4 rounded-lg text-xs overflow-auto max-h-40 mb-6">
              {JSON.stringify(this.state.error, null, 2)}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoanCalculator = () => {
  const { config } = useBranding();
  const [amount, setAmount] = useState(50000);
  const [rate, setRate] = useState(8.5);
  const [term, setTerm] = useState(60);
  const [repaymentType, setRepaymentType] = useState<'PI' | 'IO'>('PI');
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    const r = rate / 100 / 12;
    const n = term;
    const p = amount;
    
    if (r === 0) {
      setMonthlyPayment(p / n);
    } else if (repaymentType === 'IO') {
      setMonthlyPayment(p * r);
    } else {
      const payment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setMonthlyPayment(payment);
    }
  }, [amount, rate, term, repaymentType]);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-zinc-900" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Loan Calculator</h3>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setRepaymentType('PI')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              repaymentType === 'PI' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            P&I
          </button>
          <button
            onClick={() => setRepaymentType('IO')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              repaymentType === 'IO' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Interest Only
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Loan Amount</label>
            <span className="text-sm font-bold text-zinc-900">${amount.toLocaleString()}</span>
          </div>
          <input 
            type="range"
            min="1000"
            max="500000"
            step="1000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
            style={{ accentColor: config?.primaryColor }}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Interest Rate (%)</label>
            <span className="text-sm font-bold text-zinc-900">{rate}%</span>
          </div>
          <input 
            type="range"
            min="1"
            max="25"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
            style={{ accentColor: config?.primaryColor }}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Loan Term (Months)</label>
            <span className="text-sm font-bold text-zinc-900">{term} mo</span>
          </div>
          <input 
            type="range"
            min="6"
            max="360"
            step="6"
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
            className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
            style={{ accentColor: config?.primaryColor }}
          />
        </div>

        <div className="pt-6 border-t border-zinc-100">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">Estimated Monthly Payment</div>
          <div className="text-4xl font-bold text-zinc-900 text-center" style={{ color: config?.primaryColor }}>
            ${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};

const BrokerBrandingSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    primaryColor: '#18181b',
    welcomeMessage: '',
    logoUrl: ''
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'brokerConfigs', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as WhiteLabelConfig;
        setFormData({
          companyName: data.companyName,
          primaryColor: data.primaryColor,
          welcomeMessage: data.welcomeMessage || '',
          logoUrl: data.logoUrl || ''
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'brokerConfigs', user.uid);
      await setDoc(docRef, {
        ...formData,
        brokerId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving branding config:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full"
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Branding</h2>
        <p className="text-zinc-500">Customize your white-label version of LendFlow.</p>
      </header>

      <div className="space-y-8">
        <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Company Name</label>
                <input 
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                  placeholder="e.g. Acme Mortgages"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Primary Color</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg border-none cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Logo URL</label>
                <input 
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Welcome Message</label>
                <textarea 
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  className="w-full h-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all resize-none"
                  placeholder="Welcome to our mortgage portal..."
                />
              </div>
              
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Preview</div>
                <div className="bg-white p-4 rounded-xl border border-zinc-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: formData.primaryColor }}>
                    {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" /> : <TrendingUp className="text-white w-5 h-5" />}
                  </div>
                  <span className="font-bold text-zinc-900">{formData.companyName || 'LendFlow'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-100 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 mb-4">Shareable Link</h3>
          <p className="text-zinc-500 mb-6">Use this link to share your branded portal with your clients.</p>
          <div className="flex gap-4">
            <input 
              type="text"
              readOnly
              value={`${window.location.origin}?brokerId=${user?.uid}`}
              className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-sm"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}?brokerId=${user?.uid}`);
              }}
              className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-all"
            >
              Copy Link
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { profile, updateNotificationPreferences } = useAuth();
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    profile?.notificationPreferences || {
      emailFrequency: 'instant',
      applicationUpdates: true,
      newProposals: true,
      marketingEmails: false,
    }
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Settings</h2>
        <p className="text-zinc-500">Manage your profile and notification preferences.</p>
      </header>

      <div className="space-y-8">
        <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Notifications
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Email Frequency
              </label>
              <select 
                value={prefs.emailFrequency}
                onChange={(e) => setPrefs({ ...prefs, emailFrequency: e.target.value as any })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Summary</option>
                <option value="none">None</option>
              </select>
            </div>

            <div className="space-y-4 pt-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox"
                    checked={prefs.applicationUpdates}
                    onChange={(e) => setPrefs({ ...prefs, applicationUpdates: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-zinc-200 rounded-full peer peer-checked:bg-zinc-900 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6" />
                </div>
                <span className="text-zinc-900 font-medium group-hover:text-zinc-600 transition-colors">
                  Application Status Updates
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox"
                    checked={prefs.newProposals}
                    onChange={(e) => setPrefs({ ...prefs, newProposals: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-zinc-200 rounded-full peer peer-checked:bg-zinc-900 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6" />
                </div>
                <span className="text-zinc-900 font-medium group-hover:text-zinc-600 transition-colors">
                  New Proposals & Messages
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox"
                    checked={prefs.marketingEmails}
                    onChange={(e) => setPrefs({ ...prefs, marketingEmails: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-zinc-200 rounded-full peer peer-checked:bg-zinc-900 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6" />
                </div>
                <span className="text-zinc-900 font-medium group-hover:text-zinc-600 transition-colors">
                  Marketing & Product Updates
                </span>
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {saving ? 'Saving Changes...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const { signIn } = useAuth();
  const { config } = useBranding();
  const [invite, setInvite] = useState<UserInvite | null>(null);

  useEffect(() => {
    const inviteId = new URLSearchParams(window.location.search).get('inviteId');
    if (inviteId) {
      const fetchInvite = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'userInvites', inviteId));
          if (docSnap.exists()) {
            setInvite(docSnap.data() as UserInvite);
          }
        } catch (error) {
          console.error('Error fetching invite:', error);
        }
      };
      fetchInvite();
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {invite && (
        <div className="bg-zinc-900 text-white py-3 px-6 text-center text-sm font-medium">
          You've been invited to join as a <span className="font-bold text-emerald-400">{invite.role}</span>. 
          <button onClick={signIn} className="ml-2 underline hover:text-emerald-300 transition-colors">Sign in to accept</button>
        </div>
      )}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center" style={{ backgroundColor: config?.primaryColor }}>
            {config?.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" /> : <TrendingUp className="text-white w-6 h-6" />}
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">{config?.companyName || 'LendFlow'}</span>
        </div>
        <button 
          onClick={signIn}
          className="px-6 py-2.5 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-all shadow-sm"
          style={{ backgroundColor: config?.primaryColor }}
        >
          Sign In
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-7xl font-bold leading-[0.9] tracking-tight text-zinc-900 mb-8">
            {config?.welcomeMessage ? config.welcomeMessage.split('\n')[0] : 'Modern Loan'} <br />
            <span className="text-zinc-400">{config?.welcomeMessage ? config.welcomeMessage.split('\n')[1] || 'Origination.' : 'Origination.'}</span>
          </h1>
          <p className="text-xl text-zinc-600 mb-10 max-w-lg leading-relaxed">
            A streamlined platform for borrowers to secure funding and lenders to manage risk with precision. Simple, secure, and transparent.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={signIn}
              className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-all shadow-lg flex items-center gap-2 group"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200" />
                ))}
              </div>
              <span className="text-sm font-medium text-zinc-500">Trusted by 500+ firms</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="aspect-[4/3] bg-zinc-200 rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-300 relative">
            <img 
              src="https://picsum.photos/seed/finance/1200/900" 
              alt="Finance" 
              className="w-full h-full object-cover grayscale opacity-80"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900/40 to-transparent" />
            
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-10 p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-600 w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900">Loan Approved</div>
                  <div className="text-xs text-zinc-500">Just now</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-zinc-900">$45,000.00</div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const RoleSelection = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [checkingInvite, setCheckingInvite] = useState(true);

  const handleSelect = async (role: UserRole) => {
    setLoading(role);
    await updateProfile(role);
  };

  useEffect(() => {
    const checkInvite = async () => {
      if (!user?.email) {
        setCheckingInvite(false);
        return;
      }
      
      try {
        const q = query(collection(db, 'userInvites'), where('email', '==', user.email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const invite = snapshot.docs[0].data() as UserInvite;
          await handleSelect(invite.role);
          // Redundant: AuthContext.updateProfile will delete the invite
        }
      } catch (error) {
        console.error('Error checking invite:', error);
      } finally {
        setCheckingInvite(false);
      }
    };
    
    checkInvite();
  }, [user?.email]);

  if (checkingInvite || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">Choose your path</h2>
          <p className="text-zinc-500 text-lg">Select how you want to use LendFlow</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <button 
            onClick={() => handleSelect(UserRole.BORROWER)}
            disabled={!!loading}
            className="group relative p-10 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-zinc-900 transition-all text-left shadow-sm hover:shadow-xl disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-4">I'm a Borrower</h3>
            <p className="text-zinc-500 leading-relaxed mb-8">
              Apply for personal or business loans, track your application status, and manage your funding.
            </p>
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              Get Started <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          <button 
            onClick={() => handleSelect(UserRole.BROKER)}
            disabled={!!loading}
            className="group relative p-10 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-zinc-900 transition-all text-left shadow-sm hover:shadow-xl disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-4">I'm a Broker</h3>
            <p className="text-zinc-500 leading-relaxed mb-8">
              Submit and manage loan applications for your clients, track commissions, and streamline your workflow.
            </p>
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              Submit Deal <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          <button 
            onClick={() => handleSelect(UserRole.LENDER)}
            disabled={!!loading}
            className="group relative p-10 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-zinc-900 transition-all text-left shadow-sm hover:shadow-xl disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-4">I'm a Lender</h3>
            <p className="text-zinc-500 leading-relaxed mb-8">
              Review loan applications, manage risk profiles, and grow your lending portfolio with ease.
            </p>
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              Access Dashboard <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentList = ({ documents, onRemove }: { documents?: LoanDocument[], onRemove?: (index: number) => void }) => {
  if (!documents || documents.length === 0) return null;

  return (
    <>
      {documents.map((doc, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group hover:border-zinc-300 transition-all">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
            <a 
              href={doc.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-900 truncate hover:text-zinc-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {doc.name}
            </a>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a 
              href={doc.url} 
              target="_blank" 
              rel="noopener noreferrer"
              download={doc.name}
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
            {onRemove && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

const DocumentUploadZone = ({ onUpload, loading }: { onUpload: (files: File[]) => void, loading: boolean }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(Array.from(e.target.files));
      e.target.value = ''; // Reset for same file upload
    }
  };

  return (
    <div 
      className={cn(
        "relative p-8 border-2 border-dashed rounded-2xl transition-all text-center",
        dragActive ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white",
        loading && "opacity-50 pointer-events-none"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="flex flex-col items-center gap-2">
        <Upload className="w-8 h-8 text-zinc-400" />
        <div className="text-sm font-bold text-zinc-900">
          {loading ? 'Processing...' : 'Click or drag documents to upload'}
        </div>
        <div className="text-xs text-zinc-500">PDF, JPG, PNG (max 5MB)</div>
      </div>
    </div>
  );
};

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <motion.p 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-[10px] font-bold text-red-500 mt-1 ml-1"
    >
      {message}
    </motion.p>
  );
};

const getPurposeIcon = (purpose: string) => {
  const p = purpose.toLowerCase();
  if (p.includes('mortgage') || p.includes('home') || p.includes('house') || p.includes('property')) return <Home className="w-4 h-4" />;
  if (p.includes('car') || p.includes('auto') || p.includes('vehicle')) return <Car className="w-4 h-4" />;
  if (p.includes('business') || p.includes('company') || p.includes('startup')) return <Briefcase className="w-4 h-4" />;
  if (p.includes('personal') || p.includes('debt') || p.includes('consolidation')) return <Wallet className="w-4 h-4" />;
  if (p.includes('education') || p.includes('student') || p.includes('school')) return <Building2 className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

const BorrowerDashboard = ({ onSwitchView }: { onSwitchView?: () => void }) => {
  const { user, profile, signOut } = useAuth();
  const { config } = useBranding();
  const isBroker = profile?.role === UserRole.BROKER;
  const [view, setView] = useState<'dashboard' | 'settings' | 'branding'>('dashboard');
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);

  useEffect(() => {
    if (selectedApp) {
      setActiveApplicantIndex(0);
    }
  }, [selectedApp]);

  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState(1);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // Form state
  const [applicants, setApplicants] = useState<Partial<Applicant>[]>([]);
  const [activeApplicantIndex, setActiveApplicantIndex] = useState(0);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loanTerm, setLoanTerm] = useState('36');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [income, setIncome] = useState('');
  const [baseIncome, setBaseIncome] = useState('');
  const [bonusIncome, setBonusIncome] = useState('');
  const [rentalIncome, setRentalIncome] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [incomeSource, setIncomeSource] = useState('Employment');
  const [isSelfEmployed, setIsSelfEmployed] = useState(false);
  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [yearsAtJob, setYearsAtJob] = useState('');
  const [totalAssets, setTotalAssets] = useState('');
  const [totalLiabilities, setTotalLiabilities] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [credit, setCredit] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [dependents, setDependents] = useState('0');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [otherMonthlyDebts, setOtherMonthlyDebts] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!amount || Number(amount) <= 0) newErrors.amount = 'Please enter a valid loan amount greater than 0';
      if (!purpose.trim()) newErrors.purpose = 'Please enter the purpose of the loan';
      if (!loanTerm) newErrors.loanTerm = 'Please select a loan term';
    }

    if (currentStep === 2) {
      if (!applicantName.trim()) newErrors.applicantName = 'Full name is required';
      if (!applicantEmail.trim()) {
        newErrors.applicantEmail = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
        newErrors.applicantEmail = 'Please enter a valid email address';
      }
      if (!dob) {
        newErrors.dob = 'Date of birth is required';
      } else {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) newErrors.dob = 'Applicants must be at least 18 years old';
      }
      if (!gender) newErrors.gender = 'Please select a gender';
      if (Number(dependents) < 0) newErrors.dependents = 'Number of dependents cannot be negative';
    }

    if (currentStep === 3) {
      if (!phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[\d\s+()-]{8,20}$/.test(phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
      if (!address.trim()) newErrors.address = 'Current address is required';
    }

    if (currentStep === 4) {
      if (!baseIncome || Number(baseIncome) < 0) newErrors.baseIncome = 'Please enter a valid base income';
      if (!employerName.trim()) newErrors.employerName = 'Employer name is required';
      if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
      if (!yearsAtJob || Number(yearsAtJob) < 0) newErrors.yearsAtJob = 'Please enter valid years at job';
    }

    if (currentStep === 5) {
      if (!monthlyExpenses || Number(monthlyExpenses) < 0) newErrors.monthlyExpenses = 'Please enter valid monthly expenses';
    }

    if (currentStep === 6) {
      if (!credit || Number(credit) < 0 || Number(credit) > 1200) {
        newErrors.credit = 'Please enter a valid credit score between 0 and 1200';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = isBroker 
      ? query(collection(db, 'applications'), where('brokerId', '==', user.uid))
      : query(collection(db, 'applications'), where('borrowerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanApplication));
      setApplications(apps.sort((a, b) => {
        const t1 = a.createdAt?.toMillis?.() || Date.now();
        const t2 = b.createdAt?.toMillis?.() || Date.now();
        return t2 - t1;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });
    return () => unsubscribe();
  }, [user]);

  const stats = {
    totalApplied: applications.reduce((sum, a) => sum + a.amount, 0),
    activeCount: applications.filter(a => a.status === ApplicationStatus.PENDING || a.status === ApplicationStatus.REVIEWING).length,
    approvedAmount: applications.filter(a => a.status === ApplicationStatus.APPROVED).reduce((sum, a) => sum + a.amount, 0),
  };

  const filteredApps = applications.filter(app => {
    const matchesStatus = filter === 'all' || app.status === filter;
    const matchesSearch = (app.purpose || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (app.amount?.toString() || '').includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const uploadFiles = async (files: File[], borrowerId: string) => {
    console.log('Starting upload for files:', files.map(f => f.name), 'Borrower ID:', borrowerId);
    try {
      const uploadPromises = files.map(async (file) => {
        console.log('Uploading file:', file.name);
        const storageRef = ref(storage, `applications/${borrowerId}/${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`);
        
        // Add a timeout to the upload process
        const uploadTask = uploadBytes(storageRef, file);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Upload timed out for ${file.name} after 30 seconds`)), 30000)
        );

        console.log('Waiting for upload task or timeout for:', file.name);
        await Promise.race([uploadTask, timeoutPromise]);
        console.log('Upload task completed for:', file.name);
        
        const url = await getDownloadURL(storageRef);
        console.log('Download URL obtained for:', file.name, url);
        
        return {
          name: file.name,
          url,
          uploadedAt: Timestamp.now()
        };
      });
      const results = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', results);
      return results;
    } catch (error) {
      console.error('File upload error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload one or more files.';
      setToast({ message: errorMessage, type: 'error' });
      throw error;
    }
  };

  useEffect(() => {
    if (user && applicants.length === 0) {
      const primaryApplicant = {
        name: user.displayName || '',
        email: user.email || '',
        phone: '',
        address: '',
        gender: '',
        dob: '',
        maritalStatus: 'Single',
        dependents: 0,
        incomeSource: 'Employment',
        isSelfEmployed: false,
        employerName: '',
        jobTitle: '',
        yearsAtJob: 0,
        baseIncome: 0,
        bonusIncome: 0,
        rentalIncome: 0,
        otherIncome: 0,
        annualIncome: 0,
        creditScore: 0,
        monthlyExpenses: 0,
        assets: [],
        liabilities: [],
        totalAssets: 0,
        totalLiabilities: 0,
        otherMonthlyDebts: 0,
      };
      setApplicants([primaryApplicant]);
      setApplicantName(primaryApplicant.name);
      setApplicantEmail(primaryApplicant.email);
    }
  }, [user, applicants.length]);

  const getCurrentApplicantData = () => ({
    name: applicantName,
    email: applicantEmail,
    phone,
    address,
    incomeSource,
    isSelfEmployed,
    employerName,
    jobTitle,
    yearsAtJob: Number(yearsAtJob),
    baseIncome: Number(baseIncome),
    bonusIncome: Number(bonusIncome),
    rentalIncome: Number(rentalIncome),
    otherIncome: Number(otherIncome),
    annualIncome: (Number(baseIncome) || 0) + (Number(bonusIncome) || 0) + (Number(rentalIncome) || 0) + (Number(otherIncome) || 0),
    creditScore: Number(credit),
    gender,
    dob,
    maritalStatus,
    dependents: Number(dependents),
    monthlyExpenses: Number(monthlyExpenses),
    assets,
    liabilities,
    totalAssets: assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0),
    totalLiabilities: liabilities.reduce((sum, l) => sum + (Number(l.balance) || 0), 0),
    otherMonthlyDebts: liabilities.reduce((sum, l) => sum + (Number(l.monthlyRepayment) || 0), 0),
  });

  const loadApplicantData = (data: any) => {
    setApplicantName(data.name || '');
    setApplicantEmail(data.email || '');
    setPhone(data.phone || '');
    setAddress(data.address || '');
    setIncomeSource(data.incomeSource || 'Employment');
    setIsSelfEmployed(data.isSelfEmployed || false);
    setEmployerName(data.employerName || '');
    setJobTitle(data.jobTitle || '');
    setYearsAtJob(data.yearsAtJob?.toString() || '');
    setBaseIncome(data.baseIncome?.toString() || '');
    setBonusIncome(data.bonusIncome?.toString() || '');
    setRentalIncome(data.rentalIncome?.toString() || '');
    setOtherIncome(data.otherIncome?.toString() || '');
    setCredit(data.creditScore?.toString() || '');
    setGender(data.gender || '');
    setDob(data.dob || '');
    setMaritalStatus(data.maritalStatus || 'Single');
    setDependents(data.dependents?.toString() || '0');
    setMonthlyExpenses(data.monthlyExpenses?.toString() || '');
    setOtherMonthlyDebts(data.otherMonthlyDebts?.toString() || '');
    setAssets(data.assets || []);
    setLiabilities(data.liabilities || []);
  };

  const handleSwitchApplicant = (index: number) => {
    if (!validateStep(step)) return;
    const currentData = getCurrentApplicantData();
    const newApplicants = [...applicants];
    newApplicants[activeApplicantIndex] = currentData;
    
    setApplicants(newApplicants);
    setActiveApplicantIndex(index);
    loadApplicantData(newApplicants[index]);
  };

  const handleAddApplicant = () => {
    if (applicants.length >= 4) return;
    if (!validateStep(step)) return;
    const currentData = getCurrentApplicantData();
    const newApplicants = [...applicants];
    newApplicants[activeApplicantIndex] = currentData;
    
    const nextApplicant = {
      name: '', email: '', phone: '', address: '', gender: '', dob: '', maritalStatus: 'Single', dependents: 0,
      incomeSource: 'Employment', isSelfEmployed: false, employerName: '', jobTitle: '', yearsAtJob: 0,
      baseIncome: 0, bonusIncome: 0, rentalIncome: 0, otherIncome: 0, annualIncome: 0, creditScore: 0,
      monthlyExpenses: 0, assets: [], liabilities: [], totalAssets: 0, totalLiabilities: 0, otherMonthlyDebts: 0,
    };
    
    const updatedApplicants = [...newApplicants, nextApplicant];
    setApplicants(updatedApplicants);
    setActiveApplicantIndex(updatedApplicants.length - 1);
    loadApplicantData(nextApplicant);
  };

  const handleRemoveApplicant = (index: number) => {
    if (applicants.length <= 1) return;
    const newApplicants = applicants.filter((_, i) => i !== index);
    setApplicants(newApplicants);
    const nextIndex = activeApplicantIndex >= newApplicants.length ? newApplicants.length - 1 : activeApplicantIndex;
    setActiveApplicantIndex(nextIndex);
    loadApplicantData(newApplicants[nextIndex]);
  };

  const handleAcceptProposal = async (app: LoanApplication) => {
    if (!app.proposedModifications) return;
    try {
      await updateDoc(doc(db, 'applications', app.id), {
        amount: app.proposedModifications.amount,
        loanTerm: app.proposedModifications.loanTerm,
        status: ApplicationStatus.APPROVED,
        lenderNotes: `Borrower accepted proposed modifications: $${app.proposedModifications.amount.toLocaleString()} for ${app.proposedModifications.loanTerm} months.`,
        proposedModifications: deleteField(),
        updatedAt: serverTimestamp(),
      });
      setSelectedApp(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${app.id}`);
    }
  };

  const handleRejectProposal = async (app: LoanApplication) => {
    try {
      await updateDoc(doc(db, 'applications', app.id), {
        status: ApplicationStatus.REVIEWING,
        lenderNotes: `Borrower rejected proposed modifications.`,
        proposedModifications: deleteField(),
        updatedAt: serverTimestamp(),
      });
      setSelectedApp(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${app.id}`);
    }
  };

  const resetForm = () => {
    setEditingAppId(null);
    setStep(1);
    setErrors({});
    setAmount('');
    setPurpose('');
    setLoanTerm('36');
    setPhone('');
    setAddress('');
    setIncome('');
    setBaseIncome('');
    setBonusIncome('');
    setRentalIncome('');
    setOtherIncome('');
    setIncomeSource('Employment');
    setIsSelfEmployed(false);
    setEmployerName('');
    setJobTitle('');
    setYearsAtJob('');
    setTotalAssets('');
    setTotalLiabilities('');
    setAssetDescription('');
    setAssets([]);
    setLiabilities([]);
    setCredit('');
    setGender('');
    setDob('');
    setMaritalStatus('Single');
    setDependents('0');
    setMonthlyExpenses('');
    setOtherMonthlyDebts('');
    setSelectedFiles([]);
    
    if (user) {
      const primaryApplicant = {
        name: user.displayName || '',
        email: user.email || '',
        phone: '',
        address: '',
        gender: '',
        dob: '',
        maritalStatus: 'Single',
        dependents: 0,
        incomeSource: 'Employment',
        isSelfEmployed: false,
        employerName: '',
        jobTitle: '',
        yearsAtJob: 0,
        baseIncome: 0,
        bonusIncome: 0,
        rentalIncome: 0,
        otherIncome: 0,
        annualIncome: 0,
        creditScore: 0,
        monthlyExpenses: 0,
        assets: [],
        liabilities: [],
        totalAssets: 0,
        totalLiabilities: 0,
        otherMonthlyDebts: 0,
      };
      setApplicants([primaryApplicant]);
      setApplicantName(primaryApplicant.name);
      setApplicantEmail(primaryApplicant.email);
    }
  };

  const handleEdit = (app: LoanApplication) => {
    setEditingAppId(app.id);
    setAmount(app.amount?.toString() || '');
    setPurpose(app.purpose || '');
    setLoanTerm(app.loanTerm?.toString() || '36');
    setStep(1);
    
    if (app.applicants && app.applicants.length > 0) {
      setApplicants(app.applicants);
      setActiveApplicantIndex(0);
      loadApplicantData(app.applicants[0]);
    } else {
      // Fallback for legacy apps
      const legacyData = {
        name: app.borrowerName,
        email: app.borrowerEmail,
        phone: app.phone || '',
        address: app.address || '',
        incomeSource: app.incomeSource || 'Employment',
        employerName: app.employerName || '',
        jobTitle: app.jobTitle || '',
        yearsAtJob: app.yearsAtJob || 0,
        baseIncome: app.baseIncome || 0,
        bonusIncome: app.bonusIncome || 0,
        rentalIncome: app.rentalIncome || 0,
        otherIncome: app.otherIncome || 0,
        creditScore: app.creditScore || 0,
        gender: app.gender || '',
        dob: app.dob || '',
        maritalStatus: app.maritalStatus || 'Single',
        dependents: app.dependents || 0,
        monthlyExpenses: app.monthlyExpenses || 0,
        assets: app.assets || [],
        liabilities: app.liabilities || [],
      };
      setApplicants([legacyData]);
      setActiveApplicantIndex(0);
      loadApplicantData(legacyData);
    }
    
    setShowForm(true);
    setSelectedApp(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validateStep(6)) return;
    setLoading(true);
    try {
      const uploadedDocs = await uploadFiles(selectedFiles, user.uid);
      
      // Save current applicant data
      const currentData = getCurrentApplicantData();
      const finalApplicants = [...applicants];
      finalApplicants[activeApplicantIndex] = currentData;

      // Calculate Combined Serviceability
      const totalAnnualIncome = finalApplicants.reduce((sum, a) => sum + (a.annualIncome || 0), 0);
      const totalMonthlyExpenses = finalApplicants.reduce((sum, a) => sum + (a.monthlyExpenses || 0), 0);
      const totalMonthlyDebts = finalApplicants.reduce((sum, a) => sum + (a.otherMonthlyDebts || 0), 0);
      
      const lAmount = Number(amount);
      const lTerm = Number(loanTerm);

      const monthlyGrossIncome = totalAnnualIncome / 12;
      const monthlyNetIncome = monthlyGrossIncome * 0.75; // Rough estimate
      const annualRate = 0.08;
      const monthlyRate = annualRate / 12;
      const monthlyRepayment = (lAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -lTerm));

      const dsr = ((monthlyRepayment + totalMonthlyDebts) / monthlyGrossIncome) * 100;
      const nsr = (monthlyNetIncome - totalMonthlyExpenses - totalMonthlyDebts) / monthlyRepayment;

      const appData = {
        borrowerId: user.uid,
        brokerId: isBroker ? user.uid : undefined,
        brokerEmail: isBroker ? user.email || '' : undefined,
        borrowerName: finalApplicants[0].name || user.displayName || 'Anonymous',
        borrowerEmail: finalApplicants[0].email || user.email || '',
        applicants: finalApplicants,
        amount: lAmount,
        purpose,
        loanTerm: lTerm,
        status: editingAppId ? (applications.find(a => a.id === editingAppId)?.status || ApplicationStatus.PENDING) : ApplicationStatus.PENDING,
        documents: editingAppId ? [...(applications.find(a => a.id === editingAppId)?.documents || []), ...uploadedDocs] : uploadedDocs,
        nsr: Number(nsr.toFixed(2)),
        dsr: Number(dsr.toFixed(2)),
        updatedAt: serverTimestamp(),
      };

      if (editingAppId) {
        await updateDoc(doc(db, 'applications', editingAppId), appData);
      } else {
        await addDoc(collection(db, 'applications'), {
          ...appData,
          createdAt: serverTimestamp(),
        });
        
        // Notify lenders only for new apps
        sendEmail(
          'lenders@lendflow.pro',
          'New Loan Application Submitted',
          `<h3>New Loan Application</h3>
           <p><strong>Borrower:</strong> ${user.displayName || 'Anonymous'}</p>
           <p><strong>Amount:</strong> $${Number(amount).toLocaleString()}</p>
           <p><strong>Purpose:</strong> ${purpose}</p>
           <p>A new application is waiting for review in the lender queue.</p>
           <p><a href="${window.location.origin}">Open LendFlow Pro</a></p>`
        );
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingAppId ? OperationType.UPDATE : OperationType.CREATE, editingAppId ? `applications/${editingAppId}` : 'applications');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocumentToExisting = async (appId: string, files: File[]) => {
    if (!user) {
      console.error('No user found in handleAddDocumentToExisting');
      return;
    }
    console.log('Adding documents to application:', appId, 'Files:', files.map(f => f.name));
    setUploadingDoc(appId);
    try {
      const app = applications.find(a => a.id === appId);
      if (!app) {
        console.error('Application not found for ID:', appId, 'Available applications:', applications.map(a => a.id));
        throw new Error('Application not found');
      }
      
      console.log('Found application:', app.id, 'Borrower ID:', app.borrowerId);
      // Use the borrower's ID for the storage path, not the current user's (who might be a lender)
      const newDocs = await uploadFiles(files, app.borrowerId);
      console.log('Uploaded new documents:', newDocs);
      const currentDocs = app.documents || [];
      
      await updateDoc(doc(db, 'applications', appId), {
        documents: [...currentDocs, ...newDocs],
        updatedAt: serverTimestamp(),
      });
      console.log('Application updated successfully with new documents');
      setToast({ message: 'Documents uploaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding document:', error);
      if (error instanceof Error && error.message.includes('timed out')) {
        // Already handled by uploadFiles toast
      } else {
        setToast({ message: 'Failed to update application with new documents.', type: 'error' });
      }
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-zinc-200 p-8 flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center" style={{ backgroundColor: config?.primaryColor }}>
            {config?.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" /> : <TrendingUp className="text-white w-5 h-5" />}
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">{config?.companyName || 'LendFlow'}</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'dashboard' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          {isBroker && (
            <button 
              onClick={() => setView('branding')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                view === 'branding' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              <Shield className="w-5 h-5" />
              Branding
            </button>
          )}
          <button 
            onClick={() => setView('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'settings' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          {onSwitchView && (
            <button 
              onClick={onSwitchView}
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
            >
              <ArrowRightLeft className="w-5 h-5" />
              Admin Dashboard
            </button>
          )}
        </nav>

        <div className="pt-8 border-t border-zinc-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-zinc-200" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">{user?.displayName}</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        {view === 'settings' ? (
          <SettingsView />
        ) : view === 'branding' ? (
          <BrokerBrandingSettings />
        ) : (
          <>
            <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">
              {config?.welcomeMessage ? config.welcomeMessage.split('\n')[0] : 'Welcome back'}
            </h2>
            <p className="text-zinc-500">
              {config?.welcomeMessage ? config.welcomeMessage.split('\n').slice(1).join(' ') : (isBroker ? 'Manage your client deals and track commissions.' : 'Manage your loan applications and funding status.')}
            </p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: config?.primaryColor }}
          >
            <PlusCircle className="w-5 h-5" />
            {isBroker ? 'New Deal' : 'New Application'}
          </button>
        </header>

        {/* Stats & Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {isBroker ? 'Total Value' : 'Total Applied'}
              </div>
              <div className="text-3xl font-bold text-zinc-900">${stats.totalApplied.toLocaleString()}</div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {isBroker ? 'Active Deals' : 'Active Applications'}
              </div>
              <div className="text-3xl font-bold text-zinc-900">{stats.activeCount}</div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Approved Funding</div>
              <div className="text-3xl font-bold text-emerald-600">${stats.approvedAmount.toLocaleString()}</div>
            </div>
            
            <div className="md:col-span-3 bg-zinc-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group" style={{ backgroundColor: config?.primaryColor }}>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Ready for your next move?</h3>
                <p className="text-zinc-300 mb-6 max-w-md">Our lenders are active and looking for quality applications. Start a new request today.</p>
                <button 
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="px-6 py-3 bg-white text-zinc-900 rounded-xl font-bold hover:bg-zinc-100 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  {isBroker ? 'New Deal' : 'New Application'}
                </button>
              </div>
              <TrendingUp className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <LoanCalculator />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search by purpose or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
          <div className="flex gap-2 p-1 bg-white border border-zinc-200 rounded-2xl">
            {['all', ...Object.values(ApplicationStatus)].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  filter === s ? "bg-zinc-900 text-white shadow-lg" : "text-zinc-500 hover:bg-zinc-50"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <AnimatePresence>
            {filteredApps.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-12 border border-dashed border-zinc-300 text-center"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">No applications found</h3>
                <p className="text-zinc-500 mb-8">Try adjusting your filters or search query.</p>
                  {applications.length === 0 && (
                    <button 
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                      className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
                    >
                      Create Application
                    </button>
                  )}
              </motion.div>
            ) : (
              filteredApps.map((app) => (
                <motion.div 
                  key={app.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedApp(app)}
                  className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex flex-col gap-6 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center",
                          app.status === ApplicationStatus.APPROVED ? "bg-emerald-50 text-emerald-600" :
                          app.status === ApplicationStatus.REJECTED ? "bg-red-50 text-red-600" :
                          app.status === ApplicationStatus.PROPOSED ? "bg-amber-50 text-amber-600" :
                          "bg-zinc-50 text-zinc-400"
                        )}>
                          {app.status === ApplicationStatus.APPROVED ? <CheckCircle2 className="w-7 h-7" /> :
                           app.status === ApplicationStatus.REJECTED ? <XCircle className="w-7 h-7" /> :
                           app.status === ApplicationStatus.PROPOSED ? <AlertCircle className="w-7 h-7" /> :
                           <Clock className="w-7 h-7" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                            {getPurposeIcon(app.purpose)}
                            {app.purpose}
                          </div>
                          <div className="text-2xl font-bold text-zinc-900">
                            ${app.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</div>
                          <div className={cn(
                            "text-sm font-bold px-3 py-1 rounded-full inline-block",
                            app.status === ApplicationStatus.APPROVED ? "bg-emerald-100 text-emerald-700" :
                            app.status === ApplicationStatus.REJECTED ? "bg-red-100 text-red-700" :
                            app.status === ApplicationStatus.PROPOSED ? "bg-amber-100 text-amber-700" :
                            "bg-zinc-100 text-zinc-600"
                          )}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Submitted</div>
                          <div className="text-sm font-medium text-zinc-900">
                            {app.createdAt?.toDate ? format(app.createdAt.toDate(), 'dd MMM yyyy') : '...'}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all opacity-0 group-hover:opacity-100"
                        >
                          View Details
                        </button>
                        {(app.status === ApplicationStatus.PENDING || app.status === ApplicationStatus.REVIEWING) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(app);
                            }}
                            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Timeline */}
                    <div className="flex items-center gap-4 py-4">
                      <div className="flex-1 h-1 bg-zinc-100 rounded-full relative overflow-hidden">
                        <div 
                          className={cn(
                            "absolute inset-y-0 left-0 transition-all duration-500",
                            app.status === ApplicationStatus.APPROVED ? "w-full bg-emerald-500" :
                            app.status === ApplicationStatus.REJECTED ? "w-full bg-red-500" :
                            app.status === ApplicationStatus.PROPOSED ? "w-4/5 bg-amber-500" :
                            app.status === ApplicationStatus.REVIEWING ? "w-2/3 bg-zinc-900" :
                            "w-1/3 bg-zinc-400"
                          )}
                        />
                      </div>
                      <div className="flex gap-8 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <span className={cn(app.status === ApplicationStatus.PENDING || app.status === ApplicationStatus.REVIEWING || app.status === ApplicationStatus.PROPOSED || app.status === ApplicationStatus.APPROVED ? "text-zinc-900" : "")}>Submitted</span>
                        <span className={cn(app.status === ApplicationStatus.REVIEWING || app.status === ApplicationStatus.PROPOSED || app.status === ApplicationStatus.APPROVED ? "text-zinc-900" : "")}>Reviewing</span>
                        <span className={cn(app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.REJECTED ? (app.status === ApplicationStatus.APPROVED ? "text-emerald-600" : "text-red-600") : app.status === ApplicationStatus.PROPOSED ? "text-amber-600" : "")}>Decision</span>
                      </div>
                    </div>

                    {app.status === ApplicationStatus.PROPOSED && app.proposedModifications && (
                      <div className="mt-6 p-6 bg-amber-50 rounded-[2rem] border border-amber-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-amber-900">Modification Proposed</div>
                              <div className="text-xs text-amber-700">A lender has suggested changes to your application.</div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectProposal(app);
                              }}
                              className="px-4 py-2 bg-white text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                            >
                              Reject Changes
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptProposal(app);
                              }}
                              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200"
                            >
                              Accept Changes
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white rounded-2xl border border-amber-100">
                            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Proposed Amount</div>
                            <div className="text-lg font-bold text-amber-900">${app.proposedModifications.amount.toLocaleString()}</div>
                            <div className="text-[10px] text-amber-500 line-through">Original: ${app.amount.toLocaleString()}</div>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-amber-100">
                            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Proposed Term</div>
                            <div className="text-lg font-bold text-amber-900">{app.proposedModifications.loanTerm} Months</div>
                            <div className="text-[10px] text-amber-500 line-through">Original: {app.loanTerm} Months</div>
                          </div>
                        </div>
                        {app.proposedModifications.notes && (
                          <div className="mt-4 text-sm text-amber-800 bg-white/50 p-4 rounded-xl border border-amber-100">
                            <strong>Lender Note:</strong> {app.proposedModifications.notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents Section */}
                    <div className="pt-6 border-t border-zinc-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Supporting Documents
                        </h4>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="file"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                handleAddDocumentToExisting(app.id, Array.from(e.target.files));
                                e.target.value = '';
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={uploadingDoc === app.id}
                          />
                          <button className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
                            <PlusCircle className="w-3 h-3" />
                            {uploadingDoc === app.id ? 'Uploading...' : 'Add Document'}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <DocumentList documents={app.documents} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Application Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-3xl font-bold text-zinc-900 mb-2">{editingAppId ? 'Edit Application' : 'New Application'}</h3>
                      <p className="text-zinc-500">Step {step} of 6: {
                        step === 1 ? 'Loan Details' :
                        step === 2 ? 'Personal Details' :
                        step === 3 ? 'Contact Info' :
                        step === 4 ? 'Employment & Income' :
                        step === 5 ? 'Assets & Expenses' :
                        'Documents & Credit'
                      }</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((s) => (
                        <div 
                          key={s}
                          className={cn(
                            "w-8 h-1.5 rounded-full transition-all",
                            s <= step ? "bg-zinc-900" : "bg-zinc-100"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Applicant Tabs */}
                  {step >= 2 && step <= 5 && (
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                      {applicants.map((app, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSwitchApplicant(idx)}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                              activeApplicantIndex === idx 
                                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                            )}
                          >
                            <User className="w-3 h-3" />
                            {idx === 0 ? 'Primary' : `Co-App ${idx + 1}`}
                          </button>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveApplicant(idx)}
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {applicants.length < 4 && (
                        <button
                          type="button"
                          onClick={handleAddApplicant}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-50 text-zinc-400 border border-dashed border-zinc-200 hover:border-zinc-900 hover:text-zinc-900 transition-all flex items-center gap-2"
                        >
                          <UserPlus className="w-3 h-3" />
                          Add Co-Applicant
                        </button>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Loan Amount ($)</label>
                            <input 
                              required
                              type="number"
                              value={amount}
                              onChange={(e) => {
                                setAmount(e.target.value);
                                clearError('amount');
                              }}
                              placeholder="e.g. 25000"
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.amount ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            />
                            <ErrorMessage message={errors.amount} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Loan Term (Months)</label>
                            <select 
                              value={loanTerm}
                              onChange={(e) => {
                                setLoanTerm(e.target.value);
                                clearError('loanTerm');
                              }}
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.loanTerm ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            >
                              <option value="12">12 Months</option>
                              <option value="24">24 Months</option>
                              <option value="36">36 Months</option>
                              <option value="48">48 Months</option>
                              <option value="60">60 Months</option>
                            </select>
                            <ErrorMessage message={errors.loanTerm} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Loan Purpose</label>
                          <input 
                            required
                            type="text"
                            value={purpose}
                            onChange={(e) => {
                              setPurpose(e.target.value);
                              clearError('purpose');
                            }}
                            placeholder="e.g. Business Expansion"
                            className={cn(
                              "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                              errors.purpose ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                            )}
                          />
                          <ErrorMessage message={errors.purpose} />
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
                            <input 
                              required
                              type="text"
                              value={applicantName}
                              onChange={(e) => {
                                setApplicantName(e.target.value);
                                clearError('applicantName');
                              }}
                              placeholder="Applicant Full Name"
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.applicantName ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            />
                            <ErrorMessage message={errors.applicantName} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                            <input 
                              required
                              type="email"
                              value={applicantEmail}
                              onChange={(e) => {
                                setApplicantEmail(e.target.value);
                                clearError('applicantEmail');
                              }}
                              placeholder="applicant@example.com"
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.applicantEmail ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            />
                            <ErrorMessage message={errors.applicantEmail} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gender</label>
                            <select 
                              value={gender}
                              onChange={(e) => {
                                setGender(e.target.value);
                                clearError('gender');
                              }}
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.gender ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                              <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                            <ErrorMessage message={errors.gender} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Date of Birth</label>
                            <input 
                              required
                              type="date"
                              value={dob}
                              onChange={(e) => {
                                setDob(e.target.value);
                                clearError('dob');
                              }}
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.dob ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            />
                            <ErrorMessage message={errors.dob} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Marital Status</label>
                            <select 
                              value={maritalStatus}
                              onChange={(e) => setMaritalStatus(e.target.value)}
                              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                            >
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="De Facto">De Facto</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Widowed">Widowed</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Number of Dependents</label>
                            <input 
                              required
                              type="number"
                              min="0"
                              value={dependents}
                              onChange={(e) => {
                                setDependents(e.target.value);
                                clearError('dependents');
                              }}
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.dependents ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            />
                            <ErrorMessage message={errors.dependents} />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone Number</label>
                          <input 
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              clearError('phone');
                            }}
                            placeholder="+61 400 000 000 or +64 20 000 0000"
                            className={cn(
                              "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                              errors.phone ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                            )}
                          />
                          <ErrorMessage message={errors.phone} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Current Address</label>
                          <textarea 
                            required
                            value={address}
                            onChange={(e) => {
                              setAddress(e.target.value);
                              clearError('address');
                            }}
                            placeholder="Street, Suburb, State/Territory, Postcode"
                            rows={3}
                            className={cn(
                              "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none",
                              errors.address ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                            )}
                          />
                          <ErrorMessage message={errors.address} />
                        </div>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 max-h-[60vh] overflow-y-auto pr-2"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Base Annual Income ($)</label>
                            <input 
                              required
                              type="number"
                              value={baseIncome}
                              onChange={(e) => {
                                setBaseIncome(e.target.value);
                                clearError('baseIncome');
                              }}
                              placeholder="e.g. 75000"
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.baseIncome ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            />
                            <ErrorMessage message={errors.baseIncome} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bonus/Commissions ($)</label>
                            <input 
                              type="number"
                              value={bonusIncome}
                              onChange={(e) => setBonusIncome(e.target.value)}
                              placeholder="e.g. 5000"
                              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Rental Income ($)</label>
                            <input 
                              type="number"
                              value={rentalIncome}
                              onChange={(e) => setRentalIncome(e.target.value)}
                              placeholder="e.g. 12000"
                              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Other Income ($)</label>
                            <input 
                              type="number"
                              value={otherIncome}
                              onChange={(e) => setOtherIncome(e.target.value)}
                              placeholder="e.g. 2000"
                              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Income Source</label>
                          <select 
                            value={incomeSource}
                            onChange={(e) => {
                              const val = e.target.value;
                              setIncomeSource(val);
                              setIsSelfEmployed(val === 'Self-Employed');
                            }}
                            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                          >
                            <option value="Employment">Employment</option>
                            <option value="Self-Employed">Self-Employed</option>
                            <option value="Business">Business</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Employer Name</label>
                          <input 
                            required
                            type="text"
                            value={employerName}
                            onChange={(e) => {
                              setEmployerName(e.target.value);
                              clearError('employerName');
                            }}
                            placeholder="Company Name"
                            className={cn(
                              "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                              errors.employerName ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                            )}
                          />
                          <ErrorMessage message={errors.employerName} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Job Title</label>
                            <input 
                              required
                              type="text"
                              value={jobTitle}
                              onChange={(e) => {
                                setJobTitle(e.target.value);
                                clearError('jobTitle');
                              }}
                              placeholder="e.g. Software Engineer"
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.jobTitle ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            />
                            <ErrorMessage message={errors.jobTitle} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Years at Job</label>
                            <input 
                              required
                              type="number"
                              value={yearsAtJob}
                              onChange={(e) => {
                                setYearsAtJob(e.target.value);
                                clearError('yearsAtJob');
                              }}
                              placeholder="e.g. 3"
                              className={cn(
                                "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                                errors.yearsAtJob ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                              )}
                            />
                            <ErrorMessage message={errors.yearsAtJob} />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 5 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 max-h-[60vh] overflow-y-auto pr-2"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assets</label>
                            <button 
                              type="button"
                              onClick={() => setAssets([...assets, { type: 'Savings', value: 0, description: '' }])}
                              className="text-xs font-bold text-zinc-900 flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3" /> Add Asset
                            </button>
                          </div>
                          {assets.map((asset, index) => (
                            <div key={index} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <select 
                                  value={asset.type}
                                  onChange={(e) => {
                                    const newAssets = [...assets];
                                    newAssets[index].type = e.target.value;
                                    setAssets(newAssets);
                                  }}
                                  className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm"
                                >
                                  <option value="Savings">Savings/Cash</option>
                                  <option value="Real Estate">Real Estate</option>
                                  <option value="Vehicle">Vehicle</option>
                                  <option value="Shares">Shares/Investments</option>
                                  <option value="Other">Other</option>
                                </select>
                                <input 
                                  type="number"
                                  value={asset.value}
                                  onChange={(e) => {
                                    const newAssets = [...assets];
                                    newAssets[index].value = Number(e.target.value);
                                    setAssets(newAssets);
                                  }}
                                  placeholder="Value ($)"
                                  className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={asset.description}
                                  onChange={(e) => {
                                    const newAssets = [...assets];
                                    newAssets[index].description = e.target.value;
                                    setAssets(newAssets);
                                  }}
                                  placeholder="Description (e.g. CBA Savings)"
                                  className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setAssets(assets.filter((_, i) => i !== index))}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Liabilities</label>
                            <button 
                              type="button"
                              onClick={() => setLiabilities([...liabilities, { type: 'Credit Card', balance: 0, monthlyRepayment: 0, description: '' }])}
                              className="text-xs font-bold text-zinc-900 flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3" /> Add Liability
                            </button>
                          </div>
                          {liabilities.map((liability, index) => (
                            <div key={index} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <select 
                                  value={liability.type}
                                  onChange={(e) => {
                                    const newLiabilities = [...liabilities];
                                    newLiabilities[index].type = e.target.value;
                                    setLiabilities(newLiabilities);
                                  }}
                                  className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm"
                                >
                                  <option value="Credit Card">Credit Card</option>
                                  <option value="Mortgage">Mortgage</option>
                                  <option value="Personal Loan">Personal Loan</option>
                                  <option value="Car Loan">Car Loan</option>
                                  <option value="Other">Other</option>
                                </select>
                                <input 
                                  type="number"
                                  value={liability.balance}
                                  onChange={(e) => {
                                    const newLiabilities = [...liabilities];
                                    newLiabilities[index].balance = Number(e.target.value);
                                    setLiabilities(newLiabilities);
                                  }}
                                  placeholder="Balance ($)"
                                  className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <input 
                                  type="number"
                                  value={liability.monthlyRepayment}
                                  onChange={(e) => {
                                    const newLiabilities = [...liabilities];
                                    newLiabilities[index].monthlyRepayment = Number(e.target.value);
                                    setLiabilities(newLiabilities);
                                  }}
                                  placeholder="Monthly Repayment ($)"
                                  className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm"
                                />
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={liability.description}
                                    onChange={(e) => {
                                      const newLiabilities = [...liabilities];
                                      newLiabilities[index].description = e.target.value;
                                      setLiabilities(newLiabilities);
                                    }}
                                    placeholder="Description"
                                    className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm"
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => setLiabilities(liabilities.filter((_, i) => i !== index))}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Monthly Living Expenses ($)</label>
                          <input 
                            required
                            type="number"
                            value={monthlyExpenses}
                            onChange={(e) => {
                              setMonthlyExpenses(e.target.value);
                              clearError('monthlyExpenses');
                            }}
                            placeholder="e.g. 2500"
                            className={cn(
                              "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                              errors.monthlyExpenses ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                            )}
                          />
                          <ErrorMessage message={errors.monthlyExpenses} />
                        </div>
                      </motion.div>
                    )}

                    {step === 6 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated Credit Score (Equifax/Experian)</label>
                          <input 
                            required
                            type="number"
                            min="0"
                            max="1200"
                            value={credit}
                            onChange={(e) => {
                              setCredit(e.target.value);
                              clearError('credit');
                            }}
                            placeholder="0 - 1200"
                            className={cn(
                              "w-full px-5 py-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                              errors.credit ? "border-red-500 focus:ring-red-500" : "border-zinc-200 focus:ring-zinc-900"
                            )}
                          />
                          <ErrorMessage message={errors.credit} />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Supporting Documents</label>
                          
                          {editingAppId && applications.find(a => a.id === editingAppId)?.documents?.length ? (
                            <div className="mb-4 space-y-2">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Existing Documents</label>
                              <div className="grid grid-cols-1 gap-2">
                                <DocumentList 
                                  documents={applications.find(a => a.id === editingAppId)?.documents} 
                                  onRemove={(idx) => {
                                    const app = applications.find(a => a.id === editingAppId);
                                    if (app && app.documents) {
                                      const newDocs = [...app.documents];
                                      newDocs.splice(idx, 1);
                                      updateDoc(doc(db, 'applications', editingAppId), {
                                        documents: newDocs,
                                        updatedAt: serverTimestamp()
                                      });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          ) : null}

                          <DocumentUploadZone 
                            loading={loading}
                            onUpload={(files) => setSelectedFiles(prev => [...prev, ...files])}
                          />
                          {selectedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-zinc-400" />
                                    <span className="text-sm font-medium text-zinc-900 truncate max-w-[200px]">{file.name}</span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-zinc-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-4 flex gap-4">
                      {step > 1 ? (
                        <button 
                          type="button"
                          onClick={() => setStep(prev => prev - 1)}
                          className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                        >
                          Back
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            resetForm();
                          }}
                          className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {step < 6 ? (
                        <button 
                          type="button"
                          onClick={() => {
                            if (validateStep(step)) {
                              setStep(prev => prev + 1);
                            }
                          }}
                          className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                        >
                          Continue
                        </button>
                      ) : (
                        <button 
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Submitting...
                            </>
                          ) : 'Submit Application'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Details Modal */}
        <AnimatePresence>
          {selectedApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedApp(null)}
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-10 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-bold text-zinc-900 mb-1">Application Details</h3>
                      <p className="text-zinc-500">Submitted on {selectedApp.createdAt?.toDate ? format(selectedApp.createdAt.toDate(), 'dd MMMM yyyy') : '...'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-zinc-900">${selectedApp.amount.toLocaleString()}</div>
                      <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{selectedApp.purpose}</div>
                    </div>
                  </div>

                  {/* Applicant Tabs */}
                  {selectedApp.applicants && selectedApp.applicants.length > 1 && (
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedApp.applicants.map((app, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveApplicantIndex(idx)}
                          className={cn(
                            "px-6 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                            activeApplicantIndex === idx 
                              ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200" 
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          )}
                        >
                          <User className="w-3.5 h-3.5" />
                          {idx === 0 ? 'Primary Applicant' : `Co-Applicant ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const currentApp = selectedApp.applicants ? selectedApp.applicants[activeApplicantIndex] : selectedApp;
                    
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-8 mb-8">
                          <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Credit Score</div>
                            <div className="text-2xl font-bold text-zinc-900">{currentApp.creditScore || 'N/A'}</div>
                          </div>
                          <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Annual Gross Income</div>
                            <div className="text-2xl font-bold text-zinc-900">${currentApp.annualIncome?.toLocaleString() || '0'}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-6">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Personal & Contact
                            </h4>
                            <div className="space-y-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Full Name</div>
                                <div className="text-sm font-bold text-zinc-900">{(currentApp as Applicant).name || (currentApp as LoanApplication).borrowerName}</div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Email Address</div>
                                <div className="text-sm font-bold text-zinc-900">{(currentApp as Applicant).email || (currentApp as LoanApplication).borrowerEmail}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Phone</div>
                                  <div className="text-sm font-bold text-zinc-900">{currentApp.phone || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Date of Birth</div>
                                  <div className="text-sm font-bold text-zinc-900">{currentApp.dob || 'N/A'}</div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Residential Address</div>
                                <div className="text-sm font-bold text-zinc-900">{currentApp.address || 'N/A'}</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              Employment & Financials
                            </h4>
                            <div className="space-y-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Employer & Job Title</div>
                                <div className="text-sm font-bold text-zinc-900">
                                  {currentApp.employerName || 'N/A'} • {currentApp.jobTitle || 'N/A'}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Income Source</div>
                                  <div className="text-sm font-bold text-zinc-900">{currentApp.incomeSource || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Years at Job</div>
                                  <div className="text-sm font-bold text-zinc-900">{currentApp.yearsAtJob || 0} Years</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Monthly Expenses</div>
                                  <div className="text-sm font-bold text-zinc-900">${currentApp.monthlyExpenses?.toLocaleString() || 0}</div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Monthly Debts</div>
                                  <div className="text-sm font-bold text-zinc-900">${currentApp.otherMonthlyDebts?.toLocaleString() || 0}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Assets & Liabilities Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                              <Wallet className="w-4 h-4" />
                              Assets Breakdown
                            </h4>
                            <div className="space-y-2">
                              {currentApp.assets && currentApp.assets.length > 0 ? (
                                currentApp.assets.map((asset, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                    <span className="text-xs font-medium text-emerald-800">{asset.description}</span>
                                    <span className="text-xs font-bold text-emerald-600">${asset.value.toLocaleString()}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">No assets listed</div>
                              )}
                              {currentApp.totalAssets !== undefined && (
                                <div className="flex justify-between items-center p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
                                  <span className="text-xs font-bold uppercase tracking-wider">Total Assets</span>
                                  <span className="text-sm font-bold">${currentApp.totalAssets.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Liabilities Breakdown
                            </h4>
                            <div className="space-y-2">
                              {currentApp.liabilities && currentApp.liabilities.length > 0 ? (
                                currentApp.liabilities.map((liability, idx) => (
                                  <div key={idx} className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-medium text-red-800">{liability.description || liability.type}</span>
                                      <span className="text-xs font-bold text-red-600">${liability.balance.toLocaleString()}</span>
                                    </div>
                                    <div className="text-[10px] text-red-400 font-medium">Repayment: ${liability.monthlyRepayment}/mo</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">No liabilities listed</div>
                              )}
                              {currentApp.totalLiabilities !== undefined && (
                                <div className="flex justify-between items-center p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-100">
                                  <span className="text-xs font-bold uppercase tracking-wider">Total Liabilities</span>
                                  <span className="text-sm font-bold">${currentApp.totalLiabilities.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {selectedApp.assetDescription && (
                    <div className="mb-10">
                      <h4 className="text-sm font-bold text-zinc-900 mb-2">Asset Description</h4>
                      <p className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                        {selectedApp.assetDescription}
                      </p>
                    </div>
                  )}

                  <div className="mb-10">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Application Progress
                    </h4>
                    <div className="space-y-6">
                      {[
                        { label: 'Application Submitted', date: selectedApp.createdAt?.toDate ? format(selectedApp.createdAt.toDate(), 'dd MMM yyyy') : '...', completed: true },
                        { label: 'Under Review', date: selectedApp.status !== ApplicationStatus.PENDING ? 'In Progress' : 'Pending', completed: selectedApp.status !== ApplicationStatus.PENDING },
                        { label: 'Final Decision', date: (selectedApp.status === ApplicationStatus.APPROVED || selectedApp.status === ApplicationStatus.REJECTED) && selectedApp.updatedAt?.toDate ? format(selectedApp.updatedAt.toDate(), 'dd MMM yyyy') : 'Pending', completed: selectedApp.status === ApplicationStatus.APPROVED || selectedApp.status === ApplicationStatus.REJECTED }
                      ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            step.completed ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                          )}>
                            {step.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-zinc-900">{step.label}</div>
                            <div className="text-xs text-zinc-500">{step.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedApp.lenderNotes && (
                    <div className="mb-10">
                      <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Lender Feedback
                      </h4>
                      <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-3xl text-sm text-zinc-600">
                        {selectedApp.lenderNotes}
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Submitted Documents
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <DocumentList documents={selectedApp.documents} />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedApp(null)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                    >
                      Close
                    </button>
                    {(selectedApp.status === ApplicationStatus.PENDING || 
                      selectedApp.status === ApplicationStatus.REVIEWING || 
                      selectedApp.status === ApplicationStatus.PROPOSED) && (
                      <button 
                        onClick={() => {
                          handleEdit(selectedApp);
                          setSelectedApp(null);
                        }}
                        className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Application
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <div className="mt-12 pt-8 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            LendFlow operates in compliance with the National Consumer Credit Protection Act (AU) and the Credit Contracts and Consumer Finance Act (NZ). 
            All loan applications are subject to responsible lending assessments and credit provider approval.
          </p>
        </div>
        </>
        )}
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              toast.type === 'success' 
                ? "bg-emerald-500/90 text-white border-emerald-400" 
                : "bg-red-500/90 text-white border-red-400"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LenderAnalytics = ({ applications }: { applications: LoanApplication[] }) => {
  const stats = {
    totalApps: applications.length,
    approvedAmount: applications
      .filter(a => a.status === ApplicationStatus.APPROVED)
      .reduce((sum, a) => sum + a.amount, 0),
    pendingApps: applications.filter(a => a.status === ApplicationStatus.PENDING).length,
    reviewingApps: applications.filter(a => a.status === ApplicationStatus.REVIEWING).length,
  };

  // Status Data for Bar Chart
  const statusData = [
    { name: 'Pending', value: applications.filter(a => a.status === ApplicationStatus.PENDING).length, color: '#71717a' },
    { name: 'Reviewing', value: applications.filter(a => a.status === ApplicationStatus.REVIEWING).length, color: '#3f3f46' },
    { name: 'Approved', value: applications.filter(a => a.status === ApplicationStatus.APPROVED).length, color: '#10b981' },
    { name: 'Rejected', value: applications.filter(a => a.status === ApplicationStatus.REJECTED).length, color: '#ef4444' },
  ];

  // Volume Data for Line Chart (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dayApps = applications.filter(a => {
      const appDate = a.createdAt?.toDate?.() || new Date();
      return isSameDay(appDate, date);
    });
    return {
      date: format(date, 'MMM d'),
      amount: dayApps.reduce((sum, a) => sum + a.amount, 0),
      count: dayApps.length,
    };
  }).reverse();

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total Applications</div>
          <div className="text-3xl font-bold text-zinc-900">{stats.totalApps}</div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Approved Funding</div>
          <div className="text-3xl font-bold text-emerald-600">${stats.approvedAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pending Review</div>
          <div className="text-3xl font-bold text-zinc-900">{stats.pendingApps}</div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">In Review</div>
          <div className="text-3xl font-bold text-zinc-900">{stats.reviewingApps}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Application Status Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                />
                <ReTooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 mb-8 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Loan Volume (Last 7 Days)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                />
                <ReTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#18181b" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#18181b', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const LenderDashboard = ({ onSwitchView }: { onSwitchView?: () => void }) => {
  const { user, profile, signOut } = useAuth();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [view, setView] = useState<'queue' | 'analytics' | 'settings'>('queue');
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [activeApplicantIndex, setActiveApplicantIndex] = useState(0);
  const [lenderNotes, setLenderNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [proposedTerm, setProposedTerm] = useState('');
  const [proposedNotes, setProposedNotes] = useState('');
  const [showProposeForm, setShowProposeForm] = useState(false);

  useEffect(() => {
    if (selectedApp) {
      setLenderNotes(selectedApp.lenderNotes || '');
      setInternalNotes(selectedApp.internalNotes || '');
      setProposedAmount(selectedApp.amount.toString());
      setProposedTerm(selectedApp.loanTerm.toString());
      setProposedNotes('');
      setShowProposeForm(false);
      setActiveApplicantIndex(0);
    }
  }, [selectedApp]);

  useEffect(() => {
    const q = collection(db, 'applications');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanApplication));
      setApplications(apps.sort((a, b) => {
        const t1 = a.createdAt?.toMillis?.() || Date.now();
        const t2 = b.createdAt?.toMillis?.() || Date.now();
        return t2 - t1;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id: string, status: ApplicationStatus) => {
    try {
      await updateDoc(doc(db, 'applications', id), {
        status,
        lenderNotes,
        internalNotes,
        updatedAt: serverTimestamp(),
      });

      if (selectedApp) {
        sendEmail(
          selectedApp.borrowerEmail,
          `Loan Application Status: ${status.toUpperCase()}`,
          `<h3>Application Status Update</h3>
           <p>Your loan application for <strong>$${selectedApp.amount.toLocaleString()}</strong> has been updated to: <strong>${status.toUpperCase()}</strong></p>
           ${lenderNotes ? `<p><strong>Lender Feedback:</strong> ${lenderNotes}</p>` : ''}
           <p>Log in to your dashboard to view more details.</p>
           <p><a href="${window.location.origin}">Open LendFlow</a></p>`
        );
      }

      setSelectedApp(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${id}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      await updateDoc(doc(db, 'applications', selectedApp.id), {
        lenderNotes,
        internalNotes,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${selectedApp.id}`);
    }
  };

  const handleProposeModifications = async () => {
    if (!selectedApp) return;
    try {
      await updateDoc(doc(db, 'applications', selectedApp.id), {
        status: ApplicationStatus.PROPOSED,
        proposedModifications: {
          amount: proposedAmount ? Number(proposedAmount) : selectedApp.amount,
          loanTerm: proposedTerm ? Number(proposedTerm) : selectedApp.loanTerm,
          notes: proposedNotes,
          proposedAt: serverTimestamp(),
        },
        lenderNotes: proposedNotes,
        updatedAt: serverTimestamp(),
      });

      sendEmail(
        selectedApp.borrowerEmail,
        `Loan Application: Modification Proposed`,
        `<h3>Modification Proposed</h3>
         <p>A lender has proposed modifications to your loan application for <strong>$${selectedApp.amount.toLocaleString()}</strong>.</p>
         <p><strong>Proposed Amount:</strong> $${(Number(proposedAmount) || selectedApp.amount).toLocaleString()}</p>
         <p><strong>Proposed Term:</strong> ${proposedTerm || selectedApp.loanTerm} Months</p>
         ${proposedNotes ? `<p><strong>Lender Notes:</strong> ${proposedNotes}</p>` : ''}
         <p>Please log in to your dashboard to accept or reject these changes.</p>
         <p><a href="${window.location.origin}">Open LendFlow</a></p>`
      );

      setSelectedApp(null);
      setShowProposeForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${selectedApp.id}`);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesStatus = filter === 'all' || app.status === filter;
    const matchesSearch = (app.borrowerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (app.purpose || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMin = minAmount === '' || app.amount >= Number(minAmount);
    const matchesMax = maxAmount === '' || app.amount <= Number(maxAmount);
    return matchesStatus && matchesSearch && matchesMin && matchesMax;
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className="w-72 bg-white border-r border-zinc-200 p-8 flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">LendFlow Pro</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setView('queue')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'queue' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Applications
          </button>
          <button 
            onClick={() => setView('analytics')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'analytics' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
          <button 
            onClick={() => setView('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'settings' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          {onSwitchView && (
            <button 
              onClick={onSwitchView}
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
            >
              <ArrowRightLeft className="w-5 h-5" />
              Admin Dashboard
            </button>
          )}
        </nav>

        <div className="pt-8 border-t border-zinc-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold">
              {user?.displayName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">{user?.displayName}</div>
              <div className="text-xs text-zinc-500 truncate">Lender Account</div>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        {view === 'settings' ? (
          <SettingsView />
        ) : (
          <>
            {view === 'queue' ? (
              <>
            <header className="flex flex-col gap-8 mb-12">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Review Queue</h2>
                  <p className="text-zinc-500">Analyze risk and manage loan originations.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm">
                  {(['all', 'pending', 'reviewing', 'proposed', 'approved', 'rejected'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilter(s as ApplicationStatus | 'all')}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        filter === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text"
                    placeholder="Search borrower or purpose..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number"
                      placeholder="Min amount"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                    />
                  </div>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number"
                      placeholder="Max amount"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Borrower</th>
                    <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Amount</th>
                    <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Credit</th>
                    <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                    <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredApps.map((app) => (
                    <tr key={app.id} onClick={() => setSelectedApp(app)} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer">
                      <td className="px-8 py-6">
                        <div className="font-bold text-zinc-900">{app.borrowerName}</div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                          {getPurposeIcon(app.purpose)}
                          {app.purpose}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-zinc-900">
                        ${app.amount.toLocaleString()}
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "text-sm font-bold",
                          (app.creditScore || 0) > 700 ? "text-emerald-600" :
                          (app.creditScore || 0) > 600 ? "text-amber-600" : "text-red-600"
                        )}>
                          {app.creditScore || 'N/A'}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "text-xs font-bold px-3 py-1 rounded-full inline-block",
                          app.status === ApplicationStatus.APPROVED ? "bg-emerald-100 text-emerald-700" :
                          app.status === ApplicationStatus.REJECTED ? "bg-red-100 text-red-700" :
                          "bg-zinc-100 text-zinc-600"
                        )}>
                          {app.status}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-zinc-500">
                        {app.createdAt?.toDate ? format(app.createdAt.toDate(), 'MMM d') : '...'}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => setSelectedApp(app)}
                          className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredApps.length === 0 && (
                <div className="p-20 text-center text-zinc-400">
                  No applications found matching your filter.
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <header className="mb-12">
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Performance Analytics</h2>
              <p className="text-zinc-500">Visualize application trends and portfolio health.</p>
            </header>
            <LenderAnalytics applications={applications} />
          </>
        )}

        {/* Review Modal */}
        <AnimatePresence>
          {selectedApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedApp(null)}
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-10 overflow-y-auto">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-bold text-zinc-900 mb-1">Review Application</h3>
                      <p className="text-zinc-500">
                        Borrower: {selectedApp.borrowerName}
                        {selectedApp.brokerEmail && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600 font-medium">
                            <Briefcase className="w-3 h-3" />
                            Broker: {selectedApp.brokerEmail}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-zinc-900">${selectedApp.amount.toLocaleString()}</div>
                      <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{selectedApp.purpose}</div>
                    </div>
                  </div>

                  {/* Applicant Selection Tabs */}
                  {selectedApp.applicants && selectedApp.applicants.length > 1 && (
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide border-b border-zinc-100">
                      {selectedApp.applicants.map((app, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveApplicantIndex(idx)}
                          className={cn(
                            "px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2",
                            activeApplicantIndex === idx 
                              ? "border-zinc-900 text-zinc-900 bg-zinc-50" 
                              : "border-transparent text-zinc-400 hover:text-zinc-600"
                          )}
                        >
                          <User className="w-3 h-3" />
                          {idx === 0 ? 'Primary Applicant' : `Co-Applicant ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const currentApp = selectedApp.applicants ? selectedApp.applicants[activeApplicantIndex] : selectedApp;
                    return (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Credit Score</div>
                            <div className="text-xl font-bold text-zinc-900">{currentApp.creditScore || 'N/A'}</div>
                          </div>
                          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Gross Income</div>
                            <div className="text-xl font-bold text-zinc-900">${currentApp.annualIncome?.toLocaleString() || 'N/A'}</div>
                            {currentApp.baseIncome !== undefined && (
                              <div className="text-[10px] text-zinc-500 mt-1">
                                Base: ${currentApp.baseIncome.toLocaleString()}
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">NSR (Combined)</div>
                            <div className={cn(
                              "text-xl font-bold",
                              (selectedApp.nsr || 0) > 1.5 ? "text-emerald-600" :
                              (selectedApp.nsr || 0) > 1.1 ? "text-amber-600" : "text-red-600"
                            )}>
                              {selectedApp.nsr?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">DSR (Combined)</div>
                            <div className={cn(
                              "text-xl font-bold",
                              (selectedApp.dsr || 0) < 0.35 ? "text-emerald-600" :
                              (selectedApp.dsr || 0) < 0.45 ? "text-amber-600" : "text-red-600"
                            )}>
                              {selectedApp.dsr ? `${(selectedApp.dsr * 100).toFixed(1)}%` : 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Contact Information</h4>
                            </div>
                            <div className="grid gap-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Phone className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</div>
                                    <div className="text-sm font-bold text-zinc-900">{currentApp.phone || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Mail className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</div>
                                    <div className="text-sm font-bold text-zinc-900">{(currentApp as Applicant).email || (currentApp as LoanApplication).borrowerEmail}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <MapPin className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Residential Address</div>
                                    <div className="text-sm font-bold text-zinc-900">{currentApp.address || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Professional Profile</h4>
                            </div>
                            <div className="grid gap-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Building2 className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Employer</div>
                                    <div className="text-sm font-bold text-zinc-900">{currentApp.employerName || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <UserCircle className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Job Title & Tenure</div>
                                    <div className="text-sm font-bold text-zinc-900">
                                      {currentApp.jobTitle || 'N/A'} 
                                      {currentApp.yearsAtJob !== undefined && ` • ${currentApp.yearsAtJob} Years`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Wallet className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Income Source</div>
                                    <div className="text-sm font-bold text-zinc-900">
                                      {currentApp.incomeSource || 'N/A'}
                                      {(currentApp as Applicant).isSelfEmployed && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-md font-bold uppercase tracking-wider">Self-Employed</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Personal Details</h4>
                            </div>
                            <div className="grid gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Gender</div>
                                  <div className="text-sm font-bold text-zinc-900 capitalize">{currentApp.gender || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Marital Status</div>
                                  <div className="text-sm font-bold text-zinc-900 capitalize">{currentApp.maritalStatus || 'N/A'}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Date of Birth</div>
                                  <div className="text-sm font-bold text-zinc-900">{currentApp.dob || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Dependents</div>
                                  <div className="text-sm font-bold text-zinc-900">{currentApp.dependents || 0}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Serviceability Analysis</h4>
                            </div>
                            <div className="grid gap-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Monthly Living Expenses</div>
                                  <div className="text-sm font-bold text-zinc-900">${currentApp.monthlyExpenses?.toLocaleString() || 0}</div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Other Monthly Debts</div>
                                  <div className="text-sm font-bold text-zinc-900">${currentApp.otherMonthlyDebts?.toLocaleString() || 0}</div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Loan Term</div>
                                  <div className="text-sm font-bold text-zinc-900">{selectedApp.loanTerm} Months</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Financials Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Assets Breakdown</h4>
                            </div>
                            <div className="space-y-3">
                              {currentApp.assets && currentApp.assets.length > 0 ? (
                                currentApp.assets.map((asset, idx) => (
                                  <div key={idx} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center">
                                    <div>
                                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{asset.type}</div>
                                      <div className="text-sm font-bold text-zinc-900">{asset.description || 'No description'}</div>
                                    </div>
                                    <div className="text-sm font-bold text-zinc-900">${asset.value.toLocaleString()}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-zinc-500 italic p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center">
                                  No detailed assets provided.
                                </div>
                              )}
                              {currentApp.totalAssets !== undefined && (
                                <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-2xl text-white">
                                  <div className="text-xs font-bold uppercase tracking-widest">Total Assets</div>
                                  <div className="text-lg font-bold">${currentApp.totalAssets.toLocaleString()}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Liabilities Breakdown</h4>
                            </div>
                            <div className="space-y-3">
                              {currentApp.liabilities && currentApp.liabilities.length > 0 ? (
                                currentApp.liabilities.map((liability, idx) => (
                                  <div key={idx} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center">
                                    <div>
                                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{liability.type}</div>
                                      <div className="text-sm font-bold text-zinc-900">{liability.description || 'No description'}</div>
                                      <div className="text-[10px] text-zinc-500">Repayment: ${liability.monthlyRepayment}/mo</div>
                                    </div>
                                    <div className="text-sm font-bold text-zinc-900">${liability.balance.toLocaleString()}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-zinc-500 italic p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center">
                                  No detailed liabilities provided.
                                </div>
                              )}
                              {currentApp.totalLiabilities !== undefined && (
                                <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-2xl text-white">
                                  <div className="text-xs font-bold uppercase tracking-widest">Total Liabilities</div>
                                  <div className="text-lg font-bold">${currentApp.totalLiabilities.toLocaleString()}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {selectedApp.assetDescription && (
                          <div className="mb-10">
                            <h4 className="text-sm font-bold text-zinc-900 mb-2">Asset Description</h4>
                            <p className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                              {selectedApp.assetDescription}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Documents Section */}
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Supporting Documents
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <DocumentList documents={selectedApp.documents} />
                    </div>
                    {(!selectedApp.documents || selectedApp.documents.length === 0) && (
                      <div className="text-sm text-zinc-500 italic bg-zinc-50 p-4 rounded-2xl border border-dashed border-zinc-200 text-center">
                        No documents uploaded by borrower.
                      </div>
                    )}
                  </div>

                  {/* Internal Notes Section */}
                  <div className="mb-10">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Internal Notes (Lenders & Admins Only)
                    </h4>
                    <textarea 
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Add internal notes that are not visible to the borrower..."
                      className="w-full p-6 bg-zinc-50 border border-zinc-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm min-h-[120px]"
                    />
                  </div>

                  {/* Lender Notes Section */}
                  <div className="mb-10">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Lender Feedback (Visible to Borrower)
                    </h4>
                    <textarea 
                      value={lenderNotes}
                      onChange={(e) => setLenderNotes(e.target.value)}
                      placeholder="Add feedback that will be sent to the borrower..."
                      className="w-full p-6 bg-zinc-50 border border-zinc-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm min-h-[120px]"
                    />
                    <div className="flex justify-end mt-3">
                      <button 
                        onClick={handleSaveNotes}
                        className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all"
                      >
                        Save All Notes
                      </button>
                    </div>
                  </div>

                  {/* Propose Modification Section */}
                  <div className="mb-10 border-t border-zinc-100 pt-10">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Propose Modification
                      </h4>
                      <button 
                        onClick={() => setShowProposeForm(!showProposeForm)}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-all"
                      >
                        {showProposeForm ? 'Cancel' : 'Open Proposal Form'}
                      </button>
                    </div>

                    {showProposeForm && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-6 bg-zinc-50 p-8 rounded-[2rem] border border-zinc-200"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Proposed Amount ($)</label>
                            <input 
                              type="number"
                              value={proposedAmount}
                              onChange={(e) => setProposedAmount(e.target.value)}
                              className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Proposed Term (Months)</label>
                            <input 
                              type="number"
                              value={proposedTerm}
                              onChange={(e) => setProposedTerm(e.target.value)}
                              className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm font-bold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Proposal Notes / Justification</label>
                          <textarea 
                            value={proposedNotes}
                            onChange={(e) => setProposedNotes(e.target.value)}
                            placeholder="Explain why you are proposing these changes..."
                            className="w-full p-6 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm min-h-[100px]"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={handleProposeModifications}
                            className="px-8 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                          >
                            Send Proposal to Borrower
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleStatusUpdate(selectedApp.id, ApplicationStatus.REJECTED)}
                      className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedApp.id, ApplicationStatus.REVIEWING)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                    >
                      Mark Reviewing
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedApp.id, ApplicationStatus.APPROVED)}
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </>
        )}
      </main>
    </div>
  );
};

const AdminDashboard = ({ onSwitchView }: { onSwitchView?: () => void }) => {
  const { user, profile, signOut } = useAuth();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.BORROWER);
  const [view, setView] = useState<'overview' | 'applications' | 'users' | 'settings'>('overview');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'app' | 'user', id: string } | null>(null);
  const [selectedAdminApp, setSelectedAdminApp] = useState<LoanApplication | null>(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState<UserProfile | null>(null);
  const [userModalTab, setUserModalTab] = useState<'overview' | 'permissions'>('overview');
  const [activeAdminApplicantIndex, setActiveAdminApplicantIndex] = useState(0);

  const handleUpdateUserPermissions = async (uid: string, permissions: Partial<UserPermissions>) => {
    try {
      const userToUpdate = users.find(u => u.uid === uid);
      if (!userToUpdate) return;
      
      const updatedPermissions = {
        ...(userToUpdate.permissions || {
          canApproveLoans: false,
          canViewAllApplications: false,
          canManageUsers: false,
          canEditApplications: false,
        }),
        ...permissions
      };

      await updateDoc(doc(db, 'users', uid), { permissions: updatedPermissions });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/permissions`);
    }
  };
  const [adminLenderNotes, setAdminLenderNotes] = useState('');
  const [adminInternalNotes, setAdminInternalNotes] = useState('');

  useEffect(() => {
    const ensureAdminProfile = async () => {
      if (user?.email?.toLowerCase() === 'rckonda@gmail.com' && profile?.role !== UserRole.ADMIN) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (!profileDoc.exists() || profileDoc.data()?.role !== UserRole.ADMIN) {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Admin',
              role: UserRole.ADMIN,
              createdAt: serverTimestamp(),
              permissions: {
                canApproveLoans: true,
                canViewAllApplications: true,
                canManageUsers: true,
                canEditApplications: true,
              }
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error ensuring admin profile:', error);
        }
      }
    };
    ensureAdminProfile();
  }, [user, profile]);

  useEffect(() => {
    if (selectedAdminApp) {
      setAdminLenderNotes(selectedAdminApp.lenderNotes || '');
      setAdminInternalNotes(selectedAdminApp.internalNotes || '');
      setActiveAdminApplicantIndex(0);
    }
  }, [selectedAdminApp]);
  
  // Filtering state
  const [appFilter, setAppFilter] = useState<ApplicationStatus | 'all'>('all');
  const [appSearch, setAppSearch] = useState('');
  const [appMinAmount, setAppMinAmount] = useState('');
  const [appMaxAmount, setAppMaxAmount] = useState('');
  const [appSortBy, setAppSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [appSortOrder, setAppSortOrder] = useState<'asc' | 'desc'>('desc');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'all'>('all');

  useEffect(() => {
    // Listen to all applications
    const qApps = collection(db, 'applications');
    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanApplication));
      setApplications(apps.sort((a, b) => {
        const t1 = a.createdAt?.toMillis?.() || Date.now();
        const t2 = b.createdAt?.toMillis?.() || Date.now();
        return t2 - t1;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    // Listen to all users
    const qUsers = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const u = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(u.sort((a, b) => {
        const t1 = a.createdAt?.toMillis?.() || Date.now();
        const t2 = b.createdAt?.toMillis?.() || Date.now();
        return t2 - t1;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Listen to all invites
    const qInvites = collection(db, 'userInvites');
    const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
      const i = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserInvite));
      setInvites(i);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'userInvites');
    });

    return () => {
      unsubscribeApps();
      unsubscribeUsers();
      unsubscribeInvites();
    };
  }, []);

  const stats = {
    total: applications.length,
    approved: applications.filter(a => a.status === ApplicationStatus.APPROVED).length,
    rejected: applications.filter(a => a.status === ApplicationStatus.REJECTED).length,
    pending: applications.filter(a => a.status === ApplicationStatus.PENDING || a.status === ApplicationStatus.REVIEWING).length,
    totalUsers: users.length,
    totalVolume: applications
      .filter(a => a.status === ApplicationStatus.APPROVED)
      .reduce((sum, a) => sum + a.amount, 0),
  };

  const handleUpdateUserRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleToggleUserStatus = async (uid: string, currentStatus?: 'active' | 'disabled') => {
    try {
      const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/status`);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !user) return;
    try {
      const inviteRef = await addDoc(collection(db, 'userInvites'), {
        email: inviteEmail.toLowerCase().trim(),
        role: inviteRole,
        invitedBy: user.uid,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      // Send invitation email via server-side API
      const appUrl = window.location.origin;
      const inviteLink = `${appUrl}?inviteId=${inviteRef.id}`;
      
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: inviteEmail.toLowerCase().trim(),
            subject: 'Invitation to Join LendFlow Pro',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e5e5e5; border-radius: 32px; background-color: #ffffff;">
                <div style="margin-bottom: 32px;">
                  <div style="width: 48px; height: 48px; background-color: #18181b; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">L</div>
                </div>
                <h1 style="font-size: 28px; font-weight: 800; color: #18181b; margin-bottom: 16px; letter-spacing: -0.02em;">You've been invited!</h1>
                <p style="font-size: 16px; color: #52525b; line-height: 1.6; margin-bottom: 32px;">
                  Hello, you have been invited to join <strong>LendFlow Pro</strong> as a <strong>${inviteRole.toUpperCase()}</strong>. 
                  Click the button below to activate your account and get started.
                </p>
                <a href="${inviteLink}" style="display: inline-block; padding: 18px 36px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px; transition: all 0.2s ease;">
                  Activate Account
                </a>
                <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #f4f4f5;">
                  <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                    This invitation was sent by ${user.displayName || user.email}. If you didn't expect this, you can safely ignore this email.
                  </p>
                </div>
              </div>
            `
          })
        });
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        // We don't block the UI if email fails, as the invite is already in Firestore
      }

      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'userInvites');
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'userInvites', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `userInvites/${id}`);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'applications', id));
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `applications/${id}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleUpdateApplicationStatus = async (id: string, status: ApplicationStatus, notes?: string, internalNotes?: string) => {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };
      if (notes !== undefined) {
        updateData.lenderNotes = notes;
      }
      if (internalNotes !== undefined) {
        updateData.internalNotes = internalNotes;
      }
      await updateDoc(doc(db, 'applications', id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${id}`);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedAdminApp) return;
    try {
      await updateDoc(doc(db, 'applications', selectedAdminApp.id), {
        lenderNotes: adminLenderNotes,
        internalNotes: adminInternalNotes,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${selectedAdminApp.id}`);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Application ID',
      'Borrower Name',
      'Borrower Email',
      'Amount',
      'Purpose',
      'Loan Term (Months)',
      'Status',
      'Created At',
      'Updated At',
      'Credit Score',
      'Annual Income',
      'NSR',
      'DSR',
      'Lender Email',
      'Lender ID'
    ];

    const csvRows = sortedApps.map(app => [
      app.id,
      `"${app.borrowerName}"`,
      app.borrowerEmail,
      app.amount,
      `"${app.purpose}"`,
      app.loanTerm || 'N/A',
      app.status,
      app.createdAt?.toDate ? format(app.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      app.updatedAt?.toDate ? format(app.updatedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      app.creditScore || 'N/A',
      app.annualIncome || 'N/A',
      app.nsr || 'N/A',
      app.dsr || 'N/A',
      app.lenderEmail || 'N/A',
      app.lenderId || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lendflow_applications_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApps = applications.filter(app => {
    const matchesStatus = appFilter === 'all' || app.status === appFilter;
    const matchesSearch = (app.borrowerName || '').toLowerCase().includes(appSearch.toLowerCase()) || 
                         (app.purpose || '').toLowerCase().includes(appSearch.toLowerCase());
    const matchesMin = appMinAmount === '' || app.amount >= Number(appMinAmount);
    const matchesMax = appMaxAmount === '' || app.amount <= Number(appMaxAmount);
    return matchesStatus && matchesSearch && matchesMin && matchesMax;
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    let comparison = 0;
    if (appSortBy === 'date') {
      const t1 = a.createdAt?.toMillis?.() || 0;
      const t2 = b.createdAt?.toMillis?.() || 0;
      comparison = t2 - t1;
    } else if (appSortBy === 'amount') {
      comparison = b.amount - a.amount;
    } else if (appSortBy === 'name') {
      comparison = (a.borrowerName || '').localeCompare(b.borrowerName || '');
    }
    return appSortOrder === 'desc' ? comparison : -comparison;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) || 
                         u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredInvites = invites.filter(i => {
    const matchesSearch = i.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || i.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className="w-72 bg-white border-r border-zinc-200 p-8 flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">LendFlow Admin</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setView('overview')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'overview' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>
          <button 
            onClick={() => setView('applications')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'applications' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <DollarSign className="w-5 h-5" />
            Applications
          </button>
          <button 
            onClick={() => setView('users')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'users' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button 
            onClick={() => setView('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              view === 'settings' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          {onSwitchView && (
            <button 
              onClick={onSwitchView}
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
            >
              <ArrowRightLeft className="w-5 h-5" />
              User Dashboard
            </button>
          )}
        </nav>

        <div className="pt-8 border-t border-zinc-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">Admin</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        {view === 'settings' ? (
          <SettingsView />
        ) : (
          <>
            <header className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">
                {view === 'overview' ? 'System Overview' : view === 'applications' ? 'Manage Applications' : 'Manage Users'}
              </h2>
              <p className="text-zinc-500">Global oversight of the LendFlow platform.</p>
            </div>
            {view === 'users' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg"
              >
                <PlusCircle className="w-4 h-4" />
                Invite User
              </button>
            )}
            {view === 'applications' && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-50 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm">
                  {(['all', 'pending', 'reviewing', 'proposed', 'approved', 'rejected'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setAppFilter(s as ApplicationStatus | 'all')}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        appFilter === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(view === 'applications' || view === 'users') && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative col-span-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="text"
                  placeholder={view === 'applications' ? "Search borrower or purpose..." : "Search name or email..."}
                  value={view === 'applications' ? appSearch : userSearch}
                  onChange={(e) => view === 'applications' ? setAppSearch(e.target.value) : setUserSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                />
              </div>
              {view === 'users' && (
                <div className="flex gap-4 col-span-3">
                  <div className="relative flex-1">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select 
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as UserRole | 'all')}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm appearance-none"
                    >
                      <option value="all">All Roles</option>
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}s</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {view === 'applications' && (
                <>
                  <div className="flex gap-4 col-span-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="number"
                        placeholder="Min amount"
                        value={appMinAmount}
                        onChange={(e) => setAppMinAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                      />
                    </div>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="number"
                        placeholder="Max amount"
                        value={appMaxAmount}
                        onChange={(e) => setAppMaxAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    <select 
                      value={appSortBy}
                      onChange={(e) => setAppSortBy(e.target.value as any)}
                      className="bg-transparent text-sm font-bold text-zinc-900 focus:outline-none cursor-pointer"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="amount">Sort by Amount</option>
                      <option value="name">Sort by Name</option>
                    </select>
                    <button 
                      onClick={() => setAppSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="p-1 hover:bg-zinc-100 rounded-md transition-all text-zinc-600"
                      title={appSortOrder === 'desc' ? 'Descending' : 'Ascending'}
                    >
                      {appSortOrder === 'desc' ? <ArrowDownWideNarrow className="w-4 h-4" /> : <ArrowUpWideNarrow className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        {view === 'overview' && (
          <div className="space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Applications', value: stats.total, icon: LayoutDashboard, color: 'zinc' },
                { label: 'Approved Volume', value: `$${stats.totalVolume.toLocaleString()}`, icon: DollarSign, color: 'emerald' },
                { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'red' },
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                    stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    stat.color === 'red' ? "bg-red-50 text-red-600" :
                    stat.color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-zinc-50 text-zinc-600"
                  )}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-bold text-zinc-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm p-8">
                <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Applications
                </h3>
                <div className="space-y-6">
                  {applications.slice(0, 5).map(app => (
                    <div key={app.id} className="flex items-center justify-between py-4 border-b border-zinc-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 font-bold">
                          {app.borrowerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900">{app.borrowerName}</div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                            {getPurposeIcon(app.purpose)}
                            {app.purpose}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-zinc-900">${app.amount.toLocaleString()}</div>
                        <div className="text-xs text-zinc-400">
                          {app.createdAt?.toDate ? format(app.createdAt.toDate(), 'MMM d, HH:mm') : '...'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm p-8">
                <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Newest Users
                </h3>
                <div className="space-y-6">
                  {users.slice(0, 5).map(u => (
                    <div key={u.uid} className="flex items-center justify-between py-4 border-b border-zinc-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 font-bold">
                          {u.displayName?.charAt(0) || u.email.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900">{u.displayName || 'Anonymous'}</div>
                          <div className="text-xs text-zinc-500">{u.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 bg-zinc-50 rounded-md inline-block">
                          {u.role}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'dd MMM yyyy') : '...'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'applications' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Borrower</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Amount</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Docs</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {sortedApps.map((app) => (
                  <tr key={app.id} onClick={() => setSelectedAdminApp(app)} className="hover:bg-zinc-50/50 transition-colors cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="font-bold text-zinc-900">{app.borrowerName}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                        {getPurposeIcon(app.purpose)}
                        {app.purpose}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-zinc-900">
                      ${app.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full inline-block",
                        app.status === ApplicationStatus.APPROVED ? "bg-emerald-100 text-emerald-700" :
                        app.status === ApplicationStatus.REJECTED ? "bg-red-100 text-red-700" :
                        app.status === ApplicationStatus.PROPOSED ? "bg-amber-100 text-amber-700" :
                        "bg-zinc-100 text-zinc-600"
                      )}>
                        {app.status}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1 text-zinc-500 text-sm">
                        <FileText className="w-4 h-4" />
                        {app.documents?.length || 0}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-500">
                      {app.createdAt?.toDate ? format(app.createdAt.toDate(), 'dd MMM yyyy') : '...'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAdminApp(app);
                          }}
                          className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateApplicationStatus(app.id, ApplicationStatus.APPROVED);
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateApplicationStatus(app.id, ApplicationStatus.REJECTED);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({ type: 'app', id: app.id });
                          }}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'users' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">User</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Role</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Joined</th>
                  <th className="px-8 py-6 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredInvites.map((invite) => (
                  <tr key={invite.id} className="bg-zinc-50/30">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-bold text-zinc-400 italic">Pending Invite</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-zinc-600">
                      {invite.email}
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 bg-zinc-100 rounded-md inline-block">
                        {invite.role}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-bold text-amber-600 uppercase tracking-wider px-2 py-1 bg-amber-50 rounded-md inline-block">
                        Pending
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-400">
                      {invite.createdAt?.toDate ? format(invite.createdAt.toDate(), 'dd MMM yyyy') : '...'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel Invite"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.map((u) => (
                  <tr 
                    key={u.uid} 
                    className="hover:bg-zinc-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAdminUser(u)}
                  >
                    <td className="px-8 py-6">
                      <div className="font-bold text-zinc-900">{u.displayName || 'Anonymous'}</div>
                    </td>
                    <td className="px-8 py-6 text-zinc-600">
                      {u.email}
                    </td>
                    <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                      <select 
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.uid, e.target.value as UserRole)}
                        className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-2 py-1 bg-zinc-50 rounded-md border-none focus:ring-2 focus:ring-zinc-900"
                      >
                        {Object.values(UserRole).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md inline-block",
                        u.status === 'disabled' ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {u.status || 'active'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-500">
                      {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'dd MMM yyyy') : '...'}
                    </td>
                    <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleToggleUserStatus(u.uid, u.status)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            u.status === 'disabled' ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"
                          )}
                          title={u.status === 'disabled' ? "Enable User" : "Disable User"}
                        >
                          {u.status === 'disabled' ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setConfirmDelete({ type: 'user', id: u.uid })}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Admin User Details Modal */}
        <AnimatePresence>
          {selectedAdminUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAdminUser(null)}
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-10 overflow-y-auto">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl font-bold text-zinc-900">
                        {selectedAdminUser.displayName?.[0] || selectedAdminUser.email[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-zinc-900">{selectedAdminUser.displayName || 'Anonymous User'}</h3>
                        <p className="text-zinc-500">{selectedAdminUser.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                            selectedAdminUser.status === 'disabled' ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {selectedAdminUser.status || 'active'}
                          </div>
                          <button 
                            onClick={() => handleToggleUserStatus(selectedAdminUser.uid, selectedAdminUser.status)}
                            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 underline underline-offset-2"
                          >
                            {selectedAdminUser.status === 'disabled' ? 'Enable Account' : 'Disable Account'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold text-zinc-600 uppercase tracking-widest">
                        {selectedAdminUser.role}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-2 font-medium">
                        Joined {selectedAdminUser.createdAt?.toDate ? format(selectedAdminUser.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-8 border-b border-zinc-100 mb-8">
                    <button 
                      onClick={() => setUserModalTab('overview')}
                      className={cn(
                        "pb-4 text-sm font-bold uppercase tracking-wider transition-all relative",
                        userModalTab === 'overview' ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                      )}
                    >
                      Overview
                      {userModalTab === 'overview' && (
                        <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
                      )}
                    </button>
                    <button 
                      onClick={() => setUserModalTab('permissions')}
                      className={cn(
                        "pb-4 text-sm font-bold uppercase tracking-wider transition-all relative",
                        userModalTab === 'permissions' ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                      )}
                    >
                      Permissions
                      {userModalTab === 'permissions' && (
                        <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
                      )}
                    </button>
                  </div>

                  {userModalTab === 'overview' ? (
                    <>
                      <div className="grid grid-cols-2 gap-6 mb-10">
                        <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Applications</div>
                          <div className="text-2xl font-bold text-zinc-900">
                            {applications.filter(a => a.borrowerId === selectedAdminUser.uid || a.brokerId === selectedAdminUser.uid).length}
                          </div>
                        </div>
                        <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">User ID</div>
                          <div className="text-xs font-mono text-zinc-500 break-all">{selectedAdminUser.uid}</div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Recent Activity
                        </h4>
                        <div className="space-y-4">
                          {applications
                            .filter(a => a.borrowerId === selectedAdminUser.uid || a.brokerId === selectedAdminUser.uid)
                            .slice(0, 5)
                            .map(app => (
                              <div key={app.id} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-xl hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    app.status === ApplicationStatus.APPROVED ? "bg-emerald-500" :
                                    app.status === ApplicationStatus.REJECTED ? "bg-red-500" : "bg-amber-500"
                                  )} />
                                  <div>
                                    <div className="text-sm font-bold text-zinc-900">${app.amount.toLocaleString()} - {app.purpose}</div>
                                    <div className="text-[10px] text-zinc-400 font-medium">
                                      {app.createdAt?.toDate ? format(app.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                  {app.status}
                                </div>
                              </div>
                            ))}
                          {applications.filter(a => a.borrowerId === selectedAdminUser.uid || a.brokerId === selectedAdminUser.uid).length === 0 && (
                            <div className="text-center py-8 text-zinc-400 text-sm italic">
                              No applications found for this user.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 mb-8">
                        <div className="flex gap-3">
                          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <div className="text-sm font-bold text-amber-900 mb-1">Advanced Permissions</div>
                            <div className="text-xs text-amber-700 leading-relaxed">
                              These permissions override default role-based access. Use with caution as they grant sensitive capabilities.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { key: 'canApproveLoans', label: 'Approve Loans', desc: 'Allow user to approve or reject loan applications.' },
                          { key: 'canViewAllApplications', label: 'View All Applications', desc: 'Grant access to view all applications in the system.' },
                          { key: 'canManageUsers', label: 'Manage Users', desc: 'Allow user to change roles and permissions of others.' },
                          { key: 'canEditApplications', label: 'Edit Applications', desc: 'Allow user to modify application details after submission.' },
                        ].map((perm) => (
                          <div key={perm.key} className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div>
                              <div className="text-sm font-bold text-zinc-900 mb-1">{perm.label}</div>
                              <div className="text-xs text-zinc-500">{perm.desc}</div>
                            </div>
                            <button 
                              onClick={() => handleUpdateUserPermissions(selectedAdminUser.uid, { [perm.key]: !selectedAdminUser.permissions?.[perm.key as keyof UserPermissions] })}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                selectedAdminUser.permissions?.[perm.key as keyof UserPermissions] ? "bg-zinc-900" : "bg-zinc-200"
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                selectedAdminUser.permissions?.[perm.key as keyof UserPermissions] ? "left-7" : "left-1"
                              )} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-10 pt-8 border-t border-zinc-100 flex justify-end gap-4">
                    <button 
                      onClick={() => setSelectedAdminUser(null)}
                      className="px-6 py-3 text-zinc-500 font-bold hover:text-zinc-900 transition-all"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => {
                        setConfirmDelete({ type: 'user', id: selectedAdminUser.uid });
                        setSelectedAdminUser(null);
                      }}
                      className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Admin Application Details Modal */}
        <AnimatePresence>
          {selectedAdminApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAdminApp(null)}
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-10 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-bold text-zinc-900 mb-1">Application Details</h3>
                      <p className="text-zinc-500">
                        Borrower: {selectedAdminApp.borrowerName}
                        {selectedAdminApp.brokerEmail && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600 font-medium">
                            <Briefcase className="w-3 h-3" />
                            Broker: {selectedAdminApp.brokerEmail}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-zinc-900">${selectedAdminApp.amount.toLocaleString()}</div>
                      <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{selectedAdminApp.purpose}</div>
                    </div>
                  </div>

                  {/* Applicant Selection Tabs */}
                  {selectedAdminApp.applicants && selectedAdminApp.applicants.length > 1 && (
                    <div className="flex gap-2 mb-8 p-1.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                      {selectedAdminApp.applicants.map((app, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveAdminApplicantIndex(idx)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                            activeAdminApplicantIndex === idx 
                              ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" 
                              : "text-zinc-400 hover:text-zinc-600 hover:bg-white/50"
                          )}
                        >
                          <User className={cn("w-3.5 h-3.5", activeAdminApplicantIndex === idx ? "text-zinc-900" : "text-zinc-300")} />
                          {idx === 0 ? 'Primary' : `Co-Applicant ${idx}`}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Credit Score</div>
                      <div className="text-xl font-bold text-zinc-900">{selectedAdminApp.creditScore}</div>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Gross Income</div>
                      <div className="text-xl font-bold text-zinc-900">${selectedAdminApp.annualIncome?.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Combined NSR</div>
                      <div className={cn(
                        "text-xl font-bold",
                        (selectedAdminApp.nsr || 0) > 1.5 ? "text-emerald-600" :
                        (selectedAdminApp.nsr || 0) > 1.1 ? "text-amber-600" : "text-red-600"
                      )}>
                        {selectedAdminApp.nsr?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Combined DSR</div>
                      <div className={cn(
                        "text-xl font-bold",
                        (selectedAdminApp.dsr || 0) < 0.35 ? "text-emerald-600" :
                        (selectedAdminApp.dsr || 0) < 0.45 ? "text-amber-600" : "text-red-600"
                      )}>
                        {selectedAdminApp.dsr ? `${(selectedAdminApp.dsr * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const currentApp = selectedAdminApp.applicants && selectedAdminApp.applicants[activeAdminApplicantIndex] 
                      ? selectedAdminApp.applicants[activeAdminApplicantIndex] 
                      : selectedAdminApp;

                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Contact Details</h4>
                            </div>
                            <div className="grid gap-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <UserCircle className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</div>
                                    <div className="text-sm font-bold text-zinc-900">{(currentApp as Applicant).name || (currentApp as LoanApplication).borrowerName}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Mail className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</div>
                                    <div className="text-sm font-bold text-zinc-900">{(currentApp as Applicant).email || (currentApp as LoanApplication).borrowerEmail}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <MapPin className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Residential Address</div>
                                    <div className="text-sm font-bold text-zinc-900">{currentApp.address || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Professional Profile</h4>
                            </div>
                            <div className="grid gap-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Building2 className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Employer</div>
                                    <div className="text-sm font-bold text-zinc-900">{currentApp.employerName || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <UserCircle className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Job Title & Tenure</div>
                                    <div className="text-sm font-bold text-zinc-900">
                                      {currentApp.jobTitle || 'N/A'} 
                                      {currentApp.yearsAtJob !== undefined && ` • ${currentApp.yearsAtJob} Years`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Wallet className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Income Source</div>
                                    <div className="text-sm font-bold text-zinc-900">
                                      {currentApp.incomeSource || 'N/A'}
                                      {(currentApp as Applicant).isSelfEmployed && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-md font-bold uppercase tracking-wider">Self-Employed</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Personal Details</h4>
                            </div>
                            <div className="grid gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Gender</div>
                                  <div className="text-sm font-bold text-zinc-900 capitalize">{currentApp.gender || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Marital Status</div>
                                  <div className="text-sm font-bold text-zinc-900 capitalize">{currentApp.maritalStatus || 'N/A'}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Date of Birth</div>
                                  <div className="text-sm font-bold text-zinc-900">{currentApp.dob || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Dependents</div>
                                  <div className="text-sm font-bold text-zinc-900">{currentApp.dependents || 0}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-zinc-900" />
                              </div>
                              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Serviceability Analysis</h4>
                            </div>
                            <div className="grid gap-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Monthly Living Expenses</div>
                                  <div className="text-sm font-bold text-zinc-900">${currentApp.monthlyExpenses?.toLocaleString() || 0}</div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Other Monthly Debts</div>
                                  <div className="text-sm font-bold text-zinc-900">${currentApp.otherMonthlyDebts?.toLocaleString() || 0}</div>
                                </div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Loan Term</div>
                                  <div className="text-sm font-bold text-zinc-900">{selectedAdminApp.loanTerm} Months</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Assets & Liabilities Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                              <Wallet className="w-4 h-4" />
                              Assets Breakdown
                            </h4>
                            <div className="space-y-2">
                              {currentApp.assets && currentApp.assets.length > 0 ? (
                                currentApp.assets.map((asset, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                    <span className="text-xs font-medium text-emerald-800">{asset.description}</span>
                                    <span className="text-xs font-bold text-emerald-600">${asset.value.toLocaleString()}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">No assets listed</div>
                              )}
                              {currentApp.totalAssets !== undefined && (
                                <div className="flex justify-between items-center p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
                                  <span className="text-xs font-bold uppercase tracking-wider">Total Assets</span>
                                  <span className="text-sm font-bold">${currentApp.totalAssets.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Liabilities Breakdown
                            </h4>
                            <div className="space-y-2">
                              {currentApp.liabilities && currentApp.liabilities.length > 0 ? (
                                currentApp.liabilities.map((liability, idx) => (
                                  <div key={idx} className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-medium text-red-800">{liability.description || liability.type}</span>
                                      <span className="text-xs font-bold text-red-600">${liability.balance.toLocaleString()}</span>
                                    </div>
                                    <div className="text-[10px] text-red-400 font-medium">Repayment: ${liability.monthlyRepayment}/mo</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">No liabilities listed</div>
                              )}
                              {currentApp.totalLiabilities !== undefined && (
                                <div className="flex justify-between items-center p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-100">
                                  <span className="text-xs font-bold uppercase tracking-wider">Total Liabilities</span>
                                  <span className="text-sm font-bold">${currentApp.totalLiabilities.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {selectedAdminApp.assetDescription && (
                          <div className="mb-10">
                            <h4 className="text-sm font-bold text-zinc-900 mb-2">Asset Description</h4>
                            <p className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                              {selectedAdminApp.assetDescription}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Supporting Documents
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <DocumentList documents={selectedAdminApp.documents} />
                    </div>
                    {(!selectedAdminApp.documents || selectedAdminApp.documents.length === 0) && (
                      <div className="text-sm text-zinc-500 italic bg-zinc-50 p-4 rounded-2xl border border-dashed border-zinc-200 text-center">
                        No documents uploaded.
                      </div>
                    )}
                  </div>

                  {/* Internal Notes Section */}
                  <div className="mb-10">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Internal Notes (Lenders & Admins Only)
                    </h4>
                    <textarea 
                      value={adminInternalNotes}
                      onChange={(e) => setAdminInternalNotes(e.target.value)}
                      placeholder="Add internal notes that are not visible to the borrower..."
                      className="w-full p-6 bg-zinc-50 border border-zinc-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm min-h-[120px]"
                    />
                  </div>

                  {/* Lender Notes Section */}
                  <div className="mb-10">
                    <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Lender Feedback (Visible to Borrower)
                    </h4>
                    <textarea 
                      value={adminLenderNotes}
                      onChange={(e) => setAdminLenderNotes(e.target.value)}
                      placeholder="Add feedback that will be sent to the borrower..."
                      className="w-full p-6 bg-zinc-50 border border-zinc-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm min-h-[120px]"
                    />
                    <div className="flex justify-end mt-3">
                      <button 
                        onClick={handleSaveAdminNotes}
                        className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all"
                      >
                        Save All Notes
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        handleUpdateApplicationStatus(selectedAdminApp.id, ApplicationStatus.REJECTED, adminLenderNotes, adminInternalNotes);
                        setSelectedAdminApp(null);
                      }}
                      className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => {
                        handleUpdateApplicationStatus(selectedAdminApp.id, ApplicationStatus.APPROVED, adminLenderNotes, adminInternalNotes);
                        setSelectedAdminApp(null);
                      }}
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Invite User Modal */}
        <AnimatePresence>
          {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInviteModal(false)}
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900">Invite New User</h3>
                    <p className="text-sm text-zinc-500">Send an invitation to join LendFlow.</p>
                  </div>
                  <button 
                    onClick={() => setShowInviteModal(false)}
                    className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assign Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.values(UserRole)).map((role) => (
                        <button
                          key={role}
                          onClick={() => setInviteRole(role)}
                          className={cn(
                            "px-4 py-3 rounded-xl text-sm font-bold border transition-all",
                            inviteRole === role 
                              ? "bg-zinc-900 border-zinc-900 text-white" 
                              : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleInviteUser}
                    disabled={!inviteEmail}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Invitation
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(null)}
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-10 text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Are you sure?</h3>
                <p className="text-zinc-500 mb-8">
                  This action cannot be undone. You are about to delete this {confirmDelete.type === 'app' ? 'application' : 'user profile'}.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 py-3 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => confirmDelete.type === 'app' ? handleDeleteApplication(confirmDelete.id) : handleDeleteUser(confirmDelete.id)}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </>
        )}
      </main>
    </div>
  );
};

const AppContent = () => {
  const { user, profile, loading, isAuthReady } = useAuth();
  const { isLoading: brandingLoading } = useBranding();
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin');

  if (!isAuthReady || loading || brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full"
        />
      </div>
    );
  }

  if (user && profile?.status === 'disabled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border border-zinc-200"
        >
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <UserX className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">Account Disabled</h1>
          <p className="text-zinc-500 mb-10 leading-relaxed">
            Your account has been disabled by an administrator. Please contact support if you believe this is an error.
          </p>
          <button 
            onClick={() => auth.signOut()}
            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Super admin bypasses role selection to ensure profile creation in AdminDashboard
  const isSuperAdmin = user.email?.toLowerCase() === 'rckonda@gmail.com';
  const isAdmin = profile?.role === UserRole.ADMIN || isSuperAdmin;

  if (!profile && !isSuperAdmin) {
    return <RoleSelection />;
  }

  if (isAdmin && adminViewMode === 'admin') {
    return <AdminDashboard onSwitchView={() => setAdminViewMode('user')} />;
  }

  if (profile?.role === UserRole.LENDER) {
    return <LenderDashboard onSwitchView={isAdmin ? () => setAdminViewMode('admin') : undefined} />;
  }

  return <BorrowerDashboard onSwitchView={isAdmin ? () => setAdminViewMode('admin') : undefined} />;
};

import { BrandingProvider, useBranding } from './components/BrandingContext';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrandingProvider>
          <AppContent />
        </BrandingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
