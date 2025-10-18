import type { CommunicationChannel, CommunicationPayload } from "../types.js";

export class WhatsAppChannel implements CommunicationChannel {
  name = "whatsapp" as const;

  async send(payload: CommunicationPayload): Promise<void> {
    console.warn(
      "[WhatsAppChannel] WhatsApp delivery not yet implemented. Payload queued for future handling.",
      {
        to: payload.to,
        subject: payload.subject,
      },
    );
  }
}
