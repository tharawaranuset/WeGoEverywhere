// src/app/(whatever)/edit-profile/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import PhotoPicker from "@/components/form/PhotoPicker";
import { OpenAPI } from "@/lib/api";
import Image from "next/image";
import { FiArrowLeft, FiCalendar, FiChevronDown } from "react-icons/fi";
import toast from "react-hot-toast";
import { EditInput } from "@/components/form/input/EditInput"; // ✅ ใช้ EditInput ใหม่
import FormSelect from "@/components/form/input/FormSelect";
import { Calendar } from "lucide-react";
import { SubmitButton } from "@/components/form/Buttons";
import { UpdateUserDto, UserService } from "@/lib/api";


type HtmlDateInput = HTMLInputElement & { showPicker?: () => void };

export default function EditProfilePage() {
  // const birthRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>({});
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // ✅ ดึงข้อมูล user ทันทีเมื่อเข้าเพจ
  useEffect(() => {
    UserService.userControllerGetUser()
      .then((res) => {
        setUser(res);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Cannot load user info");
      });
  }, []);


  const dateRef = useRef<HtmlDateInput | null>(null);
  const openDate = () => {
    const el = dateRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else { el.focus(); el.click(); }
  };
  const today = new Date().toISOString().slice(0, 10);



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      // 1. Upload profile picture if selected

      if (profileFile) {
        const formData = new FormData();
        formData.append("file", profileFile);
        // Try to get JWT from localStorage or cookies
        let token = null;
        if (typeof window !== "undefined") {
          token = localStorage.getItem("access_token") || null;
        }
        const res = await fetch(`${OpenAPI.BASE}/users/profile-picture`, {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed to upload profile picture");
      }

      // 2. Update user info
      const body: UpdateUserDto = {
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        birthdate: user.birthdate || undefined,
        sex: user.sex || undefined,
        telephoneNumber: user.telephoneNumber || undefined,
        bio: user.bio || null,
      };

      if (body.birthdate) {
        const birthDate = new Date(body.birthdate);
        const today = new Date();
        const age =
          today.getFullYear() -
          birthDate.getFullYear() -
          (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);

        if (age < 20) {
          toast.error("You must be at least 20 years old.");
          setSubmitting(false);
          return;
        }
      }
      await UserService.userControllerUpdate(body);
      toast.success("Successfully Edited");
      setProfileFile(null);
      setProfilePreview(null);
    } catch (err) {
      console.error(err);
      toast.error("Unsuccessfully Edited, try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen py-1 font-alt bg-white">
      <div className="mx-auto w-full px-2">
        {/* Back + Title pill */}
        <div className="mt-10 mb-4 relative z-10">
          <button
            aria-label="Back"
            onClick={() => history.back()}
            className="absolute left-0 top-1/2 -translate-y-[60%] z-20 w-10 h-10 rounded-full bg-[#EB6223] flex items-center justify-center shadow hover:scale-105 transition"
          >
            <FiArrowLeft className="text-[#000000]" size={17} />
          </button>
          <div className="flex justify-center">
            <div className="absolute -bottom-6 z-10 px-10 py-3 rounded-[60px] bg-[#FFDCD5] shadow-[0_6px_0_rgba(0,0,0,0.07)]">
              <span className="text-2xl font-semibold text-[#1f1f1f]">
                Edit Profile
              </span>
            </div>
          </div>
        </div>

        {/* Card */}
        <section className="relative z-20  mx-4 bg-[#FFF5E9] rounded-t-[60px] p-5 shadow">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <PhotoPicker
              name="profilePhoto"
              value={
                profilePreview
                  || (user?.profilePicture
                    ? user.profilePicture.startsWith('http')
                      ? user.profilePicture
                      : `${OpenAPI.BASE}${user.profilePicture}`
                    : "/images/profile_image.png"
                  )
              }
              onChange={(file, url) => {
                setProfileFile(file);
                setProfilePreview(url);
              }}
              size={112}
              rounded="full"
              caption="Change your profile photo"
            />
          </div>

          {/* Form */}
          <form
            className="mt-6 space-y-5"
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              // กันกรณีกด Enter แล้ว submit
              if (e.key === "Enter") e.preventDefault();
            }}
          >
            <EditInput
              name="firstName"
              type="text"
              label="First name"
              defaultValue={user?.firstName || ""}
              pattern="[ก-ฮะ-๛A-Za-z\s]+"
              onChange={(e)=> setUser({...user, firstName: e.target.value })}
              required
            />

            <EditInput
              name="lastName"
              type="text"
              label="Last name"
              defaultValue={user?.lastName || ""}
              pattern="[ก-ฮะ-๛A-Za-z\s]+"
              onChange={(e) => setUser({ ...user, lastName: e.target.value })}
              required
            />

           {/* Birth date */}
          <div className="mb-0">
            <label htmlFor="birthDate" className="text-sm font-semibold">Birth date</label>
            <div className="relative">
              <EditInput
                ref={dateRef as any}
                id="birthDate"
                name="birthDate"
                type="date"
                max={today}
                containerClassName="mb-0" 
                defaultValue={user?.birthdate || ""}
                onChange={(e) => setUser({ ...user, birthdate: e.target.value })}
                required
                className="pr-11 appearance-none
                          [&::-webkit-calendar-picker-indicator]:hidden
                          [&::-webkit-clear-button]:hidden
                          [&::-webkit-inner-spin-button]:hidden
                          [-moz-appearance:textfield]"
              />
              <button
                type="button"
                onClick={openDate}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900"
                aria-label="Open date picker"
              >
                <Calendar size={18} />
              </button>
            </div>
          </div>

            <FormSelect
              name="sex"
              label="Sex"
              required
              value={user?.sex || ""}
              className = "bg-gray-200"
              containerClassName="mb-2.5" 
              onChange={(e) => setUser({ ...user, sex: e.target.value })}
              options={[
                { label: "Select…", value: "", disabled: true },
                { label: "Female", value: "female" },
                { label: "Male", value: "male" },
                { label: "Other", value: "other" },
                { label: "Prefer not to say", value: "prefer_not" },
              ]}
          />

            <EditInput
              name="telephone"
              type="tel"
              inputMode="tel"
              label="Telephone"
              value={user?.telephoneNumber || ""}
              onChange={(e) => {
                setUser({ ...user, telephoneNumber: e.target.value });
              }}
              placeholder="Phone Number (Optional)"
              pattern="^0[689][0-9]{7,8}$"
              title="Starting with 06, 08, or 09 and up to 10 digits (e.g. 0812345678)"
              maxLength={10} 
           
            />

            <EditInput
              name="bio"
              type="bio"
              label="Bio"
              value={user?.bio || ""}
              onChange={(e) => {
                setUser({ ...user, bio: e.target.value });
              }}
              placeholder="Bio (Optional)"
        
            />

            {/* Save */}
            <SubmitButton
              text="Save"
              className="w-full mt-2 mb-2 rounded-[24px] bg-[#FFDCD5] text-[#2E2E2E]
             font-extrabold py-3 transition border border-black 
             hover:bg-[#FFBFB3] hover:shadow-lg active:scale-95w-full mt-2 mb-2 whitespace-nowrap h-12 flex-1
             rounded-[24px] bg-[#FFDCD5] text-[#2E2E2E]
             font-extrabold text-[16px] px-6 shadow
             border border-black 
             hover:scale-[1.02] hover:bg-[#FFBFB3] hover:shadow-lg
             active:scale-95 transition"
            />

            {/* Change password */}
            <button
              type="button"
              className="block mx-auto text-[14px] text-[#8B8E94] underline underline-offset-2"
            >
              Change Password
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}