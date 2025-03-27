import { NextRequest, NextResponse } from "next/server";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  generateInvoiceNumber
} from "@/app/utils/invoices";
import { getNextInvoiceNumber, updateSeriesInvoiceCount } from "@/app/utils/invoice_series";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const invoice = await getInvoiceById(id);
      return NextResponse.json(invoice);
    } else {
      const status = searchParams.get('status');
      const client_id = searchParams.get('client_id');
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const search = searchParams.get('search') || undefined;
      const sort_by = searchParams.get('sort_by') || undefined;
      const sort_order = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';
      const result = await getInvoices({
        status: status || undefined,
        client_id: client_id || undefined,
        limit: limit,
        offset: offset,
        search: search || undefined,
        sort_by,
        sort_order
      });
      
      return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const invoice = await createInvoice(data);
    return NextResponse.json(invoice);
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
    
    const status = searchParams.get('status');
    
    // If we're updating the status, use the utility function
    if (status && ['draft', 'final', 'submitted'].includes(status)) {
      const success = await updateInvoiceStatus(id, status as any);
      return NextResponse.json({ success });
    } else {
      // Otherwise, update the invoice with the provided data
      const data = await request.json();
      const invoice = await updateInvoice(id, data);
      return NextResponse.json(invoice);
    }
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
    
    await deleteInvoice(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
