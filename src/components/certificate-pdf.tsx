"use client";

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

  return (
    <div className="rounded border bg-white p-8 shadow-sm" style={{ fontFamily: "Times New Roman, serif" }}>
      <div className="text-center mb-6">
        <div className="mx-auto mb-2 h-[80px] w-[80px] relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/barangay-seal.png" alt="Seal" className="h-full w-full object-contain" />
        </div>
        <p className="text-xs uppercase tracking-wide">Republic of the Philippines</p>
        <p className="text-xs uppercase tracking-wide">City of Victorias</p>
        <p className="text-xs uppercase tracking-wide">Negros Occidental</p>
        <p className="mt-2 text-sm font-bold uppercase tracking-wider">
          Office of the Barangay IX - Daan Banwa
        </p>
      </div>

      <h2 className="mb-6 text-center text-lg font-bold underline">
        {typeLabels[c.type] || c.type}
      </h2>

      <div className="space-y-3 text-sm leading-relaxed">
        {c.type === "CLEARANCE" && (
          <>
            <p>TO WHOM IT MAY CONCERN:</p>
            <p className="text-justify">
              This is to certify that <strong>{fullName}</strong>, of legal age, Filipino, and a resident of{" "}
              <strong>{r.household.address}, Purok {r.household.purok}</strong>, this barangay, is a person of good
              moral character and has no pending case or criminal record in this barangay as of this date.
            </p>
            <p className="text-justify">
              This certification is being issued at the request of the interested party for{" "}
              <strong>{c.purpose}</strong>.
            </p>
          </>
        )}
        {c.type === "RESIDENCY" && (
          <>
            <p>TO WHOM IT MAY CONCERN:</p>
            <p className="text-justify">
              This is to certify that <strong>{fullName}</strong>, {birthDate}, {r.gender.toLowerCase()},{" "}
              {r.civilStatus.toLowerCase()}, Filipino, is a bonafide resident of{" "}
              <strong>{r.household.address}, Purok {r.household.purok}</strong>, Barangay IX - Daan Banwa,
              City of Victorias, Negros Occidental.
            </p>
            <p className="text-justify">
              This certification is issued upon request of the interested party for{" "}
              <strong>{c.purpose}</strong>.
            </p>
          </>
        )}
        {c.type === "INDIGENCY" && (
          <>
            <p>TO WHOM IT MAY CONCERN:</p>
            <p className="text-justify">
              This is to certify that <strong>{fullName}</strong>, of legal age, Filipino, and a resident of{" "}
              <strong>{r.household.address}, Purok {r.household.purok}</strong>, this barangay, belongs to an
              indigent family and is considered a beneficiary of the barangay&apos;s social welfare programs.
            </p>
            <p className="text-justify">
              This certification is being issued at the request of the interested party for{" "}
              <strong>{c.purpose}</strong>.
            </p>
          </>
        )}
        {c.type === "BUSINESS_PERMIT" && (
          <>
            <p>TO WHOM IT MAY CONCERN:</p>
            <p className="text-justify">
              This is to certify that <strong>{fullName}</strong> has been granted permission to operate a business
              establishment within the jurisdiction of Barangay IX - Daan Banwa, City of Victorias, Negros Occidental,
              subject to the terms and conditions provided under existing barangay ordinances.
            </p>
            <p className="text-justify">
              This certificate is issued for <strong>{c.purpose}</strong>.
            </p>
          </>
        )}
      </div>

      <div className="mt-8 flex justify-between text-sm">
        <div className="text-center">
          <p className="font-semibold">Prepared by:</p>
          <div className="mt-8 border-t border-gray-400 pt-1">
            <p className="font-semibold">Secretary</p>
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold">Approved by:</p>
          <div className="mt-8 border-t border-gray-400 pt-1">
            <p className="font-semibold">Barangay Captain</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        <p>Date of Request: {new Date(c.requestDate).toLocaleDateString("en-PH")}</p>
        {c.releaseDate && <p>Date Issued: {new Date(c.releaseDate).toLocaleDateString("en-PH")}</p>}
      </div>
    </div>
  );
}
