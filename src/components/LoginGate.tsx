import React, { useState } from 'react';
import { Mail, Phone, Globe, Shield, HelpCircle, Loader2 } from 'lucide-react';
import { User } from '../types';

const PIXEL_LEAF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%" style="image-rendering:pixelated; shape-rendering:crispEdges;"><rect x="2" y="13" width="2" height="2" fill="%2378350F" /><rect x="3" y="12" width="2" height="2" fill="%2378350F" /><rect x="4" y="11" width="1" height="1" fill="%23065F46" /><rect x="5" y="10" width="1" height="1" fill="%23065F46" /><rect x="6" y="9" width="1" height="1" fill="%23065F46" /><rect x="7" y="8" width="1" height="1" fill="%23065F46" /><rect x="8" y="7" width="1" height="1" fill="%23065F46" /><rect x="9" y="6" width="1" height="1" fill="%23065F46" /><rect x="10" y="5" width="1" height="1" fill="%23065F46" /><rect x="11" y="4" width="1" height="1" fill="%23065F46" /><rect x="12" y="3" width="1" height="1" fill="%23065F46" /><rect x="13" y="2" width="1" height="1" fill="%23065F46" /><rect x="14" y="2" width="1" height="4" fill="%23047857" /><rect x="13" y="6" width="1" height="3" fill="%23047857" /><rect x="12" y="9" width="1" height="2" fill="%23047857" /><rect x="10" y="11" width="2" height="1" fill="%23047857" /><rect x="7" y="12" width="3" height="1" fill="%23047857" /><rect x="4" y="13" width="3" height="1" fill="%23047857" /><rect x="11" y="3" width="2" height="1" fill="%2310B981" /><rect x="10" y="4" width="2" height="1" fill="%2310B981" /><rect x="12" y="4" width="1" height="1" fill="%23059669" /><rect x="9" y="5" width="2" height="1" fill="%2310B981" /><rect x="11" y="5" width="2" height="1" fill="%23059669" /><rect x="7" y="6" width="2" height="1" fill="%2334D399" /><rect x="9" y="6" width="2" height="1" fill="%23FF7A59" /><rect x="11" y="6" width="2" height="1" fill="%23D97706" /><rect x="6" y="7" width="2" height="1" fill="%2334D399" /><rect x="8" y="7" width="2" height="1" fill="%23FF7A59" /><rect x="10" y="7" width="3" height="1" fill="%23D97706" /><rect x="5" y="8" width="2" height="1" fill="%23059669" /><rect x="7" y="8" width="2" height="1" fill="%23FF7A59" /><rect x="9" y="8" width="3" height="1" fill="%23D97706" /><rect x="4" y="9" width="2" height="1" fill="%23059669" /><rect x="6" y="9" width="2" height="1" fill="%23FF7A59" /><rect x="8" y="9" width="4" height="1" fill="%23B45309" /><rect x="4" y="10" width="2" height="1" fill="%23047857" /><rect x="6" y="10" width="4" height="1" fill="%23B45309" /><rect x="4" y="11" width="6" height="1" fill="%2378350F" /></svg>`;

