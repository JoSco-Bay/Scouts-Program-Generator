import LegalPage from "@/components/LegalPage";

export default function ChildSafetyPage() {
  return (
    <LegalPage title="Child Safety Policy" updated="16 August 2026">
      <p>
        Scout Program Builder is an independent planning tool and is not affiliated with,
        endorsed by, or associated with Scouts Australia or any official Scouts organisation.
        We are committed to the safety and wellbeing of children and young people, and that
        commitment shapes how this app is built and how data may be used within it.
      </p>

      <h2>What we store</h2>
      <p>
        This app stores children&apos;s first names, ages, and program progress (attendance, OAS
        and SIA progress, milestone activities) only. It does not collect or store photos, home
        addresses, contact details, or other sensitive information.
      </p>

      <h2>Who can access data</h2>
      <p>
        Data entered into the app is only accessible by the registered leader who created the
        group.
      </p>

      <h2>Leader obligations</h2>
      <p>
        Leaders using this app must comply with their own organisation&apos;s child safety
        policies and Working With Children requirements. This app is a planning tool and does not
        verify or replace those obligations.
      </p>

      <h2>Parental consent</h2>
      <p>
        Leaders are responsible for obtaining parental consent before entering any child&apos;s
        information into the app.
      </p>

      <h2>Reporting a concern or requesting data deletion</h2>
      <p>
        To report a child safety concern or to request deletion of a child&apos;s data, contact
        us at <a href="mailto:youthpathapp@gmail.com">youthpathapp@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
