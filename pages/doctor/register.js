import React, { useState, useEffect } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";

const DoctorRegister = () => {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");

  const {
    registerDoctor,
    isRegisteringDoctor,
    registerDoctorError,
    userRole,
    refetchUserRole,
  } = useHealthcareContract();

  const [txHash, setTxHash] = useState(null);
  const [registrationSuccessful, setRegistrationSuccessful] = useState(false);
  const { isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !specialization) {
      toast.error("Please fill all fields");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const hash = await registerDoctor(name, specialization, address);
      setTxHash(hash);
      toast.success("Doctor registration transaction submitted! Waiting for confirmation...");
    } catch (error) {
      toast.error("Failed to register doctor");
      console.error(error);
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setRegistrationSuccessful(true);
      refetchUserRole();
      toast.success("Doctor registration confirmed! Updating role...");
    }
  }, [isSuccess, refetchUserRole]);

  // Redirect when role updates to doctor
  useEffect(() => {
    if (userRole === 'doctor' && registrationSuccessful) {
      toast.success("Redirecting to dashboard...");
      setTimeout(() => {
        window.location.href = "/doctor/dashboard";
      }, 500);
    }
  }, [userRole, registrationSuccessful]);

  // Handle transaction error
  useEffect(() => {
    if (isError) {
      toast.error("Transaction failed. Please try again.");
    }
  }, [isError]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Connect Your Wallet</h2>
          <p className="text-cyan-400">You need to connect your wallet to register as a doctor.</p>
        </div>
      </div>
    );
  }

  if (userRole === 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Already Registered</h2>
          <p className="text-cyan-400 mb-6">You are already registered as a doctor.</p>
          <a
            href="/doctor/dashboard"
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Go to Doctor Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <div className="max-w-md mx-auto pt-16 pb-8">
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-8 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Doctor Registration</h1>
            <p className="text-cyan-400">Register as a healthcare professional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                disabled={isRegisteringDoctor}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Specialization
              </label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                disabled={isRegisteringDoctor}
                required
              >
                <option value="" className="bg-gray-700 text-white">Select your specialization</option>
                <option value="General Medicine" className="bg-gray-700 text-white">General Medicine</option>
                <option value="Cardiology" className="bg-gray-700 text-white">Cardiology</option>
                <option value="Dermatology" className="bg-gray-700 text-white">Dermatology</option>
                <option value="Neurology" className="bg-gray-700 text-white">Neurology</option>
                <option value="Orthopedics" className="bg-gray-700 text-white">Orthopedics</option>
                <option value="Pediatrics" className="bg-gray-700 text-white">Pediatrics</option>
                <option value="Psychiatry" className="bg-gray-700 text-white">Psychiatry</option>
                <option value="Radiology" className="bg-gray-700 text-white">Radiology</option>
                <option value="Surgery" className="bg-gray-700 text-white">Surgery</option>
                <option value="Urology" className="bg-gray-700 text-white">Urology</option>
                <option value="Gynecology" className="bg-gray-700 text-white">Gynecology</option>
                <option value="Ophthalmology" className="bg-gray-700 text-white">Ophthalmology</option>
                <option value="Dentistry" className="bg-gray-700 text-white">Dentistry</option>
                <option value="Other" className="bg-gray-700 text-white">Other</option>
              </select>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-white">
                    Registration Note
                  </h3>
                  <div className="mt-2 text-sm text-cyan-400">
                    <p>
                      Register as a doctor to provide healthcare services on the platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegisteringDoctor}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegisteringDoctor ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Registering...
                </div>
              ) : (
                "Register as Doctor"
              )}
            </button>

            {registerDoctorError && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">
                      Registration Error
                    </h3>
                    <div className="mt-2 text-sm text-red-400">
                      <p>{registerDoctorError.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-cyan-400">
              Already registered?{" "}
              <a href="/doctor/dashboard" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Go to Dashboard
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;
