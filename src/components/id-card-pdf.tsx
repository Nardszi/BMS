"use client";

import { formatDate } from "@/lib/utils";

interface IDCardData {
  idNumber: string;
  photoUrl: string | null;
  issueDate: string;
  expiryDate: string;
  status: string;
  address: string;
  contactNumber: string | null;
  resident: {
    firstName: string;
    lastName: string;
    middleName: string | null;
    birthDate: string;
    gender: string;
    civilStatus: string;
    contactNumber: string | null;
    household: { address: string; purok: string };
  };
}

interface IDCardPDFProps {
  data: IDCardData;
  showPrintLayout?: boolean;
}

export function IDCardPDF({ data, showPrintLayout = false }: IDCardPDFProps) {
  const r = data.resident;
  const fullName = `${r.lastName}, ${r.firstName}${r.middleName ? ` ${r.middleName}` : ""}`;
  const birthDate = formatDate(r.birthDate);
  const expiry = formatDate(data.expiryDate);
  const issued = formatDate(data.issueDate);

  const cardFront = (
    <div
      className="relative overflow-hidden rounded-lg border-2 border-blue-900 bg-white shadow-lg"
      style={{ width: "3.375in", height: "2.125in" }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-center gap-2 bg-blue-900 px-2 py-1">
        <img src="/barangay-seal.png" alt="" className="h-6 w-6 object-contain" />
        <div className="text-center">
          <p className="text-[7px] font-bold leading-tight text-white">BARANGAY IX - DAAN BANWA</p>
          <p className="text-[5px] text-blue-200">City of Victorias, Negros Occidental</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-2 px-2 pt-1.5 pb-1">
        {/* Photo */}
        <div className="flex-shrink-0">
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt="Photo"
              className="h-[1.05in] w-[0.85in] rounded border border-gray-300 object-cover"
            />
          ) : (
            <div className="flex h-[1.05in] w-[0.85in] items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-400">
              No Photo
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-[8px] font-bold text-gray-900 truncate">{fullName}</p>
          <div className="mt-0.5 space-y-[1px] text-[6px] text-gray-600">
            <p><span className="font-semibold">DOB:</span> {birthDate}</p>
            <p><span className="font-semibold">Gender:</span> {r.gender}</p>
            <p><span className="font-semibold">Civil Status:</span> {r.civilStatus}</p>
            <p className="truncate"><span className="font-semibold">Address:</span> {data.address}</p>
            {data.contactNumber && <p><span className="font-semibold">Contact:</span> {data.contactNumber}</p>}
          </div>
          <div className="mt-1 rounded bg-blue-50 px-1 py-0.5">
            <p className="text-[7px] font-bold text-blue-900">{data.idNumber}</p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-blue-100 bg-blue-50 px-2 py-0.5">
        <p className="text-[5px] text-gray-500">Valid: {issued} - {expiry}</p>
        <div className="text-right">
          <p className="text-[5px] text-gray-500">Issued By:</p>
          <p className="text-[6px] font-semibold text-gray-700">Barangay IX</p>
        </div>
      </div>
    </div>
  );

  const cardBack = (
    <div
      className="relative overflow-hidden rounded-lg border-2 border-blue-900 bg-white shadow-lg"
      style={{ width: "3.375in", height: "2.125in" }}
    >
      {/* Header */}
      <div className="bg-blue-900 px-2 py-1">
        <p className="text-center text-[7px] font-bold text-white">BARANGAY IDENTIFICATION CARD</p>
      </div>

      {/* Back Content */}
      <div className="px-2 pt-1.5 pb-1">
        <p className="text-[7px] font-bold text-gray-700 mb-1">EMERGENCY CONTACT</p>
        <div className="rounded bg-gray-50 p-1.5 text-[6px] text-gray-600 space-y-0.5">
          <p>In case of emergency, please contact:</p>
          <p className="font-semibold">{r.lastName} - {r.contactNumber || "N/A"}</p>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div className="text-center">
            <div className="mb-0.5 h-[0.4in] w-[0.4in] rounded border border-gray-300 bg-gray-50 flex items-center justify-center">
              <img src="/barangay-seal.png" alt="" className="h-6 w-6 object-contain opacity-30" />
            </div>
            <p className="text-[5px] text-gray-500">Barangay Seal</p>
          </div>

          <div className="text-center">
            <div className="mb-0.5 h-[0.4in] w-[1.2in] border-b border-gray-400" />
            <p className="text-[6px] font-semibold text-gray-700">HON. JUAN DELA CRUZ</p>
            <p className="text-[5px] text-gray-500">Barangay Captain</p>
          </div>

          <div className="text-center">
            <div className="mb-0.5 h-[0.4in] w-[0.4in] rounded border border-gray-300 bg-gray-50 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-[1px]">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={`h-[3px] w-[3px] ${Math.random() > 0.5 ? "bg-black" : "bg-transparent"}`} />
                ))}
              </div>
            </div>
            <p className="text-[5px] text-gray-500">Scan to Verify</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-blue-100 bg-blue-50 px-2 py-0.5">
        <p className="text-center text-[5px] text-gray-500">
          This card is property of Barangay IX - Daan Banwa. Found card please return to the Barangay Hall.
        </p>
      </div>
    </div>
  );

  if (showPrintLayout) {
    return (
      <div className="print:block">
        <div className="flex gap-6">
          <div>
            <p className="mb-1 text-center text-xs font-medium text-gray-500">FRONT</p>
            {cardFront}
          </div>
          <div>
            <p className="mb-1 text-center text-xs font-medium text-gray-500">BACK</p>
            {cardBack}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-center text-sm font-medium text-gray-500">Front</p>
        <div className="flex justify-center">{cardFront}</div>
      </div>
      <div>
        <p className="mb-2 text-center text-sm font-medium text-gray-500">Back</p>
        <div className="flex justify-center">{cardBack}</div>
      </div>
    </div>
  );
}
