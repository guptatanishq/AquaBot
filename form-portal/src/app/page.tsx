'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Droplets, RefreshCw, ArrowLeft, ArrowRight, Check, X
} from 'lucide-react';

import { FormData, ValidationErrors, Unit } from './types';
import { issueBuckets } from './constants';
import Step1Form from './components/Step1Form';
import Step2Form from './components/Step2Form';
import Step3Success from './components/Step3Success';

export default function FormIssueReporter() {
  // Navigation Step: 1 = Issue & Company & Photo, 2 = Contact Info & Submit, 3 = Confirmation
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    industry: '',
    industryId: '',
    unitIds: [],
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
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [unitSearch, setUnitSearch] = useState<string>('');
  const [isUnitsOpen, setIsUnitsOpen] = useState<boolean>(false);
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [localPhone, setLocalPhone] = useState<string>('');

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field Touched / Error States for validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors & { units?: string }>({});

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
    const errors: ValidationErrors & { units?: string } = {};
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
      if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
      if (!localPhone.trim()) errors.phone = 'Phone number is required';
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
      unitIds: [],
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
    setLocalPhone('');
    setCountryCode('+91');
    setAvailableUnits([]);
    setValidationErrors({});
    setTicketId(null);
    setSubmitError(null);
    setStep(1);
  };

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

          {step === 1 && (
            <Step1Form
              formData={formData}
              setFormData={setFormData}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
              loadingIndustries={loadingIndustries}
              filteredIndustries={filteredIndustries}
              industrySearch={industrySearch}
              setIndustrySearch={setIndustrySearch}
              isIndustryFocused={isIndustryFocused}
              setIsIndustryFocused={setIsIndustryFocused}
              handleSelectIndustry={handleSelectIndustry}
              availableUnits={availableUnits}
              loadingUnits={loadingUnits}
              unitSearch={unitSearch}
              setUnitSearch={setUnitSearch}
              isUnitsOpen={isUnitsOpen}
              setIsUnitsOpen={setIsUnitsOpen}
              handleToggleUnit={handleToggleUnit}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleRemoveFile={handleRemoveFile}
            />
          )}

          {step === 2 && (
            <Step2Form
              formData={formData}
              setFormData={setFormData}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              localPhone={localPhone}
              setLocalPhone={setLocalPhone}
              availableUnits={availableUnits}
              submitError={submitError}
            />
          )}

          {step === 3 && (
            <Step3Success
              formData={formData}
              ticketId={ticketId}
              handleReset={handleReset}
              homeUrl="http://localhost:3000/"
            />
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


    </div>
  );
}

