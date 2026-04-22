import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { sendTicketConfirmationEmail } from '@/lib/email';

let lastDateString = '';
let dailyCounter = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, designation, industry, industryId, unitIds, issueType, description, photoUrl } = body;

    // Generate Ticket ID without slashes: ddmmyy01
    const todayStr = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(new Date());

    if (todayStr !== lastDateString) {
      lastDateString = todayStr;
      dailyCounter = 1;
    } else {
      dailyCounter++;
    }

    const unSlashedDate = todayStr.replace(/\//g, ''); // Converts dd/mm/yy to ddmmyy
    const ticketId = `${unSlashedDate}${dailyCounter.toString().padStart(2, '0')}`;

    console.log('--- NEW TICKET GENERATED ---');
    console.log(`Ticket ID: ${ticketId}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`Designation: ${designation}`);
    console.log(`Industry: ${industry} (ID: ${industryId})`);
    console.log(`Units Selected: ${Array.isArray(unitIds) ? unitIds.join(', ') : 'None'}`);
    console.log(`Issue Type: ${issueType}`);
    console.log(`Description: ${description}`);
    console.log(`Photo Uploaded: ${photoUrl ? 'Yes (base64 string)' : 'No'}`);
    console.log('----------------------------');

    // Create ticket object
    const newTicketData = {
      id: ticketId,
      name,
      email,
      phone,
      designation,
      industry,
      industryId,
      unitIds: Array.isArray(unitIds) ? unitIds : [],
      issueType,
      description,
      photoUrl,
      timestamp: new Date().toISOString(),
    };

    // Save ticket data to a JSON file (Acting as a mock database)
    const filePath = path.join(process.cwd(), 'tickets.json');
    let existingTickets = [];
    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      existingTickets = JSON.parse(fileData);
    } catch {
      // File doesn't exist yet, we will create it
    }

    existingTickets.push(newTicketData);
    await fs.writeFile(filePath, JSON.stringify(existingTickets, null, 2), 'utf-8');

    // Simulate network processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Send confirmation email if email was provided
    if (email) {
      await sendTicketConfirmationEmail(email, name, ticketId, description);
    }

    return NextResponse.json({ success: true, ticketId }, { status: 200 });
  } catch (error) {
    console.error('Error reporting issue:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
