import {
  escapeHtml,
  sanitizeInput,
  sanitizeObject,
  stripHtmlTags,
  sanitizeFilename,
} from "@/lib/sanitize";

describe("sanitize utilities", () => {
  describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
      );
    });

    it("should escape ampersand", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("should escape quotes", () => {
      expect(escapeHtml('"test"')).toBe("&quot;test&quot;");
    });

    it("should return empty string for empty input", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("sanitizeInput", () => {
    it("should trim and escape input", () => {
      expect(sanitizeInput("  <b>test</b>  ")).toBe("&lt;b&gt;test&lt;&#x2F;b&gt;");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize specified fields", () => {
      const obj = {
        name: "<script>alert(1)</script>",
        age: 25,
        note: "  normal text  ",
      };
      const result = sanitizeObject(obj, ["name", "note"]);
      expect(result.name).toBe("&lt;script&gt;alert(1)&lt;&#x2F;script&gt;");
      expect(result.note).toBe("normal text");
      expect(result.age).toBe(25);
    });
  });

  describe("stripHtmlTags", () => {
    it("should remove HTML tags", () => {
      expect(stripHtmlTags("<p>Hello <b>World</b></p>")).toBe("Hello World");
    });

    it("should handle empty string", () => {
      expect(stripHtmlTags("")).toBe("");
    });
  });

  describe("sanitizeFilename", () => {
    it("should replace invalid characters", () => {
      expect(sanitizeFilename("file<>:name.txt")).toBe("file_name.txt");
    });

    it("should collapse multiple underscores", () => {
      expect(sanitizeFilename("file   name.txt")).toBe("file_name.txt");
    });

    it("should truncate long filenames", () => {
      const longName = "a".repeat(300) + ".txt";
      expect(sanitizeFilename(longName).length).toBe(255);
    });
  });
});
