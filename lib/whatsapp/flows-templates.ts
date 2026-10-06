/**
 * Ittisalo — Meta WhatsApp Flows JSON Schema Blueprints (v6.0)
 * 
 * Standard Flow schemas ready for 1-click publishing to Meta WhatsApp Business API.
 */

export interface FlowBlueprint {
  key: string;
  name: string;
  category: string;
  description: string;
  ctaText: string;
  flowJson: any;
}

export const APPOINTMENT_BOOKING_FLOW: FlowBlueprint = {
  key: 'APPOINTMENT_BOOKING',
  name: 'Clinic & Salon Appointment Booking',
  category: 'APPOINTMENT_BOOKING',
  description: 'Multi-step in-chat booking form with service selection, doctor choice, date picker, and preferred time slot.',
  ctaText: '📅 Book Appointment',
  flowJson: {
    version: '6.0',
    screens: [
      {
        id: 'BOOKING_FORM',
        title: 'Book Your Visit',
        terminal: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Form',
              name: 'booking_form',
              children: [
                {
                  type: 'TextHeading',
                  text: 'Select Service & Schedule',
                },
                {
                  type: 'TextSubheading',
                  text: 'Choose your desired service, provider, and preferred time.',
                },
                {
                  type: 'Dropdown',
                  name: 'service_name',
                  label: 'Select Service',
                  required: true,
                  'data-source': [
                    { id: 'general_consult', title: 'General Consultation (PKR 2,000)' },
                    { id: 'dental_cleaning', title: 'Dental Cleaning & Scaling (PKR 4,500)' },
                    { id: 'teeth_whitening', title: 'Laser Teeth Whitening (PKR 12,000)' },
                    { id: 'root_canal', title: 'Root Canal Therapy (PKR 15,000)' },
                    { id: 'ortho_consult', title: 'Braces & Aligners Evaluation (PKR 3,000)' },
                  ],
                },
                {
                  type: 'Dropdown',
                  name: 'doctor_name',
                  label: 'Preferred Specialist',
                  required: true,
                  'data-source': [
                    { id: 'any_available', title: 'First Available Specialist' },
                    { id: 'dr_sarah', title: 'Dr. Sarah Khan (Senior Orthodontist)' },
                    { id: 'dr_bilal', title: 'Dr. Bilal Ahmed (Cosmetic Dental Surgeon)' },
                    { id: 'dr_ayesha', title: 'Dr. Ayesha Malik (General Practitioner)' },
                  ],
                },
                {
                  type: 'DatePicker',
                  name: 'appointment_date',
                  label: 'Select Date',
                  required: true,
                },
                {
                  type: 'RadioButtonsGroup',
                  name: 'slot_time',
                  label: 'Preferred Time Window',
                  required: true,
                  'data-source': [
                    { id: '11:00 AM', title: 'Morning: 11:00 AM' },
                    { id: '01:30 PM', title: 'Afternoon: 01:30 PM' },
                    { id: '04:00 PM', title: 'Evening: 04:00 PM' },
                    { id: '06:30 PM', title: 'Night: 06:30 PM' },
                  ],
                },
                {
                  type: 'TextInput',
                  name: 'patient_name',
                  label: 'Patient Full Name',
                  required: true,
                },
                {
                  type: 'TextInput',
                  name: 'notes',
                  label: 'Symptoms / Medical Notes (Optional)',
                  required: false,
                },
                {
                  type: 'OptIn',
                  name: 'reminder_optin',
                  label: 'Receive automated WhatsApp reminders before visit',
                  required: false,
                },
                {
                  type: 'Footer',
                  label: 'Confirm & Book Appointment',
                  'on-click-action': {
                    name: 'complete',
                    payload: {
                      service_name: '${form.service_name}',
                      doctor_name: '${form.doctor_name}',
                      appointment_date: '${form.appointment_date}',
                      slot_time: '${form.slot_time}',
                      patient_name: '${form.patient_name}',
                      notes: '${form.notes}',
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

export const COD_ADDRESS_FLOW: FlowBlueprint = {
  key: 'COD_ADDRESS',
  name: 'Cash on Delivery (COD) Address Collector',
  category: 'CUSTOMER_SUPPORT',
  description: 'Native form collecting customer delivery address, city, landmark, and delivery instructions in 1 tap.',
  ctaText: '📍 Enter Delivery Address',
  flowJson: {
    version: '6.0',
    screens: [
      {
        id: 'SHIPPING_FORM',
        title: 'Delivery Details',
        terminal: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Form',
              name: 'address_form',
              children: [
                {
                  type: 'TextHeading',
                  text: 'Cash on Delivery Address',
                },
                {
                  type: 'TextSubheading',
                  text: 'Please provide your accurate delivery details for courier dispatch.',
                },
                {
                  type: 'TextInput',
                  name: 'customer_name',
                  label: 'Recipient Full Name',
                  required: true,
                },
                {
                  type: 'TextInput',
                  name: 'alternate_phone',
                  label: 'Alternate Contact Number (Optional)',
                  required: false,
                  'input-type': 'phone',
                },
                {
                  type: 'Dropdown',
                  name: 'city',
                  label: 'Delivery City',
                  required: true,
                  'data-source': [
                    { id: 'Karachi', title: 'Karachi' },
                    { id: 'Lahore', title: 'Lahore' },
                    { id: 'Islamabad', title: 'Islamabad' },
                    { id: 'Rawalpindi', title: 'Rawalpindi' },
                    { id: 'Faisalabad', title: 'Faisalabad' },
                    { id: 'Multan', title: 'Multan' },
                    { id: 'Peshawar', title: 'Peshawar' },
                    { id: 'Quetta', title: 'Quetta' },
                    { id: 'Sialkot', title: 'Sialkot' },
                    { id: 'Gujranwala', title: 'Gujranwala' },
                    { id: 'Other', title: 'Other City' },
                  ],
                },
                {
                  type: 'TextInput',
                  name: 'delivery_address',
                  label: 'Complete Street Address (House / Flat #, Street, Area)',
                  required: true,
                },
                {
                  type: 'TextInput',
                  name: 'landmark',
                  label: 'Nearest Famous Landmark',
                  required: false,
                },
                {
                  type: 'TextInput',
                  name: 'delivery_instructions',
                  label: 'Special Delivery Instructions (Optional)',
                  required: false,
                },
                {
                  type: 'Footer',
                  label: 'Save & Confirm Address',
                  'on-click-action': {
                    name: 'complete',
                    payload: {
                      customer_name: '${form.customer_name}',
                      alternate_phone: '${form.alternate_phone}',
                      city: '${form.city}',
                      delivery_address: '${form.delivery_address}',
                      landmark: '${form.landmark}',
                      delivery_instructions: '${form.delivery_instructions}',
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

export const CUSTOMER_FEEDBACK_FLOW: FlowBlueprint = {
  key: 'CUSTOMER_FEEDBACK',
  name: 'Customer CSAT & Experience Feedback',
  category: 'CUSTOMER_SUPPORT',
  description: 'Interactive post-purchase and appointment satisfaction rating flow.',
  ctaText: '⭐ Rate Experience',
  flowJson: {
    version: '6.0',
    screens: [
      {
        id: 'FEEDBACK_FORM',
        title: 'Your Feedback',
        terminal: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Form',
              name: 'feedback_form',
              children: [
                {
                  type: 'TextHeading',
                  text: 'How was your experience?',
                },
                {
                  type: 'TextSubheading',
                  text: 'Your feedback helps us continuously improve our service.',
                },
                {
                  type: 'RadioButtonsGroup',
                  name: 'rating',
                  label: 'Overall Rating',
                  required: true,
                  'data-source': [
                    { id: '5', title: 'Excellent (5/5)' },
                    { id: '4', title: 'Good (4/5)' },
                    { id: '3', title: 'Average (3/5)' },
                    { id: '2', title: 'Needs Improvement (2/5)' },
                    { id: '1', title: 'Poor (1/5)' },
                  ],
                },
                {
                  type: 'TextInput',
                  name: 'positive_feedback',
                  label: 'What did you like the most?',
                  required: false,
                },
                {
                  type: 'TextInput',
                  name: 'improvement_feedback',
                  label: 'What could we have done better?',
                  required: false,
                },
                {
                  type: 'Footer',
                  label: 'Submit Feedback',
                  'on-click-action': {
                    name: 'complete',
                    payload: {
                      rating: '${form.rating}',
                      positive_feedback: '${form.positive_feedback}',
                      improvement_feedback: '${form.improvement_feedback}',
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

export const ALL_FLOW_BLUEPRINTS: FlowBlueprint[] = [
  APPOINTMENT_BOOKING_FLOW,
  COD_ADDRESS_FLOW,
  CUSTOMER_FEEDBACK_FLOW,
];
