import { describe, it, expect } from "vitest";
import {
  residentSchema,
  permitSchema,
  certificateSchema,
  blotterSchema,
  announcementSchema,
  officialSchema,
  barangayIdSchema,
} from "@/lib/validations";

describe("residentSchema", () => {
  const valid = {
    firstName: "Juan",
    lastName: "Dela Cruz",
    middleName: "Santos",
    birthDate: "1990-01-15",
    gender: "MALE",
    civilStatus: "SINGLE",
    address: "Purok 1, Barangay 9",
    purok: "Purok 1",
    occupation: "Teacher",
    contactNumber: "09171234567",
    emergencyContact: "Maria Dela Cruz",
    emergencyPhone: "09181234567",
    isRegisteredVoter: true,
  };

  it("accepts valid resident", () => {
    expect(residentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing first name", () => {
    const { firstName, ...rest } = valid;
    expect(residentSchema.safeParse({ ...rest }).success).toBe(false);
  });

  it("rejects invalid gender", () => {
    expect(residentSchema.safeParse({ ...valid, gender: "OTHER" }).success).toBe(false);
  });

  it("rejects invalid civil status", () => {
    expect(residentSchema.safeParse({ ...valid, civilStatus: "COMPLICATED" }).success).toBe(false);
  });

  it("rejects invalid phone number", () => {
    expect(residentSchema.safeParse({ ...valid, contactNumber: "123" }).success).toBe(false);
  });

  it("accepts +63 phone format", () => {
    expect(residentSchema.safeParse({ ...valid, contactNumber: "+639171234567" }).success).toBe(true);
  });

  it("allows optional middle name", () => {
    expect(residentSchema.safeParse({ ...valid, middleName: null }).success).toBe(true);
  });

  it("allows optional occupation", () => {
    expect(residentSchema.safeParse({ ...valid, occupation: null }).success).toBe(true);
  });

  it("rejects first name > 100 chars", () => {
    expect(residentSchema.safeParse({ ...valid, firstName: "A".repeat(101) }).success).toBe(false);
  });

  it("rejects empty purok", () => {
    expect(residentSchema.safeParse({ ...valid, purok: "" }).success).toBe(false);
  });
});

describe("permitSchema", () => {
  const valid = {
    businessName: "Sari-Sari Store",
    ownerResidentId: "res-123",
    businessType: "Retail",
    address: "Purok 1",
    issueDate: "2026-01-01",
    expiryDate: "2027-01-01",
  };

  it("accepts valid permit", () => {
    expect(permitSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing business name", () => {
    const { businessName, ...rest } = valid;
    expect(permitSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing owner", () => {
    const { ownerResidentId, ...rest } = valid;
    expect(permitSchema.safeParse(rest).success).toBe(false);
  });
});

describe("certificateSchema", () => {
  it("accepts valid certificate", () => {
    expect(
      certificateSchema.safeParse({
        residentId: "res-1",
        type: "CLEARANCE",
        purpose: "Employment",
      }).success
    ).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(
      certificateSchema.safeParse({
        residentId: "res-1",
        type: "INVALID",
        purpose: "Employment",
      }).success
    ).toBe(false);
  });

  it("accepts all valid types", () => {
    for (const type of ["CLEARANCE", "RESIDENCY", "INDIGENCY", "BUSINESS_PERMIT"]) {
      expect(
        certificateSchema.safeParse({ residentId: "res-1", type, purpose: "Test" }).success
      ).toBe(true);
    }
  });
});

describe("blotterSchema", () => {
  const valid = {
    complainantName: "Juan",
    respondentName: "Pedro",
    incidentDate: "2026-01-01",
    incidentType: "Theft",
    narrative: "Something happened",
  };

  it("accepts valid blotter", () => {
    expect(blotterSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing narrative", () => {
    const { narrative, ...rest } = valid;
    expect(blotterSchema.safeParse({ ...rest }).success).toBe(false);
  });

  it("rejects narrative > 2000 chars", () => {
    expect(blotterSchema.safeParse({ ...valid, narrative: "A".repeat(2001) }).success).toBe(false);
  });
});

describe("announcementSchema", () => {
  it("accepts valid announcement", () => {
    expect(
      announcementSchema.safeParse({
        title: "Meeting",
        content: "Barangay assembly",
      }).success
    ).toBe(true);
  });

  it("sets defaults for priority and category", () => {
    const result = announcementSchema.safeParse({
      title: "Meeting",
      content: "Barangay assembly",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("GENERAL");
      expect(result.data.category).toBe("GENERAL");
      expect(result.data.pinned).toBe(false);
    }
  });

  it("rejects missing title", () => {
    expect(
      announcementSchema.safeParse({ content: "test" }).success
    ).toBe(false);
  });

  it("accepts valid imageUrl", () => {
    expect(
      announcementSchema.safeParse({
        title: "Test",
        content: "Test",
        imageUrl: "https://example.com/image.png",
      }).success
    ).toBe(true);
  });

  it("rejects invalid imageUrl", () => {
    expect(
      announcementSchema.safeParse({
        title: "Test",
        content: "Test",
        imageUrl: "not-a-url",
      }).success
    ).toBe(false);
  });
});

describe("officialSchema", () => {
  it("accepts valid official", () => {
    expect(
      officialSchema.safeParse({
        userId: "user-1",
        position: "Barangay Captain",
        termStart: "2025-01-01",
        termEnd: "2028-01-01",
      }).success
    ).toBe(true);
  });

  it("rejects missing position", () => {
    expect(
      officialSchema.safeParse({
        userId: "user-1",
        termStart: "2025-01-01",
        termEnd: "2028-01-01",
      }).success
    ).toBe(false);
  });
});

describe("barangayIdSchema", () => {
  it("accepts valid ID", () => {
    expect(
      barangayIdSchema.safeParse({
        residentId: "res-1",
        address: "Purok 1",
      }).success
    ).toBe(true);
  });

  it("rejects missing residentId", () => {
    expect(
      barangayIdSchema.safeParse({ address: "Purok 1" }).success
    ).toBe(false);
  });
});
