"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface CertificateProps {
  certificate: {
    id: string;
    type: string;
    purpose: string;
    status: string;
    requestDate: string;
    releaseDate: string | null;
    resident: {
      firstName: string;
      lastName: string;
      middleName: string | null;
      birthDate: string;
      gender: string;
      civilStatus: string;
      household: { address: string; purok: string };
    };
    issuedBy: { name: string } | null;
  };
}

const typeLabels: Record<string, string> = {
  CLEARANCE: "BARANGAY CLEARANCE",
  RESIDENCY: "CERTIFICATE OF RESIDENCY",
  INDIGENCY: "CERTIFICATE OF INDIGENCY",
  BUSINESS_PERMIT: "BUSINESS PERMIT CERTIFICATE",
};

export function CertificatePDF({ certificate }: CertificateProps) {
  const c = certificate;
  const r = c.resident;
  const fullName = `${r.lastName}, ${r.firstName}${r.middleName ? ` ${r.middleName}` : ""}`;
  const birthDate = new Date(r.birthDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  const [qrUrl, setQrUrl] = useState("");
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    QRCode.toDataURL(`${origin}/verify/${c.id}`, { width: 80, margin: 1 }).then(setQrUrl).catch(() => {});
  }, [c.id]);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#fff",
        width: "8.5in",
        minHeight: "11in",
        padding: "1in 1.2in",
        fontFamily: '"Times New Roman", Times, serif',
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Seal watermark - security */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.04,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/barangay-seal.png" alt="" style={{ width: 350, height: 350, objectFit: "contain" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/barangay-seal.png" alt="Seal" style={{ width: 90, height: 90, objectFit: "contain" }} />
          </div>
          <p style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1.5, margin: 0 }}>Republic of the Philippines</p>
          <p style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1.5, margin: 0 }}>City of Victorias</p>
          <p style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1.5, margin: 0 }}>Negros Occidental</p>
          <p style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginTop: 12 }}>
            Office of the Barangay IX - Daan Banwa
          </p>
        </div>

        {/* Title */}
        <h2
          style={{
            textAlign: "center",
            fontSize: 20,
            fontWeight: 700,
            textTransform: "uppercase",
            textDecoration: "underline",
            marginBottom: 40,
          }}
        >
          {typeLabels[c.type] || c.type}
        </h2>

        {/* Body */}
        <div style={{ fontSize: 15, lineHeight: 2, marginBottom: 60 }}>
          {c.type === "CLEARANCE" && (
            <>
              <p>TO WHOM IT MAY CONCERN:</p>
              <p style={{ textAlign: "justify", textIndent: 48 }}>
                This is to certify that <strong>{fullName}</strong>, of legal age, Filipino, and a resident of{" "}
                <strong>{r.household.address}, Purok {r.household.purok}</strong>, this barangay, is a person of good
                moral character and has no pending case or criminal record in this barangay as of this date.
              </p>
              <p style={{ textAlign: "justify", textIndent: 48 }}>
                This certification is being issued at the request of the interested party for{" "}
                <strong>{c.purpose}</strong>.
              </p>
            </>
          )}
          {c.type === "RESIDENCY" && (
            <>
              <p>TO WHOM IT MAY CONCERN:</p>
              <p style={{ textAlign: "justify", textIndent: 48 }}>
                This is to certify that <strong>{fullName}</strong>, {birthDate}, {r.gender.toLowerCase()},{" "}
                {r.civilStatus.toLowerCase()}, Filipino, is a bonafide resident of{" "}
                <strong>{r.household.address}, Purok {r.household.purok}</strong>, Barangay IX - Daan Banwa,
                City of Victorias, Negros Occidental.
              </p>
              <p style={{ textAlign: "justify", textIndent: 48 }}>
                This certification is issued upon request of the interested party for{" "}
                <strong>{c.purpose}</strong>.
              </p>
            </>
          )}
          {c.type === "INDIGENCY" && (
            <>
              <p>TO WHOM IT MAY CONCERN:</p>
              <p style={{ textAlign: "justify", textIndent: 48 }}>
                This is to certify that <strong>{fullName}</strong>, of legal age, Filipino, and a resident of{" "}
                <strong>{r.household.address}, Purok {r.household.purok}</strong>, this barangay, belongs to an
                indigent family and is considered a beneficiary of the barangay&apos;s social welfare programs.
              </p>
              <p style={{ textAlign: "justify", textIndent: 48 }}>
                This certification is being issued at the request of the interested party for{" "}
                <strong>{c.purpose}</strong>.
              </p>
            </>
          )}
          {c.type === "BUSINESS_PERMIT" && (
            <>
              <p>TO WHOM IT MAY CONCERN:</p>
              <p style={{ textAlign: "justify", textIndent: 48 }}>
                This is to certify that <strong>{fullName}</strong> has been granted permission to operate a business
                establishment within the jurisdiction of Barangay IX - Daan Banwa, City of Victorias, Negros Occidental,
                subject to the terms and conditions provided under existing barangay ordinances.
              </p>
              <p style={{ textAlign: "justify", textIndent: 48 }}>
                This certificate is issued for <strong>{c.purpose}</strong>.
              </p>
            </>
          )}
        </div>

        {/* Signatures */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 60 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 600 }}>Prepared by:</p>
            <div style={{ marginTop: 60, borderTop: "1px solid #94a3b8", paddingTop: 4, minWidth: 180 }}>
              <p style={{ fontWeight: 600 }}>Secretary</p>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 600 }}>Approved by:</p>
            <div style={{ marginTop: 60, borderTop: "1px solid #94a3b8", paddingTop: 4, minWidth: 180 }}>
              <p style={{ fontWeight: 600 }}>Barangay Captain</p>
            </div>
          </div>
        </div>

        {/* QR Verification */}
        <div style={{ position: "absolute", bottom: 40, left: 50, textAlign: "center" }}>
          {qrUrl && <img src={qrUrl} alt="Verify" style={{ width: 70, height: 70 }} />}
          <p style={{ fontSize: 8, color: "#94a3b8", marginTop: 2 }}>Scan to verify</p>
        </div>

        {/* Dates */}
        <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>
          <p>Date of Request: {new Date(c.requestDate).toLocaleDateString("en-PH")}</p>
          {c.releaseDate && <p>Date Issued: {new Date(c.releaseDate).toLocaleDateString("en-PH")}</p>}
        </div>
      </div>
    </div>
  );
}
