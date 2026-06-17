'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Droplets, User, Mail, Phone, Search, Check, 
  ArrowLeft, ArrowRight, ImageIcon, 
  X, Upload, AlertCircle, HelpCircle, ChevronRight,
  ShieldCheck, RefreshCw, CheckCircle2, FileText, FileSpreadsheet
} from 'lucide-react';

const issueBuckets: Record<string, string[]> = {
  'Numbers missing from my dashboard': [
    'Meter display is ON and showing numbers locally',
    'Meter display is ON but showing zero',
    'Meter display is completely blank or OFF',
    "I can't access the meter physically right now",
    "I'm not sure - I can only see the dashboard",
  ],
  'The readings look wrong or unusually high': [
    'Showing an absurdly large number',
    'Showing zero even though meter is running',
    "Dashboard number doesn't match meter display",
    "Water balance total doesn't add up",
    'Readings seem slightly high or low',
  ],
  'I need to correct or add some data': [
    'Read values directly from meter display',
    'Values from manual logbook',
    'Entered wrong value in portal and want correction',
    'Meter was replaced/serviced and data shifted',
    'Other',
  ],
  "A physical meter or sensor isn't working": [
    'Display is blank or not turning on',
    'Display shows numbers but portal shows nothing',
    'Readings are fluctuating randomly',
    'It keeps showing zero when water is flowing',
    'Visible physical damage on device',
  ],
  'I need something changed on my dashboard': [
    'Rename a meter or location',
    'Add/remove meter from water balance',
    'Change report or alert recipients',
    'Adjust alert limits (thresholds)',
    'Change layout/categories',
    'Something else',
  ],
  "My reports or alert emails aren't arriving": [
    'Daily/weekly report email not arriving',
    'Report arrived but has missing/NA values',
    'Alert emails are incorrect or excessive',
    'Alert emails have completely stopped',
    'PDF report has wrong branding/fields',
  ],
  "Something on the portal or app isn't working": [
    "Happens every time - consistently broken",
    'Happened a few times but not always',
    "Happened once - not sure if it'll repeat",
  ],
  'I need someone to visit my site': [
    'Install a new meter',
    'Calibrate/check an existing meter',
    'Replace a damaged/faulty meter',
    'Fix wiring or connectivity',
    "General check-up - not sure what's wrong",
  ],
};

const doesIssueRequireUnits = (issueType: string): boolean => {
  const unitRequiredCategories = [
    'Numbers missing from my dashboard',
    'The readings look wrong or unusually high',
    'I need to correct or add some data',
    "A physical meter or sensor isn't working",
    'I need someone to visit my site'
  ];
  return unitRequiredCategories.includes(issueType);
};

