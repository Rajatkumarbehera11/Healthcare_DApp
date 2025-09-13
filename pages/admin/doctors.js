import React, { useState, useEffect, useCallback } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

const AdminDoctors = () => {
  const { address, isConnected } = useAccount();
  const { userRole, isLoadingRole, registerDoctor, getAllDoctors, listenToDoctorRegistered } = useHealthcareContract();

  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    specialization: "",
    walletAddress: ""
  });

  // Function to fetch doctors from contract
  const fetchDoctors = useCallback(async () => {
    if (!isConnected || userRole !== 'admin') return;

    setIsLoadingDoctors(true);
    try {
      const contractDoctors = await getAllDoctors();
      // Transform contract data to match UI expectations
      const formattedDoctors = contractDoctors.map((doctor, index) => ({
        id: index + 1,
        name: doctor.name,
        specialization: doctor.specialization,
        walletAddress: doctor.doctorAddress,
        status: "Active", // Default status, could be enhanced with contract data
        patientsCount: 0, // Would need additional contract function
        appointmentsCount: 0, // Would need additional contract function
        rating: 0 // Would need additional contract function
      }));
      setDoctors(formattedDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [isConnected, userRole, getAllDoctors]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Event handlers for real-time updates
  const handleDoctorRegistered = useCallback((event) => {
    const { doctorId, doctorAddress, name, specialization } = event.args || {};
    setDoctors((prev) => [
      {
        id: Number(doctorId),
        name: name,
        specialization: specialization,
        walletAddress: doctorAddress,
        status: "Active",
        patientsCount: 0,
        appointmentsCount: 0,
        rating: 0
      },
      ...prev,
    ]);
    toast.success("New doctor registered successfully");
  }, []);

  // Setup event listeners for real-time updates
  useEffect(() => {
    if (!isConnected || userRole !== 'admin') return;

    const unsubscribeDoctor = listenToDoctorRegistered(handleDoctorRegistered);

    return () => {
      if (unsubscribeDoctor) unsubscribeDoctor();
    };
  }, [isConnected, userRole, listenToDoctorRegistered, handleDoctorRegistered]);

  const handleAddDoctor = async (e) => {
    e.preventDefault();

    if (!newDoctor.name || !newDoctor.specialization || !newDoctor.walletAddress) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await registerDoctor(newDoctor.name, newDoctor.specialization, newDoctor.walletAddress);
      toast.success("Doctor registration submitted successfully");

      // Add to local state
      const newDoctorEntry = {
        id: doctors.length + 1,
        name: newDoctor.name,
        specialization: newDoctor.specialization,
        walletAddress: newDoctor.walletAddress,
        status: "Pending",
        patientsCount: 0,
        appointmentsCount: 0,
        rating: 0
      };
      setDoctors([...doctors, newDoctorEntry]);

      // Reset form
      setNewDoctor({ name: "", specialization: "", walletAddress: "" });
      setShowAddDoctorModal(false);
    } catch (error) {
      console.error("Error adding doctor:", error);
      toast.error("Failed to add doctor");
    }
  };

  const toggleDoctorStatus = (doctorId) => {
    setDoctors(doctors.map(doctor =>
      doctor.id === doctorId
        ? { ...doctor, status: doctor.status === "Active" ? "Inactive" : "Active" }
        : doctor
    ));
    toast.success("Doctor status updated");
  };

  if (!isConnected) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h2>
          <p>You need to connect your wallet to manage doctors.</p>
        </div>
      </main>
    </div>
  );
  }

  if (isLoadingRole) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
      </main>
    </div>
  );
  }

  if (userRole !== 'admin') {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have admin privileges to manage doctors.</p>
        </div>
      </main>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Doctor Management</h1>
            <p className="text-cyan-400">Manage doctors on your healthcare platform</p>
          </div>
          <button
            onClick={() => setShowAddDoctorModal(true)}
            className="bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Add New Doctor
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-cyan-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-cyan-400">Total Doctors</p>
                <p className="text-2xl font-bold text-white">{doctors.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-teal-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-teal-400">Active Doctors</p>
                <p className="text-2xl font-bold text-white">
                  {doctors.filter(d => d.status === "Active").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-cyan-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-cyan-400">Total Patients</p>
                <p className="text-2xl font-bold text-white">
                  {doctors.reduce((sum, doctor) => sum + doctor.patientsCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-teal-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-teal-400">Total Appointments</p>
                <p className="text-2xl font-bold text-white">
                  {doctors.reduce((sum, doctor) => sum + doctor.appointmentsCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">All Doctors</h2>
          </div>

          {isLoadingDoctors ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-cyan-400 mt-4">Loading doctors...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Patients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Appointments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-800 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-cyan-900 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{doctor.name}</div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {doctor.walletAddress.slice(0, 6)}...{doctor.walletAddress.slice(-4)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">{doctor.specialization}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {doctor.patientsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {doctor.appointmentsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex text-yellow-400 mr-2">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className="w-4 h-4" fill={i < Math.floor(doctor.rating) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-300">{doctor.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doctor.status === 'Active' ? 'bg-green-900 text-green-300' :
                          doctor.status === 'Inactive' ? 'bg-red-900 text-red-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {doctor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleDoctorStatus(doctor.id)}
                          className={`mr-3 px-3 py-1 rounded text-xs font-medium transition-colors ${
                            doctor.status === 'Active'
                              ? 'bg-red-900 text-red-300 hover:bg-red-800'
                              : 'bg-green-900 text-green-300 hover:bg-green-800'
                          }`}
                        >
                          {doctor.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="px-3 py-1 rounded text-xs font-medium bg-cyan-900 text-cyan-300 hover:bg-cyan-800 transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Doctor Modal */}
        {showAddDoctorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-700 w-96 shadow-[0_0_25px_rgba(14,203,129,0.8)] rounded-xl bg-gradient-to-br from-gray-800 via-gray-900 to-black">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-white mb-4">Add New Doctor</h3>
                <form onSubmit={handleAddDoctor}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newDoctor.name}
                      onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-gray-400"
                      placeholder="Dr. John Smith"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Specialization
                    </label>
                    <select
                      value={newDoctor.specialization}
                      onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
                      required
                    >
                      <option value="" className="bg-gray-700 text-gray-300">Select specialization</option>
                      <option value="Cardiology" className="bg-gray-700 text-white">Cardiology</option>
                      <option value="Neurology" className="bg-gray-700 text-white">Neurology</option>
                      <option value="Pediatrics" className="bg-gray-700 text-white">Pediatrics</option>
                      <option value="Orthopedics" className="bg-gray-700 text-white">Orthopedics</option>
                      <option value="Dermatology" className="bg-gray-700 text-white">Dermatology</option>
                      <option value="Psychiatry" className="bg-gray-700 text-white">Psychiatry</option>
                      <option value="Gynecology" className="bg-gray-700 text-white">Gynecology</option>
                      <option value="Ophthalmology" className="bg-gray-700 text-white">Ophthalmology</option>
                      <option value="Dentistry" className="bg-gray-700 text-white">Dentistry</option>
                      <option value="General Medicine" className="bg-gray-700 text-white">General Medicine</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={newDoctor.walletAddress}
                      onChange={(e) => setNewDoctor({ ...newDoctor, walletAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-gray-400"
                      placeholder="0x..."
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddDoctorModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Add Doctor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDoctors;
