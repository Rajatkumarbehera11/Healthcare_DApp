import React, { useState, useEffect, useCallback } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

const AdminAppointments = () => {
  const { address, isConnected } = useAccount();
  const { userRole, isLoadingRole, updateAppointmentStatus, getAllAppointments, listenToAppointmentBooked, listenToAppointmentStatusUpdated } = useHealthcareContract();

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Function to fetch appointments from contract
  const fetchAppointments = useCallback(async () => {
    if (!isConnected || userRole !== 'admin') return;

    setIsLoadingAppointments(true);
    try {
      const contractAppointments = await getAllAppointments();
      // Transform contract data to match UI expectations
      const formattedAppointments = contractAppointments.map((appointment, index) => ({
        id: index + 1,
        patientName: appointment.patientName || "Unknown Patient",
        patientAddress: appointment.patientAddress || "0x0000000000000000000000000000000000000000",
        doctorName: appointment.doctorName || "Unknown Doctor",
        doctorAddress: appointment.doctorAddress || "0x0000000000000000000000000000000000000000",
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
  }, [isConnected, userRole, getAllAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Event handlers for real-time updates
  const handleAppointmentBooked = useCallback((event) => {
    const { appointmentId, patientAddress, doctorAddress, timestamp } = event.args || {};
    // Add new appointment to the list
    setAppointments((prev) => [
      {
        id: Number(appointmentId),
        patientName: "New Patient",
        patientAddress: patientAddress || "0x0000000000000000000000000000000000000000",
        doctorName: "New Doctor",
        doctorAddress: doctorAddress || "0x0000000000000000000000000000000000000000",
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
    if (!isConnected || userRole !== 'admin') return;

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

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const statusValue = newStatus === "Completed" ? 1 : newStatus === "Cancelled" ? 2 : newStatus === "Booked" ? 0 : 3;
      await updateAppointmentStatus(appointmentId, statusValue);

      // Update local state
      setAppointments(appointments.map(appointment =>
        appointment.id === appointmentId
          ? { ...appointment, status: newStatus }
          : appointment
      ));

      toast.success(`Appointment status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h2>
          <p>You need to connect your wallet to manage appointments.</p>
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

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have admin privileges to manage appointments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Appointment Management</h1>
          <p className="text-cyan-400">Manage all appointments on your healthcare platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-cyan-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-cyan-400">Total Appointments</p>
                <p className="text-2xl font-bold text-white">{appointments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-400">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {appointments.filter(a => a.status === "Completed").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-yellow-400">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {appointments.filter(a => a.status === "Pending" || a.status === "Booked").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-red-400">Cancelled</p>
                <p className="text-2xl font-bold text-white">
                  {appointments.filter(a => a.status === "Cancelled").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 mb-8 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-white">All Appointments</h2>
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
                      Doctor
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Actions
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
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{appointment.doctorName}</div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {appointment.doctorAddress.slice(0, 6)}...{appointment.doctorAddress.slice(-4)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {appointment.status === 'Booked' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(appointment.id, 'Completed')}
                                className="px-3 py-1 rounded text-xs font-medium bg-green-900 text-green-300 hover:bg-green-800 transition-colors duration-200"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(appointment.id, 'Cancelled')}
                                className="px-3 py-1 rounded text-xs font-medium bg-red-900 text-red-300 hover:bg-red-800 transition-colors duration-200"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {appointment.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusUpdate(appointment.id, 'Booked')}
                              className="px-3 py-1 rounded text-xs font-medium bg-blue-900 text-blue-300 hover:bg-blue-800 transition-colors duration-200"
                            >
                              Confirm
                            </button>
                          )}
                          <button className="px-3 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200">
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAppointments;
