import React from "react";
import { Card, CardBody, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";

interface DDTItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  weight: number;
  unit_price: number;
  total_price: number;
  serial_numbers?: string[];
  notes?: string;
}

interface DDT {
  ddt_id: string;
  ddt_number: string;
  date: string;
  vehicle_id: string;
  vehicle_name: string;
  vehicle_plate: string;
  driver_name: string;
  driver_phone?: string;
  departure_address: string;
  destination_address: string;
  customer_name: string;
  customer_vat?: string;
  customer_phone?: string;
  items: DDTItem[];
  total_weight: number;
  total_value: number;
  status: "draft" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  departure_time?: string;
  arrival_time?: string;
  delivery_notes?: string;
  signature_path?: string;
  created_at: string;
  updated_at: string;
}

interface DDTPrintViewProps {
  ddt: DDT;
  companyInfo?: {
    name: string;
    address: string;
    vat: string;
    phone: string;
    email: string;
  };
}

export default function DDTPrintView({ ddt, companyInfo }: DDTPrintViewProps) {
  const currentDate = new Date().toLocaleDateString('it-IT');
  const currentTime = new Date().toLocaleTimeString('it-IT', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Default company info if not provided
  const defaultCompanyInfo = {
    name: "CosmicHub Termoidraulica",
    address: "Via Roma 123, 20121 Milano (MI)",
    vat: "IT12345678901",
    phone: "+39 02 1234567",
    email: "info@cosmichub.it",
  };

  const company = companyInfo || defaultCompanyInfo;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black print:shadow-none">
      {/* Print Button - Hidden when printing */}
      <div className="mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Icon icon="solar:printer-bold" width={20} />
          Stampa DDT
        </button>
      </div>

      <div className="p-8 print:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              DOCUMENTO DI TRASPORTO
            </h1>
            <div className="text-lg font-semibold">
              N. {ddt.ddt_number}
            </div>
            <div className="text-sm text-gray-600">
              Data emissione: {new Date(ddt.date).toLocaleDateString('it-IT')}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="solar:rocket-2-bold" className="text-primary" width={24} />
              <span className="text-xl font-bold text-primary">CosmicHub</span>
            </div>
            <div className="text-sm text-gray-600">
              Stampato il {currentDate} alle {currentTime}
            </div>
          </div>
        </div>

        {/* Company and Customer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Mittente */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary border-b border-primary pb-1">
              MITTENTE
            </h3>
            <div className="space-y-1">
              <div className="font-semibold">{company.name}</div>
              <div>{company.address}</div>
              <div>P.IVA: {company.vat}</div>
              <div>Tel: {company.phone}</div>
              <div>Email: {company.email}</div>
            </div>
          </div>

          {/* Destinatario */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary border-b border-primary pb-1">
              DESTINATARIO
            </h3>
            <div className="space-y-1">
              <div className="font-semibold">{ddt.customer_name}</div>
              <div>{ddt.destination_address}</div>
              {ddt.customer_vat && <div>P.IVA: {ddt.customer_vat}</div>}
              {ddt.customer_phone && <div>Tel: {ddt.customer_phone}</div>}
            </div>
          </div>
        </div>

        {/* Transport Info */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-primary border-b border-primary pb-1">
            INFORMAZIONI TRASPORTO
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="font-semibold text-sm text-gray-600">VEICOLO</div>
              <div>{ddt.vehicle_name}</div>
              <div className="text-sm text-gray-600">Targa: {ddt.vehicle_plate}</div>
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-600">AUTISTA</div>
              <div>{ddt.driver_name}</div>
              {ddt.driver_phone && (
                <div className="text-sm text-gray-600">Tel: {ddt.driver_phone}</div>
              )}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-600">ORARI</div>
              {ddt.departure_time && (
                <div className="text-sm">Partenza: {ddt.departure_time}</div>
              )}
              {ddt.arrival_time && (
                <div className="text-sm">Arrivo: {ddt.arrival_time}</div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-primary border-b border-primary pb-1">
            PRODOTTI TRASPORTATI
          </h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">
                  DESCRIZIONE
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">
                  CODICE SKU
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">
                  QUANTITÀ
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">
                  PESO (kg)
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">
                  VALORE €
                </th>
              </tr>
            </thead>
            <tbody>
              {ddt.items.map((item, index) => (
                <tr key={index} className="even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="font-medium">{item.product_name}</div>
                    {item.serial_numbers && item.serial_numbers.length > 0 && (
                      <div className="text-xs text-gray-600">
                        Seriali: {item.serial_numbers.join(', ')}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-gray-600">
                        Note: {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {item.sku}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {(item.weight * item.quantity).toFixed(1)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    €{item.total_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-semibold">
                <td className="border border-gray-300 px-3 py-2" colSpan={2}>
                  TOTALI
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {ddt.items.reduce((sum, item) => sum + item.quantity, 0)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {ddt.total_weight.toFixed(1)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  €{ddt.total_value.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-2 text-primary">LUOGO DI PARTENZA</h4>
            <div className="text-sm border border-gray-300 p-3 rounded bg-gray-50">
              {ddt.departure_address}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-primary">LUOGO DI DESTINAZIONE</h4>
            <div className="text-sm border border-gray-300 p-3 rounded bg-gray-50">
              {ddt.destination_address}
            </div>
          </div>
        </div>

        {/* Delivery Notes */}
        {ddt.delivery_notes && (
          <div className="mb-8">
            <h4 className="font-semibold mb-2 text-primary">NOTE DI CONSEGNA</h4>
            <div className="text-sm border border-gray-300 p-3 rounded bg-gray-50">
              {ddt.delivery_notes}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-12">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <div className="font-semibold text-sm">FIRMA MITTENTE</div>
              <div className="text-xs text-gray-600">
                {company.name}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <div className="font-semibold text-sm">FIRMA VETTORE</div>
              <div className="text-xs text-gray-600">
                {ddt.driver_name}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <div className="font-semibold text-sm">FIRMA DESTINATARIO</div>
              <div className="text-xs text-gray-600">
                {ddt.customer_name}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-gray-600 text-center">
          <div className="mb-2">
            Documento di trasporto emesso ai sensi del D.P.R. 472/96 e successive modificazioni
          </div>
          <div>
            Le merci viaggiano a rischio e pericolo del committente. Il vettore non risponde di 
            ritardi dovuti a cause di forza maggiore.
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          
          @page {
            margin: 1cm;
            size: A4;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
} 