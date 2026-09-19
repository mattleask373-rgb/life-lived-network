export type ReportSubject = "profile" | "connection_request" | "connection_message";
export type ReportReason = "safety" | "harassment" | "spam" | "misleading" | "other";

export const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "safety", label: "I feel unsafe" },
  { id: "harassment", label: "Harassment" },
  { id: "spam", label: "Spam" },
  { id: "misleading", label: "Misleading information" },
  { id: "other", label: "Something else" },
];

export function otherPerson(
  request: { senderId: string; recipientId: string },
  userId: string,
): string | null {
  if (request.senderId === userId) return request.recipientId;
  if (request.recipientId === userId) return request.senderId;
  return null;
}
