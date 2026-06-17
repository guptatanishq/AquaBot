import React from 'react';
import { Mail, AlertCircle, Check } from 'lucide-react';
import { FormData, ValidationErrors, Unit } from '../types';
import { countryCodes } from '../constants';

interface Step2FormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  validationErrors: ValidationErrors & { units?: string };
  setValidationErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  countryCode: string;
  setCountryCode: (val: string) => void;
  localPhone: string;
  setLocalPhone: (val: string) => void;
  availableUnits: Unit[];
  submitError: string | null;
}

export default function Step2Form({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
  countryCode,
  setCountryCode,
  localPhone,
  setLocalPhone,
  availableUnits,
  submitError,
}: Step2FormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-700" />
          Your Profile Information
        </h2>
        <p className="text-slate-500 text-sm mt-1">Please provide your contact details so we can update you regarding the ticket.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Contact Form */}
        <div className="space-y-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Enter name"
              className={`px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium ${
                validationErrors.name ? 'border-red-400 ring-2 ring-red-50 focus-within:ring-red-400' : 'border-slate-200'
              }`}
            />
            {validationErrors.name && (
              <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {validationErrors.name}
              </span>
            )}
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="Enter email"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium ${
                  validationErrors.email ? 'border-red-400 ring-2 ring-red-50 focus-within:ring-red-400' : 'border-slate-200'
                }`}
              />
            </div>
            {validationErrors.email && (
              <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {validationErrors.email}
              </span>
            )}
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</label>
            <div className={`flex items-stretch border rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-cyan-600 transition-all font-medium overflow-hidden ${
              validationErrors.phone ? 'border-red-400 ring-2 ring-red-50 focus-within:ring-red-400' : 'border-slate-200'
            }`}>
              <select
                value={countryCode}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setCountryCode(newCode);
                  setFormData(prev => ({ ...prev, phone: localPhone ? `${newCode}${localPhone}` : '' }));
                }}
                className="bg-slate-100 text-slate-700 border-r border-slate-200 w-24 px-2 py-3 text-sm focus:outline-none rounded-l-xl font-bold cursor-pointer self-stretch"
              >
                {countryCodes.map((c, idx) => (
                  <option key={`${c.code}-${c.flag}-${idx}`} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 flex items-center">
                <input
                  type="tel"
                  id="phone"
                  value={localPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalPhone(val);
                    setFormData(prev => ({ ...prev, phone: val ? `${countryCode}${val}` : '' }));
                    if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  placeholder=""
                  className="w-full pl-4 pr-4 py-3 bg-transparent text-slate-800 focus:outline-none font-medium h-full"
                />
              </div>
            </div>
            {validationErrors.phone && (
              <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {validationErrors.phone}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Ticket Details Review Summary */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm flex flex-col gap-3 h-fit">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Submission Summary</span>
          
          <div className="space-y-2 text-slate-600 divide-y divide-slate-100">
            <div className="pt-2 flex justify-between gap-4">
              <span className="font-semibold text-slate-500">Company:</span>
              <span className="text-right text-slate-800 font-bold truncate max-w-[150px]">{formData.industry || 'Not Selected'}</span>
            </div>
            {formData.unitIds.length > 0 && (
              <div className="pt-2 flex justify-between gap-4">
                <span className="font-semibold text-slate-500">Units Selected:</span>
                <span className="text-right text-cyan-800 font-bold">{formData.unitIds.length} location(s)</span>
              </div>
            )}
            <div className="pt-2 flex flex-col gap-0.5">
              <span className="font-semibold text-slate-500">Category:</span>
              <span className="text-slate-800 font-semibold truncate">{formData.issueType || 'Not Selected'}</span>
            </div>
            {formData.issueOption && (
              <div className="pt-2 flex flex-col gap-0.5">
                <span className="font-semibold text-slate-500">Detail Option:</span>
                <span className="text-slate-600 text-xs italic">{formData.issueOption}</span>
              </div>
            )}
            {formData.inaccuracyReason && (
              <div className="pt-2 flex flex-col gap-0.5">
                <span className="font-semibold text-slate-500">Inaccuracy Reason & Source:</span>
                <span className="text-slate-800 text-xs font-medium leading-relaxed">{formData.inaccuracyReason}</span>
              </div>
            )}
            {formData.missingTimeline && (
              <div className="pt-2 flex flex-col gap-0.5">
                <span className="font-semibold text-slate-500">Timeline Missing:</span>
                <span className="text-slate-800 text-xs font-medium leading-relaxed">{formData.missingTimeline}</span>
              </div>
            )}
            {formData.photoUrl && (
              <div className="pt-2 flex justify-between gap-4">
                <span className="font-semibold text-slate-500">Attachment:</span>
                <span className="text-right text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Added
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-sm leading-relaxed flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{submitError}</span>
        </div>
      )}
    </div>
  );
}

// Simple internal icon wrapper so it compiles cleanly if "User" icon isn't imported from main scope
function User({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
