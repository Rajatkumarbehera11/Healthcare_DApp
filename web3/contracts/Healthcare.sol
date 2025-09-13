// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Healthcare {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct Patient {
        uint id;
        string name;
        uint age;
        string gender;
        address patientAddress;
        bool exists;
    }

    struct Doctor {
        uint id;
        string name;
        string specialization;
        address doctorAddress;
        bool exists;
    }

    struct Appointment {
        uint id;
        uint patientId;
        uint doctorId;
        uint timestamp;
        string status; // e.g. "Booked", "Completed", "Cancelled"
    }

    struct MedicalRecord {
        uint id;
        uint patientId;
        string ipfsHash; // IPFS hash of medical record file
        uint timestamp;
    }

    struct Prescription {
        uint id;
        uint patientId;
        uint doctorId;
        string ipfsHash; // IPFS hash of prescription file
        uint timestamp;
    }

    uint private patientCount;
    uint private doctorCount;
    uint private appointmentCount;
    uint private medicalRecordCount;
    uint private prescriptionCount;

    mapping(uint => Patient) public patients;
    mapping(address => uint) public patientIds;

    mapping(uint => Doctor) public doctors;
    mapping(address => uint) public doctorIds;

    mapping(uint => Appointment) public appointments;
    mapping(uint => MedicalRecord) public medicalRecords;
    mapping(uint => Prescription) public prescriptions;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyDoctor() {
        require(doctorIds[msg.sender] != 0, "Only registered doctor can perform this action");
        _;
    }

    modifier onlyPatient() {
        require(patientIds[msg.sender] != 0, "Only registered patient can perform this action");
        _;
    }

    event PatientRegistered(uint indexed patientId, address indexed patientAddress, string name, uint age, string gender);
    event DoctorRegistered(uint indexed doctorId, address indexed doctorAddress, string name, string specialization);
    event AppointmentBooked(uint indexed appointmentId, uint indexed patientId, uint indexed doctorId, uint timestamp);
    event AppointmentStatusUpdated(uint indexed appointmentId, string status);

    // Register a new patient
    function registerPatient(string memory _name, uint _age, string memory _gender) public {
        require(patientIds[msg.sender] == 0, "Patient already registered");
        patientCount++;
        patients[patientCount] = Patient(patientCount, _name, _age, _gender, msg.sender, true);
        patientIds[msg.sender] = patientCount;
        emit PatientRegistered(patientCount, msg.sender, _name, _age, _gender);
    }

    // Register a new doctor
    function registerDoctor(string memory _name, string memory _specialization, address _doctorAddress) public {
        require(doctorIds[_doctorAddress] == 0, "Doctor already registered");
        doctorCount++;
        doctors[doctorCount] = Doctor(doctorCount, _name, _specialization, _doctorAddress, true);
        doctorIds[_doctorAddress] = doctorCount;
        emit DoctorRegistered(doctorCount, _doctorAddress, _name, _specialization);
    }

    // Book an appointment
    function bookAppointment(uint _doctorId, uint _timestamp) public onlyPatient {
        require(doctors[_doctorId].exists, "Doctor does not exist");
        appointmentCount++;
        appointments[appointmentCount] = Appointment(appointmentCount, patientIds[msg.sender], _doctorId, _timestamp, "Booked");
        emit AppointmentBooked(appointmentCount, patientIds[msg.sender], _doctorId, _timestamp);
    }

    // Update appointment status (only doctor or owner)
    function updateAppointmentStatus(uint _appointmentId, string memory _status) public {
        Appointment storage appointment = appointments[_appointmentId];
        require(appointment.id != 0, "Appointment does not exist");
        require(msg.sender == owner || msg.sender == doctors[appointment.doctorId].doctorAddress, "Not authorized");
        appointment.status = _status;
        emit AppointmentStatusUpdated(_appointmentId, _status);
    }

    // Add medical record (only doctor)
    function addMedicalRecord(uint _patientId, string memory _ipfsHash) public onlyDoctor {
        require(patients[_patientId].exists, "Patient does not exist");
        medicalRecordCount++;
        medicalRecords[medicalRecordCount] = MedicalRecord(medicalRecordCount, _patientId, _ipfsHash, block.timestamp);
    }

    // Add prescription (only doctor)
    function addPrescription(uint _patientId, string memory _ipfsHash) public onlyDoctor {
        require(patients[_patientId].exists, "Patient does not exist");
        prescriptionCount++;
        prescriptions[prescriptionCount] = Prescription(prescriptionCount, _patientId, doctorIds[msg.sender], _ipfsHash, block.timestamp);
    }

    // Get patient details by address
    function getPatientByAddress(address _patientAddress) public view returns (Patient memory) {
        uint id = patientIds[_patientAddress];
        require(id != 0, "Patient not found");
        return patients[id];
    }

    // Get doctor details by address
    function getDoctorByAddress(address _doctorAddress) public view returns (Doctor memory) {
        uint id = doctorIds[_doctorAddress];
        require(id != 0, "Doctor not found");
        return doctors[id];
    }

    // Get all medical records for a patient
    function getPatientMedicalRecords(address _patientAddress) public view returns (MedicalRecord[] memory) {
        uint patientId = patientIds[_patientAddress];
        require(patientId != 0, "Patient not found");

        // Count records for this patient
        uint recordCount = 0;
        for (uint i = 1; i <= medicalRecordCount; i++) {
            if (medicalRecords[i].patientId == patientId) {
                recordCount++;
            }
        }

        // Create array of records
        MedicalRecord[] memory patientRecords = new MedicalRecord[](recordCount);
        uint index = 0;
        for (uint i = 1; i <= medicalRecordCount; i++) {
            if (medicalRecords[i].patientId == patientId) {
                patientRecords[index] = medicalRecords[i];
                index++;
            }
        }

        return patientRecords;
    }

    // Get all prescriptions for a patient
    function getPatientPrescriptions(address _patientAddress) public view returns (Prescription[] memory) {
        uint patientId = patientIds[_patientAddress];
        require(patientId != 0, "Patient not found");

        // Count prescriptions for this patient
        uint patientPrescriptionCount = 0;
        for (uint i = 1; i <= prescriptionCount; i++) {
            if (prescriptions[i].patientId == patientId) {
                patientPrescriptionCount++;
            }
        }

        // Create array of prescriptions
        Prescription[] memory patientPrescriptions = new Prescription[](patientPrescriptionCount);
        uint index = 0;
        for (uint i = 1; i <= prescriptionCount; i++) {
            if (prescriptions[i].patientId == patientId) {
                patientPrescriptions[index] = prescriptions[i];
                index++;
            }
        }

        return patientPrescriptions;
    }

    // Get all appointments for a patient
    function getPatientAppointments(address _patientAddress) public view returns (Appointment[] memory) {
        uint patientId = patientIds[_patientAddress];
        require(patientId != 0, "Patient not found");

        // Count appointments for this patient
        uint count = 0;
        for (uint i = 1; i <= appointmentCount; i++) {
            if (appointments[i].patientId == patientId) {
                count++;
            }
        }

        // Create array of appointments
        Appointment[] memory patientAppointments = new Appointment[](count);
        uint index = 0;
        for (uint i = 1; i <= appointmentCount; i++) {
            if (appointments[i].patientId == patientId) {
                patientAppointments[index] = appointments[i];
                index++;
            }
        }

        return patientAppointments;
    }

    // Get all appointments for a doctor
    function getDoctorAppointments(address _doctorAddress) public view returns (Appointment[] memory) {
        uint doctorId = doctorIds[_doctorAddress];
        require(doctorId != 0, "Doctor not found");

        // Count appointments for this doctor
        uint count = 0;
        for (uint i = 1; i <= appointmentCount; i++) {
            if (appointments[i].doctorId == doctorId) {
                count++;
            }
        }

        // Create array of appointments
        Appointment[] memory doctorAppointments = new Appointment[](count);
        uint index = 0;
        for (uint i = 1; i <= appointmentCount; i++) {
            if (appointments[i].doctorId == doctorId) {
                doctorAppointments[index] = appointments[i];
                index++;
            }
        }

        return doctorAppointments;
    }

    // Get total counts for admin dashboard
    function getTotalCounts() public view returns (uint, uint, uint, uint, uint) {
        return (patientCount, doctorCount, appointmentCount, medicalRecordCount, prescriptionCount);
    }

    // Get all patients (for admin)
    function getAllPatients() public view returns (Patient[] memory) {
        Patient[] memory allPatients = new Patient[](patientCount);
        for (uint i = 1; i <= patientCount; i++) {
            allPatients[i-1] = patients[i];
        }
        return allPatients;
    }

    // Get all doctors (for admin)
    function getAllDoctors() public view returns (Doctor[] memory) {
        Doctor[] memory allDoctors = new Doctor[](doctorCount);
        for (uint i = 1; i <= doctorCount; i++) {
            allDoctors[i-1] = doctors[i];
        }
        return allDoctors;
    }

    // Get all appointments (for admin)
    function getAllAppointments() public view returns (Appointment[] memory) {
        Appointment[] memory allAppointments = new Appointment[](appointmentCount);
        for (uint i = 1; i <= appointmentCount; i++) {
            allAppointments[i-1] = appointments[i];
        }
        return allAppointments;
    }
}
