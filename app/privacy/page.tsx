import LegalPage from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="16 August 2026">
      <p>
        Scout Program Builder is an independent planning tool and is not affiliated with,
        endorsed by, or associated with Scouts Australia or any official Scouts organisation.
      </p>

      <h2>Information we store</h2>
      <p>
        To provide term planning, run sheet generation, and member progress tracking, the app
        stores group details (group name, section, meeting schedule, leader names), term plan
        content, generated run sheets, and member records (first name, age, year joined,
        attendance, OAS/SIA/milestone progress).
      </p>

      <h2>How data is used</h2>
      <p>
        Data you enter is used only to generate and display your term plans, run sheets, and
        member progress within the app, and — where you use the AI generation features — is sent
        to our AI provider solely to generate the requested content.
      </p>

      <h2>Who can access your data</h2>
      <p>
        Data is only accessible by the registered leader who created the group.
      </p>

      <h2>Data retention and deletion</h2>
      <p>
        You may request deletion of your account data at any time by contacting us using the
        details below.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions or to request data deletion, contact us at{" "}
        <a href="mailto:[INSERT CONTACT EMAIL]">[INSERT CONTACT EMAIL]</a>.
      </p>
    </LegalPage>
  );
}
