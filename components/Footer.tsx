import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "20px 24px",
        borderTop: "1px solid #e5e7eb",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          fontSize: 12,
          lineHeight: 1.6,
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 6px" }}>
          YouthPath is an independent planning tool and is not affiliated with,
          endorsed by, or associated with Scouts Australia or any official Scouts organisation.
          All Scouts Australia program framework references (OAS, milestones, challenge areas)
          are used for informational purposes only.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/privacy" style={{ color: "#9ca3af", textDecoration: "underline" }}>
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" style={{ color: "#9ca3af", textDecoration: "underline" }}>
            Terms of Service
          </Link>
          {" · "}
          <Link href="/childsafety" style={{ color: "#9ca3af", textDecoration: "underline" }}>
            Child Safety Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
