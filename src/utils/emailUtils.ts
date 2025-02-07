import emailjs from "@emailjs/browser";
import supabase from "./supabase";

type EmailData = {
  patientName: string;
  patientArea: string;
  patientLocation: string;
  serviceType: string[];
  details: string;
  imageUrl?: string;
};

// Quick service types
const QUICK_SERVICES = [
  "blood_test",
  "im",
  "iv",
  "patient_care",
  "hemo_vs",
  "other",
];

// Initialize EmailJS with your public key
emailjs.init("4N70KK1SQmyzd406d");

export const sendNotificationToNurses = async (emailData: EmailData) => {
  try {
    // Get super admin emails
    const { data: superAdmins } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "superAdmin");

    // For quick services, also get nurses in the same area
    let areaSpecificNurses: { email: string }[] = [];
    if (emailData.serviceType.some((type) => QUICK_SERVICES.includes(type))) {
      const { data: nurses } = await supabase
        .from("profiles")
        .select("email")
        .eq("area", emailData.patientArea)
        .in("role", ["registered", "licensed", "practitioner"]);

      if (nurses) {
        areaSpecificNurses = nurses;
      }
    }

    // Combine and deduplicate emails
    const allEmails = [
      ...(superAdmins?.map((admin) => admin.email) || []),
      ...(areaSpecificNurses.map((nurse) => nurse.email) || []),
    ];
    const uniqueEmails = [...new Set(allEmails)];

    if (uniqueEmails.length === 0) return;

    const templateParams = {
      to_email: uniqueEmails.join(","),
      patient_name: emailData.patientName,
      patient_area: emailData.patientArea,
      patient_location: emailData.patientLocation,
      service_type: emailData.serviceType.join(", "),
      details: emailData.details,
    };

    const response = await emailjs.send(
      "service_r6n90nk",
      "template_sbdqdmd",
      templateParams
    );

    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendNurseAssignmentRequest = async (
  requestId: string,
  nurseName: string,
  patientName: string,
  serviceType: string[]
) => {
  try {
    // Get super admin emails
    const { data: superAdmins } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "superAdmin");

    if (!superAdmins || superAdmins.length === 0) return;

    const uniqueEmails = [...new Set(superAdmins.map((admin) => admin.email))];

    const templateParams = {
      to_email: uniqueEmails.join(","),
      nurse_name: nurseName,
      patient_name: patientName,
      service_type: serviceType.join(", "),
      request_id: requestId,
    };

    const response = await emailjs.send(
      "service_r6n90nk",
      "template_rfosoa3",
      templateParams
    );

    return response;
  } catch (error) {
    console.error("Error sending nurse assignment request email:", error);
    throw error;
  }
};
