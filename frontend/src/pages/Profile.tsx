import { useUser, useAuth } from "@clerk/clerk-react";
import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import { authFetch } from "../lib/api";
import { useToast } from "../lib/toast";

const Profile = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const toast = useToast();

  const [bio, setBio] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // --- Load data when user logs in ---
  useEffect(() => {
    if (isLoaded && user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      fetchUserInfo(user.id); // ✅ Load MongoDB profile data (bio, etc.)
    }
  }, [isLoaded, user]);

  // --- Fetch user's existing profile info from MongoDB ---
  const fetchUserInfo = async (clerkId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://dopawink.onrender.com"}/api/info/${clerkId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (response.ok) {
        const data = await response.json();
        setBio(data.bio || "");
      } else {
        console.warn("No extra profile info found for this user");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // --- Update profile picture (Clerk handles this) ---
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      setIsSaving(true);
      await user.setProfileImage({ file });
      await user.reload();
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast.error("Error updating profile picture!");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setIsSaving(false);
    }
  };

  // --- Update name fields (Clerk updates this) ---
  const handleSaveName = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      await user.update({ firstName, lastName });
      await user.reload();
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Save Bio to MongoDB via Backend ---
  const handleSaveBio = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const response = await authFetch(getToken, `/api/info/${user.id}`, {
        method: "PUT", // 👈 matches backend route
        body: JSON.stringify({ bio }), // send only bio for now
      });

      if (response.ok) {
        toast.success("Bio updated successfully!");
      } else {
        const err = await response.json();
        toast.error(`Failed to update bio: ${err.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving bio:", error);
      toast.error("A network or server error occurred!");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-white">
      <Navbar />

      <div className="flex flex-1 flex-col items-center justify-center pt-20 px-6 text-center">
        {/* Profile Picture */}
        <div className="relative mb-4">
          <img
            src={preview || user?.imageUrl}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-pink-400 shadow-lg object-cover"
          />
          <label
            htmlFor="imageUpload"
            className="absolute bottom-2 right-2 bg-pink-500 text-white p-2 rounded-full cursor-pointer hover:bg-pink-600 transition"
          >
            ✏️
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Editable Name Fields */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <label htmlFor="firstName" className="sr-only">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            autoComplete="given-name"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400"
          />
          <label htmlFor="lastName" className="sr-only">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            autoComplete="family-name"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400"
          />
        </div>

        <button
          onClick={handleSaveName}
          disabled={isSaving}
          className={`px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold rounded-full shadow-md transition-all duration-300 ${
            isSaving
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-pink-500 hover:to-pink-700 hover:scale-105"
          }`}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        {/* Username */}
        <p className="text-gray-500 mt-4">@{user?.username || "username"}</p>

        {/* Bio Section */}
        <div className="mt-6 w-full max-w-md">
          <label htmlFor="bio" className="sr-only">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write something about yourself..."
            maxLength={1000}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
            rows={4}
          ></textarea>

          <button
            onClick={handleSaveBio}
            disabled={isSaving}
            className="mt-3 w-full py-2 bg-gradient-to-r from-pink-400 to-pink-600 text-white font-semibold rounded-lg hover:from-pink-500 hover:to-pink-700 transition-all duration-300 shadow-md disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Bio"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
