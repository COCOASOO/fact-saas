import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { Invoice } from "@/app/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils/invoice-calculations";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 8,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  totalLabel: {
    width: 150,
    textAlign: "right",
    marginRight: 10,
  },
  totalValue: {
    width: 100,
    textAlign: "right",
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>FACTURA</Text>
          <Text>Nº: {invoice.invoice_number}</Text>
          <Text>Fecha: {formatDate(invoice.invoice_date)}</Text>
        </View>
        {/* Removemos temporalmente el logo */}
      </View>

      {/* Información de la empresa */}
      <View style={styles.section}>
        <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
          Datos del Emisor
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Empresa:</Text>
          <Text style={styles.value}>{invoice.company?.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>NIF:</Text>
          <Text style={styles.value}>{invoice.company?.nif}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dirección:</Text>
          <Text style={styles.value}>
            {invoice.company?.address}, {invoice.company?.postcode}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ciudad:</Text>
          <Text style={styles.value}>
            {invoice.company?.city}, {invoice.company?.country}
          </Text>
        </View>
      </View>

      {/* Información del Cliente */}
      <View style={styles.section}>
        <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
          Datos del Cliente
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>{invoice.client?.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>NIF:</Text>
          <Text style={styles.value}>{invoice.client?.nif}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dirección:</Text>
          <Text style={styles.value}>
            {invoice.client?.address}, {invoice.client?.postcode}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ciudad:</Text>
          <Text style={styles.value}>
            {invoice.client?.city}, {invoice.client?.country}
          </Text>
        </View>
      </View>

      {/* Detalles Económicos */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Base Imponible:</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(invoice.subtotal || 0)} {invoice.currency}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            IVA ({invoice.tax_rate || 0}%):
          </Text>
          <Text style={styles.totalValue}>
            {formatCurrency(invoice.tax_amount || 0)} {invoice.currency}
          </Text>
        </View>
        {(invoice.irpf_rate || 0) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              IRPF ({invoice.irpf_rate || 0}%):
            </Text>
            <Text style={styles.totalValue}>
              -{formatCurrency(invoice.irpf_amount || 0)} {invoice.currency}
            </Text>
          </View>
        )}
        <View style={{ ...styles.totalRow, marginTop: 10 }}>
          <Text style={{ ...styles.totalLabel, fontWeight: "bold" }}>
            TOTAL:
          </Text>
          <Text style={{ ...styles.totalValue, fontWeight: "bold" }}>
            {formatCurrency(invoice.total_amount || 0)} {invoice.currency}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);