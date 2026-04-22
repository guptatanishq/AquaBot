import { useState, useEffect } from 'react';

export type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  options?: string[];
  isMultiSelect?: boolean;
  multiSelectOptions?: { id: string; name: string }[];
  isIndustrySearch?: boolean;
  isImage?: boolean; // If true, treats 'text' as a base64 image string
};

type ChatStep = 'Name' | 'Email' | 'Phone' | 'Designation' | 'Industry' | 'Unit' | 'IssueType' | 'Description' | 'Photo' | 'Done';

export function useChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ChatStep>('Name');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    industry: '',
    industryId: '',
    unitIds: [] as string[],
    issueType: '',
    description: '',
    photoUrl: '', // base64
  });

  const appendMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString() + Math.random(), timestamp: new Date() },
    ]);
  };

  // Start sequence
  useEffect(() => {
    if (step === 'Name' && messages.length === 0) {
      const timer = setTimeout(() => {
        appendMessage({ sender: 'bot', text: 'Hello! Welcome to the AquaBot support portal. May I know your name?' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, messages.length]);

  const handleSendMessage = async (text: string, isImage: boolean = false, payload?: any) => {
    // Determine what user visually sent
    if (isImage) {
      appendMessage({ sender: 'user', text: text, isImage: true });
    } else {
      appendMessage({ sender: 'user', text });
    }

    // State machine logic
    switch (step) {
      case 'Name':
        setFormData((prev) => ({ ...prev, name: text }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: `Nice to meet you, ${text}. Could you please provide your email address?` });
          setStep('Email');
        }, 500);
        break;

      case 'Email':
        setFormData((prev) => ({ ...prev, email: text }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: `Thanks! Please enter your phone number.` });
          setStep('Phone');
        }, 500);
        break;

      case 'Phone':
        setFormData((prev) => ({ ...prev, phone: text }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: `Got it. What is your designation?` });
          setStep('Designation');
        }, 500);
        break;

      case 'Designation':
        setFormData((prev) => ({ ...prev, designation: text }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: `Thank you. Please search and select your Industry/Location:`, isIndustrySearch: true });
          setStep('Industry');
        }, 500);
        break;

      case 'Industry':
        setFormData((prev) => ({ ...prev, industry: text }));
        setTimeout(async () => {
          try {
            const res = await fetch(`/api/lookupUnits?industry=${encodeURIComponent(text)}`);
            const json = await res.json();
            
            if (json.success && json.data) {
              setFormData((prev) => ({ ...prev, industryId: json.data.id }));
              appendMessage({
                sender: 'bot', 
                text: `Which affected units are you reporting for? You can select multiple.`,
                isMultiSelect: true,
                multiSelectOptions: json.data.units
              });
              setStep('Unit');
            } else {
              appendMessage({ 
                sender: 'bot', 
                text: 'We couldn\'t find specific units for that industry. Please select the type of issue you want to report:',
                options: ['Software Issue', 'Hardware Issue', 'Network Issue', 'Other']
              });
              setStep('IssueType');
            }
          } catch (e) {
            appendMessage({ 
              sender: 'bot', 
              text: 'Could not fetch units. Please select the type of issue you want to report:',
              options: ['Software Issue', 'Hardware Issue', 'Network Issue', 'Other']
            });
            setStep('IssueType');
          }
        }, 500);
        break;

      case 'Unit':
        // payload should contain the list of IDs
        if (payload && Array.isArray(payload)) {
          setFormData((prev) => ({ ...prev, unitIds: payload }));
        }
        setTimeout(() => {
          appendMessage({ 
            sender: 'bot', 
            text: 'Got it. Please select the type of issue you want to report:',
            options: ['Software Issue', 'Hardware Issue', 'Network Issue', 'Other']
          });
          setStep('IssueType');
        }, 500);
        break;

      case 'IssueType':
        setFormData((prev) => ({ ...prev, issueType: text }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: 'Can you provide a detailed description of the problem?' });
          setStep('Description');
        }, 500);
        break;

      case 'Description':
        setFormData((prev) => ({ ...prev, description: text }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: 'Almost done. Please upload a photo of the affected element. (Click the attachment icon next to the send button)' });
          setStep('Photo');
        }, 500);
        break;

      case 'Photo':
        // Store image base64 if it is an image, or handle text if they skipped or typed text
        const finalPhotoData = isImage ? text : '';
        setFormData((prev) => ({ ...prev, photoUrl: finalPhotoData }));
        
        setTimeout(async () => {
          appendMessage({ sender: 'bot', text: 'Submitting your issue ticket...' });
          try {
            const response = await fetch('/api/report-issue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...formData, description: formData.description, photoUrl: finalPhotoData }), // Include latest descriptions explicitly because state closure might be lagging in rapid async steps, but since we are awaiting, it's safer to build payload.
            });
            const data = await response.json();
            
            if (data.success) {
              appendMessage({ sender: 'bot', text: `✅ Your issue has been reported successfully!\n\nYour Ticket ID is: **${data.ticketId}**` });
            } else {
              appendMessage({ sender: 'bot', text: '❌ Failed to process the ticket on our end. Please try again later.' });
            }
          } catch (error) {
            appendMessage({ sender: 'bot', text: '❌ Sorry, there was a network error submitting your ticket.' });
          }
          setStep('Done');
        }, 1000);
        break;

      case 'Done':
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: 'If you have another issue, you can simply refresh the page to start over!' });
        }, 500);
        break;
    }
  };

  return {
    messages,
    handleSendMessage,
    isDone: step === 'Done',
    isAwaitingPhoto: step === 'Photo',
    isAwaitingIndustry: step === 'Industry',
  };
}
