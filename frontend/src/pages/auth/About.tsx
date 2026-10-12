import type { JSX } from "react";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { SignUpButton } from "@clerk/clerk-react";
import InfoPage from "./InfoPage";

const VALUES = [
  {
    icon: Heart,
    title: "Real connections",
    text: "Mutual likes become matches, every conversation starts with genuine, two-way interest.",
  },
  {
    icon: ShieldCheck,
    title: "Safety first",
    text: "Secure sign-in and private one-to-one chats keep your experience safe and personal.",
  },
  {
    icon: Sparkles,
    title: "Effortless matching",
    text: "A photo, a bio, and your vibe. Set up in seconds and start discovering people right away.",
  },
];

/** /about — the story and values behind DopaWink. */
export default function About(): JSX.Element {
  return (
    <InfoPage>
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">
          About{" "}
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            DopaWink
          </span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          DopaWink started with a simple idea: meeting someone new should feel
          exciting, not exhausting. No endless scrolling, no games, just real
          people, real sparks, and one small wink to start it all.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-2xl shadow-md p-6 border border-pink-100"
            >
              <div className="bg-pink-100 p-3 rounded-xl w-fit">
                <v.icon className="w-6 h-6 text-pink-500" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-gray-800">{v.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <SignUpButton mode="modal">
            <button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold rounded-full shadow-lg transition-all">
              Join DopaWink today
            </button>
          </SignUpButton>
        </div>
      </div>
    </InfoPage>
  );
}
