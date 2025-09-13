// pages/doctor/appointments.js
import React, { useState, useEffect, useCallback } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

const DoctorAppointments = () => {
  const { address, isConnected } = useAccount();
  const { userRole, isLoadingRole, getDoctorAppointments, listenToAppointmentBooked, listenToAppointmentStatusUpdated } = useHealthcareContract();

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Function to fetch appointments for doctor
  const fetchAppointments = useCallback(async () => {
    if (!isConnected || userRole !== 'doctor') return;

    setIsLoadingAppointments(true);
    try {
      const contractAppointments = await getDoctorAppointments(address);
      const formattedAppointments = contractAppointments.map((appointment, index) => ({
        id: index + 1,
        patientName: appointment.patientName || "Unknown Patient",
        patientAddress: appointment.patientAddress || "0x0000000000000000000000000000000000000000",
        date: new Date(Number(appointment.timestamp) * 1000).toISOString().split('T')[0],
        time: new Date(Number(appointment.timestamp) * 1000).toLocaleTimeString(),
        status: appointment.status === 0 ? "Booked" : appointment.status === 1 ? "Completed" : appointment.status === 2 ? "Cancelled" : "Pending",
        specialization: appointment.specialization || "General Medicine",
        notes: appointment.notes || ""
      }));
      setAppointments(formattedAppointments);
      setFilteredAppointments(formattedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [isConnected, userRole, getDoctorAppointments, address]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Event handlers for real-time updates
  const handleAppointmentBooked = useCallback((event) => {
    const { appointmentId, patientAddress, timestamp } = event.args || {};
    setAppointments((prev) => [
      {
        id: Number(appointmentId),
        patientName: "New Patient",
        patientAddress: patientAddress || "0x0000000000000000000000000000000000000000",
        date: new Date(Number(timestamp) * 1000).toISOString().split('T')[0],
        time: new Date(Number(timestamp) * 1000).toLocaleTimeString(),
        status: "Booked",
        specialization: "General Medicine",
        notes: ""
      },
      ...prev,
    ]);
    toast.success("New appointment booked successfully");
  }, []);

  const handleAppointmentStatusUpdated = useCallback((event) => {
    const { appointmentId, status } = event.args || {};
    const statusText = status === 0 ? "Booked" : status === 1 ? "Completed" : status === 2 ? "Cancelled" : "Pending";
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === Number(appointmentId)
          ? { ...appointment, status: statusText }
          : appointment
      )
    );
    toast.success(`Appointment status updated to ${statusText}`);
  }, []);

  // Setup event listeners for real-time updates
  useEffect(() => {
    if (!isConnected || userRole !== 'doctor') return;

    const unsubscribeBooked = listenToAppointmentBooked(handleAppointmentBooked);
    const unsubscribeStatus = listenToAppointmentStatusUpdated(handleAppointmentStatusUpdated);

    return () => {
      if (unsubscribeBooked) unsubscribeBooked();
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }, [isConnected, userRole, listenToAppointmentBooked, listenToAppointmentStatusUpdated, handleAppointmentBooked, handleAppointmentStatusUpdated]);

  useEffect(() => {
    let filtered = appointments;

    if (statusFilter !== "All") {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    if (dateFilter !== "All") {
      const today = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "Today":
          filterDate.setDate(today.getDate());
          filtered = filtered.filter(appointment => appointment.date === filterDate.toISOString().split('T')[0]);
          break;
        case "Tomorrow":
          filterDate.setDate(today.getDate() + 1);
          filtered = filtered.filter(appointment => appointment.date === filterDate.toISOString().split('T')[0]);
          break;
        case "This Week":
          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          filtered = filtered.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate >= weekStart && appointmentDate <= weekEnd;
          });
          break;
        default:
          break;
      }
    }

    setFilteredAppointments(filtered);
  }, [appointments, statusFilter, dateFilter]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h2>
          <p>You need to connect your wallet to view your appointments.</p>
        </div>
      </div>
    );
  }

  if (isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (userRole !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have doctor privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
          <p className="text-cyan-400">View and manage your appointments</p>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 mb-8 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-white">Appointments</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
              >
                <option value="All" className="bg-gray-700 text-white">All Status</option>
                <option value="Booked" className="bg-gray-700 text-white">Booked</option>
                <option value="Pending" className="bg-gray-700 text-white">Pending</option>
                <option value="Completed" className="bg-gray-700 text-white">Completed</option>
                <option value="Cancelled" className="bg-gray-700 text-white">Cancelled</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
              >
                <option value="All" className="bg-gray-700 text-white">All Dates</option>
                <option value="Today" className="bg-gray-700 text-white">Today</option>
                <option value="Tomorrow" className="bg-gray-700 text-white">Tomorrow</option>
                <option value="This Week" className="bg-gray-700 text-white">This Week</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          {isLoadingAppointments ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">Loading appointments...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-800 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-cyan-900 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{appointment.patientName}</div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {appointment.patientAddress.slice(0, 6)}...{appointment.patientAddress.slice(-4)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{appointment.date}</div>
                        <div className="text-sm text-gray-400">{appointment.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">{appointment.specialization}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'Completed' ? 'bg-green-900 text-green-300' :
                          appointment.status === 'Booked' ? 'bg-blue-900 text-blue-300' :
                          appointment.status === 'Pending' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;
