import type { JSX } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import InfoPage from "./InfoPage";

/**
 * /contact — sample contact details.
 * TODO: replace every SAMPLE value below with the real data.
 */
const CONTACT_CARDS = [
  {
    icon: Mail,
    label: "Email",
    // TODO: replace with the real support email
    value: "waywayataclibon.wt@gmail.com",
  },
  {
    icon: Phone,
    label: "Phone",
    // TODO: replace with the real phone number
    value: "(+63) 9984952000",
  },
  {
    icon: MapPin,
    label: "Location",
    // TODO: replace with the real address
    value: "Taguig City, Metro Manila",
  },
  {
    icon: Clock,
    label: "Support hours",
    // TODO: replace with the real support hours
    value: "Mon–Fri, 9:00 AM – 5:00 PM",
  },
];

/** /contact — where to reach the DopaWink team. */
export default function Contact(): JSX.Element {
  return (
    <InfoPage>
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">
          Contact{" "}
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Us
          </span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Questions, feedback, or just want to say hi? We'd love to hear from you.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 text-left">
          {CONTACT_CARDS.map((c) => (
            <div
              key={c.label}
              className="relative bg-white rounded-2xl shadow-md p-6 border border-pink-100"
            >
              <div className="bg-pink-100 p-3 rounded-xl w-fit">
                <c.icon className="w-6 h-6 text-pink-500" />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {c.label}
              </h2>
              <p className="mt-1 text-lg font-bold text-gray-800">{c.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-gray-500">
          We usually reply within 1–2 business days.
        </p>
      </div>
    </InfoPage>
  );
}
