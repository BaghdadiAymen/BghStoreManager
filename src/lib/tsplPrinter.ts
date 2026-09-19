/**
 * TSPL (TSC Thermal Printer Command Language) Generator & WebUSB Utility
 * Specifically designed for 203 DPI Thermal Label Printers (Xprinter, Gprinter, TSC, etc.)
 */

export interface TSPLPrintOptions {
  storeName: string;
  productName: string;
  priceFormatted: string;
  qrId: string;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  copies: number;
  direction: 0 | 1; // 0: normal, 1: reverse 180°
  layout: 'side-by-side' | 'stacked';
}

/**
 * Generate native TSPL commands string
 * 203 DPI = 8 dots per mm
 */
export function generateTSPLCommands(options: TSPLPrintOptions): string {
  const {
    storeName,
    productName,
    priceFormatted,
    qrId,
    widthMm,
    heightMm,
    gapMm,
    copies,
    direction,
    layout
  } = options;

  // Clean strings for TSPL
  const cleanStore = storeName.replace(/"/g, "'").slice(0, 24);
  const cleanName = productName.replace(/"/g, "'").slice(0, 30);
  const cleanPrice = priceFormatted.replace(/"/g, "'");
  const cleanId = qrId.replace(/"/g, "'");

  const lines: string[] = [];

  // Page setup
  lines.push(`SIZE ${widthMm} mm, ${heightMm} mm`);
  lines.push(`GAP ${gapMm} mm, 0 mm`);
  lines.push(`DIRECTION ${direction}`);
  lines.push(`CLS`);

  if (layout === 'side-by-side') {
    // 40x20mm or 50x30mm side-by-side layout: QR on left, text on right
    // 203 DPI coordinates (8 dots/mm)
    const qrSize = heightMm <= 25 ? 3 : 4; // QR code cell width
    const qrX = 16;
    const qrY = 16;
    const textX = Math.round(widthMm * 8 * 0.42); // start text around 42% of width

    // Draw QR Code: QRCODE x,y,Ecc,cell_width,mode,rotation,"data"
    lines.push(`QRCODE ${qrX},${qrY},M,${qrSize},A,0,"${cleanId}"`);

    // Store Name header
    lines.push(`TEXT ${textX},12,"2",0,1,1,"${cleanStore}"`);
    lines.push(`BAR ${textX},30,${Math.round(widthMm * 8 - textX - 16)},1`);

    // Product Name (Font 2 or 1 depending on height)
    lines.push(`TEXT ${textX},36,"2",0,1,1,"${cleanName}"`);

    // Product ID
    lines.push(`TEXT ${textX},68,"1",0,1,1,"ID: ${cleanId}"`);

    // Price box / text
    if (heightMm >= 25) {
      lines.push(`BOX ${textX},95,${Math.round(widthMm * 8 - 16)},135,2`);
      lines.push(`TEXT ${textX + 10},105,"3",0,1,1,"${cleanPrice}"`);
    } else {
      lines.push(`TEXT ${textX},92,"3",0,1,1,"${cleanPrice}"`);
    }
  } else {
    // Stacked layout (centered)
    const centerX = Math.round((widthMm * 8) / 2);
    lines.push(`TEXT 16,10,"2",0,1,1,"${cleanStore}"`);
    lines.push(`BAR 16,28,${Math.round(widthMm * 8 - 32)},1`);
    lines.push(`QRCODE ${centerX - 40},35,M,3,A,0,"${cleanId}"`);
    lines.push(`TEXT 16,${Math.round(heightMm * 8 - 60)},"2",0,1,1,"${cleanName}"`);
    lines.push(`TEXT 16,${Math.round(heightMm * 8 - 35)},"1",0,1,1,"ID: ${cleanId}"`);
    lines.push(`TEXT 16,${Math.round(heightMm * 8 - 20)},"3",0,1,1,"${cleanPrice}"`);
  }

  // Print copies
  lines.push(`PRINT ${copies},1`);
  lines.push('');

  return lines.join('\r\n');
}

/**
 * Send raw TSPL commands directly to USB thermal printer via WebUSB
 */
export async function sendTSPLToWebUSB(tsplCommand: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!('usb' in navigator)) {
      return {
        success: false,
        message: 'WebUSB is not supported in this browser. Please use Chrome, Edge or Opera on Windows.'
      };
    }

    // Request USB device from user
    const device = await (navigator as any).usb.requestDevice({
      filters: [] // Allow user to select any connected USB printer
    });

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);

    // Find OUT endpoint for bulk transfer
    const endpoint = device.configuration.interfaces[0].alternates[0].endpoints.find(
      (e: any) => e.direction === 'out'
    );

    if (!endpoint) {
      return { success: false, message: 'Could not find printer USB write endpoint.' };
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(tsplCommand);

    await device.transferOut(endpoint.endpointNumber, data);
    await device.close();

    return { success: true, message: 'Label sent to thermal printer successfully via USB!' };
  } catch (err: any) {
    console.error('WebUSB error:', err);
    if (err.name === 'NotFoundError') {
      return { success: false, message: 'No USB device was selected.' };
    }
    return { success: false, message: err.message || 'Failed to send data to USB printer.' };
  }
}

/**
 * Send raw TSPL commands via WebSerial (COM / USB-Serial ports)
 */
export async function sendTSPLToWebSerial(tsplCommand: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!('serial' in navigator)) {
      return {
        success: false,
        message: 'WebSerial is not supported in this browser. Please use Chrome, Edge or Opera.'
      };
    }

    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });

    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    await writer.write(encoder.encode(tsplCommand));
    writer.releaseLock();
    await port.close();

    return { success: true, message: 'Label sent to serial/USB printer successfully!' };
  } catch (err: any) {
    console.error('WebSerial error:', err);
    if (err.name === 'NotFoundError') {
      return { success: false, message: 'No serial port was selected.' };
    }
    return { success: false, message: err.message || 'Failed to send data to serial port.' };
  }
}
