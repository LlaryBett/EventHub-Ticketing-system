import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10, // frames per second for scanning
        qrbox: { width: 250, height: 250 }, // scanning box size
      },
      false
    );

    scanner.render(
      (decodedText, decodedResult) => {
        if (onScanSuccess) onScanSuccess(decodedText, decodedResult);
      },
      (errorMessage) => {
        if (onScanError) onScanError(errorMessage);
      }
    );

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [onScanSuccess, onScanError]);

  return <div id="qr-reader" ref={scannerRef} />;
};

export default QRScanner;
