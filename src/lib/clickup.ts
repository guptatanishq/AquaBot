// src/lib/clickup.ts

export const createClickUpTask = async (ticketData: any) => {
  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.CLICKUP_LIST_ID;

  if (!token || !listId) {
    console.warn("ClickUp API Token or List ID is missing. Skipping ClickUp integration.");
    return false;
  }

  const { id: ticketId, name, email, phone, industry, industryId, unitIds, issueType, issueOption, description, photoUrl, inaccuracyReason, missingTimeline, fileName } = ticketData;
  const combinedIssueDescription = [
    `Issue Type: ${issueType || 'Not provided'}`,
    `Issue Detail: ${issueOption || 'Not provided'}`,
    inaccuracyReason ? `Inaccuracy Explanation & Source: ${inaccuracyReason}` : null,
    missingTimeline ? `Missing Data Timeline: ${missingTimeline}` : null,
    `Issue Description: ${description || 'Not provided'}`,
  ].filter(Boolean).join('\n');

  const taskName = industry;
  
  const markdownDescription = `
**Ticket ID:** ${ticketId}
**Issue Description:**
> ${combinedIssueDescription.replace(/\n/g, '\n> ')}

**Customer Details:**
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

**Location Details:**
- Company/Industry: ${industry} (ID: ${industryId})
- Units Selected: ${Array.isArray(unitIds) ? unitIds.join(', ') : 'None'}

**Original User Description:**
> ${description || 'Not provided'}
  `.trim();

  try {
    // 1. Create the base Task in ClickUp with Custom Fields mapping
    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: taskName,
        description: markdownDescription,
        custom_fields: [
          {
            id: "032a2e7b-e702-4d08-8897-eab7b1071697", // Customer Name (mapped to Industry Name)
            value: industry
          },
          {
            id: "73e18315-dc82-4e05-afbc-9c39f829a87d", // Issue Description
            value: combinedIssueDescription
          },
          {
            id: "bee1e984-8c86-4f0c-9696-4540425c7b5a", // Email Address
            value: email
          },
          {
            id: "ae12edcb-0689-4f12-ac1e-c5d6a2c3dbc7", // Fluxgen Member
            value: name
          },
          {
            id: "4cade1b4-78a5-419b-a07f-382485d49b64", // Mobile Number
            value: phone.startsWith('+') ? phone : `+91${phone}`
          },
          {
            id: "d772fc7c-8980-479a-9664-9120142cfc41", // Ticket ID
            value: ticketId
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('ClickUp Task creation failed:', await response.text());
      return false;
    }

    const task = await response.json();
    const taskId = task.id;

    // 2. Upload the attachment if photoUrl exists
    if (photoUrl && photoUrl.startsWith('data:')) {
      // Extract the mime type and base64 string
      const matches = photoUrl.match(/^data:([^;]+);base64,(.*)$/);
      
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Native Node.js >= 18 Blob and FormData
        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        
        // Determine extension as a fallback
        let extension = 'bin';
        const mimeMap: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
          'video/mp4': 'mp4',
          'video/quicktime': 'mov',
          'application/pdf': 'pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'application/vnd.ms-excel': 'xls',
          'text/plain': 'txt',
          'text/csv': 'csv'
        };
        if (mimeMap[mimeType]) {
          extension = mimeMap[mimeType];
        } else {
          const parts = mimeType.split('/');
          if (parts.length === 2) {
            extension = parts[1].split(';')[0];
          }
        }
        
        const uploadName = fileName || `issue_file_${ticketId}.${extension}`;
        formData.append('attachment', blob, uploadName);

        const attachmentRes = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/attachment`, {
          method: 'POST',
          headers: {
            'Authorization': token
            // Content-Type is intentionally omitted so the browser/fetch dynamically generates the multipart boundary
          },
          body: formData
        });

        if (!attachmentRes.ok) {
          console.error("ClickUp Attachment upload failed:", await attachmentRes.text());
        }
      }
    }

    console.log(`ClickUp task successfully created with ID: ${taskId}`);
    return true;

  } catch (error) {
    console.error('Error in clickup integration:', error);
    return false;
  }
};
