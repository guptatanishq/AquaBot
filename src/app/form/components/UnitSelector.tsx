import React from 'react';
import { Search, Check, X, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { FormData, Unit, ValidationErrors } from '../types';

interface UnitSelectorProps {
  formData: FormData;
  availableUnits: Unit[];
  validationErrors: ValidationErrors & { units?: string };
  unitSearch: string;
  setUnitSearch: (val: string) => void;
  isUnitsOpen: boolean;
  setIsUnitsOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleToggleUnit: (unitId: string) => void;
}

export default function UnitSelector({
  formData,
  availableUnits,
  validationErrors,
  unitSearch,
  setUnitSearch,
  isUnitsOpen,
  setIsUnitsOpen,
  handleToggleUnit,
}: UnitSelectorProps) {
  // Filter units list based on search
  const filteredUnits = availableUnits.filter(u =>
    u.name.toLowerCase().includes(unitSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1.5 animate-fadeIn">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-700">Affected Units / Locations</label>
        <span className="text-xs font-bold text-cyan-700">{formData.unitIds.length} Selected</span>
      </div>

      {/* Collapsible Dropdown Trigger Box */}
      <div 
        onClick={() => setIsUnitsOpen(prev => !prev)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-600 min-h-[48px]"
      >
        <div className="flex flex-wrap gap-1.5 items-center pr-2">
          {formData.unitIds.length === 0 ? (
            <span className="text-sm text-slate-400 font-medium">Select affected units/locations...</span>
          ) : (
            formData.unitIds.map(id => {
              const unit = availableUnits.find(u => u.id === id);
              return (
                <span 
                  key={id} 
                  className="px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleUnit(id);
                  }}
                >
                  {unit ? unit.name : id}
                  <X className="w-3 h-3 hover:text-cyan-900 cursor-pointer" />
                </span>
              );
            })
          )}
        </div>
        <div className="text-slate-400 shrink-0">
          {isUnitsOpen ? <ChevronUp className="w-4 h-4 text-cyan-700" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Dropdown Box (collapsible list) */}
      {isUnitsOpen && (
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col gap-3 animate-fadeIn">
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

          {/* Done Button to collapse dropdown */}
          <button
            type="button"
            onClick={() => setIsUnitsOpen(false)}
            className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      )}
      {validationErrors.units && (
        <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {validationErrors.units}
        </span>
      )}
    </div>
  );
}
