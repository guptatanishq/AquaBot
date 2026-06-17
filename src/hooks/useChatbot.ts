import { useState, useEffect, useRef } from 'react';

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

type ChatStep = 'Name' | 'Industry' | 'Unit' | 'Email' | 'Phone' | 'IssueType' | 'IssueOption' | 'Description' | 'Photo' | 'Done';

export function useChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ChatStep>('Name');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    industry: '',
    industryId: '',
    unitIds: [] as string[],
    issueType: '',
    issueOption: '',
    description: '',
    photoUrl: '', // base64
  });
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

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

  const handleSendMessage = async (text: string, isImage: boolean = false, _payload?: any) => {
    // Determine what user visually sent
    if (isImage) {
      appendMessage({ sender: 'user', text: text, isImage: true });
    } else {
      appendMessage({ sender: 'user', text });
    }

    // State machine logic
    switch (step) {
      case 'Name':
        setFormData((prev) => ({ ...prev, name: text.trim() }));
        setTimeout(() => {
          appendMessage({
            sender: 'bot',
            text: `Thanks, ${text}. Please search and select your company or industry.`,
            isIndustrySearch: true,
          });
          setStep('Industry');
        }, 500);
        break;

      case 'Industry':
        setFormData((prev) => ({ ...prev, industry: text.trim() }));
        setTimeout(async () => {
          try {
            const res = await fetch(`/api/lookupUnits?industry=${encodeURIComponent(text.trim())}`);
            const json = await res.json();

            if (json.success && json.data) {
              setFormData((prev) => ({ ...prev, industryId: json.data.id }));
              appendMessage({
                sender: 'bot',
                text: 'Which affected units are you reporting for? You can select multiple.',
                isMultiSelect: true,
                multiSelectOptions: json.data.units,
              });
              setStep('Unit');
              return;
            }
          } catch {
            // fall through to email when lookup fails
          }

          appendMessage({ sender: 'bot', text: 'Please share your email address.' });
          setStep('Email');
        }, 500);
        break;

      case 'Unit':
        if (_payload && Array.isArray(_payload)) {
          setFormData((prev) => ({ ...prev, unitIds: _payload }));
        }
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: 'Please share your email address.' });
          setStep('Email');
        }, 500);
        break;

      case 'Email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text.trim())) {
          setTimeout(() => {
            appendMessage({ sender: 'bot', text: "That doesn't look like a valid email. Please enter a correct email address." });
          }, 300);
          return;
        }
        setFormData((prev) => ({ ...prev, email: text.trim() }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: 'Please enter your phone number.' });
          setStep('Phone');
        }, 500);
        break;
      }

      case 'Phone':
        setFormData((prev) => ({ ...prev, phone: text.trim() }));
        setTimeout(() => {
          appendMessage({
            sender: 'bot',
            text: "Pick the option that best describes what you're seeing:",
            options: Object.keys(issueBuckets),
          });
          setStep('IssueType');
        }, 500);
        break;

      case 'IssueType':
        setFormData((prev) => ({ ...prev, issueType: text }));
        setTimeout(() => {
          appendMessage({
            sender: 'bot',
            text: 'Please choose the closest issue detail for better clarity:',
            options: issueBuckets[text] || ['Other'],
          });
          setStep('IssueOption');
        }, 500);
        break;

      case 'IssueOption':
        setFormData((prev) => ({ ...prev, issueOption: text }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: 'Please describe what is happening in your own words.' });
          setStep('Description');
        }, 500);
        break;

      case 'Description':
        setFormData((prev) => ({ ...prev, description: text.trim() }));
        setTimeout(() => {
          appendMessage({ sender: 'bot', text: 'Almost done. Please upload an image or video of the issue (optional). You can also skip this step.' });
          setStep('Photo');
        }, 500);
        break;

      case 'Photo':
        // Store image base64 if it is an image, or handle text if they skipped or typed text
        const finalPhotoData = isImage ? text : '';
        const ticketPayload = { ...formDataRef.current, photoUrl: finalPhotoData };
        setFormData(ticketPayload);
        
        setTimeout(async () => {
          appendMessage({ sender: 'bot', text: 'Submitting your issue ticket...' });
          try {
            const response = await fetch('/api/report-issue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ticketPayload),
            });
            const data = await response.json();
            
            if (data.success) {
              appendMessage({ sender: 'bot', text: `✅ Your issue has been reported successfully!\n\nYour Ticket ID is: **${data.ticketId}**.\n\nWe have shared a copy of this ticket and the issue details through email as well.` });
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
