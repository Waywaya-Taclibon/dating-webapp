import { useUser } from "@clerk/clerk-react";
import Navbar from "../Navbar";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar stays fixed */}
      <Navbar />

      {/* Main content container */}
      <div className="flex flex-1 flex-col items-center justify-center pt-16 text-center px-6">
        <h1 className="text-5xl font-bold text-gray-800 leading-tight">
          Welcome <span className="text-pink-400">{user?.firstName}</span>{" "}
          <br /> Discover your Dopa<span className="text-pink-400">Wink</span>!
        </h1>

        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
          Connect with like-minded people through swiping and messaging. Make
          meaningful conversations and authentic connections.
        </p>

        {/* Buttons Section */}
        <div className="mt-8 flex space-x-4">
          <Link
            to="/discover"
            className="px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold rounded-full shadow-md hover:from-pink-500 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
          >
            Start Swiping
          </Link>

          <Link
            to="/profile"
            className="px-6 py-3 bg-white text-pink-600 border-2 border-pink-500 font-semibold rounded-full shadow-sm hover:bg-pink-50 transition-all duration-300 transform hover:scale-105"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
