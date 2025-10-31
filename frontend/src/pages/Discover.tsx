import SwipeCards from "./Card";
import Navbar from "./Navbar";

const Discover = () => {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-pink-50 to-white overflow-hidden">
      <Navbar />

      {/* Main content container - accounts for fixed navbar height */}
      <main className="flex-1 flex flex-col pt-16 min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 min-h-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 flex-shrink-0">
            Discover Matches
          </h1>

          <div className="flex-1 w-full max-w-md flex flex-col min-h-0">
            <SwipeCards />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Discover;