import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { sendTicketConfirmationEmail } from '@/lib/email';

import { createClickUpTask } from '@/lib/clickup';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, industry, industryId, unitIds, issueType, issueOption, description, photoUrl, inaccuracyReason, missingTimeline, fileName } = body;

    // Generate Ticket ID without slashes: ddmmyy01
    const todayStr = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(new Date());

    const unSlashedDate = todayStr.replace(/\//g, ''); // Converts dd/mm/yy to ddmmyy

    // Read JSON file first to determine the exact sequential counter for today
    const filePath = path.join(process.cwd(), 'tickets.json');
    let existingTickets: any[] = [];
    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      existingTickets = JSON.parse(fileData);
    } catch {
      // File doesn't exist yet, which means 0 tickets today
    }

    // Filter to find how many tickets ALREADY exist specifically for today
    const todaysTickets = existingTickets.filter((t: any) => t.id && t.id.startsWith(unSlashedDate));
    const dailyCounter = todaysTickets.length + 1;

    const ticketId = `${unSlashedDate}${dailyCounter.toString().padStart(2, '0')}`;

    console.log('--- NEW TICKET GENERATED ---');
    console.log(`Ticket ID: ${ticketId}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`Industry: ${industry} (ID: ${industryId})`);
    console.log(`Units Selected: ${Array.isArray(unitIds) ? unitIds.join(', ') : 'None'}`);
    console.log(`Issue Type: ${issueType}`);
    console.log(`Issue Detail: ${issueOption}`);
    if (inaccuracyReason) console.log(`Inaccuracy Reason: ${inaccuracyReason}`);
    if (missingTimeline) console.log(`Missing Timeline: ${missingTimeline}`);
    console.log(`Description: ${description}`);
    console.log(`Photo Uploaded: ${photoUrl ? 'Yes (base64 string)' : 'No'}`);
    if (fileName) console.log(`File Name: ${fileName}`);
    console.log('----------------------------');

    // Create ticket object
    const newTicketData = {
      id: ticketId,
      name,
      email,
      phone,
      industry,
      industryId,
      unitIds: Array.isArray(unitIds) ? unitIds : [],
      issueType,
      issueOption,
      inaccuracyReason: inaccuracyReason || '',
      missingTimeline: missingTimeline || '',
      description,
      photoUrl,
      fileName: fileName || '',
      timestamp: new Date().toISOString(),
    };

    // Save ticket data to a JSON file (Acting as a mock database)
    // We already read existingTickets to calculate the dailyCounter above
    existingTickets.push(newTicketData);
    await fs.writeFile(filePath, JSON.stringify(existingTickets, null, 2), 'utf-8');

    // Send confirmation email asynchronously (do not await)
    if (email) {
      sendTicketConfirmationEmail(email, name, ticketId, description).catch((err) => {
        console.error('Background email failed:', err);
      });
    }

    // Push data to ClickUp asynchronously
    createClickUpTask(newTicketData).catch((err) => {
      console.error('Background ClickUp sync failed:', err);
    });

    return NextResponse.json({ success: true, ticketId }, { status: 200 });
  } catch (error) {
    console.error('Error reporting issue:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
