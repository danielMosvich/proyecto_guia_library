/**
 * Realistic SUNAT Electronic Delivery Guide (Guía de Remisión Electrónica Remitente - DespatchAdvice)
 * Containing realistic office/school supplies with different units (Unidades, Cajas, Paquetes, Botellas)
 * and packaging conversion patterns (CAX24, PQTX100, etc.)
 */
export const SAMPLE_DESPATCH_ADVICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
                xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
                xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>T108-00624402</cbc:ID>
  <cbc:IssueDate>2026-11-15</cbc:IssueDate>
  <cbc:IssueTime>08:45:00</cbc:IssueTime>
  <cbc:DespatchAdviceTypeCode>09</cbc:DespatchAdviceTypeCode>
  <cbc:Note>ENTREGA MERCADERIA ALMACEN CENTRAL - ORDEN DE COMPRA OC-2026-889</cbc:Note>

  <!-- Datos del Proveedor / Remitente -->
  <cac:DespatchSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20512345678</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[DISTRIBUIDORA NACIONAL DE UTILES Y SUMINISTROS S.A.C.]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DespatchSupplierParty>

  <!-- Datos del Destinatario -->
  <cac:DeliveryCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20609876543</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[COMERCIALIZADORA RETAIL LIMA S.R.L.]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DeliveryCustomerParty>

  <!-- Línea 1: Limpiatipos en Cajas x24 -->
  <cac:DespatchLine>
    <cbc:ID>1</cbc:ID>
    <cbc:DeliveredQuantity unitCode="BX">5</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>1</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description><![CDATA[LIMPIATIPOS ARTESCO COLOR AZUL CAX24]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[50974001]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>

  <!-- Línea 2: Limpiapipas Chenille Rojo en Paquetes x100 -->
  <cac:DespatchLine>
    <cbc:ID>2</cbc:ID>
    <cbc:DeliveredQuantity unitCode="PK">10</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>2</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description><![CDATA[LIMPIAPIPAS CHENILLE ROJO 30CM PQTX100 ARTESCO]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[50974002]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>

  <!-- Línea 3: Cuaderno Standford en Unidades sueltas -->
  <cac:DespatchLine>
    <cbc:ID>3</cbc:ID>
    <cbc:DeliveredQuantity unitCode="NIU">48</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>3</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description><![CDATA[CUADERNO ENGRAMPADO TRIPLE RENGLON 100H STANDFORD]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[50974003]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>

  <!-- Línea 4: Plumones de Pizarra en Cajas x12 -->
  <cac:DespatchLine>
    <cbc:ID>4</cbc:ID>
    <cbc:DeliveredQuantity unitCode="BX">4</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>4</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description><![CDATA[PLUMON PARA PIZARRA ACRILICA COLOR NEGRO ARTESCO CAX12]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[50974004]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>

  <!-- Línea 5: Tijeras Escolares en Unidades -->
  <cac:DespatchLine>
    <cbc:ID>5</cbc:ID>
    <cbc:DeliveredQuantity unitCode="NIU">36</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>5</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description><![CDATA[TIJERA ESCOLAR PUNTA ROMA 5 PULGADAS FABER-CASTELL]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[50974005]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>

  <!-- Línea 6: Goma en barra Display x12 en Caja -->
  <cac:DespatchLine>
    <cbc:ID>6</cbc:ID>
    <cbc:DeliveredQuantity unitCode="BX">6</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>6</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description><![CDATA[GOMA EN BARRA GLUE STICK 40GR PEGAFAN DISPX12]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[50974006]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>

  <!-- Línea 7: Papel Bond A4 Millar en Paquetes x500 -->
  <cac:DespatchLine>
    <cbc:ID>7</cbc:ID>
    <cbc:DeliveredQuantity unitCode="PK">8</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>7</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description><![CDATA[PAPEL BOND A4 75GR REPORT MILLAR PQTX500 HOJAS]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[50974007]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>

  <!-- Línea 8: Silicona Líquida en Botellas -->
  <cac:DespatchLine>
    <cbc:ID>8</cbc:ID>
    <cbc:DeliveredQuantity unitCode="BO">24</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>8</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description><![CDATA[SILICONA LIQUIDA 250ML ARTESCO CON DOSIFICADOR]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[50974008]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>
</DespatchAdvice>`;

/**
 * Realistic SUNAT Electronic Invoice (Factura Electrónica - Invoice)
 * Demonstrating automatic detection, prices extraction and compatibility with future POS.
 */
export const SAMPLE_INVOICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>F001-00089234</cbc:ID>
  <cbc:IssueDate>2026-11-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="0101">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>

  <!-- Proveedor Emisor -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20100123456</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[IMPORTACIONES Y PAPELERIA INDUSTRIAL PERU S.A.]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Cliente Receptor -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20609876543</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[COMERCIALIZADORA RETAIL LIMA S.R.L.]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Línea 1: Cintas Adhesivas de Embalaje -->
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="BX">12</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">720.00</cbc:LineExtensionAmount>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">60.00</cbc:PriceAmount>
    </cac:Price>
    <cac:Item>
      <cbc:Description><![CDATA[CINTA DE EMBALAJE TRANSPARENTE 2X110 YARDAS PEGAFAN CAX36]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[7751234001]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:InvoiceLine>

  <!-- Línea 2: Archivadores de Palanca -->
  <cac:InvoiceLine>
    <cbc:ID>2</cbc:ID>
    <cbc:InvoicedQuantity unitCode="NIU">50</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">425.00</cbc:LineExtensionAmount>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">8.50</cbc:PriceAmount>
    </cac:Price>
    <cac:Item>
      <cbc:Description><![CDATA[ARCHIVADOR DE PALANCA LOMO ANCHO OFICIO COLOR NEGRO FORTE]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[7751234002]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:InvoiceLine>

  <!-- Línea 3: Grapas 26/6 en Cajas -->
  <cac:InvoiceLine>
    <cbc:ID>3</cbc:ID>
    <cbc:InvoicedQuantity unitCode="BX">20</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">70.00</cbc:LineExtensionAmount>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">3.50</cbc:PriceAmount>
    </cac:Price>
    <cac:Item>
      <cbc:Description><![CDATA[GRAPAS COBREADAS 26/6 CAX5000 RAPID]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID><![CDATA[7751234003]]></cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:InvoiceLine>
</Invoice>`;
