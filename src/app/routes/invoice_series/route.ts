import { NextRequest, NextResponse } from "next/server";
import {
  getInvoiceSeries,
  getInvoiceSeriesById,
  addInvoiceSeries,
  updateInvoiceSeries,
  deleteInvoiceSeries
} from "@/app/utils/invoice_series";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const series = await getInvoiceSeriesById(id);
      return NextResponse.json(series);
    } else {
      const allSeries = await getInvoiceSeries();
      return NextResponse.json(allSeries);
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const series = await addInvoiceSeries(data);
    return NextResponse.json(series);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const data = await request.json();
    const series = await updateInvoiceSeries(id, data);
    return NextResponse.json(series);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    await deleteInvoiceSeries(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
