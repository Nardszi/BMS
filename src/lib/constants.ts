export const BARANGAY_NAME = "Barangay IX";
export const BARANGAY_ALIAS = "Daan Banwa";
export const BARANGAY_FULL_NAME = `${BARANGAY_NAME} - ${BARANGAY_ALIAS}`;
export const BARANGAY_CITY = "City of Victorias";
export const BARANGAY_PROVINCE = "Negros Occidental";
export const BARANGAY_ADDRESS = `${BARANGAY_FULL_NAME}, ${BARANGAY_CITY}, ${BARANGAY_PROVINCE}`;
export const BARANGAY_PHONE = "(034) 123-4567";

export const PUROK_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "Toreno", "Aji"] as const;

export type PurokOption = (typeof PUROK_OPTIONS)[number];
