import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { FormData } from '../types';

interface Step3SuccessProps {
  formData: FormData;
  ticketId: string | null;
  handleReset: () => void;
  homeUrl?: string;
}

export default function Step3Success({
  formData,
  ticketId,
  handleReset,
  homeUrl = '/',
}: Step3SuccessProps) {
  return (
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
          href={homeUrl}
          className="px-6 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-center transition-all"
        >
          Return to Chatbot
        </a>
      </div>
    </div>
  );
}