export default function FormIssueReporter() {
  // Navigation Step: 1 = Issue & Company & Photo, 2 = Contact Info & Submit, 3 = Confirmation
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    industry: '',
    industryId: '',
    unitIds: [] as string[],
    issueType: '',
    issueOption: '',
    inaccuracyReason: '',
    missingTimeline: '',
    description: '',
    photoUrl: '', // base64
    fileName: '',
  });

  // Autocomplete / Search States
  const [allIndustries, setAllIndustries] = useState<string[]>([]);
  const [industrySearch, setIndustrySearch] = useState<string>('');
  const [isIndustryFocused, setIsIndustryFocused] = useState<boolean>(false);
  const [loadingIndustries, setLoadingIndustries] = useState<boolean>(true);
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);
  const [availableUnits, setAvailableUnits] = useState<{ id: string; name: string }[]>([]);
  const [unitSearch, setUnitSearch] = useState<string>('');

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field Touched / Error States for validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch industries on mount
  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setAllIndustries(d.data);
        }
        setLoadingIndustries(false);
      })
      .catch(() => setLoadingIndustries(false));
  }, []);

  // Filter industries list
  const filteredIndustries = industrySearch.trim() === ''
    ? []
    : allIndustries.filter(i => i.toLowerCase().includes(industrySearch.toLowerCase())).slice(0, 8);

  // Handle industry selection
  const handleSelectIndustry = (industryName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      industry: industryName,
      industryId: '',
      unitIds: [] 
    }));
    setIndustrySearch(industryName);
    setIsIndustryFocused(false);
  };

  // Fetch units when industry or issueType changes
  useEffect(() => {
    if (!formData.industry.trim() || !formData.issueType) {
      setAvailableUnits([]);
      setFormData(prev => ({ ...prev, unitIds: [] }));
      return;
    }

    setLoadingUnits(true);
    fetch(`/api/lookupUnits?industry=${encodeURIComponent(formData.industry.trim())}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setFormData(prev => ({ ...prev, industryId: json.data.id }));
          setAvailableUnits(json.data.units || []);
        } else {
          setAvailableUnits([]);
        }
        setLoadingUnits(false);
      })
      .catch((err) => {
        console.error('Failed to lookup units:', err);
        setAvailableUnits([]);
        setLoadingUnits(false);
      });
  }, [formData.industry, formData.issueType]);

  // Toggle unit selection
  const handleToggleUnit = (unitId: string) => {
    setFormData(prev => {
      const isSelected = prev.unitIds.includes(unitId);
      const newUnitIds = isSelected 
        ? prev.unitIds.filter(id => id !== unitId) 
        : [...prev.unitIds, unitId];
      return { ...prev, unitIds: newUnitIds };
    });
  };

  // Upload/File Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          photoUrl: reader.result as string,
          fileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, photoUrl: '', fileName: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validations per step
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (currentStep === 1) {
      if (!formData.issueType) errors.issueType = 'Please select a main issue category';
      if (formData.issueType !== 'Others' && !formData.issueOption) {
        errors.issueOption = 'Please select an issue detail option';
      }
      
      // Dynamic validation for data inaccuracy
      if ((formData.issueType === 'The readings look wrong or unusually high' || 
           formData.issueType === 'I need to correct or add some data') && 
          !formData.inaccuracyReason.trim()) {
        errors.inaccuracyReason = 'Please explain why the data is inaccurate and state the reference source';
      }

      // Dynamic validation for missing data timeline
      if (formData.issueType === 'Numbers missing from my dashboard' && !formData.missingTimeline.trim()) {
        errors.missingTimeline = 'Please specify the timeline when the data was missing';
      }

      if (!formData.description.trim()) {
        errors.description = 'Please provide a description of the issue';
      }
      if (!formData.industry.trim()) {
        errors.industry = 'Please select a company or industry';
      }
      if (formData.issueType && availableUnits.length > 0 && formData.unitIds.length === 0) {
        errors.units = 'Please select at least one affected unit/location';
      }
    }

    if (currentStep === 2) {
      if (!formData.name.trim()) errors.name = 'Full name is required';
      if (!formData.email.trim()) {
        errors.email = 'Email address is required';
      } else if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Submit Issue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 2) return;
    if (!validateStep(2)) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        setTicketId(data.ticketId);
        setStep(3);
      } else {
        setSubmitError(data.error || 'Failed to submit the issue. Please check the fields and try again.');
      }
    } catch {
      setSubmitError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to start over
  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      industry: '',
      industryId: '',
      unitIds: [] as string[],
      issueType: '',
      issueOption: '',
      inaccuracyReason: '',
      missingTimeline: '',
      description: '',
      photoUrl: '',
      fileName: '',
    });
    setIndustrySearch('');
    setUnitSearch('');
    setAvailableUnits([]);
    setValidationErrors({});
    setTicketId(null);
    setSubmitError(null);
    setStep(1);
  };

  // Filtered unit options based on user text query
  const filteredUnits = availableUnits.filter(u => 
    u.name.toLowerCase().includes(unitSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-cyan-100 transition-all duration-300">
        
        {/* Header */}
        <div className="bg-linear-to-r from-cyan-800 to-emerald-700 p-6 sm:p-8 text-white relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-2xl shadow-inner animate-pulse">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">AquaBot Intake</h1>
              <p className="text-sm font-medium text-cyan-100 opacity-90">Issue Reporting Form Portal</p>
            </div>
          </div>
          {step <= 2 && (
            <div className="text-right shrink-0">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-75 block">Progress</span>
              <span className="text-lg font-bold">{Math.round((step / 2) * 100)}%</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {step <= 2 && (
          <div className="w-full bg-slate-100 h-1.5 relative overflow-hidden">
            <div 
              className="bg-linear-to-r from-cyan-600 to-emerald-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        )}

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          
          {/* STEP 1: Issue, Company & Location Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-cyan-700" />
                  Report Your Issue
                </h2>
                <p className="text-slate-500 text-sm mt-1">Please select your company and fill in the details of the issue below.</p>
              </div>

              <div className="space-y-5">
                {/* 1. Industry / Company Selection */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-sm font-semibold text-slate-700">Company / Industry Name</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-cyan-700" />
                    <input
                      type="text"
                      value={industrySearch}
                      onChange={(e) => {
                        setIndustrySearch(e.target.value);
                        setFormData(prev => ({ ...prev, industry: e.target.value, industryId: '', unitIds: [] }));
                        setAvailableUnits([]);
                        setIsIndustryFocused(true);
                      }}
                      onFocus={() => setIsIndustryFocused(true)}
                      placeholder={loadingIndustries ? "Loading industries list..." : "Type to search company/industry..."}
                      disabled={loadingIndustries}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium ${
                        validationErrors.industry ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {industrySearch && (
                      <button 
                        type="button"
                        onClick={() => {
                          setIndustrySearch('');
                          setFormData(prev => ({ ...prev, industry: '', industryId: '', unitIds: [] }));
                          setAvailableUnits([]);
                        }}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isIndustryFocused && filteredIndustries.length > 0 && (
                    <div className="absolute top-[76px] left-0 right-0 bg-white rounded-xl border border-cyan-100 shadow-xl overflow-hidden z-20 flex flex-col max-h-60 overflow-y-auto">
                      {filteredIndustries.map((ind) => (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => handleSelectIndustry(ind)}
                          className="text-left px-5 py-3 text-sm font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 transition-colors border-b border-slate-50 last:border-b-0 flex items-center justify-between"
                        >
                          <span>{ind}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  {isIndustryFocused && industrySearch.trim() !== '' && filteredIndustries.length === 0 && (
                    <div className="absolute top-[76px] left-0 right-0 bg-white p-4 rounded-xl border border-cyan-50 shadow-lg z-20 text-slate-500 text-sm italic">
                      No matching company or industry found. You can type to enter manually, but custom options might not have unit lookups.
                    </div>
                  )}

                  {validationErrors.industry && (
                    <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {validationErrors.industry}
                    </span>
                  )}
                </div>

                {/* Company selected info */}
                {formData.industry && !isIndustryFocused && (
                  <div className="p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100 flex items-center justify-between animate-fadeIn">
                    <span className="text-sm text-cyan-800 font-semibold">Selected: {formData.industry}</span>
                    <button 
                      type="button" 
                      onClick={() => setIsIndustryFocused(true)} 
                      className="text-xs font-bold text-cyan-700 hover:underline"
                    >
                      Change Company
                    </button>
                  </div>
                )}

                {/* 2. Issue Category */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <label htmlFor="issueType" className="text-sm font-semibold text-slate-700">Issue Category</label>
                  <select
                    id="issueType"
                    value={formData.issueType}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        issueType: e.target.value,
                        issueOption: '' // Reset child selection
                      }));
                      if (validationErrors.issueType) setValidationErrors(prev => ({ ...prev, issueType: '' }));
                    }}
                    className={`px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-semibold appearance-none relative ${
                      validationErrors.issueType ? 'border-red-400' : 'border-slate-200'
                    }`}
                  >
                    <option value="">-- Choose Category --</option>
                    {Object.keys(issueBuckets).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                  {validationErrors.issueType && (
                    <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {validationErrors.issueType}
                    </span>
                  )}
                </div>

                {/* 3. Issue Option (Conditional) */}
                {formData.issueType && formData.issueType !== 'Others' && (
                  <div className="flex flex-col gap-1.5 animate-fadeIn">
                    <label htmlFor="issueOption" className="text-sm font-semibold text-slate-700">Issue Detail Option</label>
                    <select
                      id="issueOption"
                      value={formData.issueOption}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, issueOption: e.target.value }));
                        if (validationErrors.issueOption) setValidationErrors(prev => ({ ...prev, issueOption: '' }));
                      }}
                      className={`px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-semibold ${
                        validationErrors.issueOption ? 'border-red-400' : 'border-slate-200'
                      }`}
                    >
                      <option value="">-- Choose Option Detail --</option>
                      {(issueBuckets[formData.issueType] || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {validationErrors.issueOption && (
                      <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {validationErrors.issueOption}
                      </span>
                    )}
                  </div>
                )}

                {/* 4. Data Inaccuracy Custom Question (Conditional) */}
                {formData.issueType && formData.issueType !== 'Others' && (formData.issueType === 'The readings look wrong or unusually high' || 
                  formData.issueType === 'I need to correct or add some data') && (
                  <div className="flex flex-col gap-1.5 animate-fadeIn">
                    <label htmlFor="inaccuracyReason" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      Why is this data inaccurate, and what is the source of your reference data?
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea
                      id="inaccuracyReason"
                      rows={3}
                      value={formData.inaccuracyReason}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, inaccuracyReason: e.target.value }));
                        if (validationErrors.inaccuracyReason) setValidationErrors(prev => ({ ...prev, inaccuracyReason: '' }));
                      }}
                      placeholder="e.g., The physical meter reads 1204 KL but the dashboard shows 1560 KL. Reference source: manual operator logbook from yesterday."
                      className={`px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium resize-y ${
                        validationErrors.inaccuracyReason ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                      }`}
                    />
                    <p className="text-xs text-slate-400 italic">
                      Please note: We require strict verification sources for all data corrections.
                    </p>
                    {validationErrors.inaccuracyReason && (
                      <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {validationErrors.inaccuracyReason}
                      </span>
                    )}
                  </div>
                )}

                {/* 5. Data Missing Timeline Custom Question (Conditional) */}
                {formData.issueType && formData.issueType !== 'Others' && formData.issueType === 'Numbers missing from my dashboard' && (
                  <div className="flex flex-col gap-1.5 animate-fadeIn">
                    <label htmlFor="missingTimeline" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      What is the timeline / period when data was missing?
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      id="missingTimeline"
                      value={formData.missingTimeline}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, missingTimeline: e.target.value }));
                        if (validationErrors.missingTimeline) setValidationErrors(prev => ({ ...prev, missingTimeline: '' }));
                      }}
                      placeholder="e.g., Since June 14, 09:00 AM to present, or specifically June 15 during night shift"
                      className={`px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium ${
                        validationErrors.missingTimeline ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                      }`}
                    />
                    {validationErrors.missingTimeline && (
                      <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {validationErrors.missingTimeline}
                      </span>
                    )}
                  </div>
                )}

                {/* 6. Affected Units Selection (shown when issue type is selected) */}
                {formData.issueType && (
                  <div className="pt-2 animate-fadeIn">
                    {loadingUnits && (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-cyan-800 font-medium">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span className="text-sm">Fetching associated locations...</span>
                      </div>
                    )}

                    {!loadingUnits && availableUnits.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-slate-700">Affected Units / Locations (Select all that apply)</label>
                          <span className="text-xs font-bold text-cyan-700">{formData.unitIds.length} Selected</span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col gap-3">
                          {/* Search inside loaded units */}
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={unitSearch}
                              onChange={(e) => setUnitSearch(e.target.value)}
                              placeholder="Filter units..."
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium"
                            />
                          </div>

                          {/* Units checkboxes */}
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredUnits.map((u) => {
                              const isSelected = formData.unitIds.includes(u.id);
                              return (
                                <label
                                  key={u.id}
                                  className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-colors border ${
                                    isSelected ? 'bg-cyan-50/70 border-cyan-200' : 'bg-white hover:bg-slate-50 border-slate-100'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                    isSelected ? 'bg-cyan-700 border-cyan-700' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() => handleToggleUnit(u.id)}
                                  />
                                  <span className="text-sm font-semibold text-slate-700 leading-snug">{u.name}</span>
                                </label>
                              );
                            })}
                            {filteredUnits.length === 0 && (
                              <div className="text-sm text-slate-500 italic p-4 text-center">No units match your search.</div>
                            )}
                          </div>
                        </div>
                        {validationErrors.units && (
                          <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {validationErrors.units}
                          </span>
                        )}
                      </div>
                    )}

                    {!loadingUnits && formData.industry && availableUnits.length === 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-sm leading-relaxed flex gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <p className="font-semibold">No locations configured</p>
                          <p className="opacity-90 mt-0.5">This company does not have pre-configured physical meters or units. You can directly proceed to detail the issue.</p>
                        </div>
                      </div>
                    )}

                    {!loadingUnits && !formData.industry && (
                      <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-sm italic text-center">
                        Please specify your company/industry name above to see associated locations.
                      </div>
                    )}
                  </div>
                )}

                {/* 7. Description */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <label htmlFor="description" className="text-sm font-semibold text-slate-700">Describe what is happening</label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, description: e.target.value }));
                      if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: '' }));
                    }}
                    placeholder="Provide details about the issue: when did it start, numbers observed, portal URL, etc."
                    className={`px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium resize-y ${
                      validationErrors.description ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {validationErrors.description && (
                    <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {validationErrors.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Part 3: Image / Video / Document Upload */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-cyan-700" />
                  Attach Support File (Optional)
                </label>
                
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                {!formData.photoUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyan-200 hover:border-cyan-500 bg-slate-50/50 hover:bg-cyan-50/20 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all gap-2.5 text-slate-500"
                  >
                    <Upload className="w-10 h-10 text-cyan-700" />
                    <div className="text-center">
                      <span className="text-sm font-bold text-cyan-800">Click to upload file</span>
                      <p className="text-xs text-slate-400 mt-1">Excel, PDF, image, video, etc. up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden p-2 flex flex-col gap-2 animate-fadeIn">
                    <div className="max-h-48 flex justify-center items-center bg-black/5 rounded-xl overflow-hidden relative">
                      {formData.photoUrl.startsWith('data:video') ? (
                        <video controls className="max-w-full max-h-44 object-contain">
                          <source src={formData.photoUrl} />
                        </video>
                      ) : formData.photoUrl.startsWith('data:image') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={formData.photoUrl} 
                          alt="Preview of issue" 
                          className="max-w-full max-h-44 object-contain"
                        />
                      ) : (
                        <div className="py-8 px-12 flex flex-col items-center justify-center gap-3">
                          {formData.photoUrl.includes('sheet') || formData.photoUrl.includes('excel') || formData.photoUrl.includes('csv') ? (
                            <FileSpreadsheet className="w-14 h-14 text-emerald-600" />
                          ) : (
                            <FileText className="w-14 h-14 text-cyan-700" />
                          )}
                          <span className="text-sm font-semibold text-slate-700 max-w-xs truncate text-center" title={formData.fileName}>
                            {formData.fileName || "Uploaded Document"}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                        title="Remove Attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 px-1.5 text-xs text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-semibold">File uploaded successfully</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Contact Details & Submit */}
          {step === 2 && (
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
                      placeholder="Enter your first and last name"
                      className={`px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium ${
                        validationErrors.name ? 'border-red-400 ring-2 ring-red-50 focus:ring-red-400' : 'border-slate-200'
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
                        placeholder="you@company.com"
                        className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium ${
                          validationErrors.email ? 'border-red-400 ring-2 ring-red-50 focus:ring-red-400' : 'border-slate-200'
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
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, phone: e.target.value }));
                          if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
                        }}
                        placeholder="+1 (555) 000-0000"
                        className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all font-medium ${
                          validationErrors.phone ? 'border-red-400 ring-2 ring-red-50 focus:ring-red-400' : 'border-slate-200'
                        }`}
                      />
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
          )}

          {/* STEP 3: Confirmation / Receipt */}
          {step === 3 && (
            <div className="py-8 text-center space-y-6 animate-fadeIn">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-50 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Issue Reported Successfully!</h2>
                <p className="text-slate-500 max-w-md mx-auto">Thank you, {formData.name}. We have generated your support ticket. Our team is investigating the issue.</p>
              </div>

              {/* Receipt Ticket Details */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col gap-1 items-center pb-4 border-b border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Ticket ID Number</span>
                  <span className="text-3xl font-extrabold text-cyan-800 tracking-tight">{ticketId}</span>
                </div>

                <div className="pt-4 text-left space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Email Shared:</span>
                    <strong className="text-slate-800">{formData.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Company Name:</span>
                    <strong className="text-slate-800">{formData.industry}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Issue Bucket:</span>
                    <strong className="text-slate-800">{formData.issueType}</strong>
                  </div>
                  <p className="text-xs text-slate-400 text-center italic mt-4 pt-2 border-t border-slate-100">
                    A copy of this ticket confirmation has been sent to your email.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 bg-linear-to-r from-cyan-800 to-emerald-700 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Report Another Issue
                </button>
                <a
                  href="http://localhost:3000/"
                  className="px-6 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-center transition-all"
                >
                  Return to Chatbot
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons (For Step 1 to 2) */}
          {step <= 2 && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
              
              {/* Back Button */}
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {/* Next / Submit Button */}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-linear-to-r from-cyan-800 to-emerald-700 text-white rounded-xl font-bold hover:shadow-lg flex items-center gap-2 transition-all"
                >
                  Proceed to Submit
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-7 py-3.5 bg-linear-to-r from-cyan-800 to-emerald-700 text-white rounded-xl font-extrabold hover:shadow-xl flex items-center gap-2 transition-all disabled:opacity-75 relative"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      Submitting Ticket...
                    </>
                  ) : (
                    <>
                      Submit Ticket
                      <Check className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              )}

            </div>
          )}

        </div>
      </div>
      
      {/* Footer info link back to bot */}
      {step <= 2 && (
        <a 
          href="http://localhost:3000/" 
          className="mt-6 text-sm font-semibold text-cyan-800 hover:text-cyan-900 transition-colors flex items-center gap-1.5"
        >
          <X className="w-4 h-4" />
          Switch to AquaBot Chat Support
        </a>
      )}
    </div>
  );
}
