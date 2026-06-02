import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { providerToken, name, amount, date, type, id } = await req.json();

    if (!providerToken) {
      return NextResponse.json({ error: "Missing Google authorization token." }, { status: 401 });
    }

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

    const isExpense = type === 'expense';
    const summary = `${isExpense ? '🔴 Pay EMI' : '🟢 Receive'} : ${name} (${formattedAmount})`;
    const description = `This is an automated reminder from your Prosper EMI & Expense Tracker app.\n\nTransaction details:\n- ID: ${id}\n- Name: ${name}\n- Amount: ${formattedAmount}\n- Due Date: ${date}\n- Type: ${isExpense ? 'Outflow (Bill / EMI)' : 'Inflow (Salary / Income)'}\n\nPlease mark this payment settled in the Prosper app once completed.`;

    const event = {
      summary,
      description,
      start: {
        date: date, // YYYY-MM-DD format (All-day event)
      },
      end: {
        date: date,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 1440 }, // 1 day before
          { method: "email", minutes: 1440 }, // 1 day before
        ],
      },
    };

    const googleRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    const data = await googleRes.json();

    if (!googleRes.ok) {
      console.error("Google Calendar Error:", data);
      return NextResponse.json({ error: data.error?.message || "Google Calendar sync failed." }, { status: googleRes.status });
    }

    return NextResponse.json({ eventId: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("event_id");
    const providerToken = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!eventId || !providerToken) {
      return NextResponse.json({ error: "Missing event ID or access token." }, { status: 400 });
    }

    const googleRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!googleRes.ok && googleRes.status !== 404) {
      const data = await googleRes.json();
      return NextResponse.json({ error: data.error?.message || "Google Calendar delete failed." }, { status: googleRes.status });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
