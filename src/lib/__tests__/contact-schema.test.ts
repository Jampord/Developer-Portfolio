import { describe, expect, it } from "vitest";
import { contactSchema } from "../contact-schema";

const valid = { name: "Ada Lovelace", email: "ada@example.com", message: "Hello there, nice site." };

describe("contactSchema", () => {
  it("accepts an email with stray spaces and capitals, and tidies it", () => {
    const parsed = contactSchema.parse({ ...valid, email: "  Ada@Example.COM " });
    expect(parsed.email).toBe("ada@example.com");
  });

  it("trims the name and the message", () => {
    const parsed = contactSchema.parse({ ...valid, name: "  Ada Lovelace  ", message: "\n Hello there, nice site. \n" });
    expect(parsed.name).toBe("Ada Lovelace");
    expect(parsed.message).toBe("Hello there, nice site.");
  });

  it("rejects a name or message that is only spaces", () => {
    expect(contactSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "            " }).success).toBe(false);
  });

  it("still rejects something that is not an email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "ada at example" }).success).toBe(false);
  });
});
