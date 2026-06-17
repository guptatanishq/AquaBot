import React from 'react';
import { 
  Search, X, ChevronRight, AlertCircle, HelpCircle, 
  RefreshCw, Upload, FileSpreadsheet, FileText, ShieldCheck
} from 'lucide-react';
import { FormData, ValidationErrors, Unit } from '../types';
import { issueBuckets } from '../constants';
import UnitSelector from './UnitSelector';

interface Step1FormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  validationErrors: ValidationErrors & { units?: string };
  setValidationErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  loadingIndustries: boolean;
  filteredIndustries: string[];
  industrySearch: string;
  setIndustrySearch: (val: string) => void;
  isIndustryFocused: boolean;
  setIsIndustryFocused: (val: boolean) => void;
  handleSelectIndustry: (ind: string) => void;
  availableUnits: Unit[];
  loadingUnits: boolean;
  unitSearch: string;
  setUnitSearch: (val: string) => void;
  isUnitsOpen: boolean;
  setIsUnitsOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleToggleUnit: (unitId: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
}

export default function Step1Form({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
  loadingIndustries,
  filteredIndustries,
  industrySearch,
  setIndustrySearch,
  isIndustryFocused,
  setIsIndustryFocused,
  handleSelectIndustry,
  availableUnits,
  loadingUnits,
  unitSearch,
  setUnitSearch,
  isUnitsOpen,
  setIsUnitsOpen,
  handleToggleUnit,
  fileInputRef,
  handleFileChange,
  handleRemoveFile,
}: Step1FormProps) {
  return (
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
              <UnitSelector
                formData={formData}
                availableUnits={availableUnits}
                validationErrors={validationErrors}
                unitSearch={unitSearch}
                setUnitSearch={setUnitSearch}
                isUnitsOpen={isUnitsOpen}
                setIsUnitsOpen={setIsUnitsOpen}
                handleToggleUnit={handleToggleUnit}
              />
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

      {/* Support File Upload */}
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
  );
}