interface LoginGateProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginGate({ onLoginSuccess }: LoginGateProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'phone' | 'google'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [sentIdentifier, setSentIdentifier] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('Harrison Vance');
  const [googleEmailInput, setGoogleEmailInput] = useState('harrison.vance@agri-global.com');

  // Request Access Code (Email)
  const handleRequestEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailInput.trim(), type: 'email' })
      });
      const data = await response.json();
      if (data.success) {
        setIsOtpSent(true);
        setSentIdentifier(emailInput.trim());
        setDevOtp(data.devOtp || null);
      } else {
        setErrorMsg(data.error || 'Failed to request code.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Request SMS OTP (Phone)
  const handleRequestPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phoneInput.trim(), type: 'phone' })
      });
      const data = await response.json();
      if (data.success) {
        setIsOtpSent(true);
        setSentIdentifier(phoneInput.trim());
        setDevOtp(data.devOtp || null);
      } else {
        setErrorMsg(data.error || 'Failed to request SMS OTP.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to send SMS.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      setErrorMsg('Please enter the 5-digit verification code.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: sentIdentifier,
          otp: otpInput.trim(),
          type: activeTab
        })
      });
      const data = await response.json();
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'Verification failed. Incorrect code.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to verify code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Continue with Google Account Mock Authentication
  const handleContinueWithGoogle = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      // Simulate OAuth response parameters using user-defined inputs
      const response = await fetch('/api/auth/google-sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: googleNameInput.trim(),
          email: googleEmailInput.trim(),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        })
      });
      const data = await response.json();
      if (data.success) {
        // Simple delay to make it feel premium & authentic
        setTimeout(() => {
          onLoginSuccess(data.user);
          setIsLoading(false);
        }, 1200);
      } else {
        setErrorMsg('Mock Google Account validation failed.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMsg('Network error connecting with Google.');
      setIsLoading(false);
    }
  };

  return (
    <div id="login_gate_container" className="min-h-screen w-full flex flex-col justify-center items-center bg-[#FAFAFA] p-4 font-sans selection:bg-orange-100 selection:text-orange-900">
      
      {/* Background Decorative Accent Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-50/60 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Login Card */}
      <div id="login_card" className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-100 border border-orange-100 p-8 relative overflow-hidden transition-all">
        
        {/* Subtle Sunset Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-coral-400 via-orange-400 to-amber-500 bg-gradient-to-r from-[#FF7A59] via-[#FFB74D] to-[#E57373]" />

        {/* Branding & Logo Header */}
        <div className="flex flex-col items-center mb-8 pt-2">
          <img 
            src="https://squarespace-cdn.com" 
            alt="Claire Logo" 
            className="w-14 h-14 object-contain mb-4 select-none"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              e.currentTarget.src = PIXEL_LEAF_SVG;
            }}
          />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight text-center">
            Claire<span className="text-[#FF7A59]">.ai</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium text-center mt-1">
            Elite Digital Agronomist & Automated Pathology Portal
          </p>
        </div>

        {/* Error Messages */}
        {errorMsg && (
          <div id="login_error" className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-medium text-center leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Access Code Input Stage */}
        {isOtpSent ? (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="otp_code" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Enter Verification Code
              </label>
              <input
                id="otp_code"
                type="text"
                maxLength={5}
                placeholder="12345"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-center font-mono text-xl tracking-widest text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-colors"
                required
              />
              <p className="text-[11px] text-slate-400 text-center leading-normal">
                We sent a 5-digit temporary authorization passcode to <strong className="text-slate-600">{sentIdentifier}</strong>.
              </p>
            </div>

            <button
              id="btn_submit_otp"
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-[#FF7A59] to-[#FFB74D] hover:opacity-90 active:opacity-100 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-100 transition-opacity"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Account...
                </>
              ) : (
                'Access Agricultural Dashboard'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOtpSent(false);
                setDevOtp(null);
                setOtpInput('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-semibold pt-1 transition-colors cursor-pointer"
            >
              Back to Sign-In Methods
            </button>
          </form>
        ) : (
          /* Normal Tabbed Selection Stage */
          <div className="space-y-6">
            
            {/* Nav Tab Options */}
            <div id="login_tabs_nav" className="flex bg-slate-100/80 p-1 rounded-xl">
              <button
                type="button"
                id="tab_email"
                onClick={() => { setActiveTab('email'); setErrorMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'email'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <button
                type="button"
                id="tab_phone"
                onClick={() => { setActiveTab('phone'); setErrorMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'phone'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                SMS Phone
              </button>
              <button
                type="button"
                id="tab_google"
                onClick={() => { setActiveTab('google'); setErrorMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'google'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Google
              </button>
            </div>

            {/* Email Form Panel */}
            {activeTab === 'email' && (
              <form onSubmit={handleRequestEmailOtp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email_input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Farmer Email Coordinates
                  </label>
                  <input
                    id="email_input"
                    type="email"
                    placeholder="farmer@microclimate.org"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-all"
                    required
                  />
                </div>
                <button
                  id="btn_request_email_code"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-[#FF7A59] to-[#FFB74D] hover:opacity-90 active:opacity-100 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-100 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Request Access Code'
                  )}
                </button>
              </form>
            )}

            {/* Phone Form Panel */}
            {activeTab === 'phone' && (
              <form onSubmit={handleRequestPhoneOtp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone_input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Farmer SMS Mobile Number
                  </label>
                  <input
                    id="phone_input"
                    type="tel"
                    placeholder="+1 (555) 234-5678"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-all"
                    required
                  />
                </div>
                <button
                  id="btn_request_sms_code"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-[#FF7A59] to-[#FFB74D] hover:opacity-90 active:opacity-100 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-100 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Send SMS OTP'
                  )}
                </button>
              </form>
            )}

            {/* Google Authentication Panel */}
            {activeTab === 'google' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-normal text-center">
                  Skip code verification and instantly sync your global farmer profile securely with Google SSO.
                </p>
                
                <div className="space-y-3 bg-slate-50/50 p-3 border border-slate-100 rounded-xl">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mock Google Name</label>
                    <input
                      type="text"
                      value={googleNameInput}
                      onChange={(e) => setGoogleNameInput(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-700 outline-none focus:border-[#FF7A59] transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mock Google Email</label>
                    <input
                      type="email"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-700 outline-none focus:border-[#FF7A59] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  id="btn_google_auth"
                  onClick={handleContinueWithGoogle}
                  disabled={isLoading}
                  className="w-full h-11 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-3 font-semibold text-xs text-slate-700 cursor-pointer shadow-sm transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-orange-400" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google Account
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Security / Quality Statement */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          Isolated Claire.ai sandbox active & secured.
        </div>
      </div>

      {/* Developer bypass OTP indicator badge on screen */}
      {devOtp && (
        <div id="dev_otp_badge" className="mt-6 bg-slate-800 text-slate-100 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono shadow-md flex items-center gap-2 max-w-sm">
          <span>🔧 Dev Mode OTP:</span>
          <strong className="text-[#FFB74D] bg-slate-900 px-2 py-0.5 rounded tracking-widest text-sm">{devOtp}</strong>
          <span className="text-[10px] text-slate-400">(Click to copy/autofill)</span>
        </div>
      )}
    </div>
  );
}
