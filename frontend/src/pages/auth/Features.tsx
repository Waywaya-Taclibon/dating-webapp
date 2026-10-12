import type { JSX } from "react";
import {
  Flame,
  Zap,
  MessagesSquare,
  Bell,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import InfoPage from "./InfoPage";

const FEATURES = [
  {
    icon: Flame,
    title: "Swipe to discover",
    text: "Browse fresh profiles every day. Like who catches your eye, pass who doesn't.",
  },
  {
    icon: Zap,
    title: "Instant matches",
    text: "When the interest is mutual, you match immediately. No waiting around.",
  },
  {
    icon: MessagesSquare,
    title: "Real-time chat",
    text: "Message your matches instantly with live delivery and typing indicators.",
  },
  {
    icon: Bell,
    title: "Match notifications",
    text: "Never miss a spark, get notified the moment someone new matches with you.",
  },
  {
    icon: UserCheck,
    title: "Quick profile setup",
    text: "Add a photo and a bio in seconds and show people what your vibe is all about.",
  },
  {
    icon: ShieldCheck,
    title: "Secure sign-in",
    text: "Protected authentication keeps your account, and your conversations safe.",
  },
];

/** /features — what DopaWink can do. */
export default function Features(): JSX.Element {
  return (
    <InfoPage>
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">
          Features made for{" "}
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            connection
          </span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Everything you need to meet someone new, nothing you don't.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl shadow-md p-6 border border-pink-100 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-3 rounded-xl w-fit">
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-gray-800">{f.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </InfoPage>
  );
}
