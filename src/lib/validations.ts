import { z } from "zod";

export const residentSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  middleName: z.string().max(100).optional().nullable(),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.enum(["MALE", "FEMALE"], { errorMap: () => ({ message: "Invalid gender" }) }),
  civilStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "DIVORCED"], { errorMap: () => ({ message: "Invalid civil status" }) }),
  address: z.string().min(1, "Address is required").max(255),
  purok: z.string().min(1, "Purok is required"),
  occupation: z.string().max(200).optional().nullable(),
  contactNumber: z.string().min(1, "Contact number is required").regex(/^(\+639\d{2}-\d{3}-\d{4}|09\d{2}-\d{3}-\d{4}|\+63\d{10}|0\d{10})$/, "Must be a valid Philippine number (09XX-XXX-XXXX)"),
  emergencyContact: z.string().max(200).optional().nullable(),
  emergencyPhone: z.string().max(20).optional().nullable(),
  isRegisteredVoter: z.boolean().optional(),
});

export const permitSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(200),
  ownerResidentId: z.string().min(1, "Owner is required"),
  businessType: z.string().min(1, "Business type is required").max(100),
  address: z.string().min(1, "Address is required").max(255),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

export const certificateSchema = z.object({
  residentId: z.string().min(1, "Resident is required"),
  type: z.enum(["CLEARANCE", "RESIDENCY", "INDIGENCY", "BUSINESS_PERMIT"], { errorMap: () => ({ message: "Invalid certificate type" }) }),
  purpose: z.string().min(1, "Purpose is required").max(500),
});

export const blotterSchema = z.object({
  complainantName: z.string().min(1, "Complainant name is required").max(200),
  respondentName: z.string().min(1, "Respondent name is required").max(200),
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentType: z.string().min(1, "Incident type is required").max(100),
  location: z.string().max(255).optional().nullable(),
  witnesses: z.string().max(500).optional().nullable(),
  narrative: z.string().min(1, "Narrative is required").max(2000),
});

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(5000),
  expiresAt: z.string().optional().nullable(),
  priority: z.enum(["URGENT", "IMPORTANT", "GENERAL"], { errorMap: () => ({ message: "Priority is required" }) }),
  category: z.enum(["HEALTH", "SAFETY", "EVENT", "MEETING", "GENERAL", "OTHERS"], { errorMap: () => ({ message: "Category is required" }) }),
  pinned: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const officialSchema = z.object({
  userId: z.string().min(1, "User is required"),
  position: z.string().min(1, "Position is required").max(100),
  termStart: z.string().min(1, "Term start is required"),
  termEnd: z.string().min(1, "Term end is required"),
});

export const barangayIdSchema = z.object({
  residentId: z.string().min(1, "Resident is required"),
  address: z.string().min(1, "Address is required").max(255),
  contactNumber: z.string().max(20).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResidentInput = z.infer<typeof residentSchema>;
export type PermitInput = z.infer<typeof permitSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
export type BlotterInput = z.infer<typeof blotterSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type OfficialInput = z.infer<typeof officialSchema>;
export type BarangayIdInput = z.infer<typeof barangayIdSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
